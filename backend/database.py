from pymongo import MongoClient
from dotenv import load_dotenv
import os
import json
import uuid

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME")

# Define fallback collection classes for offline resilience
class LocalJSONCollection:
    def __init__(self, filename):
        self.filename = os.path.join(os.path.dirname(os.path.abspath(__file__)), filename)
        if not os.path.exists(self.filename):
            with open(self.filename, 'w') as f:
                json.dump([], f)

    def _read(self):
        try:
            with open(self.filename, 'r') as f:
                return json.load(f)
        except Exception:
            return []

    def _write(self, data):
        try:
            with open(self.filename, 'w') as f:
                json.dump(data, f, default=str, indent=4)
        except Exception as e:
            print(f"Error writing to local JSON fallback database: {e}")

    def find_one(self, query):
        data = self._read()
        for item in data:
            match = True
            for k, v in query.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
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
            match = True
            for k, v in query.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                filtered.append(item)
        return FindCursor(filtered)

class InsertOneResult:
    def __init__(self, inserted_id):
        self.inserted_id = inserted_id

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

# Connection Setup
db_connected = False
try:
    print("Connecting to MongoDB Atlas (Standard)...")
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
    # Check connection by fetching server info
    client.server_info()
    db = client[DATABASE_NAME]
    users = db["users"]
    predictions = db["predictions"]
    print("Successfully connected to MongoDB Atlas (Standard SSL verified).")
    db_connected = True
except Exception as e1:
    print(f"MongoDB Atlas standard connection failed: {e1}")
    try:
        print("Retrying connection with tlsAllowInvalidCertificates=True...")
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000, tlsAllowInvalidCertificates=True)
        client.server_info()
        db = client[DATABASE_NAME]
        users = db["users"]
        predictions = db["predictions"]
        print("Successfully connected to MongoDB Atlas (TLS certificate verification bypassed).")
        db_connected = True
    except Exception as e2:
        print(f"MongoDB Atlas connection failed with both methods: {e2}")
        print("Initiating local JSON fallback database.")
        users = LocalJSONCollection("users_db.json")
        predictions = LocalJSONCollection("predictions_db.json")