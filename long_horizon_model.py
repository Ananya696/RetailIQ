import pandas as pd
import numpy as np
from pathlib import Path

from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

DATA_PATH = BASE_DIR / "kaggle_data" / "train.csv"
MODEL_DIR = BASE_DIR / "models"
MODEL_PATH = MODEL_DIR / "long_horizon_model.pkl"


# ============================================================
# LOAD DATA
# ============================================================

print(f"Loading dataset: {DATA_PATH}")

df = pd.read_csv(DATA_PATH)

df["date"] = pd.to_datetime(df["date"])

df = df.sort_values(
    ["store", "item", "date"]
).reset_index(drop=True)

print(f"Dataset shape: {df.shape}")
print(f"Date range: {df['date'].min().date()} -> {df['date'].max().date()}")


# ============================================================
# FEATURE ENGINEERING
# ============================================================

def create_features(data):
    data = data.copy()

    # Calendar features
    data["year"] = data["date"].dt.year
    data["month"] = data["date"].dt.month
    data["day"] = data["date"].dt.day
    data["day_of_week"] = data["date"].dt.dayofweek
    data["week_of_year"] = data["date"].dt.isocalendar().week.astype(int)
    data["quarter"] = data["date"].dt.quarter
    data["is_weekend"] = (
        data["day_of_week"] >= 5
    ).astype(int)

    # Cyclic seasonal features
    data["month_sin"] = np.sin(
        2 * np.pi * data["month"] / 12
    )

    data["month_cos"] = np.cos(
        2 * np.pi * data["month"] / 12
    )

    data["dow_sin"] = np.sin(
        2 * np.pi * data["day_of_week"] / 7
    )

    data["dow_cos"] = np.cos(
        2 * np.pi * data["day_of_week"] / 7
    )

    # Relative time trend
    first_date = data["date"].min()

    data["days_since_start"] = (
        data["date"] - first_date
    ).dt.days

    return data


df = create_features(df)


# ============================================================
# FEATURES
# ============================================================

FEATURE_COLS = [
    "store",
    "item",
    "year",
    "month",
    "day",
    "day_of_week",
    "week_of_year",
    "quarter",
    "is_weekend",
    "month_sin",
    "month_cos",
    "dow_sin",
    "dow_cos",
    "days_since_start",
]

TARGET_COL = "sales"


# ============================================================
# TRAIN / TEST SPLIT
# ============================================================

# Use 2013-2016 for training
# Use 2017 for testing

train_df = df[df["year"] < 2017].copy()
test_df = df[df["year"] == 2017].copy()

print()
print("Training rows:", len(train_df))
print("Testing rows :", len(test_df))


X_train = train_df[FEATURE_COLS]
y_train = train_df[TARGET_COL]

X_test = test_df[FEATURE_COLS]
y_test = test_df[TARGET_COL]


# ============================================================
# LOAD EXISTING MODEL OR TRAIN NEW MODEL
# ============================================================

if MODEL_PATH.exists():

    print()
    print("Existing long-horizon model found.")
    print("Loading model...")

    model_payload = joblib.load(MODEL_PATH)

    model = model_payload["model"]

    print("Model loaded successfully.")

else:

    print()
    print("No existing long-horizon model found.")
    print("Training new model...")

    model = RandomForestRegressor(
        n_estimators=150,
        max_depth=18,
        min_samples_split=10,
        random_state=42,
        n_jobs=-1
    )

    model.fit(X_train, y_train)

    print("Training completed.")

    # Save model
    MODEL_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    model_payload = {
        "model": model,
        "feature_cols": FEATURE_COLS,
        "target_col": TARGET_COL,
        "training_date": str(pd.Timestamp.now()),
        "data_start": str(df["date"].min().date()),
        "data_end": str(df["date"].max().date()),
    }

    joblib.dump(
        model_payload,
        MODEL_PATH
    )

    print()
    print("Model saved to:")
    print(MODEL_PATH)


# ============================================================
# EVALUATION
# ============================================================

predictions = model.predict(X_test)

mae = mean_absolute_error(
    y_test,
    predictions
)

rmse = np.sqrt(
    mean_squared_error(
        y_test,
        predictions
    )
)

r2 = r2_score(
    y_test,
    predictions
)

print()
print("=" * 50)
print("LONG-HORIZON MODEL EVALUATION")
print("=" * 50)

print(f"MAE  : {mae:.4f}")
print(f"RMSE : {rmse:.4f}")
print(f"R²   : {r2:.4f}")



# ============================================================
# FUTURE DATE PREDICTION TEST
# ============================================================

def predict_future_date(store_id, item_id, target_date):
    target_date = pd.Timestamp(target_date)

    first_date = df["date"].min()

    row = pd.DataFrame([{
        "store": store_id,
        "item": item_id,
        "year": target_date.year,
        "month": target_date.month,
        "day": target_date.day,
        "day_of_week": target_date.dayofweek,
        "week_of_year": int(target_date.isocalendar().week),
        "quarter": target_date.quarter,
        "is_weekend": int(target_date.dayofweek >= 5),

        "month_sin": np.sin(
            2 * np.pi * target_date.month / 12
        ),
        "month_cos": np.cos(
            2 * np.pi * target_date.month / 12
        ),
        "dow_sin": np.sin(
            2 * np.pi * target_date.dayofweek / 7
        ),
        "dow_cos": np.cos(
            2 * np.pi * target_date.dayofweek / 7
        ),

        "days_since_start": (
            target_date - first_date
        ).days,
    }])

    prediction = model.predict(
        row[FEATURE_COLS]
    )[0]

    return max(0, int(round(prediction)))



def predict_future_days(store_id, item_id, start_date, days):
    """
    Predict demand for the next N days starting from start_date.
    """

    start_date = pd.Timestamp(start_date)

    if days < 1:
        raise ValueError("days must be at least 1")

    predictions = []
    forecast_dates = []

    for i in range(days):
        target_date = start_date + pd.Timedelta(days=i)

        prediction = predict_future_date(
            store_id=store_id,
            item_id=item_id,
            target_date=target_date
        )

        forecast_dates.append(
            target_date.strftime("%Y-%m-%d")
        )

        predictions.append(prediction)

    return {
        "store": store_id,
        "item": item_id,
        "forecast_dates": forecast_dates,
        "forecast": predictions,
        "total_demand": sum(predictions)
    }
    
    
    
    # ============================================================
# MULTI-DAY FORECAST TEST
# ============================================================

result = predict_future_days(
    store_id=1,
    item_id=10,
    start_date="2026-10-05",
    days=40
)

print()
print("=" * 50)
print("40-DAY FUTURE FORECAST TEST")
print("=" * 50)

print(f"Store       : {result['store']}")
print(f"Item        : {result['item']}")
print(f"Days        : {len(result['forecast'])}")
print(f"Total demand: {result['total_demand']}")

print()
print("First 5 predictions:")

for date, prediction in zip(
    result["forecast_dates"][:5],
    result["forecast"][:5]
):
    print(f"{date} -> {prediction} units")

print()
print("Last 5 predictions:")

for date, prediction in zip(
    result["forecast_dates"][-5:],
    result["forecast"][-5:]
):
    print(f"{date} -> {prediction} units")