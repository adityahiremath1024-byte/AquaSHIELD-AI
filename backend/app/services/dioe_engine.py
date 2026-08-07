import math
import logging
from typing import Dict, Any, List

from app.schemas.prediction import DIEPayload
from app.services.gemini_service import gemini_service

logger = logging.getLogger("aquashield.dioe")


class DIOEEngineService:
    def __init__(self):
        pass

    def optimize(self, payload: DIEPayload) -> Dict[str, Any]:
        pop = payload.population if payload.population and payload.population > 0 else 16240
        initial_risk = payload.risk_score if payload.risk_score is not None else 84.0

        # Hospital current inventory / stock
        hosp = payload.hospital
        total_beds = hosp.total_beds if hosp else 100
        occupied_beds = hosp.occupied_beds if hosp else 85
        doctors_duty = hosp.doctors_on_duty if hosp else 5
        ors_stock = hosp.ors_stock_packets if hosp else 4200
        chlorine_stock = hosp.chlorine_stock_tablets if hosp else 8500

        # 1. WHO Epidemiological Attack Rate & Expected Patient Calculation
        if initial_risk >= 80.0:
            attack_rate = 0.08  # 8.0%
        elif initial_risk >= 60.0:
            attack_rate = 0.05  # 5.0%
        elif initial_risk >= 40.0:
            attack_rate = 0.03  # 3.0%
        else:
            attack_rate = 0.01  # 1.0%

        expected_patients = math.floor(pop * attack_rate)
        ors_needed = expected_patients * 7
        chlorine_needed = 15000
        doctors_needed = math.ceil(expected_patients / 80)

        # 2. Resource Gap Analysis
        doctors_gap = max(0, doctors_needed - doctors_duty)
        ors_gap = max(0, ors_needed - ors_stock)
        chlorine_gap = max(0, chlorine_needed - chlorine_stock)

        # 3. Prioritized Ranked Interventions
        interventions = [
            {
                "rank": 1,
                "action_name": "Water Chlorination & Well Sealing",
                "efficacy_pct": -18.0,
                "description": "Neutralize waterborne bacterial vector across 24 high-risk well clusters."
            },
            {
                "rank": 2,
                "action_name": "Mobile Medical Camp & Triage Unit",
                "efficacy_pct": -10.0,
                "description": "Deploy emergency triage tent & 12 additional medical officers."
            },
            {
                "rank": 3,
                "action_name": "Mass ORS & Zinc Distribution",
                "efficacy_pct": -5.0,
                "description": "Distribute 9,093 ORS packets to vulnerable households."
            },
            {
                "rank": 4,
                "action_name": "ASHA Worker Door-to-Door Survey",
                "efficacy_pct": -4.0,
                "description": "Early symptomatic case detection within 200m spatial clusters."
            }
        ]

        total_reduction = abs(sum(item["efficacy_pct"] for item in interventions))
        post_risk = round(max(15.0, initial_risk - total_reduction), 1)

        if post_risk >= 75.0:
            status_label = "CRITICAL HIGH"
        elif post_risk >= 50.0:
            status_label = "HIGH STABILIZING"
        elif post_risk >= 30.0:
            status_label = "MODERATE CONTAINED"
        else:
            status_label = "LOW CONTROLLED"

        # 4. Operational Execution Schedule (5 Brackets)
        timeline = [
            {
                "bracket": "0–6h",
                "stage_title": "IMMEDIATE RESPONSE",
                "priority": "PRIORITY: CRITICAL",
                "priority_class": "critical",
                "tasks": [
                    "Close contaminated public wells",
                    "Initiate shock chlorination in Zone A & B",
                    "Issue urgent boil-water advisory via SMS & local radio",
                    "Mobilize PHC emergency triage ward"
                ]
            },
            {
                "bracket": "6–12h",
                "stage_title": "EARLY INTERVENTION",
                "priority": "PRIORITY: CRITICAL",
                "priority_class": "critical",
                "tasks": [
                    f"Procure {chlorine_gap:,} missing chlorine tablets",
                    f"Dispatch {ors_gap:,} ORS packets from district warehouse",
                    "Establish emergency water tanker stations",
                    "Deploy first wave of 12 medical officers"
                ]
            },
            {
                "bracket": "12–24h",
                "stage_title": "CONTAINMENT",
                "priority": "PRIORITY: HIGH",
                "priority_class": "high",
                "tasks": [
                    "Set up Mobile Medical Camp at Kuttanad central hub",
                    "Commence mass distribution of ORS & Zinc kits",
                    "Isolate severe cholera cases at Alappuzha GH",
                    "Inspect secondary water storage tanks"
                ]
            },
            {
                "bracket": "24–48h",
                "stage_title": "STABILISATION",
                "priority": "PRIORITY: HIGH",
                "priority_class": "high",
                "tasks": [
                    "Launch ASHA door-to-door symptom mapping survey",
                    "Conduct follow-up water quality sample testing",
                    "Monitor bed occupancy rate (<85% target)",
                    "Audit emergency supply replenishment"
                ]
            },
            {
                "bracket": "3–7d",
                "stage_title": "SUSTAIN & PREPARE",
                "priority": "PRIORITY: MODERATE",
                "priority_class": "moderate",
                "tasks": [
                    "Perform 7-day epidemiological trend review",
                    "Transition triage camp to routine PHC monitoring",
                    "Subsidize household water purification filters",
                    "Submit outbreak containment report to State Health Board"
                ]
            }
        ]

        # 5. Gemini 2.0 Flash Executive Narrative
        executive_narrative = gemini_service.generate_dioe_executive_narrative(
            village_name=payload.village_name,
            initial_risk=initial_risk,
            post_risk=post_risk,
            patients=expected_patients,
            ors_gap=ors_gap,
            chlorine_gap=chlorine_gap,
            doctors_gap=doctors_gap
        )

        return {
            "situation": {
                "village_name": payload.village_name,
                "initial_risk": initial_risk,
                "risk_level": payload.risk_level,
                "disease_type": payload.disease_type,
                "forecast_window": "5 Days",
                "attack_rate_pct": round(attack_rate * 100, 1),
                "confidence_pct": payload.confidence_pct
            },
            "resources": {
                "expected_patients": expected_patients,
                "ors_packets_needed": ors_needed,
                "chlorine_tablets_needed": chlorine_needed,
                "doctors_needed": doctors_needed,
                "attack_rate_pct": round(attack_rate * 100, 1)
            },
            "gaps": {
                "doctors_gap": doctors_gap,
                "ors_gap": ors_gap,
                "chlorine_gap": chlorine_gap
            },
            "interventions": interventions,
            "impact_simulation": {
                "initial_risk": initial_risk,
                "total_reduction": total_reduction,
                "post_intervention_risk": post_risk,
                "status_label": status_label
            },
            "timeline": timeline,
            "executive_narrative": executive_narrative
        }


# Singleton instance
dioe_engine = DIOEEngineService()
