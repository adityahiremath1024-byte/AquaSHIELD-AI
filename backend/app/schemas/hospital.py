"""
AquaShield AI — Pydantic Schemas for Module 3: Hospital Surveillance
"""
from datetime import date as date_type, datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# ── Request Schema ──────────────────────────────────────────────────────────

class HospitalRecordCreate(BaseModel):
    """Payload for POST /api/hospital/records."""
    village_name: str = Field(..., example="Kottayam")
    latitude: float = Field(9.4981, ge=-90, le=90)
    longitude: float = Field(76.3388, ge=-180, le=180)
    record_date: date_type = Field(..., example="2025-06-04")
    diarrhea_cases: int = Field(0, ge=0)
    typhoid_cases: int = Field(0, ge=0)
    cholera_cases: int = Field(0, ge=0)
    fever_cases: int = Field(0, ge=0)
    total_beds: int = Field(100, ge=0)
    occupied_beds: int = Field(0, ge=0)
    doctors_on_duty: int = Field(1, ge=0)
    medicine_stock_pct: float = Field(100.0, ge=0, le=100)
    reported_by: str = Field("System", example="Dr. Sarah Paul")


# ── Response Schemas ────────────────────────────────────────────────────────

class HospitalRecordResponse(BaseModel):
    """Response after creating / updating a hospital record."""
    id: int
    village_name: str
    record_date: date_type
    total_cases: int
    yesterday_cases: int
    growth_rate_pct: float
    moving_avg_7d: float
    outbreak_threshold_level: str
    total_beds: int
    occupied_beds: int
    beds_available: int
    bed_occupancy_pct: float
    doctors_on_duty: int
    medicine_stock_pct: float
    hospital_capacity_risk_score: float
    hospital_score_stars: int
    is_imputed: bool
    reported_by: str

    class Config:
        from_attributes = True


class TrendDataPoint(BaseModel):
    """Single data point in the 7-day historical trend."""
    date: str
    cases: int


class HospitalSurgeSummaryResponse(BaseModel):
    """Response for GET /api/hospital/surge-summary."""
    village_name: str
    today_total: int
    diarrhea_cases: int = 0
    typhoid_cases: int = 0
    cholera_cases: int = 0
    fever_cases: int = 0
    growth_rate_pct: float
    moving_avg_7d: float
    outbreak_threshold_level: str
    capacity_utilization_pct: float
    beds_available: int
    total_beds: int
    occupied_beds: int
    doctors_on_duty: int
    medicine_stock_pct: float
    capacity_risk_score: float
    hospital_score_stars: int
    is_imputed: bool
    historical_trend: List[TrendDataPoint]
