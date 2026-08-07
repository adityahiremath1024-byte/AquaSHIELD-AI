# Product Requirements Document (PRD)
## AquaShield AI — Waterborne Disease Outbreak Risk Prediction & Decision Support Platform

| | |
|---|---|
| **Version** | 2.0 (Refined) |
| **Status** | Draft — Hackathon MVP |
| **Team** | Dev Pirates |
| **Event** | HackGenesis 2026 · Healthcare Track |
| **Document Owner** | Product / Engineering Lead |
| **Last Updated** | 2026-08-05 |

### Document History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | — | Dev Pirates | Initial draft |
| 1.1 | — | Dev Pirates | First refinement pass |
| 2.0 | 2026-08-05 | Dev Pirates | Comprehensive refinement — added quantified problem metrics, data flow architecture, dependency risk matrix, KPIs, timeline, expanded NFRs |

---

## 1. Product Overview

**Product Name:** AquaShield AI
**Product Type:** AI-powered web application
**Platform:** Responsive web dashboard (desktop + tablet)
**Primary Region:** India (initial deployment context: flood-prone districts such as Kuttanad, Kerala)

AquaShield AI is a public health early-warning platform that predicts waterborne disease outbreaks — cholera, typhoid, diarrhea, leptospirosis — before they escalate, by fusing four independent data streams (weather, satellite imagery, hospital surveillance, citizen reports) into a single, explainable, AI-generated risk score with a 7-day forecast and a prioritized response plan.

**One-line pitch:** *From raindrops to readiness — turning six disconnected signals into one explainable outbreak forecast, and time to act.*

---

## 2. Problem Statement

Waterborne disease outbreaks accelerate rapidly after floods — the incubation window for pathogens like *Vibrio cholerae* is as short as 12–72 hours. Yet most public health monitoring is:

- **Reactive, not predictive** — action begins only after hospitals report a patient surge, by which point transmission is already underway. Studies show a typical 5–14 day lag between environmental trigger and public health response.
- **Single-signal** — a health department might see rainfall data, or hospital admissions, or a citizen complaint, but rarely all four in one place, correlated in real time.
- **Fragmented across departments** — meteorological, satellite, clinical, and community data live in separate systems with no shared decision layer.
- **Resource-blind** — even when an outbreak is detected, there is no automated mechanism to match the threat level against available hospital capacity, supplies, and personnel.

### Impact Context
- WHO estimates **829,000 deaths annually** from diarrheal disease linked to unsafe water (2024 data).
- India alone recorded **1.2 crore (12 million) acute diarrheal disease cases** in 2023 (IDSP).
- Post-flood waterborne outbreaks can increase case loads by **3–10× within 2 weeks** of a major flood event.

AquaShield AI closes this gap with a unified, AI-driven fusion engine that converts raw multi-source data into a single actionable risk signal, days before a traditional case-count trigger would fire.

---

## 3. Goals & Objectives

| # | Goal | Description | Key Metric |
|---|---|---|---|
| G1 | **Reduce detection lag** | Surface outbreak risk while rainfall/flood signals are still accumulating, ahead of clinical confirmation. | Risk alert generated ≥ 48 hours before case-count threshold breach (simulated). |
| G2 | **Unify fragmented data** | Give health officers one dashboard instead of four disconnected sources. | Single-pane view consolidating all four data streams with < 3 clicks to any detail. |
| G3 | **Make AI decisions explainable** | Every risk score must be traceable to the specific signals that drove it (via SHAP), so officers can trust and act on it. | 100% of risk scores accompanied by SHAP feature attribution breakdown. |
| G4 | **Turn prediction into action** | Don't stop at a risk score — output a prioritized, resource-aware intervention plan. | Decision report includes ≥ 3 ranked interventions with projected risk-reduction estimates. |
| G5 | **Demonstrate feasibility** | Prove, within the hackathon scope, that an end-to-end fusion-and-prediction pipeline can run reliably on free/low-cost data sources. | Full pipeline completes for ≥ 3 distinct test scenarios without manual intervention. |

---

## 4. Target Users

### Primary Users

