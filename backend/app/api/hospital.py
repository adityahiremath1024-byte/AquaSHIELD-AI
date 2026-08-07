"""
AquaShield AI — Module 3: Hospital Surveillance API Router
══════════════════════════════════════════════════════════
Endpoints:
  POST /api/hospital/records        — Submit daily admission & capacity data
  GET  /api/hospital/surge-summary  — Query live surge metrics & 7-day trend
  GET  /api/hospital/records        — List all records for a village
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List

from app.db.database import get_db
from app.db.models import HospitalRecord
from app.schemas.hospital import (
    HospitalRecordCreate,
    HospitalRecordResponse,
    HospitalSurgeSummaryResponse,
)
from app.services.hospital_service import create_or_update_record, get_surge_summary

router = APIRouter(prefix="/api/hospital", tags=["Module 3 — Hospital Surveillance"])


@router.post("/records", response_model=HospitalRecordResponse, status_code=201)
def submit_hospital_record(
    payload: HospitalRecordCreate,
    db: Session = Depends(get_db),
):
    """
    Submit a daily hospital admission record.
    Auto-deduplicates: if a record for the same village + date exists, it is merged/updated.
    All 7 mathematical metrics are computed on every write.
    """
    record = create_or_update_record(db, payload)
    return record


@router.get("/surge-summary", response_model=HospitalSurgeSummaryResponse)
def get_hospital_surge_summary(
    village_name: str = Query("Kottayam", description="Village or hospital name to query"),
    db: Session = Depends(get_db),
):
    """
    Returns the latest surge summary for a village:
    today's total cases, growth rate %, 7-day moving average,
    outbreak threshold tier, capacity utilization %, capacity risk score,
    5-star health rating, and 7-day historical trend.
    """
    summary = get_surge_summary(db, village_name)
    return summary


@router.get("/records", response_model=List[HospitalRecordResponse])
def list_hospital_records(
    village_name: str = Query("Kottayam", description="Village name to filter"),
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """List all hospital records for a village, newest first."""
    records = (
        db.query(HospitalRecord)
        .filter(HospitalRecord.village_name.ilike(f"%{village_name}%"))
        .order_by(desc(HospitalRecord.record_date))
        .limit(limit)
        .all()
    )
    if not records:
        raise HTTPException(status_code=404, detail=f"No records found for '{village_name}'")
    return records
