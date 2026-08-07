"""
AquaShield AI — Pydantic Schemas for Satellite Imagery Module & Inundation Engine
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class SatelliteHealthResponse(BaseModel):
    status: str
    provider: str = "Planet Data API v1"
    authentication: str
    timestamp: str
    message: str


class SceneMetadata(BaseModel):
    image_id: str
    satellite_name: str
    acquisition_date: str
    cloud_cover_percent: float
    ground_resolution_m: float
    bounding_box: List[float]
    thumbnail_url: str
    download_url: str
    item_type: str


class SearchResponse(BaseModel):
    count: int
    query_parameters: Dict[str, Any]
    scenes: List[SceneMetadata]


class SceneDetailResponse(BaseModel):
    image_id: str
    satellite_name: str
    acquisition_date: str
    cloud_cover_percent: float
    ground_resolution_m: float
    bounding_box: List[float]
    thumbnail_url: str
    download_url: str
    item_type: str
    raw_properties: Dict[str, Any]
    links: Dict[str, Any]


class NDWIAnalysisResponse(BaseModel):
    image_id: str
    surface_water_pct: float
    water_pixel_count: int = 0
    total_pixels: int = 240000
    mean_ndwi: float = 0.0
    flooded_area_sq_km: float
    stagnant_water_pockets: int
    detection_confidence_pct: float
    flood_risk: str = "MINIMAL"
    cloud_cover_pct: float
    resolution_gsd_meters: float
    image_date: str
    processing_pipeline: str = "rgb_spectral_constrained"


class FloodComparisonResponse(BaseModel):
    baseline_image_id: str
    flood_image_id: str
    baseline_water_pct: float
    flood_water_pct: float
    water_expansion_rate_pct: float
    expanded_area_sq_km: float
    severity_level: str
    severity_description: str
    detection_confidence_pct: float
    stagnant_water_pockets: int
    disease_vector_risk: str
