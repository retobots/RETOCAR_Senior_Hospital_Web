from firebase_client import db
from datetime import datetime
from models import Baterryupdate
from fastapi import APIRouter, HTTPException
router = APIRouter()

@router.post("/robots/{robot_id}/battery")
async def update_battery(robot_id: str, battery_update: Baterryupdate):
    # Kiểm tra robot tồn tại
    doc_ref = db.collection('robots').document(robot_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Robot not found")
    # Xác định trạng thái pin
    battery_status = "normal"
    if battery_update.battery_level < 20:
        battery_status = "low"
    # Cập nhật Firestore
    doc_ref.update({
        "battery": battery_update.battery_level,
        "battery_status": battery_status,
        "updatedAt": datetime.now().isoformat()
    })
    return {"message": "Battery updated", "robot_id": robot_id, "battery": battery_update.battery_level, "battery_status": battery_status}
