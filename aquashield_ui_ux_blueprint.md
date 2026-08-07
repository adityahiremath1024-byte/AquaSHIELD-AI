# 🎨 AquaShield AI — UI/UX Design & Frontend Architecture Blueprint

This document defines the visual layout, interaction paradigms, styles, and state-management specifications for the **AquaShield AI** frontend dashboards. It enables any teammate or AI coding agent to implement the user interface exactly as displayed in the project’s screenshots.

---

## 1. Overall Design System & Visual Tokens

The frontend uses a modern **Glassmorphism Dark Mode** theme styled via Vanilla CSS3.

```
       ┌────────────────────────────────────────────────────────┐
       │                 VISUAL STYLES & TOKENS                 │
       │                                                        │
       │  Primary BG: #06080f (Deep Space Navy Black)           │
       │  Card BG:    rgba(14, 22, 40, 0.85) (Frosted Glass)    │
       │  Borders:    1px solid rgba(255, 255, 255, 0.08)       │
       │  Backdrops:  backdrop-filter: blur(12px)               │
       └────────────────────────────────────────────────────────┘
```

### Color Palette Tokens
* **Background Primary**: `#06080f` (Deep Space Navy Black)
* **Frosted Card BG**: `rgba(14, 22, 40, 0.85)` (Translucent midnight blue)
* **Slate Text (Muted)**: `#7a8ba8` (Used for secondary descriptions and labels)
* **Bright Text (High-contrast)**: `#f0f4f8` / `#ffffff`
* **Accent Colors**:
  * **Electric Cyan**: `#00f2fe` (Primary interactive components, highlights, and gauges)
  * **Emerald Green**: `#10b981` (Success states, low-risk tags, math formulas)
  * **Warning Amber**: `#f59e0b` (Moderate risk levels, alert warnings)
  * **Danger Red**: `#ef4444` (Critical risks, shortages, emergency alerts)
  * **Deep Violet**: `#a855f7` (Citizen signal, community exposure metrics)
* **Gradients**:
  * **Accent Gradient**: `linear-gradient(135deg, #00f2fe 0%, #10b981 100%)`
  * **Red-Orange Gradient**: `linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)`

### Typography Standards
* **Fonts**:
  * **Interface Headings**: `Outfit` (Modern geometric sans-serif)
  * **Body Text**: `Inter` (Optimized readability sans-serif)
  * **Data & Math Formulas**: `JetBrains Mono` / `monospace` (For coordinates, parameters, and outputs)
* **Font-Weights**: 300 (Light), 400 (Regular), 500 (Medium), 600 (Semi-Bold), 700 (Bold), 800 (Extra-Bold).

---

## 2. Common Layout Elements

All dashboard screens must share a consistent global shell structure.

### 2.1 Navigation Shell (Left Sidebar)
The left sidebar contains vertical navigation links with minimalist line-art icons and tooltips.
* **Top Area**: A shield logo with cyan outline and the text "AquaShield AI".
* **Menu Items**:
  1. `Overview` (Icon: Grid) -> link to `/`
  2. `Weather` (Icon: Cloud) -> link to `/weather`
  3. `Satellite` (Icon: Satellite) -> link to `/satellite`
  4. `Hospital` (Icon: Hospital) -> link to `/hospital`
  5. `Citizen` (Icon: Citizen avatar) -> link to `/citizen`
  6. `Fusion` (Icon: Brain) -> link to `/fusion`
  7. `Prediction` (Icon: Wave/Chart) -> link to `/prediction`
  8. `Decision Engine` (Icon: Gear/Sliders) -> link to `/dioe`
* **Active State Highlight**: The active page icon is colored in electric cyan, sits on a subtle translucent blue circle, and shows a vertical cyan highlight bar on the left edge.

### 2.2 Global Top Header Bar
* **Left**: Page Title & Subtitle (e.g., "AI Decision Intelligence & Intervention Optimisation Engine").
* **Right**: 
  * `LIVE` status indicator pill (glowing green dot).
  * Sync timestamp: "Last Sync: 04 Jun 2025 14:37:21 IST".
  * Active alarms badge ("ALERTS 12" in red).
  * Profile circle or "Sign In" button (gradient borders).
  * **Step Progress Badge**: Rounded pill text badge: e.g. "Step 7 of 7".

---

## 3. Screen-by-Screen UI/UX Specifications

---