| # | User Persona | Role Context | Key Need | Usage Frequency |
|---|---|---|---|---|
| P1 | District Health Officer (DHO) | Oversees public health for an entire district; accountable for outbreak containment decisions. | Real-time outbreak risk visibility across their jurisdiction with actionable recommendations. | Daily (during monsoon: multiple times/day) |
| P2 | Public Health Department Staff | Analyzes epidemiological trends, prepares reports for state-level review. | Consolidated reporting and trend monitoring across facilities. | Daily |
| P3 | Disaster Management Authority (DMA) Officer | Coordinates multi-agency flood response; allocates rescue, medical, and supply resources. | Resource prioritization during flood emergencies, linked to health risk intelligence. | Event-driven (during flood emergencies) |
| P4 | Primary Health Centre (PHC) Staff | Frontline facility managing local patient intake; limited resources, high caseload variability. | Local capacity and case-load visibility; early warning to prepare for surges. | Daily |

### Secondary Users

| # | User Persona | Role Context | Key Need | Usage Frequency |
|---|---|---|---|---|
| S1 | Hospital Administrator | Manages bed allocation, medicine inventory, and staffing at district/sub-district hospitals. | Bed/medicine capacity monitoring and shortage alerts. | Daily |
| S2 | Medical Officer | Attends to patients and enters daily case data into surveillance systems. | Efficient daily case data entry, trend review for their facility. | Daily |
| S3 | Field Health Worker (ASHA/Anganwadi) | Conducts door-to-door health visits in rural communities. | Ground-truth deployment guidance — where to prioritize visits. | As directed |
| S4 | Citizen | Resident in a flood-prone area; may observe contaminated water sources. | Simple, quick way to report visibly contaminated water and feel heard. | Occasional / event-driven |

---

## 5. Core Modules (Functional Requirements)

Each module is independently testable and contributes a defined output to the fusion layer.

### Module 1 — Meteorological Intelligence

| Attribute | Detail |
|---|---|
| **Input** | Lat/long → 30-day historical + current weather via Open-Meteo API |
| **Processing** | Cumulative rainfall (7/15/30-day windows), rainfall trend %, rainfall anomaly % vs. seasonal baseline, consecutive rain-streak count, Steadman heat index |
| **Output** | Weighted **Bacteria Growth Index (0–100%)** with risk tier (Low ≤ 25 / Moderate 26–50 / High 51–75 / Critical > 75) |
| **Fallback** | If API unreachable: use last-known-good cached data (max 6 hours stale); if cache expired, flag data as unavailable and reduce fusion weight to zero. |

### Module 2 — Satellite Flood Intelligence

| Attribute | Detail |
|---|---|
| **Input** | Geographic polygon + date range → satellite imagery (e.g., Planet Labs PSScene API) |
| **Processing** | Image quality gate (reject if cloud cover > 50%, resolution > 10m/px, or age > 72 hours) → NDWI water-pixel classification → surface water % → baseline vs. post-flood expansion rate |
| **Output** | **Flood severity tier** (None / Minor / Moderate / Severe / Extreme), flooded area (sq km), water expansion %, standing-water/vector-risk flag |
| **Fallback** | If API unreachable or no qualifying image: use pre-fetched static scene for demo; clearly flag as "cached/simulated imagery" in the UI. |

### Module 3 — Hospital Surveillance

| Attribute | Detail |
|---|---|
| **Input** | Daily admission records by disease category (cholera, typhoid, acute diarrhea, leptospirosis), bed count, medicine stock levels, staffing counts per facility |
| **Processing** | Deduplication by village + date + patient hash, 7-day moving average for missing-data imputation, growth-rate % (today vs. yesterday and vs. 7-day average), outbreak threshold tiering, capacity risk scoring |
| **Output** | **Outbreak tier** (Normal / Watch / Alert / Emergency), **capacity risk score (0–10)**, 5-star facility health rating |
| **Fallback** | If no data submitted for a facility in > 48 hours: mark facility as "data stale" on dashboard; use last-known values with a visible staleness indicator. |

### Module 4 — Citizen Reporting

