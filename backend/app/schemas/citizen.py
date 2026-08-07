from datetime import datetime
from pydantic import BaseModel
from typing import Optional, List


class CitizenReportCreate(BaseModel):
    reporter_name: str
    latitude: float
    longitude: float
    condition: str
    photo_url: Optional[str] = None


class CitizenReportResponse(BaseModel):
    id: int
    reporter_name: str
    timestamp: datetime
    latitude: float
    longitude: float
    condition: str
    silt_pct: float
    algae_pct: float
    sludge_pct: float
    laplacian_variance: float
    r_water_score: float
    status: str
    reason: Optional[str] = None
    reliability: str
    photo_url: Optional[str] = None
    cluster_id: Optional[str] = None

    class Config:
        from_attributes = True


class SpatialClusterResponse(BaseModel):
    cluster_id: str
    latitude: float
    longitude: float
    reports_count: int
    risk_level: str
    is_active: bool

    class Config:
        from_attributes = True


class CitizenDashboardSummary(BaseModel):
    total_reports: int
    total_clusters: int
    avg_risk_score: float
    reports: List[CitizenReportResponse]
    clusters: List[SpatialClusterResponse]
