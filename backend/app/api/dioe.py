from fastapi import APIRouter, HTTPException
from app.schemas.prediction import DIEPayload
from app.services.dioe_engine import dioe_engine

router = APIRouter(prefix="/api/dioe", tags=["Module 7: Decision Intelligence Engine (DIOE)"])

@router.post("/optimize")
def optimize_dioe(payload: DIEPayload):
    try:
        return dioe_engine.optimize(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DIOE optimization failed: {str(e)}")

