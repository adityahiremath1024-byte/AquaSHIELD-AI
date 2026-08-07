import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Load environment variables
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(BASE_DIR, ".env")
load_dotenv(ENV_PATH)

from app.api.prediction import router as prediction_router
from app.api.dioe import router as dioe_router

app = FastAPI(
    title="AquaShield AI — Outbreak Risk Engine & Decision Intelligence Backend",
    description="Production backend for Module 6 (XGBoost + SHAP + Gemini) and Module 7 (DIOE WHO Decision Optimizer).",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(prediction_router)
app.include_router(dioe_router)

# Mount Static Files (HTML/CSS/JS dashboard)
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
if os.path.exists(STATIC_DIR):
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "system": "AquaShield AI Engine",
        "modules": ["Module 6: Prediction", "Module 7: DIOE"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
