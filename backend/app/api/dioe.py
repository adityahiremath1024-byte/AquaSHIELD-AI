from fastapi import APIRouter
from app.schemas.prediction import DIEPayload
from app.services.dioe_engine import dioe_engine

router = APIRouter(prefix="/api/dioe", tags=["Module 7: Decision Intelligence Engine (DIOE)"])


@router.post("/optimize")
def optimize_dioe(payload: DIEPayload):
    return dioe_engine.optimize(payload)
