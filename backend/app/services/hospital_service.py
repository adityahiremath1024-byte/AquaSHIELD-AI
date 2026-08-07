"""
AquaShield AI — Module 3: Hospital Surveillance Mathematical Engine
═══════════════════════════════════════════════════════════════════
Implements all 7 deterministic formulas specified in the Module 3
technical architecture document:

  1. Total Daily Case Admissions  (C_today)
  2. 7-Day Rolling Moving Average (MA_7d)
  3. Growth Rate %                (yesterday vs today velocity)
  4. Outbreak Threshold Tiers     (Emergency / Alert / Watch / Normal)
  5. Hospital Capacity Metrics    (Beds Available, Bed Occupancy %)
  6. Capacity Risk Score          (R_capacity ∈ [0, 10])
  7. 5-Star Health Rating Mapping (⋆ to ⋆⋆⋆⋆⋆)

Also includes:
  - Auto-deduplication (merge on village_name + record_date)
  - Missing data imputation via MA_7d
"""
from datetime import date as date_type, timedelta, datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.models import HospitalRecord
from app.schemas.hospital import HospitalRecordCreate


# ═════════════════════════════════════════════════════════════════════════════
# Formula 1: Total Daily Case Admissions
# ═════════════════════════════════════════════════════════════════════════════
def compute_total_cases(diarrhea: int, typhoid: int, cholera: int, fever: int) -> int:
    """C_today = Diarrhea + Typhoid + Cholera + Fever"""
    return diarrhea + typhoid + cholera + fever


# ═════════════════════════════════════════════════════════════════════════════
# Formula 2: 7-Day Rolling Moving Average
# ═════════════════════════════════════════════════════════════════════════════
def compute_moving_avg_7d(past_totals: List[int]) -> float:
    """MA_7d = (1/N) * Σ C_i   where N ≤ 7"""
    if not past_totals:
        return 0.0
    n = min(len(past_totals), 7)
    return round(sum(past_totals[-n:]) / n, 1)


# ═════════════════════════════════════════════════════════════════════════════
# Formula 3: Growth Rate % (Yesterday vs Today Velocity)
# ═════════════════════════════════════════════════════════════════════════════
def compute_growth_rate(today: int, yesterday: int) -> float:
    """Growth Rate % = (C_today - C_yesterday) / max(C_yesterday, 1) × 100"""
    return round((today - yesterday) / max(yesterday, 1) * 100, 1)


# ═════════════════════════════════════════════════════════════════════════════
# Formula 4: Outbreak Threshold Tiers
# ═════════════════════════════════════════════════════════════════════════════
def classify_outbreak_tier(total_cases: int, growth_rate: float) -> str:
    """
    Emergency: C_today ≥ 50 OR Growth ≥ 100%
    Alert:     C_today ≥ 25 OR Growth ≥ 60%
    Watch:     C_today ≥ 10 OR Growth ≥ 30%
    Normal:    otherwise
    """
    if total_cases >= 50 or growth_rate >= 100.0:
        return "EMERGENCY"
    if total_cases >= 25 or growth_rate >= 60.0:
        return "ALERT"
    if total_cases >= 10 or growth_rate >= 30.0:
        return "WATCH"
    return "NORMAL"


# ═════════════════════════════════════════════════════════════════════════════
# Formula 5: Hospital Capacity Metrics
# ═════════════════════════════════════════════════════════════════════════════
def compute_beds_available(total_beds: int, occupied_beds: int) -> int:
    """Beds Available = max(0, Total Beds − Occupied Beds)"""
    return max(0, total_beds - occupied_beds)


def compute_bed_occupancy_pct(total_beds: int, occupied_beds: int) -> float:
    """Bed Occupancy % = (Occupied / Total) × 100"""
    if total_beds <= 0:
        return 0.0
    return round(occupied_beds / total_beds * 100, 1)


# ═════════════════════════════════════════════════════════════════════════════
# Formula 6: Hospital Capacity Risk Score (R_capacity ∈ [0, 10])
# ═════════════════════════════════════════════════════════════════════════════
def compute_capacity_risk_score(
    bed_occupancy_pct: float,
    medicine_stock_pct: float,
    doctors_on_duty: int,
    growth_rate_pct: float
) -> float:
    """
    R_capacity = 3.0 (Base)
        + 3.0  if Bed Occupancy > 80%
        + 2.0  if Medicine Stock < 30%
        + 1.0  if Doctors on Duty < 3
        + 1.0  if Growth Rate > 50%
    Final = min(10.0, R_capacity)
    """
    score = 3.0
    if bed_occupancy_pct > 80.0:
        score += 3.0
    if medicine_stock_pct < 30.0:
        score += 2.0
    if doctors_on_duty < 3:
        score += 1.0
    if growth_rate_pct > 50.0:
        score += 1.0
    return min(10.0, round(score, 1))


