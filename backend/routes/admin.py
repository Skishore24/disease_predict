from fastapi import APIRouter
from database import users,predictions

router = APIRouter()

@router.get("/admin/stats")
def stats():

    total_users = users.count_documents({})

    total_predictions = predictions.count_documents({})

    return {
        "total_users": total_users,
        "total_predictions": total_predictions
    }