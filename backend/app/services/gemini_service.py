import os
import json
import logging
from typing import Dict, Any, List

logger = logging.getLogger("aquashield.gemini")

# Try importing google.genai or fallback safely
GENAI_AVAILABLE = False
try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    logger.warning("google-genai package not available. Using rule-based fallback engine.")


class GeminiService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.client = None
        if GENAI_AVAILABLE and self.api_key:
            try:
                self.client = genai.Client(api_key=self.api_key)
                logger.info("Gemini 2.0 Flash client initialized successfully.")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini client: {e}")

    def generate_action_plan(
        self,
        village_name: str,
        risk_score: float,
        risk_level: str,
        top_features: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Generates 6-section structured medical action plan using Gemini 2.0 Flash 
        or triggers Rule-Based Fallback Engine.
        """
        if self.client:
            try:
                feature_str = ", ".join([f"{f['feature']} ({f['contribution']}%)" for f in top_features])
                prompt = f"""
                You are an expert Epidemiologist and Public Health Advisor for AquaShield AI.
                Location: {village_name}
                Outbreak Risk Score: {risk_score:.1f}% ({risk_level})
                Top Contributing Drivers (SHAP Attributions): {feature_str}

                Generate a structured JSON response containing exactly 6 medical action plan sections:
                1. Situation Assessment (paragraph)
                2. Immediate Actions (24-48 Hours) (list of 4 string items)
                3. Medical Preparedness (3-7 Days) (list of 4 string items)
                4. Community Interventions (list of 4 string items)
                5. Resource Requirements (list of 4 string items)
                6. Monitoring Indicators (list of 4 string items)

                Respond ONLY with valid JSON with this structure:
                {{
                  "sections": [
                    {{"title": "SITUATION ASSESSMENT", "content": "...", "type": "text"}},
                    {{"title": "IMMEDIATE ACTIONS (24–48 Hours)", "content": ["...", "...", "...", "..."], "type": "list"}},
                    {{"title": "MEDICAL PREPAREDNESS (3–7 Days)", "content": ["...", "...", "...", "..."], "type": "list"}},
                    {{"title": "COMMUNITY INTERVENTIONS", "content": ["...", "...", "...", "..."], "type": "list"}},
                    {{"title": "RESOURCE REQUIREMENTS", "content": ["...", "...", "...", "..."], "type": "list"}},
                    {{"title": "MONITORING INDICATORS", "content": ["...", "...", "...", "..."], "type": "list"}}
                  ]
                }}
                """
                response = self.client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.2,
                        response_mime_type="application/json"
                    )
                )
                data = json.loads(response.text)
                return {"source": "gemini", "sections": data.get("sections", [])}
            except Exception as e:
                logger.error(f"Gemini API execution failed: {e}. Activating Fallback Engine.")

        return self._rule_based_prediction_fallback(village_name, risk_score, risk_level)

    def generate_dioe_executive_narrative(
        self,
        village_name: str,
        initial_risk: float,
        post_risk: float,
        patients: int,
        ors_gap: int,
        chlorine_gap: int,
        doctors_gap: int
    ) -> Dict[str, Any]:
        """
        Generates 4-section Executive Decision Briefing for Module 7 DIOE.
        """
        if self.client:
            try:
                prompt = f"""
                You are the Chief Public Health Intelligence Officer executing Module 7 DIOE.
                Region: {village_name}
                Current Initial Outbreak Risk: {initial_risk}%
                Projected Post-Intervention Risk: {post_risk}%
                Expected Patients: {patients}
                Shortage Gaps: Doctors Short: {doctors_gap}, ORS Packets Short: {ors_gap}, Chlorine Tablets Short: {chlorine_gap}

                Return JSON with 4 sections:
                1. Executive Situation & Patient Load Forecast
                2. Resource Bottleneck Analysis (Shortages & Gaps)
                3. Intervention Optimization & Impact Simulation
                4. Operational 24–48 Hour Execution Timeline

                Format as JSON:
                {{
                  "sections": [
                    {{"title": "1. Executive Situation & Patient Load Forecast", "content": "...", "type": "text"}},
                    {{"title": "2. Resource Bottleneck Analysis (Shortages & Gaps)", "content": "...", "type": "text"}},
                    {{"title": "3. Intervention Optimization & Impact Simulation", "content": "...", "type": "text"}},
                    {{"title": "4. Operational 24–48 Hour Execution Timeline", "content": ["...", "...", "..."], "type": "list"}}
                  ]
                }}
                """
                response = self.client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.2,
                        response_mime_type="application/json"
                    )
                )
                data = json.loads(response.text)
                return {"source": "gemini", "sections": data.get("sections", [])}
            except Exception as e:
                logger.error(f"Gemini DIOE briefing failed: {e}. Activating Fallback Engine.")

        return self._rule_based_dioe_fallback(village_name, initial_risk, post_risk, patients, ors_gap, chlorine_gap, doctors_gap)

    def _rule_based_prediction_fallback(self, village_name: str, risk_score: float, risk_level: str) -> Dict[str, Any]:
        return {
            "source": "fallback",
            "sections": [
                {
                    "title": "SITUATION ASSESSMENT",
                    "content": f"High outbreak risk ({risk_score:.1f}% - {risk_level}) detected in {village_name} due to severe rainfall anomaly, rapid flood expansion, and rising clinical hospital admissions. High risk of Cholera and Acute Diarrheal Disease outbreak within 7 days.",
                    "type": "text"
                },
                {
                    "title": "IMMEDIATE ACTIONS (24–48 Hours)",
                    "content": [
                        "Deploy emergency water chlorination teams to all water sources within 5km of flood zones",
                        "Issue boil-water advisory through all local communication channels",
                        "Activate rapid response teams at local PHC and District Hospital",
                        "Pre-position ORS packets and IV fluids at forward distribution points"
                    ],
                    "type": "list"
                },
                {
                    "title": "MEDICAL PREPAREDNESS (3–7 Days)",
                    "content": [
                        "Stock 5,000 ORS packets at PHC supply chain",
                        "Ensure IV fluid reserves for projected patient surges",
                        "Pre-position Doxycycline and Azithromycin for cholera prophylaxis",
                        "Coordinate with State Drug Controller for emergency procurement authorization"
                    ],
                    "type": "list"
                },
                {
                    "title": "COMMUNITY INTERVENTIONS",
                    "content": [
                        "Deploy ASHA and Anganwadi workers for door-to-door hygiene education",
                        "Establish community water purification stations at identified contamination clusters",
                        "Activate community health volunteers for daily surveillance sweeps",
                        "Distribute hygiene kits targeting families within 200m of confirmed contamination reports"
                    ],
                    "type": "list"
                },
                {
                    "title": "RESOURCE REQUIREMENTS",
                    "content": [
                        "5,000 ORS packets, 20,000 Chlorine tablets, 500 IV fluid units",
                        "17 doctors, 35 nursing staff, 50 ASHA workers",
                        "8 mobile medical units for remote area coverage",
                        "Emergency water tankers: 15 units for potable water distribution"
                    ],
                    "type": "list"
                },
                {
                    "title": "MONITORING INDICATORS",
                    "content": [
                        "Daily diarrheal case count tracking (target: <15 new cases/day by Day 7)",
                        "Water quality testing at 24 sampling points every 12 hours",
                        "Hospital bed occupancy monitoring (threshold alert: >85%)",
                        "Community reporting cluster density (target: zero new clusters by Day 14)"
                    ],
                    "type": "list"
                }
            ]
        }

    def _rule_based_dioe_fallback(self, village_name: str, initial_risk: float, post_risk: float, patients: int, ors_gap: int, chlorine_gap: int, doctors_gap: int) -> Dict[str, Any]:
        return {
            "source": "fallback",
            "sections": [
                {
                    "title": "1. Executive Situation & Patient Load Forecast",
                    "content": f"The outbreak model forecasts an initial risk of {initial_risk:.1f}% for {village_name}. Under the standard WHO epidemiological attack rate (8.0%), an estimated {patients:,} patients will require medical intervention over the 7-day forecast horizon.",
                    "type": "text"
                },
                {
                    "title": "2. Resource Bottleneck Analysis (Shortages & Gaps)",
                    "content": f"Immediate supply chain gap analysis reveals critical shortages: a deficit of {doctors_gap} doctors, {ors_gap:,} ORS packets, and {chlorine_gap:,} chlorine tablets. Emergency procurement must be initiated immediately.",
                    "type": "text"
                },
                {
                    "title": "3. Intervention Optimization & Impact Simulation",
                    "content": f"By executing the 4-tier prioritized intervention plan (Water Chlorination -18%, Medical Camp -10%, ORS Distribution -5%, ASHA Survey -4%), the predicted disease risk drops from {initial_risk:.1f}% to {post_risk:.1f}% (MODERATE CONTAINED status).",
                    "type": "text"
                },
                {
                    "title": "4. Operational 24–48 Hour Execution Timeline",
                    "content": [
                        "0–6h: Seal public wells and start shock chlorination",
                        "6–12h: Procure missing chlorine tablets and ORS stock",
                        "12–24h: Deploy Mobile Medical Unit and emergency staff",
                        "24–48h: Door-to-door ASHA health survey & re-testing"
                    ],
                    "type": "list"
                }
            ]
        }


# Singleton service instance
gemini_service = GeminiService()