### Screen 1: Master Overview Dashboard (`/` or `/weather`)
* **Left Section (Large)**: Outbreak value proposition text: *"Outbreak risk, seven days before it happens."* 
* **Center Section**: Frosted glass panel with interactive map displaying Kerala Backwaters (satellite view) overlaid with colored location pins (Red = Critical, Orange = High, Yellow = Moderate, Green = Low).
* **Right Section**: Grid showing "Village Risk Scores" (Alappuzha: 0.78, Kainakary: 0.63, etc.) and a checklist verifying connection status of all 6 data streams (Weather, Satellite, Hospital, NCDC, Citizen Reports, Mobility).
* **Bottom Panel**: Full list of the 7 modules with status badges (`LIVE`) and navigate-forward arrows.

---

### Screen 2: Module 1 — Weather Intelligence (`/weather`)
* **Input Card**: Frosted glass entry box containing inputs: `Location Name`, `Latitude`, `Longitude`, `Start Date`, `End Date`, and a large cyan button reading "FETCH WEATHER INTELLIGENCE".
* **Analytics Panel (Appears on click)**:
  * **Left Side**: "Bacteria Growth Index" star rating (4 out of 5 stars) with a blue wave canvas and a large "64% - Moderate Risk" tag.
  * **Right Side (4-Card Grid)**:
    1. *Historical Accumulated Rain*: Tabular data (Past 7d, Past 15d, Past 30d).
    2. *Rainfall Trend*: Large "+59.5%" text with upward arrow.
    3. *Rainfall Anomaly*: Anomaly indices for 7d, 15d, and 30d.
    4. *Rainy Day Streak*: Counter badge showing "3 Days".
* **Footer**: Proceed action banner navigating to `/satellite`.

---

### Screen 3: Module 2 — Satellite Flood Engine (`/satellite`)
* **Main Panel (Map & Stats)**:
  * **Left Component**: Satellite view viewer displaying Blue NDWI flood contour overlays. Includes interactive zoom tools (`+`/`-`), legend scale (`-1.0` to `1.0`), and coordinates metadata.
  * **Bottom Timeline Carousel**: Horizontal sequence showing thumbnail dates (e.g. 28 May $\to$ 04 Jun) and calculated flood % (8.3% $\to$ 36.0%).
  * **Right Metrics Cards**:
    * *Surface Water Coverage*: "36.0%"
    * *Flood Expansion Rate*: "+100.0% vs. baseline"
    * *Stagnant Pockets*: "28 detected"
    * *Detection Confidence*: "95.25%"
* **Bottom Panel (Comparison)**: Baseline (18.0%) vs. Post-Flood (36.0%) progress bars with red highlights and an orange "VERY HIGH" inundation severity level warning badge.

---

### Screen 4: Module 3 — Hospital Capacity & Surveillance (`/hospital`)
* **Data Entry Form**: Fields for `Hospital Name` (dropdown), `Total Beds`, `Occupied Beds`, `Today's New Cases`, `Doctors on Duty`, and a "SUBMIT DATA" button.
* **Middle Metrics Grid**:
  * *7-Day Rolling Average*: "23.4 cases/day"
  * *Case Growth Rate*: "+47.2% vs. previous 7 days"
  * *Capacity Utilization*: "85%" (442/520 beds occupied)
  * *Outbreak Threshold*: "ALERT" (yellow warning badge)
* **Bottom Component**: Smooth continuous line graph showing "7-Day New Case Trend" with individual coordinate points (12, 14, 18, 21, 25, 30, 38).

---

### Screen 5: Module 4 — Citizen Photo Reporting (`/citizen`)
* **Left Input Panel**: Fields for `Reporter Name`, `Latitude`, `Longitude`, `Water Source Type` (dropdown), `Description`, and a "SUBMIT REPORT" button.
* **Right Panel**: A drag-and-drop file upload section with camera icon and cyan dashed outline: "Upload Geotagged Photo".
* **Bottom Left (Cluster Log)**: "200m Spatial Cluster Analysis (Haversine)" showing list items with ID, coordinates, report count, and danger badges (e.g. C-001, 7 reports, `HIGH RISK` in red).
* **Bottom Right (Image Gate)**: "Image Validation" panel with green checkmark card (`ACCEPTED` Water/Flood imagery) and red cross card (`REJECTED` Non-water content like selfies, pets, food).

---

### Screen 6: Module 5 — Multi-Source Data Fusion Engine (`/fusion`)
* **Top Input Signal Cards (Row of 4)**:
  * Weather Signal: green border, displays "Bacteria Index 64%"
  * Satellite Signal: cyan border, displays "Flood Expansion +100%"
  * Hospital Signal: amber border, displays "Case Surge +47%"
  * Citizen Signal: purple border, displays "Cluster Risk HIGH"
