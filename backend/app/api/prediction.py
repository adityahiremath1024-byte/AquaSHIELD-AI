from fastapi import APIRouter, Query, HTTPException
from typing import Optional

from app.schemas.prediction import PredictionRequest, PredictionFullResponse
from app.services.prediction_engine import prediction_engine

router = APIRouter(prefix="/api/prediction", tags=["Module 6: Outbreak Prediction"])


@router.get("/analyze")
def analyze_prediction_get(
    village_name: str = Query("West Kainakary", description="Village name"),
    latitude: float = Query(9.4981, description="Latitude"),
    longitude: float = Query(76.3388, description="Longitude"),
    rainfall_mm: Optional[float] = Query(None, description="Rainfall in mm"),
    temperature_c: Optional[float] = Query(None, description="Temperature in C"),
    humidity_pct: Optional[float] = Query(None, description="Humidity %"),
    flood_pct_increase: Optional[float] = Query(None, description="Flood increase %"),
    hospital_cases_7d: Optional[int] = Query(None, description="Hospital cases 7d"),
    case_surge_pct: Optional[float] = Query(None, description="Case surge %"),
    citizen_reports_count: Optional[int] = Query(None, description="Citizen reports count"),
    water_stagnation_index: Optional[float] = Query(None, description="Stagnation index")
):
    try:
        req = PredictionRequest(
            village_name=village_name,
            latitude=latitude,
            longitude=longitude,
            rainfall_mm=rainfall_mm,
            temperature_c=temperature_c,
            humidity_pct=humidity_pct,
            flood_pct_increase=flood_pct_increase,
            hospital_cases_7d=hospital_cases_7d,
            case_surge_pct=case_surge_pct,
            citizen_reports_count=citizen_reports_count,
            water_stagnation_index=water_stagnation_index
        )
        return prediction_engine.analyze(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction analysis failed: {str(e)}")


@router.post("/run")
def run_prediction_post(req: PredictionRequest):
    try:
        return prediction_engine.analyze(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction run failed: {str(e)}")

