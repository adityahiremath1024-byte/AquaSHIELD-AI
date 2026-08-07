import math
import random
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.models import CitizenReport, SpatialCluster
from app.schemas.citizen import CitizenReportCreate, CitizenDashboardSummary

logger = logging.getLogger("aquashield.citizen_service")


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes Earth distance in meters using Haversine formula."""
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2))
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


def create_citizen_report(db: Session, payload: CitizenReportCreate) -> CitizenReport:
    """
    Submits a new crowdsourced water report.
    Executes simulated image feature mask decoding and Haversine spatial clustering.
    Stores all results using SQLAlchemy.
    """
    condition = payload.condition.lower()
    
    # ── Simulated Computer Vision Mask Outputs ──
    silt = 0.0
    algae = 0.0
    sludge = 0.0
    laplacian = float(random.randint(60, 260))

    if condition == "silt":
        silt = random.uniform(15.0, 30.0)
        algae = random.uniform(2.0, 7.0)
        sludge = random.uniform(1.0, 5.0)
        laplacian = float(random.randint(250, 450))
    elif condition == "algae":
        silt = random.uniform(1.0, 5.0)
        algae = random.uniform(10.0, 30.0)
        sludge = random.uniform(1.0, 4.0)
        laplacian = float(random.randint(120, 270))
    elif condition == "sludge":
        silt = random.uniform(1.0, 6.0)
        algae = random.uniform(1.0, 5.0)
        sludge = random.uniform(8.0, 23.0)
        laplacian = float(random.randint(80, 180))
    elif condition == "clean":
        silt = random.uniform(0.0, 1.5)
        algae = random.uniform(0.0, 1.0)
        sludge = random.uniform(0.0, 1.0)
        laplacian = float(random.randint(40, 90))

    # ── Validation Gate Decision Logic ──
    # REJECTED if (Psilt% + Palgae% + Psludge%) < 4.0% AND Laplacian < 80.0
    total_mask_pct = silt + algae + sludge
    status = "ACCEPTED"
    reason = "Water contamination accepted"
    reliability = "badge-new"
    r_water = 15.0

    if total_mask_pct < 4.0 and laplacian < 80.0:
        status = "REJECTED"
        reason = "Selfie rejected"
        reliability = "badge-spam"
        r_water = 15.0
    else:
        # AI Contamination Risk Score (Rwater)
        bonus = 10.0 if laplacian > 300 else 0.0
        r_water = min(100.0, max(15.0, (silt * 0.55) + (algae * 0.25) + (sludge * 0.20) + bonus))
        
        # Star score reliability heuristic
        if laplacian > 200:
            reliability = "badge-trusted"
        else:
            reliability = "badge-new"

    # Default SVG photo representation if empty
    default_photo = (
        "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%231b223c'><rect width='100' height='100'/><path d='M10 80 C30 60 70 90 90 70' stroke='%2300f2fe' fill='none' stroke-width='3'/></svg>"
        if status == "ACCEPTED" else
        "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%231b223c'><rect width='100' height='100'/><line x1='20' y1='20' x2='80' y2='80' stroke='%23ef4444' stroke-width='4'/></svg>"
    )
    photo_url = payload.photo_url if payload.photo_url else default_photo

    # ── Haversine 200m Spatial Clustering Engine ──
    cluster_id = None
    if status == "ACCEPTED":
        # Search all active clusters
        active_clusters = db.query(SpatialCluster).filter(SpatialCluster.is_active == True).all()
        target_cluster = None

        for cluster in active_clusters:
            dist = haversine_distance(payload.latitude, payload.longitude, cluster.latitude, cluster.longitude)
            if dist <= 200.0:
                target_cluster = cluster
                break

        if target_cluster:
            # Join existing cluster
            cluster_id = target_cluster.cluster_id
            target_cluster.reports_count += 1
            if target_cluster.reports_count >= 3:
                target_cluster.risk_level = "HIGH RISK"
            db.add(target_cluster)
        else:
            # Create new spatial cluster
            cluster_id = f"CLUSTER-{int(payload.latitude*1000)}-{int(payload.longitude*1000)}"
            new_cluster = SpatialCluster(
                cluster_id=cluster_id,
                latitude=payload.latitude,
                longitude=payload.longitude,
                reports_count=1,
                risk_level="MODERATE",
                is_active=True
            )
            db.add(new_cluster)

    # Instantiate Report Model
    new_report = CitizenReport(
        reporter_name=payload.reporter_name,
        latitude=payload.latitude,
        longitude=payload.longitude,
        condition=payload.condition,
        silt_pct=silt,
        algae_pct=algae,
        sludge_pct=sludge,
        laplacian_variance=laplacian,
        r_water_score=r_water,
        status=status,
        reason=reason,
        reliability=reliability,
        photo_url=photo_url,
        cluster_id=cluster_id
    )

    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    logger.info(f"Citizen report successfully persisted. ID: {new_report.id}, Rwater: {r_water:.2f}%")
    return new_report


def get_citizen_summary(db: Session) -> CitizenDashboardSummary:
    """Returns aggregated stats alongside listings of reports & active clusters."""
    total_reports = db.query(CitizenReport).count()
    
    # Active high-risk clusters count (reports_count >= 3)
    total_clusters = db.query(SpatialCluster).filter(
        SpatialCluster.is_active == True,
        SpatialCluster.reports_count >= 3
    ).count()

    # Average risk score (ACCEPTED reports only)
    accepted_reports = db.query(CitizenReport).filter(CitizenReport.status == "ACCEPTED").all()
    avg_score = 0.0
    if accepted_reports:
        avg_score = sum(r.r_water_score for r in accepted_reports) / len(accepted_reports)
    else:
        avg_score = 74.2  # default fallback matching mockup

    # Fetch lists ordered by ID desc
    reports_list = db.query(CitizenReport).order_by(desc(CitizenReport.id)).limit(50).all()
    clusters_list = db.query(SpatialCluster).filter(SpatialCluster.is_active == True).all()

    return CitizenDashboardSummary(
        total_reports=total_reports,
        total_clusters=total_clusters,
        avg_risk_score=round(avg_score, 1),
        reports=reports_list,
        clusters=clusters_list
    )
