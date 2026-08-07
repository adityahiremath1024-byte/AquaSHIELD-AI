import math
import logging
from typing import Dict, Any, List

from app.schemas.prediction import DIEPayload
from app.services.gemini_service import gemini_service

logger = logging.getLogger("aquashield.dioeengine")


class DIOEEngineService:
    def __init__(self):
        pass

    def optimize(self, payload: DIEPayload) -> Dict[str, Any]:
        """
        Executes Module 7: AI Decision Intelligence & Intervention Optimisation Engine (DIOE)
        7-Stage Deterministic Computation Pipeline + Gemini 2.0 Flash Executive Narrative.
        """
        pop = payload.population if payload.population and payload.population > 0 else 16240
        initial_risk = payload.risk_score if payload.risk_score is not None else 84.0
        flood_pct = payload.flood_pct if payload.flood_pct is not None else 34.0

        # Hospital current inventory / stock from Module 3
        hosp = payload.hospital
        total_beds = hosp.total_beds if hosp else 100
        occupied_beds = hosp.occupied_beds if hosp else 85
        doctors_duty = hosp.doctors_on_duty if hosp else 5
        ors_stock = hosp.ors_stock_packets if hosp else 4200
        chlorine_stock = hosp.chlorine_stock_tablets if hosp else 8500

        # =========================================================================
        # STAGE 1: Operational Situation Assessment & Threat Classification
        # =========================================================================
        if initial_risk >= 80.0:
            threat_level = "CRITICAL"
            horizon_days = 5
            attack_rate = 0.08  # 8.0%
        elif initial_risk >= 60.0:
            threat_level = "HIGH"
            horizon_days = 7
            attack_rate = 0.05  # 5.0%
        elif initial_risk >= 40.0:
            threat_level = "MODERATE"
            horizon_days = 10
            attack_rate = 0.02  # 2.0%
        else:
            threat_level = "LOW"
            horizon_days = 14
            attack_rate = 0.005  # 0.5%

        stage1_assessment = {
            "risk_score_pct": initial_risk,
            "threat_level": threat_level,
            "disease": payload.disease_type or "Cholera / Acute Diarrhea",
            "expected_outbreak_target": payload.village_name or "Kuttanad, Kerala",
            "transmission_vector": "Waterborne & Stagnant Inundation",
            "horizon_days": horizon_days,
            "attack_rate_pct": round(attack_rate * 100, 1),
            "confidence_pct": payload.confidence_pct if payload.confidence_pct is not None else 91.0
        }

        # =========================================================================
        # STAGE 2: Resource Requirement Estimator (WHO Epidemiological Equations)
        # =========================================================================
        # Eq 1: Expected Patient Load = max(10, floor(N_pop * alpha))
        expected_patients = max(10, math.floor(pop * attack_rate))
        
        # Eq 2: ORS Packets Required = E_patients * 7
        ors_required = expected_patients * 7
        
        # Eq 3: Chlorine Tablets Required = 15,000 tablets (fixed shock dose)
        chlorine_required = 15000
        
        # Eq 4: Doctors Needed = max(2, ceil(E_patients / 80))
        doctors_needed = max(2, math.ceil(expected_patients / 80))

        stage2_resources = {
            "expected_patients": expected_patients,
            "ors_packets_needed": ors_required,
            "chlorine_tablets_needed": chlorine_required,
            "doctors_needed": doctors_needed,
            "attack_rate_pct": round(attack_rate * 100, 1)
        }

        # =========================================================================
        # STAGE 3: Resource Availability & Shortage Gap Analysis
        # =========================================================================
        ors_gap = max(0, ors_required - ors_stock)
        chlorine_gap = max(0, chlorine_required - chlorine_stock)
        doctors_gap = max(0, doctors_needed - doctors_duty)

        ors_status = "SHORTAGE" if ors_gap > 0 else "ENOUGH"
        chlorine_status = "SHORTAGE" if chlorine_gap > 0 else "ENOUGH"
        doctors_status = "SHORTAGE" if doctors_gap > 0 else "ENOUGH"
        critical_shortage = (ors_gap > 0 or chlorine_gap > 0 or doctors_gap > 0)

        stage3_gaps = {
            "ors_gap": ors_gap,
            "ors_status": ors_status,
            "chlorine_gap": chlorine_gap,
            "chlorine_status": chlorine_status,
            "doctors_gap": doctors_gap,
            "doctors_status": doctors_status,
            "critical_shortage": critical_shortage
        }

        # =========================================================================
        # STAGE 4: Intervention Optimizer (Rule-Based Prioritized Action Selection)
        # =========================================================================
        is_critical_flood = (initial_risk > 80.0 and flood_pct > 30.0)

        if is_critical_flood:
            # Decision Rule A — Critical Flood Scenario
            interventions = [
                {
                    "rank": 1,
                    "action_name": "Water Chlorination & Well Sealing",
                    "efficacy_pct": -18.0,
                    "target_description": "Neutralize waterborne bacterial vector in flooded public wells"
                },
                {
                    "rank": 2,
                    "action_name": "Mobile Medical Camp & Triage Unit",
                    "efficacy_pct": -10.0,
                    "target_description": f"Deploy {doctors_gap} additional doctors & emergency beds to PHC"
                },
                {
                    "rank": 3,
                    "action_name": "Mass ORS & Zinc Distribution",
                    "efficacy_pct": -5.0,
                    "target_description": f"Distribute {ors_required:,} ORS packets to vulnerable households"
                },
                {
                    "rank": 4,
                    "action_name": "ASHA Worker Door-to-Door Survey",
                    "efficacy_pct": -4.0,
                    "target_description": "Early detection of active diarrhea/fever cases within 200m cluster"
                }
            ]
        else:
            # Decision Rule B — Standard Scenario
            interventions = [
                {
                    "rank": 1,
                    "action_name": "Water Source Quality Testing & Chlorination",
                    "efficacy_pct": -15.0,
                    "target_description": "Shock-chlorinate identified contaminated open water sources"
                },
                {
                    "rank": 2,
                    "action_name": "ASHA Worker Community Survey",
                    "efficacy_pct": -10.0,
                    "target_description": "Conduct door-to-door health survey & case finding"
                },
                {
                    "rank": 3,
                    "action_name": "ORS Distribution Drive",
                    "efficacy_pct": -8.0,
                    "target_description": f"Pre-position {ors_required:,} ORS packets at local health posts"
                },
                {
                    "rank": 4,
                    "action_name": "Boil-Water Advisory Campaign",
                    "efficacy_pct": -4.0,
                    "target_description": "Issue public health advisories via local loudspeakers and SMS"
                }
            ]

        # =========================================================================
        # STAGE 5: Impact Simulator (Mathematical Risk Reduction Model)
        # =========================================================================
        total_combined_reduction = abs(sum(item["efficacy_pct"] for item in interventions))
        post_risk = round(max(15.0, initial_risk - total_combined_reduction), 1)
        post_level = "MODERATE (CONTAINED)" if post_risk < 55.0 else "HIGH"

        stage5_impact = {
            "initial_risk_pct": initial_risk,
            "total_combined_reduction_pct": total_combined_reduction,
            "predicted_post_action_risk_pct": post_risk,
            "post_level": post_level,
            "status_label": "MODERATE CONTAINED" if post_risk < 55.0 else "HIGH STABILIZING"
        }

        # =========================================================================
        # STAGE 6: Operational Execution Timeline Planner
        # =========================================================================
        timeline = [
            {
                "time_bracket": "0–6 Hours",
                "stage_title": "IMMEDIATE RESPONSE",
                "priority": "PRIORITY: CRITICAL",
                "priority_class": "critical",
                "operational_task": "Close contaminated public wells & initiate shock chlorination",
                "tasks": [
                    "Close contaminated public wells & initiate shock chlorination",
                    "Alert district health authorities & emergency management",
                    "Issue urgent boil-water advisory via SMS & local radio",
                    "Mobilize PHC emergency triage ward"
                ]
            },
            {
                "time_bracket": "6–12 Hours",
                "stage_title": "EARLY INTERVENTION",
                "priority": "PRIORITY: CRITICAL",
                "priority_class": "critical",
                "operational_task": f"Procure & deploy {chlorine_gap:,} missing chlorine tablets & {ors_required:,} ORS packets",
                "tasks": [
                    f"Procure & deploy {chlorine_gap:,} missing chlorine tablets",
                    f"Dispatch {ors_required:,} ORS packets to forward distribution points",
                    "Begin water quality testing at 24 sampling stations",
                    "Start active case finding at Primary Health Centres"
                ]
            },
            {
                "time_bracket": "12–24 Hours",
                "stage_title": "CONTAINMENT",
                "priority": "PRIORITY: HIGH",
                "priority_class": "high",
                "operational_task": f"Establish Mobile Medical Camp & deploy {doctors_gap} emergency doctors",
                "tasks": [
                    f"Establish Mobile Medical Camp & deploy {doctors_gap} emergency doctors",
                    "Intensify spatial cluster surveillance in high-risk zones",
                    "Ensure safe potable water supply via emergency tankers",
                    "Conduct community hygiene awareness drive"
                ]
            },
            {
                "time_bracket": "24–48 Hours",
                "stage_title": "STABILISATION",
                "priority": "PRIORITY: HIGH",
                "priority_class": "high",
                "operational_task": "Launch ASHA worker door-to-door survey & water quality re-testing",
                "tasks": [
                    "Launch ASHA worker door-to-door survey & water quality re-testing",
                    "Adjust medical resource allocation based on bed occupancy",
                    "Strengthen PHC healthcare capacity & triage units",
                    "Submit daily epidemiological surveillance report to State"
                ]
            },
            {
                "time_bracket": "3–7 Days",
                "stage_title": "SUSTAIN & PREPARE",
                "priority": "PRIORITY: MODERATE",
                "priority_class": "moderate",
                "operational_task": "Retrospective hospital surveillance & capacity review",
                "tasks": [
                    "Retrospective hospital surveillance & capacity review",
                    "Maintain active surveillance sweep across 100% of village",
                    "Replenish emergency ORS and antibiotic medicine stock",
                    "Prepare post-outbreak evaluation report"
                ]
            }
        ]

        # =========================================================================
        # STAGE 7: Structured JSON Output & Gemini AI Executive Narrative
        # =========================================================================
        deterministic_json = {
            "severity": threat_level,
            "expected_patients": expected_patients,
            "resources_required": {
                "ors_packets": ors_required,
                "chlorine_tablets": chlorine_required,
                "doctors_needed": doctors_needed
            },
            "resource_gaps": {
                "ors_gap": ors_gap,
                "chlorine_gap": chlorine_gap,
                "doctors_gap": doctors_gap
            },
            "recommended_actions": [item["action_name"] for item in interventions],
            "initial_risk_pct": initial_risk,
            "predicted_risk_after_action_pct": post_risk
        }

        # Layer 2: Gemini 2.0 Flash Executive Narrative
        executive_narrative = gemini_service.generate_dioe_executive_narrative(
            village_name=payload.village_name or "Kuttanad, Kerala",
            initial_risk=initial_risk,
            post_risk=post_risk,
            patients=expected_patients,
            ors_gap=ors_gap,
            chlorine_gap=chlorine_gap,
            doctors_gap=doctors_gap
        )

        return {
            "situation": stage1_assessment,
            "resources": stage2_resources,
            "gaps": stage3_gaps,
            "interventions": interventions,
            "impact_simulation": stage5_impact,
            "timeline": timeline,
            "deterministic_json": deterministic_json,
            "executive_narrative": executive_narrative
        }


# Singleton instance
dioe_engine = DIOEEngineService()
