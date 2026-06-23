from fastapi import APIRouter
from database import predictions
import joblib
import os

router = APIRouter()

BASE_DIR = os.path.dirname(
    os.path.dirname(__file__)
)

model = joblib.load(
    os.path.join(
        BASE_DIR,
        "models",
        "disease_model.pkl"
    )
)

encoder = joblib.load(
    os.path.join(
        BASE_DIR,
        "models",
        "label_encoder.pkl"
    )
)

@router.post("/predict")
def predict(data: dict):
    features = [[
        data["fever"],
        data["cough"],
        data["headache"],
        data["fatigue"],
        data["vomiting"]
    ]]

    prediction = model.predict(features)
    probabilities = model.predict_proba(features)
    confidence = round(max(probabilities[0]) * 100, 2)

    disease = encoder.inverse_transform(prediction)[0]

    result = {
        "patient_name": data["patient_name"],
        "disease": disease,
        "confidence": f"{confidence}%"
    }

    # Insert into DB and convert _id to string for JSON serialization
    predictions.insert_one(result)
    result["_id"] = str(result["_id"])

    return result


@router.get("/history")
def history():
    data = []
    # Sort predictions by _id descending to show latest first
    for item in predictions.find().sort("_id", -1):
        item["_id"] = str(item["_id"])
        data.append(item)
    return data