from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# ==========================================
# MODULE 6: PREDICTION SCHEMAS
# ==========================================

class PredictionRequest(BaseModel):
    village_name: str = Field("West Kainakary", description="Target village or region name")
    latitude: float = Field(9.4981, description="Geospatial latitude")
    longitude: float = Field(76.3388, description="Geospatial longitude")
    rainfall_mm: Optional[float] = Field(None, description="7-day cumulative rainfall in mm")
    temperature_c: Optional[float] = Field(None, description="Average temperature in Celsius")
    humidity_pct: Optional[float] = Field(None, description="Relative humidity percentage")
    flood_pct_increase: Optional[float] = Field(None, description="Inundation expansion percentage")
    hospital_cases_7d: Optional[int] = Field(None, description="7-day total hospital diarrheal cases")
    case_surge_pct: Optional[float] = Field(None, description="Hospital case surge rate %")
    citizen_reports_count: Optional[int] = Field(None, description="Number of citizen reports within region")
    water_stagnation_index: Optional[float] = Field(None, description="Water stagnation index 0-100")

class SHAPFeatureContribution(BaseModel):
    feature: str
    contribution: float
    color: str

class ActionPlanSection(BaseModel):
    title: str
    content: Any  # Union[str, List[str]]
    type: str     # "text" or "list"

class ActionPlanData(BaseModel):
    source: str   # "gemini" or "fallback"
    sections: List[ActionPlanSection]

class PredictionResponseData(BaseModel):
    risk_score: float
    risk_level: str
    confidence_r2: float
    confidence_r2_pct: float
    mae: float
    ci_lower: float
    ci_upper: float
    training_samples: int
    prediction_horizon: str
    model_type: str

class PredictionFullResponse(BaseModel):
    input: Dict[str, Any]
    prediction: PredictionResponseData
    shap_values: List[SHAPFeatureContribution]
    action_plan: ActionPlanData


# ==========================================
# MODULE 7: DIOE SCHEMAS
# ==========================================

class HospitalCapacityInput(BaseModel):
    total_beds: int = Field(100, description="Total bed capacity")
    occupied_beds: int = Field(85, description="Current occupied beds")
    doctors_on_duty: int = Field(5, description="Doctors on duty")
    ors_stock_packets: int = Field(4200, description="Current ORS stock packets")
    chlorine_stock_tablets: int = Field(8500, description="Current Chlorine stock tablets")

class DIEPayload(BaseModel):
    village_name: str = Field("West Kainakary", description="Location name")
    latitude: float = Field(9.4981, description="Latitude")
    longitude: float = Field(76.3388, description="Longitude")
    risk_score: float = Field(84.0, description="Module 6 predicted risk score %")
    risk_level: str = Field("CRITICAL", description="Risk level tier")
    disease_type: str = Field("Cholera / Acute Diarrhea", description="Predominant disease threat")
    confidence_pct: float = Field(91.0, description="Model confidence %")
    population: int = Field(16240, description="Regional population")
    hospital: Optional[HospitalCapacityInput] = None
    rain_7d_mm: Optional[float] = 182.0
    humidity_pct: Optional[float] = 91.0
    flood_pct: Optional[float] = 34.0
    flood_expansion_pct: Optional[float] = 19.0
    citizen_reports_count: Optional[int] = 18

class ResourceMetrics(BaseModel):
    expected_patients: int
    ors_packets_needed: int
    chlorine_tablets_needed: int
    doctors_needed: int
    attack_rate_pct: float

class ResourceGaps(BaseModel):
    doctors_gap: int
    ors_gap: int
    chlorine_gap: int

class InterventionItem(BaseModel):
    rank: int
    action_name: str
    efficacy_pct: float
    description: str

class ImpactSimulation(BaseModel):
    initial_risk: float
    total_reduction: float
    post_intervention_risk: float
    status_label: str

class TimelineBracket(BaseModel):
    bracket: str
    stage_title: str
    priority: str
    priority_class: str
    tasks: List[str]

class DIOEResponse(BaseModel):
    situation: Dict[str, Any]
    resources: ResourceMetrics
    gaps: ResourceGaps
    interventions: List[InterventionItem]
    impact_simulation: ImpactSimulation
    timeline: List[TimelineBracket]
    executive_narrative: ActionPlanData
