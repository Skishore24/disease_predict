import sys
import os

# Inject backend directory into sys.path to resolve module imports when hosted on Vercel
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, RedirectResponse
import json
import time
import logging
from datetime import datetime

from utils.logging_config import setup_logging
from routes.auth import router as auth_router, get_current_user
from routes.prediction import router as prediction_router
from database import (
    db_connected, water_tracker, medicine_tracker, recovery_tracker, 
    feedback, settings, health_logs, predictions
)
from schemas import (
    WaterLogRequest, MedicineTrackerRequest, MedicineToggleRequest, 
    RecoveryTrackerRequest, FeedbackRequest, SettingsRequest
)

# Initialize professional logger
setup_logging()

app = FastAPI(
    title="MediPredict API",
    description="Professional Patient Diagnostic Hub and Health Portal"
)

# In-Memory Sliding Window Rate Limiter
class RateLimiter:
    def __init__(self, requests_limit: int, window_seconds: int):
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        self.clients = {}  # client_ip -> list of timestamps

    def is_allowed(self, client_ip: str) -> bool:
        now = time.time()
        timestamps = self.clients.get(client_ip, [])
        # Filter timestamps outside the active window
        timestamps = [t for t in timestamps if now - t < self.window_seconds]
        self.clients[client_ip] = timestamps

        if len(timestamps) < self.requests_limit:
            timestamps.append(now)
            return True
        return False

# Setup limiters
auth_limiter = RateLimiter(requests_limit=60, window_seconds=60)
predict_limiter = RateLimiter(requests_limit=45, window_seconds=60)
general_limiter = RateLimiter(requests_limit=600, window_seconds=60)

# Exception handler for request validation error sanitization
@app.exception_handler(RequestValidationError)
def validation_exception_handler(request, exc):
    details = exc.errors()
    error_messages = [f"{err['loc'][-1]}: {err['msg']}" for err in details]
    error_str = ", ".join(error_messages)
    logging.warning("Request validation failed for %s: %s", request.url.path, error_str)
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": error_str}
    )

# Generic exception handler for database & execution crashes
@app.exception_handler(Exception)
def generic_exception_handler(request: Request, exc: Exception):
    logging.exception("Unhandled runtime error occurred on %s", request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please try again later."}
    )

# CORS Policy
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, recommend setting specific origins e.g. ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Logging & Rate Limiting Middleware
@app.middleware("http")
async def process_request_middleware(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    path = request.url.path
    start_time = time.time()

    # Rate limiting routing rules
    if path.startswith("/login") or path.startswith("/register") or path.startswith("/forgot-password") or path.startswith("/reset-password"):
        if not auth_limiter.is_allowed(client_ip):
            logging.warning("Rate limit exceeded for auth request from %s", client_ip)
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many login/registration attempts. Please try again in a minute."}
            )
    elif path.startswith("/predict"):
        if not predict_limiter.is_allowed(client_ip):
            logging.warning("Rate limit exceeded for predict request from %s", client_ip)
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many diagnosis requests. Please wait a minute."}
            )
    elif path.startswith("/api"):
        if not general_limiter.is_allowed(client_ip):
            logging.warning("Rate limit exceeded for general api request from %s", client_ip)
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please slow down."}
            )

    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    logging.info(
        "Request: %s %s | Client: %s | Status: %d | Time: %.2fms",
        request.method, path, client_ip, response.status_code, process_time
    )
    return response

# Startup tasks
@app.on_event("startup")
def on_startup():
    logging.info("Starting up MediPredict FastAPI application...")
    from database import init_db_indexes
    init_db_indexes()

# Register core routers
app.include_router(auth_router)
app.include_router(prediction_router)

# Health endpoint
@app.get("/api/health")
def health():
    return {
        "status": "running",
        "database_connected": db_connected
    }

# 1. WATER TRACKER ENDPOINTS
@app.get("/api/trackers/water")
def get_water(current_user: dict = Depends(get_current_user)):
    today = datetime.utcnow().strftime("%Y-%m-%d")
    record = water_tracker.find_one({"email": current_user["email"], "date": today})
    cups = record["cups"] if record else 0
    return {"cups": cups, "date": today}

@app.post("/api/trackers/water")
def log_water(data: WaterLogRequest, current_user: dict = Depends(get_current_user)):
    today = datetime.utcnow().strftime("%Y-%m-%d")
    record = water_tracker.find_one({"email": current_user["email"], "date": today})
    
    if record:
        new_cups = max(0, min(8, record["cups"] + data.cups))
        water_tracker.update_one(
            {"_id": record["_id"]},
            {"$set": {"cups": new_cups}}
        )
    else:
        new_cups = max(0, min(8, data.cups))
        water_tracker.insert_one({
            "email": current_user["email"],
            "date": today,
            "cups": new_cups
        })
    return {"cups": new_cups, "date": today}

# 2. MEDICINE TRACKER ENDPOINTS
@app.get("/api/trackers/medicine")
def get_medicines(current_user: dict = Depends(get_current_user)):
    cursor = medicine_tracker.find({"email": current_user["email"]})
    meds = []
    for item in cursor:
        item["_id"] = str(item["_id"])
        meds.append(item)
    return meds

@app.post("/api/trackers/medicine")
def add_medicine(data: MedicineTrackerRequest, current_user: dict = Depends(get_current_user)):
    new_med = {
        "email": current_user["email"],
        "medicine_name": data.medicine_name,
        "dosage": data.dosage,
        "time": data.time,
        "taken": data.taken
    }
    res = medicine_tracker.insert_one(new_med)
    new_med["_id"] = str(res.inserted_id)
    return new_med

