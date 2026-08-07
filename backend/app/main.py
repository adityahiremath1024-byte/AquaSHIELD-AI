import os
from datetime import date, timedelta
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Load environment variables
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(BASE_DIR, ".env")
load_dotenv(ENV_PATH)

from app.api.weather import router as weather_router
from app.api.satellite import router as satellite_router
from app.api.hospital import router as hospital_router
from app.api.citizen import router as citizen_router
from app.api.fusion import router as fusion_router
from app.api.prediction import router as prediction_router
from app.api.dioe import router as dioe_router
<<<<<<< HEAD

=======
from app.api.hospital import router as hospital_router
from app.api.fusion import router as fusion_router
from app.api.citizen import router as citizen_router
>>>>>>> 79b8d27 (Resolve merge conflict in main.py, models.py and add db ignore)
from app.db.database import engine, SessionLocal
from app.db.models import Base, HospitalRecord, CitizenReport, SpatialCluster

app = FastAPI(
    title="AquaShield AI — Satellite & Outbreak Intelligence Engine",
    description="Production backend for Planet Satellite Imagery Engine and Modules.",
    version="1.2.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(weather_router)
app.include_router(satellite_router)
app.include_router(hospital_router)
app.include_router(citizen_router)
app.include_router(fusion_router)
app.include_router(prediction_router)
app.include_router(dioe_router)


# ── Database Initialization & Seed Data ──────────────────────────────────────
@app.on_event("startup")
def on_startup():
    """Create database tables and seed 7-day historical data if empty."""
    Base.metadata.create_all(bind=engine)
    _seed_hospital_data()
    _seed_citizen_data()


def _seed_hospital_data():
    """Insert 7-day sample hospital records for Kottayam General Hospital."""
    db = SessionLocal()
    try:
        existing_count = db.query(HospitalRecord).count()
        if existing_count > 0:
            return  # Already seeded

        seed_data = [
            {"days_ago": 6, "diarrhea": 5,  "typhoid": 3, "cholera": 1, "fever": 3,  "total": 12, "beds_occ": 410, "docs": 22, "med": 88.0},
            {"days_ago": 5, "diarrhea": 6,  "typhoid": 3, "cholera": 1, "fever": 4,  "total": 14, "beds_occ": 418, "docs": 24, "med": 85.0},
            {"days_ago": 4, "diarrhea": 8,  "typhoid": 4, "cholera": 2, "fever": 4,  "total": 18, "beds_occ": 425, "docs": 22, "med": 80.0},
            {"days_ago": 3, "diarrhea": 10, "typhoid": 5, "cholera": 2, "fever": 4,  "total": 21, "beds_occ": 430, "docs": 23, "med": 76.0},
            {"days_ago": 2, "diarrhea": 12, "typhoid": 6, "cholera": 2, "fever": 5,  "total": 25, "beds_occ": 435, "docs": 21, "med": 72.0},
            {"days_ago": 1, "diarrhea": 14, "typhoid": 7, "cholera": 3, "fever": 6,  "total": 30, "beds_occ": 438, "docs": 23, "med": 68.0},
            {"days_ago": 0, "diarrhea": 17, "typhoid": 9, "cholera": 4, "fever": 8,  "total": 38, "beds_occ": 442, "docs": 24, "med": 62.0},
        ]

        today = date.today()
        prev_total = 0

        for row in seed_data:
            rec_date = today - timedelta(days=row["days_ago"])
            total = row["total"]

            growth = round((total - prev_total) / max(prev_total, 1) * 100, 1) if prev_total > 0 else 0.0

            if total >= 50 or growth >= 100.0:
                tier = "EMERGENCY"
            elif total >= 25 or growth >= 60.0:
                tier = "ALERT"
            elif total >= 10 or growth >= 30.0:
                tier = "WATCH"
            else:
                tier = "NORMAL"

            total_beds = 520
            beds_occ = row["beds_occ"]
            beds_avail = max(0, total_beds - beds_occ)
            occ_pct = round(beds_occ / total_beds * 100, 1)

            risk = 3.0
            if occ_pct > 80.0:
                risk += 3.0
            if row["med"] < 30.0:
                risk += 2.0
            if row["docs"] < 3:
                risk += 1.0
            if growth > 50.0:
                risk += 1.0
            risk = min(10.0, risk)

            if risk <= 2.0:
                stars = 5
            elif risk <= 4.0:
                stars = 4
            elif risk <= 6.0:
                stars = 3
            elif risk <= 8.0:
                stars = 2
            else:
                stars = 1

            record = HospitalRecord(
                village_name="Kottayam General Hospital",
                latitude=9.5916,
                longitude=76.5222,
                record_date=rec_date,
                diarrhea_cases=row["diarrhea"],
                typhoid_cases=row["typhoid"],
                cholera_cases=row["cholera"],
                fever_cases=row["fever"],
                total_cases=total,
                yesterday_cases=prev_total,
                growth_rate_pct=growth,
                moving_avg_7d=0.0,
                outbreak_threshold_level=tier,
                total_beds=total_beds,
                occupied_beds=beds_occ,
                beds_available=beds_avail,
                bed_occupancy_pct=occ_pct,
                doctors_on_duty=row["docs"],
                medicine_stock_pct=row["med"],
                hospital_capacity_risk_score=risk,
                hospital_score_stars=stars,
                is_imputed=False,
                reported_by="Seed Data",
            )
            db.add(record)
            prev_total = total

        db.commit()

        all_records = (
            db.query(HospitalRecord)
            .order_by(HospitalRecord.record_date)
            .all()
        )
        totals_so_far = []
        for rec in all_records:
            totals_so_far.append(rec.total_cases)
            n = min(len(totals_so_far), 7)
            rec.moving_avg_7d = round(sum(totals_so_far[-n:]) / n, 1)
        db.commit()

    finally:
        db.close()


def _seed_citizen_data():
    """Insert initial crowdsourced validated citizen water reports and spatial clusters."""
    db = SessionLocal()
    try:
        if db.query(CitizenReport).count() > 0:
            return

        cluster_high = SpatialCluster(
            cluster_id="CLUSTER-12971-77594",
            latitude=12.9716,
            longitude=77.5946,
            reports_count=4,
            risk_level="HIGH RISK",
            is_active=True
        )
        cluster_mod = SpatialCluster(
            cluster_id="CLUSTER-12962-77605",
            latitude=12.9621,
            longitude=77.6058,
            reports_count=1,
            risk_level="MODERATE",
            is_active=True
        )
        db.add(cluster_high)
        db.add(cluster_mod)
        db.commit()

        reports = [
            CitizenReport(
                reporter_name="Anjali Kurup",
                latitude=12.9716,
                longitude=77.5946,
                condition="silt",
                silt_pct=18.4,
                algae_pct=6.2,
                sludge_pct=3.1,
                laplacian_variance=340.0,
                r_water_score=26.4,
                status="ACCEPTED",
                reason="Water contamination accepted",
                reliability="badge-trusted",
                cluster_id="CLUSTER-12971-77594"
            ),
            CitizenReport(
                reporter_name="Manu Joseph",
                latitude=12.9720,
                longitude=77.5950,
                condition="algae",
                silt_pct=4.5,
                algae_pct=22.8,
                sludge_pct=1.2,
                laplacian_variance=180.0,
                r_water_score=21.0,
                status="ACCEPTED",
                reason="Water contamination accepted",
                reliability="badge-trusted",
                cluster_id="CLUSTER-12971-77594"
            ),
            CitizenReport(
                reporter_name="Devassy Thomas",
                latitude=12.9710,
                longitude=77.5940,
                condition="sludge",
                silt_pct=2.1,
                algae_pct=3.4,
                sludge_pct=15.6,
                laplacian_variance=95.0,
                r_water_score=20.1,
                status="ACCEPTED",
                reason="Water contamination accepted",
                reliability="badge-new",
                cluster_id="CLUSTER-12971-77594"
            ),
            CitizenReport(
                reporter_name="Ramesh K.",
                latitude=12.9715,
                longitude=77.5942,
                condition="silt",
                silt_pct=12.0,
                algae_pct=5.0,
                sludge_pct=2.0,
                laplacian_variance=290.0,
                r_water_score=23.6,
                status="ACCEPTED",
                reason="Water contamination accepted",
                reliability="badge-trusted",
                cluster_id="CLUSTER-12971-77594"
            ),
            CitizenReport(
                reporter_name="Sunitha Paul",
                latitude=12.9621,
                longitude=77.6058,
                condition="silt",
                silt_pct=24.5,
                algae_pct=1.5,
                sludge_pct=8.2,
                laplacian_variance=410.0,
                r_water_score=31.2,
                status="ACCEPTED",
                reason="Water contamination accepted",
                reliability="badge-trusted",
                cluster_id="CLUSTER-12962-77605"
            ),
            CitizenReport(
                reporter_name="Unknown Uploader",
                latitude=12.9810,
                longitude=77.5812,
                condition="clean",
                silt_pct=0.2,
                algae_pct=0.1,
                sludge_pct=0.5,
                laplacian_variance=42.0,
                r_water_score=15.0,
                status="REJECTED",
                reason="Selfie rejected",
                reliability="badge-spam"
            )
        ]
        
        for r in reports:
            if r.status == "ACCEPTED":
                r.photo_url = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%231b223c'><rect width='100' height='100'/><path d='M10 80 Q 30 50, 50 80 T 90 80' fill='none' stroke='%23d97706' stroke-width='3'/><path d='M10 60 Q 30 40, 50 60 T 90 60' fill='none' stroke='%23059669' stroke-width='2'/></svg>"
            else:
                r.photo_url = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%231b223c'><rect width='100' height='100'/><circle cx='50' cy='35' r='15' fill='%23e0e0e0'/><path d='M20 80 Q 50 50, 80 80' fill='%23e0e0e0'/></svg>"
            db.add(r)
            
        db.commit()
    finally:
        db.close()


STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
if os.path.exists(STATIC_DIR):
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "system": "AquaShield AI Engine",
        "modules": [
            "Module 1: Meteorological Intelligence",
            "Module 2: Satellite Imagery Engine",
            "Module 3: Hospital Surveillance",
            "Module 6: Prediction",
            "Module 7: DIOE"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
