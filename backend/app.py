from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from routes.auth import router as auth_router
from routes.prediction import router as prediction_router

app = FastAPI(
    title="MediPredict API"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes must be registered before mounting static files
app.include_router(auth_router)
app.include_router(prediction_router)

from database import db_connected
from fastapi.responses import RedirectResponse

@app.get("/api/health")
def health():
    return {
        "status": "running",
        "database_connected": db_connected
    }

@app.get("/")
def read_root():
    return RedirectResponse(url="/index.html")

# Serve static frontend files (this must be registered last)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(os.path.dirname(BASE_DIR), "frontend")
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")