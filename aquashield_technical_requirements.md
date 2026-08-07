# 🛠️ AquaShield AI — Technical Requirements & Backend Architecture Blueprint

This document serves as the absolute technical source of truth for building, maintaining, and scaling the **AquaShield AI** backend. It contains the complete system architecture, database schema, API routing specifications, mathematical formulas, and business logic for all 7 operational modules.

---

## 1. System Architecture & Tech Stack

AquaShield AI uses a high-performance, lightweight, and asynchronous Python-based backend architecture designed for low latency, mathematical computation, and real-time API integrations.

```
       ┌────────────────────────────────────────────────────────┐
       │                FASTAPI BACKEND SYSTEM                  │
       │                                                        │
       │  ┌──────────────────┐  ┌─────────────┐  ┌───────────┐  │
       │  │   API Routers    │  │  Services   │  │ Database  │  │
       │  │ (FastAPI Routes) │  │  (Business) │  │ (SQLite)  │  │
       │  └────────┬─────────┘  └──────┬──────┘  └─────┬─────┘  │
       └───────────┼───────────────────┼───────────────┼────────┘
                   │                   │               │
       ┌───────────▼───────────┐       │               │
       │   External Data APIs  │       │               │
       │  • Planet Labs API    ◄───────┤               │
       │  • Open-Meteo API     ◄───────┘               │
       └───────────────────────┘                       │
                   ▲                                   │
                   │                                   │
       ┌───────────┴───────────┐                       │
       │      Client App       │                       │
       │ (HTML/CSS Dashboard)  ◄───────────────────────┘
       └───────────────────────┘
```

### Core Technologies & Versioning
* **Runtime**: Python 3.10+ (asynchronous environment)
* **Web Framework**: FastAPI `^0.115.0` (asynchronous routing & OpenAPI autogeneration)
* **ASGI Server**: Uvicorn `^0.32.0` (high-performance ASGI server)
* **Async HTTP Client**: HTTPX `^0.28.0` (used for asynchronous external API requests)
* **Database & ORM**: SQLite + SQLAlchemy `^2.0.0`
* **Machine Learning**: XGBoost `^2.0.0` (regression engine), Scikit-Learn `^1.3.0`
* **Explainable AI (XAI)**: SHAP `^0.44.0` (TreeExplainer for feature importance)
* **Generative AI SDK**: Google GenAI `^1.0.0` (for Gemini 2.0 Flash action plan formatting)
* **Image Analytics & Computer Vision**: NumPy `^1.24.0`, Pillow `^10.0.0`, OpenCV (Headless) `^4.8.0`

---

## 2. Relational Database Schema (SQLite)

The database (`aquashield.db`) is structured using SQLAlchemy ORM. It stores ground-truth clinical data (hospital surveillance) and crowdsourced environmental data (citizen reports).

```
 ┌──────────────────────────────────────┐          ┌──────────────────────────────────────┐
 │           HOSPITAL_RECORDS           │          │           CITIZEN_REPORTS            │
 ├──────────────────────────────────────┤          ├──────────────────────────────────────┤
 │ id: INTEGER (PK)                     │          │ id: INTEGER (PK)                     │
 │ village_name: VARCHAR                │          │ reporter_name: VARCHAR               │
 │ latitude: FLOAT                      │          │ village_name: VARCHAR                │
 │ longitude: FLOAT                     │          │ latitude: FLOAT                      │
 │ record_date: DATE (YYYY-MM-DD)       │          │ longitude: FLOAT                     │
 │ diarrhea_cases: INTEGER              │          │ water_source_type: VARCHAR           │
 │ typhoid_cases: INTEGER               │          │ description: TEXT                    │
 │ cholera_cases: INTEGER               │          │ ai_generated_caption: TEXT           │
 │ fever_cases: INTEGER                 │          │ perceived_risk_level: VARCHAR        │
 │ total_cases: INTEGER                 │          │ image_validation_status: VARCHAR     │
 │ yesterday_cases: INTEGER             │          │ image_content_label: VARCHAR         │
 │ growth_rate_pct: FLOAT               │          │ reporter_reliability: VARCHAR        │
 │ moving_avg_7d: FLOAT                 │          │ cluster_id: VARCHAR                  │
 │ outbreak_threshold_level: VARCHAR    │          │ nearby_reports_count_200m: INTEGER  │
 │ total_beds: INTEGER                  │          │ is_high_risk_cluster: BOOLEAN        │
 │ occupied_beds: INTEGER               │          │ photo_filename: VARCHAR              │
 │ beds_available: INTEGER              │          │ photo_url: VARCHAR                   │
 │ bed_occupancy_pct: FLOAT             │          │ created_at: DATETIME                 │
 │ doctors_on_duty: INTEGER             │          └──────────────────────────────────────┘
 │ medicine_stock_pct: FLOAT            │
 │ hospital_capacity_risk_score: FLOAT  │
 │ hospital_score_stars: INTEGER        │
 │ is_imputed: BOOLEAN                  │
 │ reported_by: VARCHAR                 │
 │ created_at: DATETIME                 │
 └──────────────────────────────────────┘
```

