import os
import json
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_error

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(os.path.dirname(BASE_DIR), "data", "raw")
CSV_PATH = os.path.join(DATA_DIR, "aquashield_synthetic_800_samples.csv")
MODEL_DIR = os.path.join(BASE_DIR, "app", "models")
MODEL_PATH = os.path.join(MODEL_DIR, "xgboost_outbreak_model.json")
METRICS_PATH = os.path.join(MODEL_DIR, "model_metrics.json")

def generate_synthetic_dataset(num_samples=800, seed=42):
    """
    Generates 800 synthetic epidemiological and environmental data rows 
    based on AquaShield AI feature specifications.
    """
    np.random.seed(seed)
    
    # 1. Environmental Features
    rainfall_mm = np.random.uniform(5.0, 350.0, num_samples)
    temperature_c = np.random.uniform(22.0, 38.0, num_samples)
    humidity_pct = np.random.uniform(40.0, 98.0, num_samples)
    flood_pct_increase = np.clip(0.15 * rainfall_mm + np.random.normal(0, 5, num_samples), 0, 100)
    days_since_last_heavy_rain = np.random.randint(0, 21, num_samples)
    water_stagnation_index = np.clip(0.4 * flood_pct_increase + 0.3 * humidity_pct - 1.5 * days_since_last_heavy_rain + np.random.normal(0, 4, num_samples), 0, 100)
    
    # 2. Clinical & Citizen Signals
    hospital_cases_7d = np.random.randint(5, 250, num_samples)
    case_surge_pct = np.clip((hospital_cases_7d - 30) / 1.5 + np.random.normal(0, 8, num_samples), -20, 200)
    citizen_reports_count = np.random.randint(0, 45, num_samples)
    citizen_avg_risk_score = np.clip(0.8 * water_stagnation_index + 0.3 * citizen_reports_count + np.random.normal(0, 5, num_samples), 0, 100)
    
    # 3. Ground Truth Outbreak Risk Target Formula (Deterministic synthetic physics + realistic noise)
    # Target outbreak_risk_pct (0 to 100%)
    raw_risk = (
        0.28 * rainfall_mm / 3.5 +
        0.22 * flood_pct_increase +
        0.18 * case_surge_pct * 0.4 +
        0.10 * temperature_c * 2.0 +
        0.07 * humidity_pct * 0.8 +
        0.15 * water_stagnation_index * 0.8 +
        np.random.normal(0, 1.8, num_samples)
    )
    
    outbreak_risk_pct = np.clip(raw_risk, 5.0, 98.5)
    
    df = pd.DataFrame({
        "rainfall_mm": np.round(rainfall_mm, 2),
        "temperature_c": np.round(temperature_c, 2),
        "humidity_pct": np.round(humidity_pct, 2),
        "flood_pct_increase": np.round(flood_pct_increase, 2),
        "hospital_cases_7d": hospital_cases_7d,
        "case_surge_pct": np.round(case_surge_pct, 2),
        "citizen_reports_count": citizen_reports_count,
        "citizen_avg_risk_score": np.round(citizen_avg_risk_score, 2),
        "days_since_last_heavy_rain": days_since_last_heavy_rain,
        "water_stagnation_index": np.round(water_stagnation_index, 2),
        "outbreak_risk_pct": np.round(outbreak_risk_pct, 2)
    })
    
    os.makedirs(DATA_DIR, exist_ok=True)
    df.to_csv(CSV_PATH, index=False)
    print(f"Synthetic dataset created successfully at: {CSV_PATH} ({len(df)} rows)")
    return df

def train_and_save_model():
    if not os.path.exists(CSV_PATH):
        df = generate_synthetic_dataset(num_samples=800)
    else:
        df = pd.read_csv(CSV_PATH)
        print(f"Loaded existing dataset from {CSV_PATH}")

    feature_cols = [
        "rainfall_mm",
        "temperature_c",
        "humidity_pct",
        "flood_pct_increase",
        "hospital_cases_7d",
        "case_surge_pct",
        "citizen_reports_count",
        "citizen_avg_risk_score",
        "days_since_last_heavy_rain",
        "water_stagnation_index"
    ]
    target_col = "outbreak_risk_pct"
    
    X = df[feature_cols]
    y = df[target_col]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Model configuration from Phase 6 specification
    model = xgb.XGBRegressor(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.08,
        subsample=0.85,
        colsample_bytree=0.85,
        reg_alpha=0.1,
        reg_lambda=1.0,
        random_state=42
    )
    
    print("Training XGBoost Regressor model...")
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    r2 = r2_score(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)
    
    print(f"Model Performance Evaluation:")
    print(f"  - R² Score: {r2:.4f} ({r2*100:.1f}%)")
    print(f"  - MAE (Mean Absolute Error): ±{mae:.2f}%")
    
    os.makedirs(MODEL_DIR, exist_ok=True)
    model.save_model(MODEL_PATH)
    print(f"Saved trained XGBoost model to: {MODEL_PATH}")
    
    metrics = {
        "model_type": "XGBoost Regressor",
        "training_samples": len(df),
        "r2_score": round(float(r2), 4),
        "r2_pct": round(float(r2 * 100), 1),
        "mae": round(float(mae), 2),
        "feature_names": feature_cols,
        "prediction_horizon": "7-Day Forward Forecast"
    }
    
    with open(METRICS_PATH, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"Saved model metrics to: {METRICS_PATH}")

if __name__ == "__main__":
    train_and_save_model()
