from datetime import datetime
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
