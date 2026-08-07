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

from app.api.prediction import router as prediction_router
from app.api.dioe import router as dioe_router
from app.api.hospital import router as hospital_router
from app.api.weather import router as weather_router
from app.db.database import engine, SessionLocal
from app.db.models import Base, HospitalRecord

app = FastAPI(
    title="AquaShield AI — Outbreak Risk Engine & Decision Intelligence Backend",
    description="Production backend for Module 3 (Hospital Surveillance), Module 6 (XGBoost + SHAP + Gemini) and Module 7 (DIOE WHO Decision Optimizer).",
    version="1.1.0"
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
app.include_router(hospital_router)
app.include_router(prediction_router)
app.include_router(dioe_router)
app.include_router(weather_router)


# ── Database Initialization & Seed Data ──────────────────────────────────────
@app.on_event("startup")
def on_startup():
    """Create database tables and seed 7-day historical data if empty."""
    Base.metadata.create_all(bind=engine)
    _seed_hospital_data()


def _seed_hospital_data():
    """Insert 7-day sample hospital records for Kottayam General Hospital."""
    db = SessionLocal()
    try:
        existing_count = db.query(HospitalRecord).count()
        if existing_count > 0:
            return  # Already seeded

        # 7-day realistic hospital admission data (ascending trend)
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

            # Growth rate
            growth = round((total - prev_total) / max(prev_total, 1) * 100, 1) if prev_total > 0 else 0.0

            # Outbreak tier
            if total >= 50 or growth >= 100.0:
                tier = "EMERGENCY"
            elif total >= 25 or growth >= 60.0:
                tier = "ALERT"
            elif total >= 10 or growth >= 30.0:
                tier = "WATCH"
            else:
                tier = "NORMAL"

            # Capacity metrics
            total_beds = 520
            beds_occ = row["beds_occ"]
            beds_avail = max(0, total_beds - beds_occ)
            occ_pct = round(beds_occ / total_beds * 100, 1)

            # Risk score
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

            # Stars
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
                moving_avg_7d=0.0,  # will be recalculated
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

        # Recalculate 7-day moving averages for all seeded records
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


# Mount Static Files (HTML/CSS/JS dashboard) — MUST be last
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
            "Module 3: Hospital Surveillance",
            "Module 6: Prediction",
            "Module 7: DIOE"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
