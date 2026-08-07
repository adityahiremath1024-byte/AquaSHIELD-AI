import asyncio
import json
import os
import sys
from dotenv import load_dotenv

# Ensure backend directory is in path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

load_dotenv(os.path.join(BASE_DIR, ".env"))

from app.services.planet_service import planet_service
from app.config.settings import settings


async def main():
    print("=========================================================")
    print(" AQUASHIELD AI — PLANET SATELLITE ENGINE VERIFICATION ")
    print("=========================================================")
    print(f"Loaded PLANET_API_KEY: {settings.PLANET_API_KEY[:8]}... (Length: {len(settings.PLANET_API_KEY)})")
    print(f"Base API URL: {settings.PLANET_BASE_URL}")
    print("---------------------------------------------------------")

    # Step 1: Health check & Auth verification
    print("\n[Step 1] Verifying Planet API Key Health & Auth...")
    health = await planet_service.verify_health()
    print("Health Verification Result:")
    print(json.dumps(health, indent=2))

    # Step 2: Search imagery for Guwahati, Assam (26.1445, 91.7362)
    guwahati_lat = 26.1445
    guwahati_lon = 91.7362
    radius_km = 10.0

    print(f"\n[Step 2] Searching PlanetScope Imagery around Guwahati, Assam ({guwahati_lat}, {guwahati_lon})...")
    try:
        search_res = await planet_service.search_scenes(
            latitude=guwahati_lat,
            longitude=guwahati_lon,
            radius_km=radius_km,
            cloud_cover_max=0.5,
            item_types="PSScene",
            limit=10
        )
        print(f"Search Completed! Found {search_res['count']} matching scenes.")
        
        scenes = search_res.get("scenes", [])
        if scenes:
            print("\nTop Sorted Scenes (by Cloud Cover % Ascending):")
            for i, scene in enumerate(scenes[:5], 1):
                print(f"  {i}. ID: {scene['image_id']} | Date: {scene['acquisition_date']} | Cloud: {scene['cloud_cover_percent']}% | GSD: {scene['ground_resolution_m']}m")
            
            # Step 3: Fetch detail for the clearest scene (first item)
            target_scene_id = scenes[0]["image_id"]
            print(f"\n[Step 3] Fetching full metadata detail for top scene ID: {target_scene_id}...")
            detail = await planet_service.get_scene_detail(target_scene_id, item_type="PSScene")
            print("Single Scene Detail Metadata:")
            print(f"  - Image ID: {detail['image_id']}")
            print(f"  - Satellite / Instrument: {detail['satellite_name']}")
            print(f"  - Acquisition Date: {detail['acquisition_date']}")
            print(f"  - Cloud Cover %: {detail['cloud_cover_percent']}%")
            print(f"  - Ground Resolution: {detail['ground_resolution_m']} meters")
            print(f"  - Bounding Box: {detail['bounding_box']}")
            print(f"  - Thumbnail URL: {detail['thumbnail_url']}")
            print(f"  - Download URL: {detail['download_url']}")

        else:
            print("\nNo PlanetScope scenes found for specified query parameters.")

    except Exception as e:
        print(f"\nSearch / Detail request failed: {e}")

    print("\n=========================================================")
    print(" VERIFICATION COMPLETE ")
    print("=========================================================")


if __name__ == "__main__":
    asyncio.run(main())
