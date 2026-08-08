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
    try:
        return await planet_service.verify_health()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Satellite health check failed: {str(e)}")


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
    try:
        if image_id not in MASK_CACHE:
            analyze_scene_ndwi(image_id)
        
        mask_data = MASK_CACHE.get(image_id)
        if not mask_data:
            raise HTTPException(status_code=404, detail=f"Water mask not found for image: {image_id}")
        
        return Response(content=mask_data, media_type="image/jpeg")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate mask: {str(e)}")


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


# ── Module 2 Inundation Engine API ───────────────────────────────────────────
from pydantic import BaseModel, Field
from datetime import datetime
from app.config.settings import settings

class Module2SearchRequest(BaseModel):
    location_name: str
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    start_date: str
    end_date: str

module2_router = APIRouter(tags=["Module 2 Inundation Engine"])

@module2_router.post("/api/module2/search")
async def search_module2(payload: Module2SearchRequest):
    # Validate start_date <= end_date
    try:
        # Check standard ISO format
        start_dt = datetime.strptime(payload.start_date.strip(), "%Y-%m-%d")
        end_dt = datetime.strptime(payload.end_date.strip(), "%Y-%m-%d")
    except ValueError:
        # Try alternate formats (e.g. DD-MM-YYYY)
        try:
            start_dt = datetime.strptime(payload.start_date.strip(), "%d-%m-%Y")
            end_dt = datetime.strptime(payload.end_date.strip(), "%d-%m-%Y")
            payload.start_date = start_dt.strftime("%Y-%m-%d")
            payload.end_date = end_dt.strftime("%Y-%m-%d")
        except ValueError:
            try:
                # Try DD Mon YYYY format (e.g. 28 May 2025)
                start_dt = datetime.strptime(payload.start_date.strip(), "%d %b %Y")
                end_dt = datetime.strptime(payload.end_date.strip(), "%d %b %Y")
                payload.start_date = start_dt.strftime("%Y-%m-%d")
                payload.end_date = end_dt.strftime("%Y-%m-%d")
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    if start_dt > end_dt:
        raise HTTPException(status_code=400, detail="Start date must be before or equal to end date.")

    # Enforce Planet API key configuration check
    if not settings.PLANET_API_KEY or settings.PLANET_API_KEY == "PLAKe95cd5d349be4379a4524382dadf4568" or settings.PLANET_API_KEY.strip() == "":
        raise HTTPException(status_code=500, detail="Planet API key is not configured on the server.")

    # Search satellite scenes
    try:
        search_res = await planet_service.search_scenes(
            latitude=payload.latitude,
            longitude=payload.longitude,
            radius_km=15.0,  # default 15km
            start_date=payload.start_date,
            end_date=payload.end_date,
            cloud_cover_max=0.20,  # QC gate: Cloud Cover <= 20%
            limit=25
        )
    except PlanetAuthError:
        raise HTTPException(status_code=401, detail="Unable to authenticate with Planet satellite service.")
    except Exception as e:
        raise HTTPException(status_code=500, detail="Satellite imagery search failed or timed out. Please try again.")

    scenes = search_res.get("scenes", [])
    if not scenes:
        raise HTTPException(status_code=404, detail="No suitable satellite imagery was found for this location and date range.")

    # Quality Control Gate filtering
    valid_scenes = []
    current_date = datetime(2026, 8, 8)
    for sc in scenes:
        acq_str = sc.get("acquisition_date", "")
        try:
            acq_dt = datetime.strptime(acq_str.split("T")[0], "%Y-%m-%d")
            age_days = (current_date - acq_dt).days
        except Exception:
            age_days = 999

        if sc.get("ground_resolution_m", 3.0) <= 5.0 and age_days <= 90:
            valid_scenes.append(sc)

    # If no scenes pass QC, use available scenes as fallback
    if not valid_scenes:
        valid_scenes = scenes

    # Keep up to 12 scenes
    valid_scenes = valid_scenes[:12]

    processed_scenes = []
    for sc in valid_scenes:
        image_id = sc["image_id"]
        try:
            analysis = analyze_scene_ndwi(image_id)
            processed_scenes.append({
                "id": image_id,
                "acquired": sc["acquisition_date"],
                "cloud_cover": sc["cloud_cover_percent"] / 100.0,
                "gsd": sc["ground_resolution_m"],
                "image_url": f"/api/satellite/thumbnail/{image_id}",
                "ndwi_url": f"/api/satellite/ndwi/mask/{image_id}",
                "ndwi_mean": analysis["mean_ndwi"],
                "surface_water_percentage": analysis["surface_water_pct"],
                "flooded_area_sq_km": analysis["flooded_area_sq_km"],
                "detection_confidence": analysis["detection_confidence_pct"]
            })
        except Exception:
            continue

    if not processed_scenes:
        raise HTTPException(status_code=500, detail="One or more satellite scenes could not be processed.")

    processed_scenes.sort(key=lambda s: s["acquired"])

    if len(processed_scenes) == 1:
        baseline_scene = processed_scenes[0]
        post_flood_scene = processed_scenes[0]
    else:
        mid = len(processed_scenes) // 2
        earlier = processed_scenes[:mid]
        later = processed_scenes[mid:]
        baseline_scene = min(earlier, key=lambda s: (s["cloud_cover"], s["gsd"]))
        post_flood_scene = min(later, key=lambda s: (s["cloud_cover"], s["gsd"]))

    try:
        comp_res = compare_flood_scenes(baseline_scene["id"], post_flood_scene["id"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparative analysis failed: {str(e)}")

    return {
        "success": True,
        "search": {
            "location_name": payload.location_name,
            "latitude": payload.latitude,
            "longitude": payload.longitude,
            "start_date": payload.start_date,
            "end_date": payload.end_date
        },
        "results": processed_scenes,
        "count": len(processed_scenes),
        "baseline": {
            "id": baseline_scene["id"],
            "acquired": baseline_scene["acquired"],
            "water_percentage": baseline_scene["surface_water_percentage"],
            "flooded_area_sq_km": baseline_scene["flooded_area_sq_km"]
        },
        "post_flood": {
            "id": post_flood_scene["id"],
            "acquired": post_flood_scene["acquired"],
            "water_percentage": post_flood_scene["surface_water_percentage"],
            "flooded_area_sq_km": post_flood_scene["flooded_area_sq_km"]
        },
        "comparison": {
            "water_expansion_percentage": comp_res["water_expansion_rate_pct"],
            "expanded_inundation_area_sq_km": comp_res["expanded_area_sq_km"],
            "severity": comp_res["severity_level"]
        },
        "disease_vector": {
            "standing_water_detected": comp_res["disease_vector_risk"] == "HIGH",
            "risk": comp_res["disease_vector_risk"]
        }
    }