* **Center Display (Visual Focus)**: A giant circle with a glowing cyan-green radial outline containing a massive **"78.4 /100"** score labeled "Unified Fusion Risk Score". Waves of animated digital signal lines stream into the circle from left and right.
* **Bottom Output Domain Cards**: Four cards showing progress bar widgets for:
  * Environmental Risk: `82` (Green bar)
  * Water Contamination: `76` (Cyan bar)
  * Health Stress: `71` (Orange bar)
  * Community Exposure: `84` (Purple bar)

---

### Screen 7: Module 6 — AI Outbreak Prediction Engine (`/prediction`)
* **Top Command Form**: Village Name, Latitude, Longitude, and a prominent blue-to-cyan gradient "RUN PREDICTION ENGINE" button.
* **Main Section Grid**:
  * **Left (SHAP Feature Importance)**: Horizontal bar chart showing contribution weights (Rainfall 28.4%, Flood Expansion 22.1%, Hospital Surge 18.7%, etc.).
  * **Center (Risk Gauge)**: A glowing rainbow semi-circular risk gauge showing **"84%"** inside with a red "CRITICAL" badge.
  * **Right (Model Metadata)**: Table detailing Model Type (`XGBoost Regressor`), $R^2$ Score (`0.94`), MAE (`2.1%`), and Training Samples (`500`).
* **Bottom Area (Gemini Narrative)**: Premium section labeled "AI-Generated Medical Action Plan (Powered by Gemini 2.0 Flash)" showing structured mitigation text in 4 clean vertical columns: Situation Summary, Immediate Actions, Medium Term Actions, and Long-Term Preparedness.

---

### Screen 8: Module 7 — Decision Intelligence Engine (DIOE) (`/dioe`)
* **Stage 1 (Situation Assessment)**: 5 cards showing Risk (84%), Threat Level (`CRITICAL` in red), Disease (`Cholera`), Horizon (`5 Days`), and Confidence (91%).
* **Stage 2 (Resource Estimator)**: 4 cards with huge metrics and formulas:
  * Expected Patients: `1,299` (Formula: `EP = P * AR * D`)
  * ORS Packets: `9,093` (Formula: `ORS = EP * 7`)
  * Chlorine Tablets: `15,000` (Formula: `CT = P * 30 * D`)
  * Doctors Needed: `17` (Formula: `DN = EP / 80`)
* **Stage 3 (Resource Gap Analysis)**: 3 cards showing gaps: "Medical Staff Gap: 11 doctors", "ORS Packet Gap: 5,893 packets", "Chlorine Tablet Gap: 10,200 tablets" (all tagged with red `SHORTAGE` indicators).
* **Stage 4 (Impact Simulator)**: Highlighted horizontal widget containing:
  * Current Projected Risk: `84.0%` (Critical)
  * Green gradient transition arrow labeled "Projected Risk After Optimal Intervention: -37.0%"
  * Projected Risk After Implementation: `47.0%` (Moderate Contained)
* **Stage 5 (Action Timeline)**: 5-column timeline layout (`0-6h`, `6-12h`, `12-24h`, `24-48h`, `3-7d`) showing tasks with checkmarks and priority tags.

---

## 4. Frontend-to-Backend Integration Architecture

The client handles data flow, state restoration, and multi-page routing via JavaScript.

### 4.1 LocalStorage Session State Schema (`aquashield_session`)
To allow users to step through pages without losing context or inputs, a single JSON object is maintained in browser memory.

```json
{
  "city": "Kuttanad, Kerala",
  "lat": 9.3500,
  "lon": 76.4300,
  "past7_mm": 182.0,
  "flood_water_pct": 34.0,
  "flood_increase_pct": 19.0,
  "hospital_raw_response": {
    "total_beds": 100,
    "occupied_beds": 85,
    "doctors_on_duty": 5
  },
  "citizen_reports_count": 18,
  "unified_fusion_score": 78.4,
  "prediction_raw_response": {
    "risk_score": 84.0,
    "risk_level": "CRITICAL"
  }
}
```

### 4.2 Auto-Restore Page Pattern
Each static page features a standard initialization script that checks the URL search parameters first, falls back to `localStorage`, and auto-fills input forms:

```javascript
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const session = JSON.parse(localStorage.getItem('aquashield_session') || '{}');

  const city = params.get('village_name') || session.city || '';
  const lat = params.get('latitude') || params.get('lat') || session.lat || '';
  const lon = params.get('longitude') || params.get('lon') || session.lon || '';

  if (city && document.getElementById('input_city')) document.getElementById('input_city').value = city;
  if (lat && document.getElementById('input_lat')) document.getElementById('input_lat').value = lat;
  if (lon && document.getElementById('input_lon')) document.getElementById('input_lon').value = lon;
});
```
