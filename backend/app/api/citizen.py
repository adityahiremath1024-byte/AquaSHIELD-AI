"""
AquaShield AI — Module 4: Citizen Water Quality Reports API Router
════════════════════════════════════════════════════════════════
Endpoints:
  POST /api/citizen/reports  — Submit crowdsourced water report
  GET  /api/citizen/summary  — Query metrics & cluster list
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.schemas.citizen import (
    CitizenReportCreate,
    CitizenReportResponse,
    CitizenDashboardSummary,
)
from app.services.citizen_service import create_citizen_report, get_citizen_summary

router = APIRouter(prefix="/api/citizen", tags=["Module 4 — Citizen Reports"])


@router.post("/reports", response_model=CitizenReportResponse, status_code=201)
def submit_report(
    payload: CitizenReportCreate,
    db: Session = Depends(get_db)
):
    """
    Submits a new crowdsourced water report.
    Executes simulated image feature mask decoding and Haversine spatial clustering.
    Stores all results using SQLAlchemy.
    """
    try:
        report = create_citizen_report(db, payload)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary", response_model=CitizenDashboardSummary)
def get_summary(
    db: Session = Depends(get_db)
):
    """
    Returns aggregated stats alongside listings of reports & active clusters.
    """
    try:
        summary = get_citizen_summary(db)
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
