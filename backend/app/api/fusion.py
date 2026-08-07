"""
AquaShield AI — Module 5: AI Multi-Signal Data Fusion Engine API Router
═══════════════════════════════════════════════════════════════════════
Endpoints:
  POST /api/fusion/process — Processes multimodal signals into 4 semantic risk domains
  GET  /api/fusion/process — Queries fusion calculation for a given location
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.fusion import FusionRequestPayload, FusionResponse
from app.services.fusion_engine import process_multi_signal_fusion

router = APIRouter(prefix="/api/fusion", tags=["Module 5 — Multi-Signal Data Fusion Engine"])


@router.post("/process", response_model=FusionResponse)
def process_fusion_post(
    payload: FusionRequestPayload,
    db: Session = Depends(get_db)
):
    """
    Executes the 4-stage Multi-Signal Data Fusion Engine:
    1. Multi-Source Data Validation
    2. Standardized Multimodal Normalization (0-100 scale)
    3. High-Order Feature Engineering
    4. Semantic Risk Fusion (R_env, R_water, R_health, R_community) -> Unified Outbreak Fusion Score.
    """
    return process_multi_signal_fusion(payload, db=db)


@router.get("/process", response_model=FusionResponse)
def process_fusion_get(
    village_name: str = Query("Kuttanad, Kerala", description="Target location name"),
    latitude: float = Query(9.3500, description="Latitude"),
    longitude: float = Query(76.4300, description="Longitude"),
    db: Session = Depends(get_db)
):
    """GET proxy endpoint executing fusion engine for target location."""
    payload = FusionRequestPayload(
        village_name=village_name,
        latitude=latitude,
        longitude=longitude
    )
    return process_multi_signal_fusion(payload, db=db)