### Table 1: `hospital_records`
Stores daily hospital admission numbers, clinical details, and capacity risk metrics.
* **`id`**: `Integer` (Primary Key, autoincrement)
* **`village_name`**: `String` (Target health monitoring location)
* **`latitude` / `longitude`**: `Float` (Geospatial coordinates of the facility)
* **`record_date`**: `Date` (Format: `YYYY-MM-DD`, unique together with `village_name`)
* **`diarrhea_cases` / `typhoid_cases` / `cholera_cases` / `fever_cases`**: `Integer` (Daily incident case counts)
* **`total_cases`**: `Integer` (Sum of all daily waterborne disease cases)
* **`yesterday_cases`**: `Integer` (Daily total cases from previous day)
* **`growth_rate_pct`**: `Float` (Percent change in cases over previous day)
* **`moving_avg_7d`**: `Float` (7-day rolling case average)
* **`outbreak_threshold_level`**: `String` (Outbreak tier classification: `Normal`, `Watch`, `Alert`, `Emergency`)
* **`total_beds` / `occupied_beds`**: `Integer` (Capacity metric)
* **`beds_available`**: `Integer` (Calculated: `total_beds - occupied_beds`)
* **`bed_occupancy_pct`**: `Float` (Calculated percentage of occupied beds)
* **`doctors_on_duty`**: `Integer` (Number of active staff)
* **`medicine_stock_pct`**: `Float` (Percentage of critical emergency stock remaining)
* **`hospital_capacity_risk_score`**: `Float` (Risk score out of 10.0 based on occupancy & shortages)
* **`hospital_score_stars`**: `Integer` (Stars out of 5 based on overall risk)
* **`is_imputed`**: `Boolean` (True if data was missing and synthesized)
* **`reported_by`**: `String` (Name of reporting hospital admin)
* **`created_at`**: `DateTime` (Timestamp of record entry, defaults to UTC)

