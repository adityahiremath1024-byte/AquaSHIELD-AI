"""
AquaShield AI — ORM Models
Table 1: hospital_records — Daily hospital admission records and capacity metrics.
"""
from datetime import datetime, date as date_type
from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime
from app.db.database import Base


class HospitalRecord(Base):
    """Daily hospital admission + capacity snapshot for a given village/facility."""

    __tablename__ = "hospital_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    village_name = Column(String, nullable=False, index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    record_date = Column(Date, nullable=False, index=True)

    # ── Disease Case Counts ──
    diarrhea_cases = Column(Integer, default=0)
    typhoid_cases = Column(Integer, default=0)
    cholera_cases = Column(Integer, default=0)
    fever_cases = Column(Integer, default=0)
    total_cases = Column(Integer, default=0)

    # ── Surge / Velocity Metrics (computed on write) ──
    yesterday_cases = Column(Integer, default=0)
    growth_rate_pct = Column(Float, default=0.0)
    moving_avg_7d = Column(Float, default=0.0)
    outbreak_threshold_level = Column(String, default="Normal")

    # ── Capacity Metrics ──
    total_beds = Column(Integer, default=100)
    occupied_beds = Column(Integer, default=0)
    beds_available = Column(Integer, default=100)
    bed_occupancy_pct = Column(Float, default=0.0)
    doctors_on_duty = Column(Integer, default=0)
    medicine_stock_pct = Column(Float, default=100.0)

    # ── Risk Scoring ──
    hospital_capacity_risk_score = Column(Float, default=3.0)
    hospital_score_stars = Column(Integer, default=5)

    # ── Meta ──
    is_imputed = Column(Boolean, default=False)
    reported_by = Column(String, default="System")
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return (
            f"<HospitalRecord(village={self.village_name}, date={self.record_date}, "
            f"cases={self.total_cases}, tier={self.outbreak_threshold_level})>"
        )
