from fastapi import APIRouter, Query, HTTPException
from typing import Optional

from app.schemas.weather import (
    WeatherResponse, ForecastResponse, HistoricalWeatherResponse, WeatherHealthResponse
)
from app.services.weather_service import weather_service

router = APIRouter(prefix="/api/weather", tags=["Module 1: Meteorological Intelligence"])


@router.get("/health", response_model=WeatherHealthResponse)
async def check_weather_health():
    """Verify connectivity and latency of the Open-Meteo external API."""
    try:
        health_result = await weather_service.check_health()
        return health_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Weather health check failed: {str(e)}")


@router.get("/current", response_model=WeatherResponse)
async def get_current_weather_data(
    latitude: float = Query(..., description="Latitude of location", ge=-90.0, le=90.0),
    longitude: float = Query(..., description="Longitude of location", ge=-180.0, le=180.0)
):
    """
    Evaluate weather outbreak risks using the 5 micro-climate triggers 
    and the 6-Variable Weighted Score Matrix.
    """
    try:
        result = await weather_service.get_current_weather(latitude, longitude)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch weather data: {str(e)}")


@router.get("/forecast", response_model=ForecastResponse)
async def get_weather_forecast_data(
    latitude: float = Query(..., description="Latitude of location", ge=-90.0, le=90.0),
    longitude: float = Query(..., description="Longitude of location", ge=-180.0, le=180.0),
    days: int = Query(7, description="Number of forecast days (1 to 16)", ge=1, le=16)
):
    """Fetch multi-day temperature and precipitation forecast for risk outlooks."""
    try:
        result = await weather_service.get_forecast(latitude, longitude, days)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch forecast: {str(e)}")


@router.get("/historical", response_model=HistoricalWeatherResponse)
async def get_historical_weather_data(
    latitude: float = Query(..., description="Latitude of location", ge=-90.0, le=90.0),
    longitude: float = Query(..., description="Longitude of location", ge=-180.0, le=180.0),
    start_date: str = Query(..., description="Start date in YYYY-MM-DD format"),
    end_date: str = Query(..., description="End date in YYYY-MM-DD format")
):
    """Query historical archives for meteorological conditions over a date range."""
    try:
        result = await weather_service.get_historical(latitude, longitude, start_date, end_date)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch historical weather: {str(e)}")

