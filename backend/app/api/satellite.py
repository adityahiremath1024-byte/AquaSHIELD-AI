from typing import Optional
from fastapi import APIRouter, Query, HTTPException, Response, status

from app.schemas.satellite import (
    SatelliteHealthResponse,
    SearchResponse,
    SceneDetailResponse,
    NDWIAnalysisResponse,
    FloodComparisonResponse
)
from app.services.planet_service import planet_service
from app.services.satellite_service import (
    analyze_scene_ndwi,
    compare_flood_scenes,
    MASK_CACHE
)
from app.utils.exceptions import PlanetAPIError, PlanetAuthError, PlanetNotFoundError

router = APIRouter(prefix="/api/satellite", tags=["Satellite Imagery Module"])


@router.get("/health", response_model=SatelliteHealthResponse)
async def satellite_health():
    """
    Verify Planet Data API authentication credentials.
    """
    return await planet_service.verify_health()


@router.get("/search", response_model=SearchResponse)
async def satellite_search(
    latitude: float = Query(..., description="Latitude of target location"),
    longitude: float = Query(..., description="Longitude of target location"),
    radius_km: float = Query(10.0, description="Bounding radius in kilometers"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    cloud_cover_max: float = Query(0.5, description="Maximum cloud cover fraction (0.0 to 1.0)"),
    item_types: str = Query("PSScene", description="Planet item type, default PSScene"),
    limit: int = Query(25, description="Maximum number of scenes to return")
):
    """
    Query PlanetScope satellite imagery matching geometry, date, and cloud constraints.
    Results are automatically sorted by cloud_cover_percent ascending (0% cloud scenes first).
    """
    try:
        return await planet_service.search_scenes(
            latitude=latitude,
            longitude=longitude,
            radius_km=radius_km,
            start_date=start_date,
            end_date=end_date,
            cloud_cover_max=cloud_cover_max,
            item_types=item_types,
            limit=limit
        )
    except PlanetAuthError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    except PlanetAPIError as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Unexpected error: {str(e)}")


@router.get("/thumbnail/{image_id}")
async def satellite_thumbnail(
    image_id: str,
    item_type: str = Query("PSScene", description="Planet item type")
):
    """
    Proxy satellite scene thumbnail PNG/JPEG bytes from Planet Tiles API.
    """
    try:
        image_bytes = await planet_service.get_thumbnail(image_id=image_id, item_type=item_type)
        return Response(content=image_bytes, media_type="image/png")
    except PlanetAuthError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    except PlanetNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PlanetAPIError as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to load thumbnail: {str(e)}")


@router.get("/search/{image_id}", response_model=SceneDetailResponse)
async def satellite_scene_detail(
    image_id: str,
    item_type: str = Query("PSScene", description="Planet item type")
):
    """
    Get detailed metadata for a single satellite scene by image ID.
    """
    try:
        return await planet_service.get_scene_detail(image_id=image_id, item_type=item_type)
    except PlanetAuthError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    except PlanetNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PlanetAPIError as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to fetch scene detail: {str(e)}")


# ── NDWI / Inundation Mask Endpoints ─────────────────────────────────────────

@router.get("/ndwi/analyze", response_model=NDWIAnalysisResponse)
def analyze_ndwi(
    image_id: str = Query(..., description="Target image ID"),
    item_type: str = Query("PSScene")
):
    """Compute NDWI, stagnant water clusters, and confidence ratios on scene."""
    try:
        return analyze_scene_ndwi(image_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"NDWI analysis failure: {str(e)}")


@router.get("/ndwi/mask/{image_id}")
def get_ndwi_mask(image_id: str):
    """Streams generated NDWI water mask JPEG overlay from memory cache."""
    if image_id not in MASK_CACHE:
        analyze_scene_ndwi(image_id)
    
    mask_data = MASK_CACHE.get(image_id)
    if not mask_data:
        raise HTTPException(status_code=404, detail=f"Water mask not found for image: {image_id}")
    
    return Response(content=mask_data, media_type="image/jpeg")


@router.get("/ndwi/compare", response_model=FloodComparisonResponse)
def compare_ndwi(
    baseline_image_id: str = Query(..., description="Pre-flood baseline scene ID"),
    flood_image_id: str = Query(..., description="Post-flood current scene ID"),
    radius_km: float = Query(15.0)
):
    """Compares pre-flood vs post-flood water coverage to obtain expansion rate %."""
    try:
        return compare_flood_scenes(baseline_image_id, flood_image_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparative analysis failure: {str(e)}")