| Attribute | Detail |
|---|---|
| **Input** | Geotagged photo (JPEG/PNG, max 10 MB) + GPS coordinates + timestamp from citizen upload |
| **Processing** | Computer-vision validation gate (HSV-threshold rule-based — accepts water/flood/sewage imagery, rejects selfies, interiors, unrelated objects), contamination scoring, 200m radius spatial clustering (Haversine distance), reporter reliability rating (weighted by submission history) |
| **Output** | **Water contamination risk score (0–100)**, active cluster flag (≥ 3 reports within 200m in 48 hours), citizen trust rating |
| **Fallback** | If CV validation confidence is ambiguous (borderline score): flag for manual review rather than auto-reject. |

> **Important: CV transparency** — The citizen photo validation uses **rule-based computer vision** (HSV color thresholds), not a trained deep-learning image classifier. All user-facing copy and pitch materials must describe this accurately.

### Module 5 — AI Multi-Signal Data Fusion

| Attribute | Detail |
|---|---|
| **Input** | Normalized outputs from Modules 1–4 |
| **Processing** | Validate completeness (flag missing modules) → normalize all inputs to 0–100 scale → engineer six predictive features → fuse into four semantic risk domains: **Environmental** (weather + flood), **Water Contamination** (citizen reports + satellite standing-water), **Health Stress** (hospital case velocity + capacity), **Community Exposure** (cluster density + population density proxy) |
| **Output** | **Unified Outbreak Fusion Score (0–100%)** with domain-level breakdown and per-domain confidence indicator |
| **Graceful degradation** | If 1 of 4 input modules is unavailable, fusion proceeds with 3 modules and flags reduced-confidence; if ≥ 2 modules unavailable, fusion score is withheld and a "data insufficient" warning is displayed. |

### Module 6 — AI Outbreak Prediction

| Attribute | Detail |
|---|---|
| **Input** | Fusion Engine output (Module 5) |
| **Processing** | Gradient-boosted regression model (XGBoost/LightGBM) forecasts 7-day outbreak probability with confidence interval; SHAP generates per-feature contribution values; LLM (Gemini API) generates a structured 6-section medical action plan; rule-based fallback template if LLM is unavailable or quota-exceeded |
| **Output** | **7-day outbreak risk % with 95% CI**, ranked SHAP drivers (top 5), 6-section action plan (Situation Summary, Immediate Actions, Resource Deployment, Surveillance Escalation, Community Communication, Escalation Triggers) |
| **Fallback** | If LLM unavailable: rule-based template engine fills the same 6 sections using threshold-driven logic. Must produce output indistinguishable in structure from LLM output. |

### Module 7 — Decision Intelligence

| Attribute | Detail |
|---|---|
| **Input** | Module 6 output + hospital capacity data (Module 3) |
| **Processing** | Estimate required medical resources (ORS sachets, IV fluids, antibiotics, beds, personnel) against current stock → detect shortages → prioritize interventions by impact/urgency matrix → simulate risk reduction under each proposed action → build an execution timeline |
| **Output** | **Resource gap report** (item-level surplus/deficit), prioritized intervention list (ranked by urgency × impact), projected risk-reduction simulation (% reduction per action), executive decision report (exportable as PDF) |

### Data Flow Architecture

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Module 1   │  │  Module 2   │  │  Module 3   │  │  Module 4   │
│  Weather    │  │  Satellite  │  │  Hospital   │  │  Citizen    │
│  Intelligence│  │  Flood Intel│  │  Surveillance│  │  Reporting  │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │                │
       └────────────────┴───────┬────────┴────────────────┘
                                │  (parallel, normalized)
                        ┌───────▼───────┐
                        │   Module 5    │
                        │  AI Fusion    │
                        │   Engine      │
                        └───────┬───────┘
                                │
                        ┌───────▼───────┐
                        │   Module 6    │
                        │  AI Outbreak  │
                        │  Prediction   │
                        └───────┬───────┘
                                │
                        ┌───────▼───────┐
                        │   Module 7    │
                        │  Decision     │
                        │  Intelligence │
                        └───────┬───────┘
                                │
                        ┌───────▼───────┐
                        │   Dashboard   │
                        │   & Reports   │
                        └───────────────┘
