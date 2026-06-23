from fastapi import APIRouter, HTTPException
from database import users
from utils.security import (
    hash_password,
    verify_password
)
from utils.auth import (
    create_access_token
)

router = APIRouter()

@router.post("/register")
def register(data: dict):

    existing = users.find_one({
        "email": data["email"]
    })

    if existing:
        raise HTTPException(
            status_code=400,
            detail="User already exists"
        )

    users.insert_one({
        "name": data["name"],
        "email": data["email"],
        "password": hash_password(
            data["password"]
        ),
        "role": "user"
    })

    return {
        "message":
        "Registration Successful"
    }


@router.post("/login")
def login(data: dict):

    user = users.find_one({
        "email": data["email"]
    })

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User Not Found"
        )

    if not verify_password(
        data["password"],
        user["password"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid Password"
        )

    token = create_access_token({
        "email": user["email"],
        "role": user["role"]
    })

    return {
        "message": "Login Success",
        "token": token,
        "user": user["name"]
    }