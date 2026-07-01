from pymongo import MongoClient
from dotenv import load_dotenv
import os
import json
import uuid

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME")

import threading

file_lock = threading.Lock()

# Define fallback collection classes for offline resilience
class LocalJSONCollection:
    def __init__(self, filename):
        db_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "db")
        try:
            os.makedirs(db_dir, exist_ok=True)
        except PermissionError:
            # Fallback to /tmp on read-only serverless environments like Vercel
            db_dir = os.path.join("/tmp", "db")
            os.makedirs(db_dir, exist_ok=True)
        self.filename = os.path.join(db_dir, filename)
        if not os.path.exists(self.filename):
            try:
                with open(self.filename, 'w') as f:
                    json.dump([], f)
            except Exception:
                pass

    def _read(self):
        with file_lock:
            try:
                with open(self.filename, 'r') as f:
                    return json.load(f)
            except Exception:
                return []

    def _write(self, data):
        with file_lock:
            try:
                with open(self.filename, 'w') as f:
                    json.dump(data, f, default=str, indent=4)
            except Exception as e:
                print(f"Error writing to local JSON fallback database: {e}")

    def _match_query(self, item, query):
        if not query:
            return True
        for k, v in query.items():
            val = item.get(k)
            if isinstance(v, dict):
                matched_op = True
                for op, op_val in v.items():
                    if op == "$regex":
                        import re
                        options = v.get("$options", "")
                        flags = 0
                        if "i" in options:
                            flags |= re.IGNORECASE
                        if not val or not re.search(str(op_val), str(val), flags):
                            matched_op = False
                            break
                    elif op == "$options":
                        continue
                    else:
                        if val != op_val:
                            matched_op = False
                            break
                if not matched_op:
                    return False
            else:
                if val != v:
                    return False
        return True

    def find_one(self, query):
        data = self._read()
        for item in data:
            if self._match_query(item, query):
                return item
        return None

    def insert_one(self, document):
        data = self._read()
        if "_id" not in document:
            from bson import ObjectId
            document["_id"] = str(ObjectId())
        else:
            document["_id"] = str(document["_id"])
        data.append(document)
        self._write(data)
        return InsertOneResult(document["_id"])

    def find(self, query=None):
        data = self._read()
        if not query:
            return FindCursor(data)
        
        filtered = []
        for item in data:
            if self._match_query(item, query):
                filtered.append(item)
        return FindCursor(filtered)

    def update_one(self, query, update):
        data = self._read()
        updated_count = 0
        for item in data:
            if self._match_query(item, query):
                if "$set" in update:
                    for uk, uv in update["$set"].items():
                        item[uk] = uv
                else:
                    for uk, uv in update.items():
                        item[uk] = uv
                updated_count = 1
                break
        if updated_count > 0:
            self._write(data)
        return UpdateResult(updated_count)

    def delete_one(self, query):
        data = self._read()
        index_to_delete = -1
        for i, item in enumerate(data):
            if self._match_query(item, query):
                index_to_delete = i
                break
        if index_to_delete != -1:
            data.pop(index_to_delete)
            self._write(data)
            return DeleteResult(1)
        return DeleteResult(0)

    def delete_many(self, query):
        data = self._read()
        initial_len = len(data)
        new_data = []
        for item in data:
            if not self._match_query(item, query):
                new_data.append(item)
        deleted_count = initial_len - len(new_data)
        if deleted_count > 0:
            self._write(new_data)
        return DeleteResult(deleted_count)

class InsertOneResult:
    def __init__(self, inserted_id):
        self.inserted_id = inserted_id

class UpdateResult:
    def __init__(self, modified_count):
        self.modified_count = modified_count

class DeleteResult:
    def __init__(self, deleted_count):
        self.deleted_count = deleted_count

class FindCursor:
    def __init__(self, data):
        self.data = data

    def sort(self, key, direction=-1):
        try:
            self.data.sort(key=lambda x: str(x.get(key, "")), reverse=(direction == -1))
        except Exception:
            pass
        return self

    def __iter__(self):
        return iter(self.data)

    def __len__(self):
        return len(self.data)

    def __getitem__(self, index):
        return self.data[index]


# Connection Setup
db_connected = False
try:
    print("Connecting to MongoDB Atlas (Standard)...")
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
    # Check connection by fetching server info
    client.server_info()
    db = client[DATABASE_NAME]
    db_connected = True
    print("Successfully connected to MongoDB Atlas (Standard SSL verified).")
except Exception as e1:
    print(f"MongoDB Atlas standard connection failed: {e1}")
    try:
        print("Retrying connection with tlsAllowInvalidCertificates=True...")
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000, tlsAllowInvalidCertificates=True)
        client.server_info()
        db = client[DATABASE_NAME]
        db_connected = True
        print("Successfully connected to MongoDB Atlas (TLS certificate verification bypassed).")
    except Exception as e2:
        print(f"MongoDB Atlas connection failed with both methods: {e2}")
        print("Initiating local JSON fallback database.")

if db_connected:
    users = db["users"]
    predictions = db["predictions"]
    health_logs = db["health_logs"]
    water_tracker = db["water_tracker"]
    medicine_tracker = db["medicine_tracker"]
    recovery_tracker = db["recovery_tracker"]
    notifications = db["notifications"]
    feedback = db["feedback"]
    settings = db["settings"]
    analytics = db["analytics"]
else:
    users = LocalJSONCollection("users_db.json")
    predictions = LocalJSONCollection("predictions_db.json")
    health_logs = LocalJSONCollection("health_logs_db.json")
    water_tracker = LocalJSONCollection("water_tracker_db.json")
    medicine_tracker = LocalJSONCollection("medicine_tracker_db.json")
    recovery_tracker = LocalJSONCollection("recovery_tracker_db.json")
    notifications = LocalJSONCollection("notifications_db.json")
    feedback = LocalJSONCollection("feedback_db.json")
    settings = LocalJSONCollection("settings_db.json")
    analytics = LocalJSONCollection("analytics_db.json")

def init_db_indexes():
    if db_connected:
        try:
            import pymongo
            users.create_index([("email", pymongo.ASCENDING)], unique=True)
            predictions.create_index([("email", pymongo.ASCENDING)])
            predictions.create_index([("timestamp", pymongo.DESCENDING)])
            water_tracker.create_index([("email", pymongo.ASCENDING), ("date", pymongo.ASCENDING)])
            medicine_tracker.create_index([("email", pymongo.ASCENDING)])
            recovery_tracker.create_index([("email", pymongo.ASCENDING), ("date", pymongo.ASCENDING)])
            print("MongoDB indexes created successfully.")
        except Exception as e:
            print(f"Failed to initialize database indexes: {e}")