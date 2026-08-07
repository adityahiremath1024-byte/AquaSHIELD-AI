from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

# --- Current Weather Schemas ---

class CurrentWeather(BaseModel):
    temperature_c: float = Field(..., description="Current temperature in Celsius")
    humidity_pct: float = Field(..., description="Current relative humidity percentage")
    wind_speed_kmh: float = Field(..., description="Current wind speed in km/h")
    precipitation_mm: float = Field(..., description="Current precipitation in mm")

class AdvancedRiskAssessment(BaseModel):
    bacteria_growth_index_pct: float = Field(..., description="Calculated Bacteria Growth Index (0-100%)")
    risk_level: str = Field(..., description="Risk level classification (LOW, MODERATE, HIGH, CRITICAL)")
    risk_stars: int = Field(..., description="Risk score star rating (1-5)")
    past_7d_accumulated_rain_mm: float = Field(..., description="Total rainfall in past 7 days")
    past_15d_accumulated_rain_mm: float = Field(..., description="Total rainfall in past 15 days")
    past_30d_accumulated_rain_mm: float = Field(..., description="Total rainfall in past 30 days")
    rainfall_trend_pct: float = Field(..., description="Rainfall trend percent change")
    rainfall_trend_direction: str = Field(..., description="Trend direction: Increasing, Decreasing, or Stable")
    consecutive_rainy_days: int = Field(..., description="Consecutive rainy days count")

class DashboardAssessment(BaseModel):
    bacteriaGrowthIndex: float
    riskLevel: str
    riskLevelLabel: str
    riskStars: int
    generatedAt: str
    protocol: str

class DetailedPrecipitation(BaseModel):
    past7_mm: float
    previous7_mm: float
    past15_mm: float
    past30_mm: float
    seasonalNormal_mm: float
    trendPct: float
    trendDirection: str
    anomaly7d: str
    anomaly15d: str
    anomaly30d: str
    anomalyPct: float
    anomalyStatus: str
    consecutiveRainyDays: int
    streakStatus: str
    daily: List[float]

class DetailedHeatIndex(BaseModel):
    temperature_c: float
    humidity_pct: int
    vaporPressure_hpa: float
    heatIndex_c: float
    formula: str

class ScoreMatrixItem(BaseModel):
    variable: str
    rawValue: str
    condition: str
    score: int
    weightPct: str
    weight: float
    contribution: float
    color: str

class RiskTier(BaseModel):
    range: str
    level: str
    badgeClass: str
    protocol: str

class WeatherResponse(BaseModel):
    latitude: float
    longitude: float
    current: CurrentWeather
    advanced_risk_assessment: AdvancedRiskAssessment
    # Extra fields to directly support the rich frontend dashboard rendering
    assessment: Optional[DashboardAssessment] = None
    precipitation: Optional[DetailedPrecipitation] = None
    heatIndex: Optional[DetailedHeatIndex] = None
    scoreMatrix: Optional[List[ScoreMatrixItem]] = None
    riskTiers: Optional[List[RiskTier]] = None

# --- Forecast Schemas ---

class DailyForecastItem(BaseModel):
    date: str
    temperature_max_c: float
    temperature_min_c: float
    precipitation_sum_mm: float
    precipitation_probability_pct: Optional[float] = None

class ForecastResponse(BaseModel):
    latitude: float
    longitude: float
    forecast: List[DailyForecastItem]

# --- Historical Schemas ---

class DailyHistoricalItem(BaseModel):
    date: str
    temperature_mean_c: float
    precipitation_sum_mm: float

class HistoricalWeatherResponse(BaseModel):
    latitude: float
    longitude: float
    start_date: str
    end_date: str
    historical: List[DailyHistoricalItem]

# --- Health Schema ---

class WeatherHealthResponse(BaseModel):
    status: str
    api: str
    latency_ms: int
