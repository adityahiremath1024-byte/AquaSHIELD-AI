from fastapi import APIRouter, HTTPException
from app.schemas.fusion import FusionRequestPayload, FusionResponse
from app.services.fusion_service import fusion_engine_service

router = APIRouter(prefix="/api/fusion", tags=["Module 5: Multi-Signal Data Fusion"])


@router.post("/process", response_model=FusionResponse)
def process_fusion_data(payload: FusionRequestPayload):
    """
    Inbound signal ingestion endpoint for Multi-Signal Outbreak Data Fusion.
    Accepts raw hydrological, meteorological, clinical, and crowdsourced parameters.
    Returns normalized metrics, engineered indicators, and the Unified Outbreak Fusion Score.
    """
    try:
        response = fusion_engine_service.process_fusion(payload)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
