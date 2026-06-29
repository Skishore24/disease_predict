from fastapi import APIRouter, HTTPException, Depends, Header
from database import users
from utils.security import hash_password, verify_password
from utils.auth import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token
)
from schemas import (
    RegisterRequest,
    LoginRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    UserProfileUpdateRequest
)
from datetime import datetime, timedelta
import uuid

router = APIRouter()

def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Session token required. Please sign in.")
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired session. Please sign in again.")
    
    user = users.find_one({"email": payload.get("email")})
    if not user:
        raise HTTPException(status_code=401, detail="User not found.")
    return user

@router.post("/register")
def register(data: RegisterRequest):
    existing = users.find_one({"email": data.email})
    if existing:
        raise HTTPException(
            status_code=400,
            detail="User already exists"
        )

    users.insert_one({
        "name": data.name,
        "email": data.email,
        "password": hash_password(data.password),
        "role": "user",
        "created_at": datetime.utcnow().isoformat(),
        # Default profile fields
        "age": 25,
        "gender": "Male",
        "height": 175.0,
        "weight": 70.0,
        "blood_group": "O+",
        "medical_history": "None",
        "allergies": "None",
        "emergency_contact": "None"
    })

    return {
        "message": "Registration Successful"
    }

@router.post("/login")
def login(data: LoginRequest):
    user = users.find_one({"email": data.email})
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User Not Found"
        )

    if not verify_password(data.password, user["password"]):
        raise HTTPException(
            status_code=401,
            detail="Invalid Password"
        )

    # Generate tokens
    access_token = create_access_token({"email": user["email"], "role": user.get("role", "user")})
    refresh_token = create_refresh_token({"email": user["email"]})

    # Save refresh token in user document for validation
    users.update_one(
        {"email": user["email"]},
        {"$set": {"refresh_token": refresh_token}}
    )

    return {
        "message": "Login Success",
        "token": access_token,
        "refresh_token": refresh_token,
        "user": user["name"]
    }

@router.post("/refresh")
def refresh(data: dict):
    r_token = data.get("refresh_token")
    if not r_token:
        raise HTTPException(status_code=400, detail="Refresh token required")
    
    payload = decode_refresh_token(r_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    
    user = users.find_one({"email": payload.get("email")})
    if not user or user.get("refresh_token") != r_token:
        raise HTTPException(status_code=401, detail="Refresh token is revoked or user not found")
    
    # Generate new tokens
    new_access_token = create_access_token({"email": user["email"], "role": user.get("role", "user")})
    new_refresh_token = create_refresh_token({"email": user["email"]})
    
    users.update_one(
        {"email": user["email"]},
        {"$set": {"refresh_token": new_refresh_token}}
    )
    
    return {
        "token": new_access_token,
        "refresh_token": new_refresh_token
    }

@router.post("/logout")
def logout(current_user: dict = Depends(get_current_user)):
    users.update_one(
        {"email": current_user["email"]},
        {"$set": {"refresh_token": None}}
    )
    return {"message": "Logout successful"}

@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest):
    user = users.find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=404, detail="Email not registered")
    
    # Generate reset token and expiry
    reset_token = str(uuid.uuid4())[:8].upper() # 8-character easy-to-type code
    expiry = (datetime.utcnow() + timedelta(minutes=15)).isoformat()
    
    users.update_one(
        {"email": data.email},
        {"$set": {"reset_token": reset_token, "reset_expiry": expiry}}
    )
    
    print(f"PASSWORD RESET REQUEST: Code for {data.email} is {reset_token}")
    
    # We return the code in the response to simplify testing on the frontend!
    return {
        "message": "Password reset link/code generated successfully.",
        "reset_token": reset_token
    }

@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest):
    user = users.find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")
    
    saved_token = user.get("reset_token")
    expiry_str = user.get("reset_expiry")
    
    if not saved_token or saved_token != data.token:
        raise HTTPException(status_code=400, detail="Invalid password reset code")
    
    if expiry_str:
        expiry = datetime.fromisoformat(expiry_str)
        if datetime.utcnow() > expiry:
            raise HTTPException(status_code=400, detail="Reset code has expired")
            
    # Update password and clear reset details
    users.update_one(
        {"email": data.email},
        {
            "$set": {
                "password": hash_password(data.new_password),
                "reset_token": None,
                "reset_expiry": None
            }
        }
    )
    return {"message": "Password has been successfully updated"}

@router.get("/profile")
def get_profile(current_user: dict = Depends(get_current_user)):
    # Calculate BMI
    height = current_user.get("height", 175.0)
    weight = current_user.get("weight", 70.0)
    bmi = 0.0
    if height > 0:
        bmi = round(weight / ((height / 100) ** 2), 2)
        
    return {
        "name": current_user["name"],
        "email": current_user["email"],
        "age": current_user.get("age", 25),
        "gender": current_user.get("gender", "Male"),
        "height": height,
        "weight": weight,
        "blood_group": current_user.get("blood_group", "O+"),
        "medical_history": current_user.get("medical_history", "None"),
        "allergies": current_user.get("allergies", "None"),
        "emergency_contact": current_user.get("emergency_contact", "None"),
        "bmi": bmi
    }

@router.put("/profile")
def update_profile(data: UserProfileUpdateRequest, current_user: dict = Depends(get_current_user)):
    # Update fields in DB
    users.update_one(
        {"email": current_user["email"]},
        {
            "$set": {
                "name": data.name,
                "age": data.age,
                "gender": data.gender,
                "height": data.height,
                "weight": data.weight,
                "blood_group": data.blood_group,
                "medical_history": data.medical_history,
                "allergies": data.allergies,
                "emergency_contact": data.emergency_contact,
                "profile_picture": data.profile_picture
            }
        }
    )
    
    # Calculate updated BMI
    bmi = round(data.weight / ((data.height / 100) ** 2), 2)
    
    return {
        "message": "Profile updated successfully",
        "bmi": bmi
    }