@app.put("/api/trackers/medicine/{id}/toggle")
def toggle_medicine(id: str, data: MedicineToggleRequest, current_user: dict = Depends(get_current_user)):
    from bson.objectid import ObjectId
    try:
        obj_id = ObjectId(id)
    except Exception:
        obj_id = id
    res = medicine_tracker.update_one(
        {"_id": obj_id, "email": current_user["email"]},
        {"$set": {"taken": data.taken}}
    )
    if res.modified_count == 0:
        res = medicine_tracker.update_one(
            {"_id": id, "email": current_user["email"]},
            {"$set": {"taken": data.taken}}
        )
    if res.modified_count == 0:
        raise HTTPException(status_code=404, detail="Medicine reminder not found or access denied")
    return {"message": "Status updated successfully"}
 
@app.delete("/api/trackers/medicine/{id}")
def delete_medicine(id: str, current_user: dict = Depends(get_current_user)):
    from bson.objectid import ObjectId
    try:
        obj_id = ObjectId(id)
    except Exception:
        obj_id = id
    res = medicine_tracker.delete_one({"_id": obj_id, "email": current_user["email"]})
    if res.deleted_count == 0:
        res = medicine_tracker.delete_one({"_id": id, "email": current_user["email"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Medicine reminder not found or access denied")
    return {"message": "Medicine reminder removed"}

# 3. RECOVERY ASSISTANT CHECKLIST ENDPOINTS
@app.get("/api/trackers/recovery")
def get_recovery_tasks(current_user: dict = Depends(get_current_user)):
    today = datetime.utcnow().strftime("%Y-%m-%d")
    cursor = recovery_tracker.find({"email": current_user["email"], "date": today})
    tasks = []
    for item in cursor:
        item["_id"] = str(item["_id"])
        tasks.append(item)
    return tasks

@app.post("/api/trackers/recovery")
def update_recovery_task(data: RecoveryTrackerRequest, current_user: dict = Depends(get_current_user)):
    today = datetime.utcnow().strftime("%Y-%m-%d")
    record = recovery_tracker.find_one({
        "email": current_user["email"], 
        "date": today, 
        "task_id": data.task_id
    })
    
    if record:
        recovery_tracker.update_one(
            {"_id": record["_id"]},
            {"$set": {"completed": data.completed}}
        )
    else:
        recovery_tracker.insert_one({
            "email": current_user["email"],
            "date": today,
            "task_id": data.task_id,
            "completed": data.completed
        })
    return {"task_id": data.task_id, "completed": data.completed, "date": today}

# 4. FEEDBACK SUBMISSIONS
@app.post("/api/feedback")
def submit_feedback(data: FeedbackRequest, current_user: dict = Depends(get_current_user)):
    feedback.insert_one({
        "email": current_user["email"],
        "rating": data.rating,
        "comments": data.comments,
        "timestamp": datetime.utcnow().isoformat()
    })
    return {"message": "Feedback submitted successfully"}

# 5. USER SETTINGS
@app.get("/api/settings")
def get_settings(current_user: dict = Depends(get_current_user)):
    record = settings.find_one({"email": current_user["email"]})
    if record:
        return {"dark_mode": record.get("dark_mode", False), "notifications_enabled": record.get("notifications_enabled", True)}
    return {"dark_mode": False, "notifications_enabled": True}

@app.put("/api/settings")
def update_settings(data: SettingsRequest, current_user: dict = Depends(get_current_user)):
    record = settings.find_one({"email": current_user["email"]})
    if record:
        settings.update_one(
            {"_id": record["_id"]},
            {"$set": {"dark_mode": data.dark_mode, "notifications_enabled": data.notifications_enabled}}
        )
    else:
        settings.insert_one({
            "email": current_user["email"],
            "dark_mode": data.dark_mode,
            "notifications_enabled": data.notifications_enabled
        })
    return {"message": "Settings updated"}

# 6. RECOVERY TREND ANALYTICS & METRICS
@app.get("/api/analytics/trends")
def get_analytics(current_user: dict = Depends(get_current_user)):
    # Load ML metrics
    metrics = {}
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    metrics_path = os.path.join(BASE_DIR, "models", "model_metrics.json")
    if os.path.exists(metrics_path):
        try:
            with open(metrics_path, "r") as f:
                metrics = json.load(f)
        except Exception:
            pass

    # Recovery Checklist Completion Score over 7 days
    today = datetime.utcnow().strftime("%Y-%m-%d")
    
    # Calculate BMI history
    cursor = predictions.find({"email": current_user["email"]}).sort("_id", -1)
    checks_count = 0
    recent_checks = []
    
    for item in cursor:
        item["_id"] = str(item["_id"])
        recent_checks.append(item)
        checks_count += 1
        
    # Return mock trends + actual database statistics
    return {
        "model_metrics": metrics,
        "recent_checks": recent_checks[:5],
        "checks_count": checks_count,
        "sleep_hours_trend": [7.5, 8.0, 7.0, 6.5, 8.0, 7.5, 8.0],  # Defaults
        "recovery_index_trend": [88, 89, 90, 88, 91, 93, 92]
    }

# Serve landing redirect
@app.get("/")
def read_root():
    return RedirectResponse(url="/index.html")

# Serve static frontend files if directory exists (facilitates local testing & vercel builds)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(os.path.dirname(BASE_DIR), "frontend")
if os.path.exists(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")