import math
from typing import List, Dict, Any, Tuple

def calculate_bbox(lat: float, lon: float, radius_km: float = 10.0) -> List[float]:
    """
    Calculate a bounding box [min_lon, min_lat, max_lon, max_lat]
    around a point (lat, lon) for a given radius in kilometers.
    """
    d_lat = radius_km / 111.0
    d_lon = radius_km / (111.0 * math.cos(math.radians(lat)))
    
    min_lat = lat - d_lat
    max_lat = lat + d_lat
    min_lon = lon - d_lon
    max_lon = lon + d_lon
    
    return [round(min_lon, 6), round(min_lat, 6), round(max_lon, 6), round(max_lat, 6)]

def point_radius_to_geojson_polygon(lat: float, lon: float, radius_km: float = 10.0) -> Dict[str, Any]:
    """
    Generate a GeoJSON Polygon geometry dict from a latitude, longitude, and radius in km.
    """
    bbox = calculate_bbox(lat, lon, radius_km)
    min_lon, min_lat, max_lon, max_lat = bbox
    
    coordinates = [[
        [min_lon, min_lat],
        [max_lon, min_lat],
        [max_lon, max_lat],
        [min_lon, max_lat],
        [min_lon, min_lat]
    ]]
    
    return {
        "type": "Polygon",
        "coordinates": coordinates
    }