# ═════════════════════════════════════════════════════════════════════════════
# Formula 7: 5-Star Health Rating Mapping
# ═════════════════════════════════════════════════════════════════════════════
def compute_star_rating(capacity_risk_score: float) -> int:
    """
    0.0 – 2.0  → 5★ (Excellent PHC Capacity)
    2.1 – 4.0  → 4★ (Good Capacity)
    4.1 – 6.0  → 3★ (Moderate Strain)
    6.1 – 8.0  → 2★ (High Capacity Strain)
    8.1 – 10.0 → 1★ (Critical Capacity Collapse)
    """
    if capacity_risk_score <= 2.0:
        return 5
    if capacity_risk_score <= 4.0:
        return 4
    if capacity_risk_score <= 6.0:
        return 3
    if capacity_risk_score <= 8.0:
        return 2
    return 1


# ═════════════════════════════════════════════════════════════════════════════
# DB Helpers: Fetch Historical Records
# ═════════════════════════════════════════════════════════════════════════════
def _get_past_records(db: Session, village_name: str, before_date: date_type, limit: int = 7) -> List[HospitalRecord]:
    """Fetch up to `limit` past records for a village, ordered by date descending."""
    return (
        db.query(HospitalRecord)
        .filter(
            HospitalRecord.village_name.ilike(f"%{village_name}%"),
            HospitalRecord.record_date < before_date,
        )
        .order_by(desc(HospitalRecord.record_date))
        .limit(limit)
        .all()
    )


def _get_yesterday_cases(db: Session, village_name: str, today: date_type) -> int:
    """Retrieve yesterday's total cases. Returns 0 if no record found."""
    yesterday = today - timedelta(days=1)
    rec = (
        db.query(HospitalRecord)
        .filter(
            HospitalRecord.village_name.ilike(f"%{village_name}%"),
            HospitalRecord.record_date == yesterday,
        )
        .first()
    )
    return rec.total_cases if rec else 0


