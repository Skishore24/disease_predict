from pydantic import BaseModel, EmailStr, Field, validator
from typing import List, Dict, Any, Optional
import re

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)

    @validator("password")
    def validate_password_strength(cls, v):
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit.")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError("Password must contain at least one special character.")
        return v

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    remember_me: Optional[bool] = False

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    token: str
    new_password: str = Field(..., min_length=8)

    @validator("new_password")
    def validate_password_strength(cls, v):
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit.")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError("Password must contain at least one special character.")
        return v

class PredictRequest(BaseModel):
    # 20 Symptoms
    fever: Optional[int] = 0
    cough: Optional[int] = 0
    headache: Optional[int] = 0
    fatigue: Optional[int] = 0
    vomiting: Optional[int] = 0
    diarrhea: Optional[int] = 0
    chest_pain: Optional[int] = 0
    sore_throat: Optional[int] = 0
    runny_nose: Optional[int] = 0
    dizziness: Optional[int] = 0
    joint_pain: Optional[int] = 0
    body_pain: Optional[int] = 0
    skin_rash: Optional[int] = 0
    loss_of_smell: Optional[int] = 0
    loss_of_taste: Optional[int] = 0
    shortness_of_breath: Optional[int] = 0
    nausea: Optional[int] = 0
    chills: Optional[int] = 0
    weight_loss: Optional[int] = 0
    abdominal_pain: Optional[int] = 0
    
    # Vitals
    vital_temp: Optional[float] = 36.8
    vital_hr: Optional[int] = 72
    vital_bp_sys: Optional[int] = 120
    vital_bp_dia: Optional[int] = 80
    vital_spo2: Optional[int] = 98
    patient_name: Optional[str] = None
    
    # Emergency Custom Overrides
    emergency_blood_vomiting: Optional[int] = 0
    emergency_unconsciousness: Optional[int] = 0
    emergency_very_high_fever: Optional[int] = 0

class UserProfileUpdateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    age: int = Field(..., ge=1, le=120)
    gender: str = Field(..., pattern="^(Male|Female|Other)$")
    height: float = Field(..., ge=30, le=250)
    weight: float = Field(..., ge=2, le=300)
    blood_group: Optional[str] = "Unknown"
    medical_history: Optional[str] = "None"
    allergies: Optional[str] = "None"
    emergency_contact: Optional[str] = "None"
    profile_picture: Optional[str] = ""

class WaterLogRequest(BaseModel):
    cups: int = Field(..., ge=-8, le=8)

class MedicineTrackerRequest(BaseModel):
    medicine_name: str = Field(..., min_length=1)
    dosage: Optional[str] = ""
    time: str = Field(..., min_length=1)
    taken: Optional[bool] = False

class MedicineToggleRequest(BaseModel):
    taken: bool

class RecoveryTrackerRequest(BaseModel):
    task_id: str = Field(..., min_length=1)
    completed: bool

class FeedbackRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comments: Optional[str] = ""

class SettingsRequest(BaseModel):
    dark_mode: bool
    notifications_enabled: bool
