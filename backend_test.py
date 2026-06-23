import requests

API = "http://127.0.0.1:8000"

print("--- Testing MediPredict API ---")

# 1. Test Home Endpoint
try:
    r = requests.get(f"{API}/")
    print("Home Endpoint:", r.status_code, r.json())
except Exception as e:
    print("Home Endpoint failed:", e)

# 2. Test Register Endpoint
try:
    # Delete existing user to ensure clean register
    r = requests.post(f"{API}/register", json={
        "name": "Doctor John",
        "email": "doctor@medipredict.com",
        "password": "securepassword123"
    })
    print("Register Endpoint:", r.status_code, r.json())
except Exception as e:
    print("Register Endpoint failed:", e)

# 3. Test Login Endpoint
try:
    r = requests.post(f"{API}/login", json={
        "email": "doctor@medipredict.com",
        "password": "securepassword123"
    })
    print("Login Endpoint:", r.status_code, r.json())
except Exception as e:
    print("Login Endpoint failed:", e)

# 4. Test Predict Endpoint
try:
    r = requests.post(f"{API}/predict", json={
        "patient_name": "Sarah Connor",
        "fever": 1,
        "cough": 1,
        "headache": 1,
        "fatigue": 0,
        "vomiting": 0
    })
    print("Predict Endpoint:", r.status_code, r.json())
except Exception as e:
    print("Predict Endpoint failed:", e)

# 5. Test History Endpoint
try:
    r = requests.get(f"{API}/history")
    print("History Endpoint (count):", r.status_code, len(r.json()))
    if len(r.json()) > 0:
        print("Latest Record:", r.json()[0])
except Exception as e:
    print("History Endpoint failed:", e)
