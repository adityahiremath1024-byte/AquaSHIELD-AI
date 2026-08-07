from datetime import datetime
from typing import Dict, Any, List, Optional
import httpx

from app.config.settings import settings
from app.utils.exceptions import PlanetAPIError, PlanetAuthError, PlanetNotFoundError
from app.utils.geo import point_radius_to_geojson_polygon, calculate_bbox


class PlanetService:
    def __init__(self):
        self.api_key = settings.PLANET_API_KEY
        self.base_url = settings.PLANET_BASE_URL
        self.tiles_url = settings.PLANET_TILES_URL
        self.auth = httpx.BasicAuth(self.api_key, "")

    async def verify_health(self) -> Dict[str, Any]:
        """
        Verifies Planet API key against GET https://api.planet.com/data/v1/item-types.
        """
        now_iso = datetime.utcnow().isoformat() + "Z"
        url = f"{self.base_url}/item-types"
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                res = await client.get(url, auth=self.auth)
                if res.status_code == 200:
                    return {
                        "status": "healthy",
                        "provider": "Planet Data API v1",
                        "authentication": "verified",
                        "timestamp": now_iso,
                        "message": "Successfully authenticated with Planet API v1."
                    }
                elif res.status_code == 401:
                    return {
                        "status": "degraded",
                        "provider": "Planet Data API v1",
                        "authentication": "failed",
                        "timestamp": now_iso,
                        "message": "Authentication failed. Invalid or unauthorized Planet API Key."
                    }
                else:
                    return {
                        "status": "unhealthy",
                        "provider": "Planet Data API v1",
                        "authentication": "failed",
                        "timestamp": now_iso,
                        "message": f"Planet API returned status code {res.status_code}."
                    }
            except Exception as e:
                return {
                    "status": "unhealthy",
                    "provider": "Planet Data API v1",
                    "authentication": "failed",
                    "timestamp": now_iso,
                    "message": f"Connection to Planet API failed: {str(e)}"
                }

    async def search_scenes(
        self,
        latitude: float,
        longitude: float,
        radius_km: float = 10.0,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        cloud_cover_max: float = 0.5,
        item_types: str = "PSScene",
        limit: int = 25
    ) -> Dict[str, Any]:
        """
        Searches Planet API for scenes matching bounding box & filters.
        Sorts results by cloud_cover_percent ascending (0% cloud scenes first).
        """
        geometry = point_radius_to_geojson_polygon(latitude, longitude, radius_km)
        
        filters: List[Dict[str, Any]] = [
            {
                "type": "GeometryFilter",
                "field_name": "geometry",
                "config": geometry
            },
            {
                "type": "RangeFilter",
                "field_name": "cloud_cover",
                "config": {"lte": cloud_cover_max}
            }
        ]

        if start_date or end_date:
            date_config: Dict[str, str] = {}
            if start_date:
                date_config["gte"] = f"{start_date}T00:00:00Z"
            if end_date:
                date_config["lte"] = f"{end_date}T23:59:59Z"
            
            filters.append({
                "type": "DateRangeFilter",
                "field_name": "acquired",
                "config": date_config
            })

        search_filter = {
            "type": "AndFilter",
            "config": filters
        }

        payload = {
            "item_types": [item_types],
            "filter": search_filter
        }

        url = f"{self.base_url}/quick-search"
        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                res = await client.post(url, auth=self.auth, json=payload)
                if res.status_code == 401:
                    raise PlanetAuthError()
                elif res.status_code != 200:
                    raise PlanetAPIError(
                        message=f"Planet Search API failed with status {res.status_code}: {res.text}",
                        status_code=res.status_code
                    )

                data = res.json()
                features = data.get("features", [])

                scenes: List[Dict[str, Any]] = []
                for item in features:
                    props = item.get("properties", {})
                    scene_id = item.get("id")
                    
                    cloud_pct = round(float(props.get("cloud_cover", 0.0)) * 100.0, 2)
                    gsd = float(props.get("gsd", 3.0))
                    acquired = props.get("acquired", "")
                    instrument = props.get("instrument", props.get("satellite_id", "PlanetScope"))
                    
                    item_bbox = item.get("bbox")
                    if not item_bbox:
                        item_bbox = calculate_bbox(latitude, longitude, radius_km)

                    scenes.append({
                        "image_id": scene_id,
                        "satellite_name": instrument,
                        "acquisition_date": acquired,
                        "cloud_cover_percent": cloud_pct,
                        "ground_resolution_m": gsd,
                        "bounding_box": item_bbox,
                        "thumbnail_url": f"/api/satellite/thumbnail/{scene_id}?item_type={item_types}",
                        "download_url": f"{self.base_url}/item-types/{item_types}/items/{scene_id}",
                        "item_type": item_types
                    })

                # SORTING REQUIREMENT: Always sort search results by cloud_cover_percent ascending so 0% cloud scenes appear first
                scenes.sort(key=lambda s: s["cloud_cover_percent"])

                # Apply limit after sorting
                truncated_scenes = scenes[:limit]

                return {
                    "count": len(truncated_scenes),
                    "query_parameters": {
                        "latitude": latitude,
                        "longitude": longitude,
                        "radius_km": radius_km,
                        "start_date": start_date,
                        "end_date": end_date,
                        "cloud_cover_max": cloud_cover_max,
                        "item_types": item_types,
                        "limit": limit
                    },
                    "scenes": truncated_scenes
                }

            except (PlanetAuthError, PlanetAPIError):
                raise
            except Exception as e:
                raise PlanetAPIError(message=f"Error executing Planet search: {str(e)}", status_code=500)

    async def get_thumbnail(self, image_id: str, item_type: str = "PSScene") -> bytes:
        """
        Proxies thumbnail image bytes from tiles.planet.com using BasicAuth and follow_redirects=True.
        """
        thumb_url = f"{self.tiles_url}/item-types/{item_type}/items/{image_id}/thumb"
        
        async with httpx.AsyncClient(follow_redirects=True, timeout=15.0) as client:
            try:
                res = await client.get(thumb_url, auth=self.auth)
                if res.status_code == 200 and len(res.content) > 100:
                    return res.content
                elif res.status_code == 401:
                    raise PlanetAuthError()
                elif res.status_code == 404:
                    raise PlanetNotFoundError(message=f"Thumbnail for image {image_id} not found.")
                else:
                    raise PlanetAPIError(
                        message=f"Failed to fetch thumbnail. Status: {res.status_code}",
                        status_code=res.status_code
                    )
            except (PlanetAuthError, PlanetNotFoundError, PlanetAPIError):
                raise
            except Exception as e:
                raise PlanetAPIError(message=f"Error proxying thumbnail: {str(e)}", status_code=500)

    async def get_scene_detail(self, image_id: str, item_type: str = "PSScene") -> Dict[str, Any]:
        """
        Fetches detailed metadata for a single scene from Planet API.
        """
        url = f"{self.base_url}/item-types/{item_type}/items/{image_id}"
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                res = await client.get(url, auth=self.auth)
                if res.status_code == 200:
                    item = res.json()
                    props = item.get("properties", {})
                    
                    cloud_pct = round(float(props.get("cloud_cover", 0.0)) * 100.0, 2)
                    gsd = float(props.get("gsd", 3.0))
                    acquired = props.get("acquired", "")
                    instrument = props.get("instrument", props.get("satellite_id", "PlanetScope"))
                    item_bbox = item.get("bbox", [])

                    return {
                        "image_id": image_id,
                        "satellite_name": instrument,
                        "acquisition_date": acquired,
                        "cloud_cover_percent": cloud_pct,
                        "ground_resolution_m": gsd,
                        "bounding_box": item_bbox,
                        "thumbnail_url": f"/api/satellite/thumbnail/{image_id}?item_type={item_type}",
                        "download_url": f"{self.base_url}/item-types/{item_type}/items/{image_id}",
                        "item_type": item_type,
                        "raw_properties": props,
                        "links": item.get("_links", {})
                    }
                elif res.status_code == 401:
                    raise PlanetAuthError()
                elif res.status_code == 404:
                    raise PlanetNotFoundError(message=f"Scene {image_id} not found.")
                else:
                    raise PlanetAPIError(
                        message=f"Failed to fetch scene detail. Status: {res.status_code}",
                        status_code=res.status_code
                    )
            except (PlanetAuthError, PlanetNotFoundError, PlanetAPIError):
                raise
            except Exception as e:
                raise PlanetAPIError(message=f"Error fetching scene detail: {str(e)}", status_code=500)


planet_service = PlanetService()
