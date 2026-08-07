from pydantic import BaseModel, Field
from typing import Dict


class FusionRequestPayload(BaseModel):
    village_name: str = Field(..., description="Name of the village/location")
    latitude: float = Field(..., description="Latitude coordinate")
    longitude: float = Field(..., description="Longitude coordinate")
    flood_water_pct: float = Field(..., description="Flood water inundation extent percentage")
    hospital_cases_7d: int = Field(..., description="Cumulative case count over last 7 days")
    case_surge_pct: float = Field(..., description="Healthcare case volume surge velocity percentage")
    citizen_reports_count: int = Field(..., description="Ground-level crowdsourced reports count")


class NormalizedMetrics(BaseModel):
    rainfall_score: float
    flood_score: float
    hospital_score: float
    citizen_score: float


class EngineeredFeatures(BaseModel):
    stagnation_index: float
    exposure_risk: float


class SemanticDomains(BaseModel):
    environmental_risk: float
    water_contamination_risk: float
    health_stress_risk: float
    community_exposure_risk: float


class FusionResponse(BaseModel):
    village_name: str
    normalized_metrics: NormalizedMetrics
    engineered_features: EngineeredFeatures
    semantic_domains: SemanticDomains
    unified_fusion_score: float