# ═════════════════════════════════════════════════════════════════════════════
# Core Service: Create / Update Record (with Deduplication)
# ═════════════════════════════════════════════════════════════════════════════
def create_or_update_record(db: Session, payload: HospitalRecordCreate) -> HospitalRecord:
    """
    Submit a daily hospital record.
    - Auto-deduplicates: if (village_name, record_date) exists, merges values.
    - Computes all 7 mathematical metrics on every write.
    """

    # ── Step 1: Total daily cases ──
    total_cases = compute_total_cases(
        payload.diarrhea_cases,
        payload.typhoid_cases,
        payload.cholera_cases,
        payload.fever_cases,
    )

    # ── Step 2: Yesterday's cases for growth calculation ──
    yesterday_cases = _get_yesterday_cases(db, payload.village_name, payload.record_date)

    # ── Step 3: Growth rate ──
    growth_rate = compute_growth_rate(total_cases, yesterday_cases)

    # ── Step 4: 7-day rolling moving average (including today) ──
    past_records = _get_past_records(db, payload.village_name, payload.record_date, limit=6)
    past_totals = [r.total_cases for r in reversed(past_records)]
    past_totals.append(total_cases)
    moving_avg = compute_moving_avg_7d(past_totals)

    # ── Step 5: Outbreak threshold tier ──
    tier = classify_outbreak_tier(total_cases, growth_rate)

    # ── Step 6: Capacity metrics ──
    beds_available = compute_beds_available(payload.total_beds, payload.occupied_beds)
    bed_occupancy = compute_bed_occupancy_pct(payload.total_beds, payload.occupied_beds)

    # ── Step 7: Capacity risk score & star rating ──
    risk_score = compute_capacity_risk_score(
        bed_occupancy, payload.medicine_stock_pct, payload.doctors_on_duty, growth_rate
    )
    stars = compute_star_rating(risk_score)

    # ── Deduplication: check if record already exists ──
    existing = (
        db.query(HospitalRecord)
        .filter(
            HospitalRecord.village_name.ilike(f"%{payload.village_name}%"),
            HospitalRecord.record_date == payload.record_date,
        )
        .first()
    )

    if existing:
        # Merge / update existing record
        existing.diarrhea_cases = payload.diarrhea_cases
        existing.typhoid_cases = payload.typhoid_cases
        existing.cholera_cases = payload.cholera_cases
        existing.fever_cases = payload.fever_cases
        existing.total_cases = total_cases
        existing.yesterday_cases = yesterday_cases
        existing.growth_rate_pct = growth_rate
        existing.moving_avg_7d = moving_avg
        existing.outbreak_threshold_level = tier
        existing.total_beds = payload.total_beds
        existing.occupied_beds = payload.occupied_beds
        existing.beds_available = beds_available
        existing.bed_occupancy_pct = bed_occupancy
        existing.doctors_on_duty = payload.doctors_on_duty
        existing.medicine_stock_pct = payload.medicine_stock_pct
        existing.hospital_capacity_risk_score = risk_score
        existing.hospital_score_stars = stars
        existing.is_imputed = False
        existing.reported_by = payload.reported_by
        existing.latitude = payload.latitude
        existing.longitude = payload.longitude
        db.commit()
        db.refresh(existing)
        return existing

    # Create new record
    record = HospitalRecord(
        village_name=payload.village_name,
        latitude=payload.latitude,
        longitude=payload.longitude,
        record_date=payload.record_date,
        diarrhea_cases=payload.diarrhea_cases,
        typhoid_cases=payload.typhoid_cases,
        cholera_cases=payload.cholera_cases,
        fever_cases=payload.fever_cases,
        total_cases=total_cases,
        yesterday_cases=yesterday_cases,
        growth_rate_pct=growth_rate,
        moving_avg_7d=moving_avg,
        outbreak_threshold_level=tier,
        total_beds=payload.total_beds,
        occupied_beds=payload.occupied_beds,
        beds_available=beds_available,
        bed_occupancy_pct=bed_occupancy,
        doctors_on_duty=payload.doctors_on_duty,
        medicine_stock_pct=payload.medicine_stock_pct,
        hospital_capacity_risk_score=risk_score,
        hospital_score_stars=stars,
        is_imputed=False,
        reported_by=payload.reported_by,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


# ═════════════════════════════════════════════════════════════════════════════
# Core Service: Surge Summary Query
# ═════════════════════════════════════════════════════════════════════════════
def get_surge_summary(db: Session, village_name: str) -> dict:
    """
    Returns the latest surge summary for a village including:
    - Today's total cases, growth rate, 7-day MA, outbreak tier
    - Capacity utilization, risk score, star rating
    - 7-day historical trend
    """
    # Get the latest record for this village
    latest = (
        db.query(HospitalRecord)
        .filter(HospitalRecord.village_name.ilike(f"%{village_name}%"))
        .order_by(desc(HospitalRecord.record_date))
        .first()
    )

    if not latest:
        return _empty_summary(village_name)

    # Get 7-day historical trend
    trend_records = (
        db.query(HospitalRecord)
        .filter(HospitalRecord.village_name.ilike(f"%{village_name}%"))
        .order_by(desc(HospitalRecord.record_date))
        .limit(7)
        .all()
    )
    trend_records.reverse()  # chronological order

    historical_trend = [
        {"date": r.record_date.strftime("%Y-%m-%d"), "cases": r.total_cases}
        for r in trend_records
    ]

    return {
        "village_name": latest.village_name,
        "today_total": latest.total_cases,
        "diarrhea_cases": latest.diarrhea_cases,
        "typhoid_cases": latest.typhoid_cases,
        "cholera_cases": latest.cholera_cases,
        "fever_cases": latest.fever_cases,
        "growth_rate_pct": latest.growth_rate_pct,
        "moving_avg_7d": latest.moving_avg_7d,
        "outbreak_threshold_level": latest.outbreak_threshold_level,
        "capacity_utilization_pct": latest.bed_occupancy_pct,
        "beds_available": latest.beds_available,
        "total_beds": latest.total_beds,
        "occupied_beds": latest.occupied_beds,
        "doctors_on_duty": latest.doctors_on_duty,
        "medicine_stock_pct": latest.medicine_stock_pct,
        "capacity_risk_score": latest.hospital_capacity_risk_score,
        "hospital_score_stars": latest.hospital_score_stars,
        "is_imputed": latest.is_imputed,
        "historical_trend": historical_trend,
    }


def _empty_summary(village_name: str) -> dict:
    """Return a zeroed summary when no records exist."""
    return {
        "village_name": village_name,
        "today_total": 0,
        "diarrhea_cases": 0,
        "typhoid_cases": 0,
        "cholera_cases": 0,
        "fever_cases": 0,
        "growth_rate_pct": 0.0,
        "moving_avg_7d": 0.0,
        "outbreak_threshold_level": "NORMAL",
        "capacity_utilization_pct": 0.0,
        "beds_available": 0,
        "total_beds": 0,
        "occupied_beds": 0,
        "doctors_on_duty": 0,
        "medicine_stock_pct": 100.0,
        "capacity_risk_score": 3.0,
        "hospital_score_stars": 5,
        "is_imputed": False,
        "historical_trend": [],
    }