```

> **Data flow summary:** Modules 1–4 run in parallel → normalized outputs feed Module 5 → Module 5's fusion score feeds Module 6 → Module 6's prediction and explanation feed Module 7 → Module 7 outputs the officer-facing decision report via the dashboard.

---

## 6. User Stories & Acceptance Criteria

| # | Role | Story | Acceptance Criteria | Priority |
|---|---|---|---|---|
| US-01 | Health Officer | As a Health Officer, I want to view district-level outbreak risk so I can act preventively. | Dashboard shows current fusion score, 7-day forecast, and top 3 risk drivers within 3 seconds of login. Risk score links to SHAP breakdown on click. | P0 — Must Have |
| US-02 | Medical Officer | As a Medical Officer, I want to submit daily hospital case records so the model stays accurate. | Duplicate submissions for the same village/date are auto-merged; missing days are imputed via 7-day moving average without blocking the workflow. Confirmation shown on successful submission. | P0 — Must Have |
| US-03 | Citizen | As a citizen, I want to upload a water contamination photo so authorities can investigate. | Upload completes in under 10 seconds on a 4G connection; irrelevant photos (selfies, unrelated objects) are rejected with a clear, non-technical message explaining why. | P0 — Must Have |
| US-04 | DMA Officer | As a DMA Officer, I want a prioritized intervention list so I can deploy resources efficiently. | Decision Intelligence module ranks ≥ 3 interventions by urgency and shows projected risk reduction for each. | P0 — Must Have |
| US-05 | Hospital Admin | As a Hospital Administrator, I want to monitor bed and medicine capacity so shortages are caught early. | Capacity dashboard flags any resource below a configurable threshold (default: bed occupancy > 80%, medicine stock < 3-day supply) in real time with visual alert. | P1 — Should Have |
| US-06 | Health Officer | As a Health Officer, I want to export a decision report as PDF so I can share it with state officials. | PDF includes fusion score, SHAP breakdown, intervention list, and resource gap report. Generated in < 5 seconds. | P1 — Should Have |
| US-07 | Health Officer | As a Health Officer, I want to see a map view of flood extent and citizen report clusters so I can identify geographic hotspots. | Map renders with flood overlay (from Module 2) and clustered citizen report markers (from Module 4). Clusters are interactive — clicking reveals individual reports. | P1 — Should Have |

---

## 7. MVP Scope

### In Scope (v1 — Hackathon)
- User authentication (email/password) and role-based dashboard access (DHO, Medical Officer, Hospital Admin, Citizen)
- Modules 1–7, fully functional end-to-end
- Interactive map view (flood extent overlay, citizen report clusters with drill-down)
- Charts and analytics (trend lines, risk domain breakdown, historical comparison)
- PDF export of the executive decision report
- Responsive layout for desktop (≥ 1024px) and tablet (≥ 768px)
- Graceful degradation when any external dependency is unavailable (see fallback specifications per module)
- At least 3 distinct test scenarios demonstrating generalizability (e.g., Kuttanad + 2 other regions/synthetic cases)

### Out of Scope (v1)

| # | Excluded Feature | Reason |
|---|---|---|

| OS-02 | Offline functionality | Requires local sync architecture beyond hackathon scope. |
| OS-03 | SMS alerts / push notifications | Needs telecom/notification infrastructure not available in hackathon timeline. |
| OS-04 | Multi-language support (i18n) | Localization deferred to post-MVP; English-only for hackathon. |
| OS-05 | Video/voice reporting | Photo + GPS sufficient for citizen validation MVP. |
| OS-06 | IoT sensor / drone integration | No hardware partnerships in MVP timeline. |
| OS-07 | Multi-disease prediction beyond waterborne illness | Keeps model scope and training data tractable. |
| OS-08 | Real-time chat between users | Not core to the prediction workflow. |
| OS-09 | Role-based analytics customization | Fixed dashboards per role sufficient for MVP. |
| OS-10 | Automatic government report submission | Requires integration approvals outside hackathon scope. |
| OS-11 | Historical outbreak database for model retraining | MVP uses a pre-trained model; online learning deferred. |

---

## 8. Non-Functional Requirements

| ID | Category | Requirement | Acceptance Criteria |
|----|----------|-------------|---------------------|
| **NFR-01** | **Performance** | The dashboard shall load within **3 seconds** on the initial visit, and subsequent page navigation shall complete within **1 second**. | Verified using browser DevTools on a standard **10 Mbps broadband** connection. |
| **NFR-02** | **Performance** | The AI risk prediction pipeline (Module 6), including fusion score processing, model inference, and SHAP explanation generation, shall complete within **10 seconds**. | Measured from prediction request submission to complete result display. |
| **NFR-03** | **Performance** | Citizen media uploads (images/videos) shall complete within **10 seconds** under normal network conditions. | Tested using a **4G connection** with approximately **5 Mbps upload speed**. |
| **NFR-04** | **Reliability** | If the LLM or any external service becomes unavailable, the system shall automatically switch to the rule-based prediction engine without interrupting the user experience. | No blank pages, crashes, or blocking error messages during simulated API failures. |
| **NFR-05** | **Reliability** | The system shall maintain at least **99% availability** throughout the demonstration and evaluation period. | Verified through continuous operation during a **2-hour** stress test without unrecoverable failures. |
| **NFR-06** | **Explainability** | Every AI-generated risk score shall provide an accessible explanation showing the contributing factors (e.g., SHAP feature importance). | Users can access the explanation for every displayed prediction through a single interaction. |
| **NFR-07** | **Data Integrity** | Duplicate records for hospitals, citizens, or reported cases shall be automatically identified and consolidated to prevent duplicate counting. | Duplicate submissions result in a single unified record after validation. |
| **NFR-08** | **Data Integrity** | Any dataset that has not been updated for more than **48 hours** shall be clearly marked as outdated before being used for analysis. | Dashboard visibly displays a stale-data indicator for outdated records. |
| **NFR-09** | **Usability** | Users shall be able to complete the primary workflow—view risk, inspect contributing factors, and export a report—in **three clicks or fewer** without requiring documentation or training. | Validated through first-time usability testing with representative users. |
| **NFR-10** | **Security** | The system shall enforce Role-Based Access Control (RBAC), ensuring users can only access data and functions permitted by their assigned role. | Unauthorized attempts to access restricted resources are denied during security testing. |
| **NFR-11** | **Security** | Citizen-uploaded media shall be securely stored with access restricted to authorized healthcare personnel. Uploaded files shall not be publicly accessible. | Unauthenticated users cannot directly access uploaded media or storage URLs. |
| **NFR-12** | **Scalability** | The system architecture shall support expansion to multiple districts or regions without requiring major architectural changes. | Code review confirms no hard-coded assumptions limiting deployment to a single district. |
| **NFR-13** | **Accessibility** | The dashboard shall conform to **WCAG 2.1 Level A** accessibility standards, including keyboard navigation, sufficient color contrast, and alternative text for visual elements. | Verified through automated accessibility testing (e.g., Lighthouse) and manual validation. |


## 9. External Dependencies & Risk Matrix

| Module | Dependency | Risk Level | Availability | Contingency |
|---|---|---|---|---|
| 1 | **Open-Meteo Forecast/Archive API** | 🟢 Low | Free, no key required, high uptime. | Cache last 6 hours of weather data locally. If cache expired, flag and zero-weight in fusion. |
| 2 | **Satellite imagery provider** (e.g., Planet Labs PSScene) | 🔴 High | **Requires a paid/research API key.** Image availability depends on satellite revisit schedule and cloud cover. | Pre-fetch and cache a static scene for demo. Label clearly as "cached imagery" in the UI. Confirm API access ≥ 1 week before event. |
| 4 | **Browser Geolocation API** | 🟢 Low | Built into all modern browsers. | Allow manual lat/long entry as fallback if GPS permission denied. |
| 6 | **Gradient-boosting model** (XGBoost/LightGBM) | 🟡 Medium | Self-hosted; no external dependency. Risk is in training data quality. | Disclose clearly whether training data is real or synthetic/simulated for the demo. Include model performance metrics (RMSE, R²) in pitch. |
| 6 | **LLM API** (Gemini) for action-plan generation | 🟡 Medium | Subject to quota limits and latency variability. | Rule-based fallback engine is **mandatory**, not optional. Demo the fallback at least once during the pitch to prove reliability. |
| 7 | **PDF generation library** (e.g., jsPDF, Puppeteer) | 🟢 Low | Client-side or self-hosted; no external dependency. | Use client-side library (jsPDF) to avoid server-side headless browser dependency. |

> **Pre-demo checklist:** Verify all API keys are active, cache fallback data for Modules 1 and 2, test LLM fallback by rate-limiting the API, and run the full pipeline for all 3 test scenarios.

---

## 10. Success Criteria & KPIs

### Functional
| # | Criterion | Verification Method |
|---|---|---|
| SC-01 | All seven modules operate end-to-end without manual intervention. | Automated pipeline test across 3 scenarios. |
| SC-02 | A user can complete the full workflow: raw data → fusion score → prediction → decision report → PDF export. | End-to-end user flow test. |
| SC-03 | AI predictions generate without errors across ≥ 3 distinct test scenarios (not just one hardcoded case). | Test with Kuttanad (Kerala), Sundarbans (West Bengal), and one synthetic high-risk scenario. |
| SC-04 | Fallback mechanisms activate correctly when external dependencies are disconnected. | Fault-injection test: disable LLM, satellite API, weather API individually and verify graceful degradation. |

### User Experience
| # | Criterion | Verification Method |
|---|---|---|
| SC-05 | Dashboard loads within 3 seconds. | Browser DevTools Network tab measurement. |
| SC-06 | Fully responsive across desktop (≥ 1024px) and tablet (≥ 768px) breakpoints. | Visual inspection at both breakpoints. |
| SC-07 | A first-time user completes the core risk-review task (view risk → drill into drivers → export report) without external help. | Observed first-use test with a team member unfamiliar with the product. |

### Technical
| # | Criterion | Verification Method |
|---|---|---|
| SC-08 | Weather, satellite, hospital, and citizen data reconcile correctly in the fusion layer (no double-counting, no missing modules silently ignored). | Unit tests on fusion engine with controlled inputs. |
| SC-09 | AI prediction generated in under 10 seconds. | Timed measurement across all 3 test scenarios. |
| SC-10 | Decision Intelligence module returns actionable, non-generic recommendations (specific resource quantities, named interventions). | Manual review of output for specificity. |
| SC-11 | System remains stable under continuous demo-length usage (≥ 2 hours without crash or memory leak). | Soak test before demo day. |

### Hackathon Judging
| # | Criterion | Verification Method |
|---|---|---|
| SC-12 | Demonstrates a complete, credible end-to-end disease-prediction workflow. | Judge observation during live demo. |
| SC-13 | Provides genuine decision support value, not just a visualization layer. | Decision report includes specific, quantified recommendations. |
| SC-14 | Validates technical feasibility of AI-assisted public health monitoring. | Pipeline runs live, not from pre-recorded screenshots. |
| SC-15 | All AI/ML claims are accurately described (no overstating CV as "deep learning," no overstating synthetic data as "validated"). | Pitch deck and demo script reviewed for accuracy. |

---

## 11. Risks & Assumptions

### Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Satellite API access unavailable during judging. | Medium | High | Pre-fetch and cache a static scene. Prepare a sandbox/trial key. Disclose openly if simulated data is used. |
| R2 | Prediction model trained on limited/synthetic data. | High | Medium | Be transparent about training data provenance in the pitch. Show model performance metrics. Don't overstate validation. |
| R3 | LLM quota exceeded mid-demo. | Medium | Medium | Rule-based fallback engine is already in scope. Demo the fallback at least once during the pitch to prove reliability. |
| R4 | Citizen CV validation is rule-based (HSV thresholds), not a trained classifier. | Low | Low | Describe accurately as "rule-based computer vision" in all user-facing and pitch materials. Avoid the term "AI image recognition." |
| R5 | Demo relies on a single reference scenario (Kuttanad). | Medium | High | Prepare and test ≥ 2 additional scenarios (different geography or synthetic high-risk data) to demonstrate generalizability. |
| R6 | Network instability at the hackathon venue. | Medium | High | Cache all critical external data before judging. Ensure fallback modes work fully offline for external APIs. |
| R7 | Team member unavailability or task bottleneck. | Low | Medium | Assign module ownership with clear interfaces; any team member can demo any module. |

### Assumptions

| # | Assumption | Consequence if Invalid |
|---|---|---|
| A1 | Open-Meteo API remains free and publicly accessible during the event. | Must find an alternative weather API or pre-cache sufficient data. |
| A2 | Satellite imagery API key (if required) is secured ≥ 1 week before the event. | Module 2 runs entirely on cached/static imagery; functionality is degraded but not blocked. |
| A3 | Judges evaluate based on live demo, not pre-recorded video. | Demo must be robust enough for live interaction. |
| A4 | Hospital surveillance data for the demo is simulated/synthetic (no real patient data). | All demo data must be clearly labeled as simulated; no HIPAA/data-privacy concerns. |
| A5 | Target users have reliable internet access (≥ 4G / broadband) when using the platform. | Offline mode (out of scope for MVP) would need to be prioritized. |

---

## 12. Hackathon Timeline & Milestones

| Phase | Milestone |  | Owner |
|---|---|---|---|
| **Preparation** | API keys secured, dev environment set up, test data prepared | Day -7 (1 week before event) | Full team |
| **Sprint 1** | Modules 1–4 independently functional with test data  | Module owners |
| **Sprint 2** | Module 5 (Fusion) + Module 6 (Prediction) integrated end-to-end  | ML / Backend lead |
| **Sprint 3** | Module 7 (Decision Intelligence) + Dashboard UI complete  | Full-stack / Frontend lead |
| **Integration** | Full pipeline tested across 3 scenarios; fallback modes verified | Full team |
| **Polish** | UI polish, PDF export, responsive testing, demo script | Full team

---

<!-- ## 13. Future Roadmap (Post-MVP)

| Phase | Features | Rationale |
|---|---|---|
| **v1.1** (Near-term) | SMS/push alerting for field health workers; multi-language localization (Hindi, Malayalam, Bengali) | Highest-impact features for real-world deployment in India. |
| **v2.0** (Medium-term) | Native mobile app for citizen reporting; automated government report submission; historical outbreak database for model retraining | Enable field-level adoption and improve model accuracy over time. |
| **v3.0** (Long-term) | IoT sensor and drone imagery integration; multi-disease expansion beyond waterborne illness; offline-first progressive web app | Full-scale public health intelligence platform. |

--- -->

## 14. Glossary

| Term | Definition |
|---|---|
| **NDWI** | Normalized Difference Water Index — satellite-derived measure of surface water presence, calculated from green and near-infrared spectral bands. |
| **Fusion Score** | Unified 0–100% outbreak risk score combining all four semantic risk domains (Environmental, Water Contamination, Health Stress, Community Exposure). |
| **SHAP** | SHapley Additive exPlanations — a game-theory-based method for attributing a model's prediction to individual input features, providing both global and local interpretability. |
| **PHC** | Primary Health Centre — the first tier of public healthcare facility in India's rural health infrastructure. |
| **ASHA** | Accredited Social Health Activist — a community-level field health worker under India's National Health Mission. |
| **CI** | Confidence Interval — a range of values within which the true value is expected to fall with a stated probability (e.g., 95% CI). |
| **XGBoost** | Extreme Gradient Boosting — an optimized gradient-boosting decision tree algorithm used for regression and classification tasks. |
| **LightGBM** | Light Gradient Boosting Machine — a high-performance gradient-boosting framework that uses histogram-based algorithms for faster training. |
| **HSV** | Hue-Saturation-Value — a color space used in computer vision for color-based image segmentation and analysis. |
| **IDSP** | Integrated Disease Surveillance Programme — India's national program for disease surveillance and outbreak response. |
| **ORS** | Oral Rehydration Salts — a WHO-recommended treatment for dehydration caused by diarrheal diseases. |
| **Haversine** | A formula for calculating the great-circle distance between two points on a sphere, used here for spatial clustering of citizen reports. |
| **WCAG** | Web Content Accessibility Guidelines — international standards for making web content accessible to people with disabilities. |

---

*End of Document*