### Table 2: `citizen_reports`
Stores community crowdsourced water quality observations, photo metadata, and computer vision validation tags.
* **`id`**: `Integer` (Primary Key, autoincrement)
* **`reporter_name`**: `String` (Default: `"Anonymous Citizen"`)
* **`village_name`**: `String` (Reporting location)
* **`latitude` / `longitude`**: `Float` (GPS coordinates of photo capture)
* **`water_source_type`**: `String` (e.g., open well, river, public tap)
* **`description`**: `Text` (Citizen text comments)
* **`ai_generated_caption`**: `Text` (Generated description of the image content)
* **`perceived_risk_level`**: `String` (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`)
* **`image_validation_status`**: `String` (`ACCEPTED` if contains water, `REJECTED` if selfie/pet/junk)
* **`image_content_label`**: `String` (Computer vision tag: `Water`, `Flood`, `Drain`, `Garbage`, `Pipe`)
* **`reporter_reliability`**: `String` (`Trusted`, `New`, `Spam`)
* **`cluster_id`**: `String` (ID of 200m spatial cluster if detected)
* **`nearby_reports_count_200m`**: `Integer` (Number of nearby reports)
* **`is_high_risk_cluster`**: `Boolean` (True if $\ge 3$ reports fall within 200 meters)
* **`photo_filename`**: `String` (Name of saved image file in backend storage)
* **`photo_url`**: `String` (Static public URL path to serve the file)
* **`created_at`**: `DateTime` (UTC timestamp)

---

## 3. End-to-End API Router & Endpoint Specifications

All endpoints return structured JSON response models unless streaming binary assets.

---

### 3.1 Module 1: Weather Engine Router (`/api/weather`)
Responsible for fetching historical and forecast meteorological data.

#### `GET /api/weather/health`
* **Purpose**: Check connection status of the Open-Meteo API.
* **Response**: `{"status": "ok", "api": "Open-Meteo Weather API", "latency_ms": 145}`

#### `GET /api/weather/current`
* **Query Parameters**:
  * `latitude`: `float` (required, ge=-90, le=90)
  * `longitude`: `float` (required, ge=-180, le=180)
* **Response Model**: `WeatherResponse`
* **JSON Structure**:
```json
{
  "latitude": 9.4981,
  "longitude": 76.3388,
  "current": {
    "temperature_c": 31.2,
    "humidity_pct": 91.0,
    "wind_speed_kmh": 12.5,
    "precipitation_mm": 2.4
  },
  "advanced_risk_assessment": {
    "bacteria_growth_index_pct": 64.0,
    "risk_level": "Moderate Risk",
    "risk_stars": 4,
    "past_7d_accumulated_rain_mm": 20.1,
    "past_15d_accumulated_rain_mm": 36.0,
    "past_30d_accumulated_rain_mm": 196.9,
    "rainfall_trend_pct": 59.5,
    "rainfall_trend_direction": "Increasing",
    "consecutive_rainy_days": 3
  }
}
```

#### `GET /api/weather/forecast`
* **Query Parameters**:
  * `latitude`: `float` (required)
  * `longitude`: `float` (required)
  * `days`: `int` (default: 7, ge=1, le=16)
* **Response Model**: `ForecastResponse`

#### `GET /api/weather/historical`
* **Query Parameters**:
  * `latitude`: `float` (required)
  * `longitude`: `float` (required)
  * `start_date`: `str` (required, format: YYYY-MM-DD)
  * `end_date`: `str` (required, format: YYYY-MM-DD)
* **Response Model**: `HistoricalWeatherResponse`

---

### 3.2 Module 2: Satellite Image Search & NDWI Mask Proxy

#### 3.2.1 Planet API Proxy (`/api/satellite`)

##### `GET /api/satellite/health`
* **Purpose**: Verify Planet API Auth credentials.
* **Response**: `HealthResponse` (`{"status": "authenticated", "item_types": ["PSScene"]}`)

##### `GET /api/satellite/search`
* **Query Parameters**:
  * `latitude`: `float` (required)
  * `longitude`: `float` (required)
  * `radius_km`: `float` (default: 10.0)
  * `start_date`: `Optional[str]` (defaults to `2024-06-01` if empty)
  * `end_date`: `Optional[str]` (defaults to current date if empty)
  * `cloud_cover_max`: `float` (default: 0.3)
  * `item_types`: `str` (default: `"PSScene"`)
  * `limit`: `int` (default: 25)
* **Response Model**: `SearchResponse`

##### `GET /api/satellite/thumbnail/{image_id}`
* **Purpose**: Proxies thumbnail previews from Planet tile server to bypass CORS.
* **Headers**: Returns `Response(content_bytes, media_type="image/jpeg")`.

---

#### 3.2.2 NDWI Inundation Calculator (`/api/ndwi`)

##### `GET /api/ndwi/analyze`
* **Query Parameters**:
  * `image_id`: `str` (required)
  * `item_type`: `str` (default: "PSScene")
* **Response Model**: `NDWIAnalysisResponse`
* **JSON Structure**:
```json
{
  "image_id": "20250604_143721_PSScene",
  "surface_water_pct": 36.0,
  "flooded_area_sq_km": 254.4,
  "stagnant_water_pockets": 28,
  "detection_confidence_pct": 95.25,
  "cloud_cover_pct": 5.0,
  "resolution_gsd_meters": 3.0,
  "image_date": "2025-06-04T06:15:00Z"
}
```

##### `GET /api/ndwi/mask/{image_id}`
* **Purpose**: Serves generated NDWI flood mask overlay (JPEG) from memory cache.
* **Response**: Streamed binary `image/jpeg` asset.

##### `GET /api/ndwi/compare`
* **Query/Payload Parameters**:
  * `baseline_image_id`: `str` (required)
  * `flood_image_id`: `str` (required)
  * `radius_km`: `float` (default: 15.0)
* **Response Model**: `FloodComparisonResponse`

---

### 3.3 Module 3: Hospital Surveillance Router (`/api/hospital`)

#### `POST /api/hospital/records`
* **Payload (`HospitalRecordCreate`)**:
```json
{
  "village_name": "Kottayam",
  "latitude": 9.4981,
  "longitude": 76.3388,
  "record_date": "2025-06-04",
  "diarrhea_cases": 15,
  "typhoid_cases": 12,
  "cholera_cases": 6,
  "fever_cases": 5,
  "total_beds": 120,
  "occupied_beds": 95,
  "doctors_on_duty": 8,
  "medicine_stock_pct": 75.0,
  "reported_by": "Dr. Sarah Paul"
}
```
* **Deduplication Rule**: If a record for the same `village_name` and `record_date` already exists, update its values rather than creating a duplicate row.
* **Response**: `HospitalRecordResponse` (Status `201 Created`).

#### `GET /api/hospital/surge-summary`
* **Query Parameters**:
  * `village_name`: `str` (default: "Guwahati")
* **Response**:
```json
{
  "village_name": "Kottayam",
  "today_total": 38,
  "growth_rate_pct": 47.2,
  "moving_avg_7d": 23.4,
  "outbreak_threshold_level": "ALERT",
  "capacity_utilization_pct": 85.0,
  "doctors_on_duty": 24,
  "capacity_risk_score": 8.0,
  "hospital_score_stars": 2,
  "is_imputed": false,
  "historical_trend": [
    {"date": "2025-05-29", "cases": 12},
    {"date": "2025-06-04", "cases": 38}
  ]
}
```

---

### 3.4 Module 4: Citizen Water Intelligence Router (`/api/citizen`)

#### `POST /api/citizen/upload`
* **Request Content-Type**: `multipart/form-data`
* **Form Inputs**:
  * `village_name`: `str` (required)
  * `latitude`: `float` (required)
  * `longitude`: `float` (required)
  * `water_source_type`: `str` (required, open_well/river/canal/tap)
  * `description`: `Optional[str]`
  * `photo`: `File` (optional, uploaded image file)
* **Processing Sequence**:
  1. Save uploaded image to `uploads/` folder with unique UUID name.
  2. Run OpenCV Image Verification Gate (checks if photo contains water/contamination).
  3. Perform Haversine 200m spatial clustering calculation.
  4. Generate automated text labels and risk score.
* **Response Model**: `CitizenReportResponse`
* **JSON Structure**:
```json
{
  "id": 142,
  "reporter_name": "Anonymous Citizen",
  "village_name": "Kottayam",
  "latitude": 9.4981,
  "longitude": 76.3388,
  "water_source_type": "Open Well",
  "image_validation_status": "ACCEPTED",
  "image_content_label": "Water",
  "cluster_id": "CL-9.498-76.338",
  "nearby_reports_count_200m": 3,
  "is_high_risk_cluster": true,
  "photo_url": "/static/uploads/c78d45-f32e.jpg",
  "created_at": "2025-06-04T14:37:21Z"
}
```

---

### 3.5 Module 5: Multi-Signal Data Fusion Engine (`/api/fusion`)

#### `POST /api/fusion/process`
* **Payload (`FusionRequestPayload`)**:
```json
{
  "village_name": "Kuttanad, Kerala",
  "latitude": 9.3500,
  "longitude": 76.4300,
  "flood_water_pct": 34.0,
  "hospital_cases_7d": 120,
  "case_surge_pct": 47.0,
  "citizen_reports_count": 18
}
```
* **Response JSON Structure**: Contains normalized metrics ($0-100$ scale), engineered indicators, and the final Unified Outbreak Fusion Index score.
```json
{
  "village_name": "Kuttanad, Kerala",
  "normalized_metrics": {
    "rainfall_score": 78.4,
    "flood_score": 85.0,
    "hospital_score": 71.0,
    "citizen_score": 84.0
  },
  "engineered_features": {
    "stagnation_index": 76.2,
    "exposure_risk": 82.5
  },
  "semantic_domains": {
    "environmental_risk": 82.0,
    "water_contamination_risk": 76.0,
    "health_stress_risk": 71.0,
    "community_exposure_risk": 84.0
  },
  "unified_fusion_score": 78.4
}
```

---

### 3.6 Module 6: XGBoost Outbreak Prediction Engine (`/api/prediction`)

#### `GET /api/prediction/analyze`
* **Query Parameters**:
  * `village_name`: `str` (required)
  * `latitude`: `float` (required)
  * `longitude`: `float` (required)
* **Response Model**: `PredictionResponse` (Executes XGBoost prediction, extracts local SHAP feature importances, and requests a Gemini AI structured action plan).

---

### 3.7 Module 7: Decision Intelligence Engine (DIOE) (`/api/dioe`)

#### `POST /api/dioe/optimize`
* **Payload (`DIEPayload`)**:
```json
{
  "village_name": "Kuttanad, Kerala",
  "latitude": 9.3500,
  "longitude": 76.4300,
  "risk_score": 84.0,
  "risk_level": "CRITICAL",
  "disease_type": "Cholera / Acute Diarrhea",
  "confidence_pct": 91.0,
  "population": 16240,
  "hospital": {
    "total_beds": 100,
    "occupied_beds": 85,
    "doctors_on_duty": 5,
    "ors_stock_packets": 4200,
    "chlorine_stock_tablets": 8500
  },
  "rain_7d_mm": 182.0,
  "humidity_pct": 91.0,
  "flood_pct": 34.0,
  "flood_expansion_pct": 19.0,
  "citizen_reports_count": 18,
  "citizen_cluster_risk": "HIGH"
}
```
* **Response JSON**: Returns computed situation threat levels, expected patient counts, required supplies, calculated stock gaps, prioritized action cards, simulated risk reductions ($84\% \to 47\%$), and Gemini AI narrative response.

---

## 4. Key Mathematical Algorithms & Logic

### 4.1 Weather Severity Rating (BGI)
Calculates bacteria growth indices from temperature and humidity.
* **Steadman Heat Index ($HI$)** is computed from current weather variables.
* **Bacteria Growth Index (BGI)**:
  $$\text{BGI} = 0.40 \cdot \text{Rain}_{\text{past7}} + 0.30 \cdot HI + 0.20 \cdot \text{Humidity} + 0.10 \cdot \text{Rain}_{\text{trend\_factor}}$$

---

### 4.2 Satellite Inundation & NDWI Mask
Calculates surface water presence from Sentinel/PlanetScope bands.
* **Modified NDWI Formula**:
  $$\text{NDWI} = \frac{\text{Green} - \text{Red}}{\text{Green} + \text{Red} + 10^{-6}}$$
* **Water Mask Condition**: A pixel is classified as water if and only if:
  $$(\text{NDWI} > 0.05) \land (\text{Blue} \ge 0.9 \cdot \text{Red})$$

---

### 4.3 Computer Vision Water Validation
Validates citizen uploads using OpenCV HSV color ranges and Laplacian texture variance.
* **Muddy Silt Detection (Brown Mask)**: HSV boundaries $[5, 25, 25]$ to $[30, 255, 230]$.
* **Algae Scum Detection (Green Mask)**: HSV boundaries $[35, 35, 35]$ to $[85, 255, 255]$.
* **Dark Sewage Detection (Low Brightness)**: Value channel $V < 35$.
* **Blue Water Detection (Clean Blue Mask)**: HSV boundaries $[90, 30, 30]$ to $[130, 255, 255]$.
* **Blur/Focus Filter (Laplacian Variance)**:
  $$\text{Variance} = \text{Var}(\nabla^2 I)$$
* **Validation Rule**:
  $$\text{Accepted} \iff (\text{Total Water Pixels} \ge 4.0\%) \land (\text{Variance} \ge 80.0)$$

---

### 4.4 Geospatial Spatial Clustering
Identifies clusters of citizen contamination reports using the Haversine distance formula.
* **Haversine Distance ($d$)**:
  $$a = \sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)$$
  $$d = 2 \cdot R \cdot \operatorname{asin}(\sqrt{a}) \quad (R = 6371 \text{ km})$$
* **High Risk Rule**: If $\ge 3$ reports occur within a radius of $d \le 200$ meters, they are grouped under a unique `cluster_id` and flagged as `is_high_risk_cluster = true`.

---

### 4.5 XGBoost Outbreak Prediction Engine
Trained on synthetic clinical and environmental variables to predict outbreak probabilities.
* **Features**: `rainfall_mm`, `temperature_c`, `humidity_pct`, `flood_pct_increase`, `hospital_cases_7d`, `case_surge_pct`, `citizen_reports_count`, `citizen_avg_risk_score`, `days_since_last_heavy_rain`, `water_stagnation_index`.
* **Model Configuration**: `n_estimators=100`, `max_depth=5`, `learning_rate=0.05`.
* **Explainability (SHAP Contributions)**: Local contributions are normalized to sum to 100%:
  $$\text{Contribution \%}_i = \frac{|\phi_i|}{\sum_{j} |\phi_j|} \times 100$$

---

### 4.6 Decision Intelligence Optimizer (DIOE)
Calculates medical resource requirements and simulates risk reductions.
* **Attack Rate ($A$)**: Based on risk score (e.g. $R \ge 80\% \rightarrow A = 8\%$).
* **Expected Patients**: $E_{\text{patients}} = \lfloor \text{Population} \times A \rfloor$.
* **ORS Needed**: $E_{\text{patients}} \times 7$ packets.
* **Doctors Needed**: $\lceil E_{\text{patients}} / 80 \rceil$ doctors.
* **Gap Analysis**: $\text{Gap} = \max(0, \text{Required} - \text{Stock})$.
* **Post-Action Risk Efficacy**:
  $$R_{\text{post}} = \max\left(15.0,\; R_{\text{initial}} - \sum \Delta_{\text{efficacy}}\right)$$
  *(E.g., Chlorination = $-18\%$, Medical Camp = $-10\%$, ORS Distribution = $-5\%$, ASHA Survey = $-4\%$)*

---

## 5. Folder Structure of the Repository

```
aquashield-ai/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── citizen.py
│   │   │   ├── dioe.py
│   │   │   ├── fusion.py
│   │   │   ├── hospital.py
│   │   │   ├── ndwi.py
│   │   │   ├── prediction.py
│   │   │   ├── satellite.py
│   │   │   └── weather.py
│   │   ├── config/
│   │   │   └── settings.py
│   │   ├── db/
│   │   │   ├── database.py
│   │   │   └── models.py
│   │   ├── schemas/
│   │   │   ├── citizen.py
│   │   │   ├── hospital.py
│   │   │   ├── ndwi.py
│   │   │   ├── prediction.py
│   │   │   ├── satellite.py
│   │   │   └── weather.py
│   │   ├── services/
│   │   │   ├── gemini_service.py
│   │   │   ├── image_analyzer.py
│   │   │   ├── ndwi_service.py
│   │   │   ├── planet_service.py
│   │   │   ├── prediction_engine.py
│   │   │   └── weather_service.py
│   │   ├── static/
│   │   │   ├── citizen.html
│   │   │   ├── dioe.html
│   │   │   ├── fusion.html
│   │   │   ├── hospital.html
│   │   │   ├── prediction.html
│   │   │   ├── satellite.html
│   │   │   └── weather.html
│   │   ├── utils/
│   │   │   ├── exceptions.py
│   │   │   ├── geo.py
│   │   │   └── weather_risk.py
│   │   └── main.py
│   ├── uploads/
│   ├── .env
│   ├── .gitignore
│   ├── requirements.txt
│   └── aquashield.db
```
