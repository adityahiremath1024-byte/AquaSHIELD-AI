"""
AquaShield AI — Pydantic Schemas for Module 5: AI Multi-Signal Data Fusion Engine
"""
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class FusionRequestPayload(BaseModel):
    """Payload for POST /api/fusion/process."""
    village_name: str = Field("Kuttanad, Kerala", example="Kuttanad, Kerala")
    latitude: float = Field(9.3500, ge=-90, le=90)
    longitude: float = Field(76.4300, ge=-180, le=180)
    rain_7d_mm: Optional[float] = Field(180.0, ge=0)
    rain_anomaly_pct: Optional[float] = Field(45.2)
    consecutive_rainy_days: Optional[int] = Field(5, ge=0)
    humidity_pct: Optional[float] = Field(91.0, ge=0, le=100)
    flood_water_pct: Optional[float] = Field(34.0, ge=0, le=100)
    flood_expansion_pct: Optional[float] = Field(42.0)
    hospital_cases_7d: Optional[int] = Field(120, ge=0)
    case_surge_pct: Optional[float] = Field(70.0)
    bed_occupancy_pct: Optional[float] = Field(85.0, ge=0, le=100)
    citizen_reports_count: Optional[int] = Field(18, ge=0)
    is_high_risk_cluster: Optional[bool] = Field(True)


class FusionResponse(BaseModel):
    """Response structure for Module 5 Fusion Engine."""
    village_name: str
    latitude: float
    longitude: float
    validation: Dict[str, Any]
    normalized_metrics: Dict[str, float]
    engineered_features: Dict[str, Any]
    semantic_domains: Dict[str, float]
    unified_fusion_score: float
    risk_level: str
