"""
7-Day Multi-Step Recursive Forecasting Engine for RetailIQ
Predicts consecutive 7-day demand by iteratively feeding prior predicted values
into future lag and rolling feature calculations.
"""

import os
import sys
import pickle
from datetime import timedelta
import pandas as pd
import numpy as np

if __package__:
    from .feature_engineering import FEATURE_COLS, load_and_preprocess_data
else:
    parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    if parent_dir not in sys.path:
        sys.path.insert(0, parent_dir)
    try:
        from src.feature_engineering import FEATURE_COLS, load_and_preprocess_data
    except ImportError:
        from feature_engineering import FEATURE_COLS, load_and_preprocess_data




import joblib


def load_trained_forecaster(model_path: str = None):
    """
    Loads the trained model and feature metadata from disk (supports joblib and pickle).
    """
    if model_path is None:
        candidates = [
            "forecast_model.pkl",
            "models/forecast_model.pkl",
            os.path.join("models", "forecast_model.pkl"),
            os.path.join("models", "sales_forecasting_model.pkl"),
            os.path.join("..", "models", "forecast_model.pkl"),
            os.path.join("..", "forecast_model.pkl"),
        ]
        for c in candidates:
            if os.path.exists(c):
                model_path = c
                break

    if not model_path or not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found at {model_path}. Train the model first.")

    try:
        payload = joblib.load(model_path)
    except Exception:
        with open(model_path, "rb") as f:
            payload = pickle.load(f)

    if isinstance(payload, dict) and "model" in payload:
        return payload["model"], payload.get("feature_cols", FEATURE_COLS)
    return payload, FEATURE_COLS



def predict_demand(
    store_id: int,
    item_id: int,
    days_ahead: int = 7,
    history_df: pd.DataFrame = None,
    model=None,
    feature_cols: list = None,
    model_path: str = None
) -> dict:
    """
    Generates a recursive multi-step sales forecast for a given store and item.

    Parameters:
        store_id (int): Store identifier (1-10)
        item_id (int): Product/item identifier (1-50)
        days_ahead (int): Number of future days to forecast (default: 7)
        history_df (pd.DataFrame): Historical dataset with at least 30 days of data.
        model: Trained scikit-learn model. If None, loaded from model_path.
        feature_cols: Ordered list of feature names.
        model_path: Optional explicit path to serialized model.

    Returns:
        dict:
            {
                "store": store_id,
                "item": item_id,
                "days_ahead": days_ahead,
                "forecast_dates": [...],
                "forecast": [d1, d2, ...],
                "total_demand": sum(d1..dN)
            }
    """
    # Load model if not provided
    if model is None or feature_cols is None:
        loaded_model, loaded_features = load_trained_forecaster(model_path)
        model = model or loaded_model
        feature_cols = feature_cols or loaded_features

    # Load history data if not provided
    if history_df is None:
        history_df = load_and_preprocess_data()

    # Filter for the target store and item
    df_si = history_df[(history_df["store"] == store_id) & (history_df["item"] == item_id)].sort_values("date").copy()

    if len(df_si) < 30:
        raise ValueError(
            f"Need at least 30 historical records for store {store_id}, item {item_id}. Got {len(df_si)}."
        )

    recent_dates = list(pd.to_datetime(df_si["date"].values))
    recent_sales = [float(x) for x in df_si["sales"].values]
    last_date = recent_dates[-1]

    daily_predictions = []
    forecast_dates = []

    for day_step in range(1, days_ahead + 1):
        target_date = last_date + timedelta(days=day_step)
        forecast_dates.append(target_date.strftime("%Y-%m-%d"))

        # Calendar features
        cal_year = target_date.year
        cal_month = target_date.month
        cal_day = target_date.day
        cal_day_of_week = target_date.dayofweek
        cal_week_of_year = int(target_date.isocalendar()[1])
        cal_quarter = target_date.quarter
        cal_is_weekend = 1 if cal_day_of_week >= 5 else 0

        # Dynamic Lag features from the extended history buffer
        lag_1 = recent_sales[-1]
        lag_7 = recent_sales[-7]
        lag_14 = recent_sales[-14]
        lag_30 = recent_sales[-30]

        # Dynamic Rolling features
        rolling_7 = float(np.mean(recent_sales[-7:]))
        rolling_14 = float(np.mean(recent_sales[-14:]))
        rolling_30 = float(np.mean(recent_sales[-30:]))

        step_features = {
            "store": store_id,
            "item": item_id,
            "year": cal_year,
            "month": cal_month,
            "day": cal_day,
            "day_of_week": cal_day_of_week,
            "week_of_year": cal_week_of_year,
            "quarter": cal_quarter,
            "is_weekend": cal_is_weekend,
            "lag_1": lag_1,
            "lag_7": lag_7,
            "lag_14": lag_14,
            "lag_30": lag_30,
            "rolling_mean_7": rolling_7,
            "rolling_mean_14": rolling_14,
            "rolling_mean_30": rolling_30
        }

        # Filter only features expected by the trained model
        step_row = {k: v for k, v in step_features.items() if k in feature_cols}
        X_step = pd.DataFrame([step_row])[feature_cols]
        pred_val = float(model.predict(X_step)[0])
        pred_val = max(0.0, pred_val)

        daily_pred_int = int(round(pred_val))
        daily_predictions.append(daily_pred_int)

        # Append to buffer for subsequent steps
        recent_sales.append(pred_val)
        recent_dates.append(target_date)

    total_demand = int(sum(daily_predictions))

    return {
        "store": store_id,
        "item": item_id,
        "days_ahead": days_ahead,
        "forecast_dates": forecast_dates,
        "forecast": daily_predictions,
        "total_demand": total_demand
    }


def forecast_next_7_days(
    store_id: int,
    item_id: int,
    history_df: pd.DataFrame = None,
    model=None,
    feature_cols: list = None,
    model_path: str = None
) -> dict:
    """Convenience alias for 7-day demand forecasting."""
    return predict_demand(
        store_id=store_id,
        item_id=item_id,
        days_ahead=7,
        history_df=history_df,
        model=model,
        feature_cols=feature_cols,
        model_path=model_path
    )



def forecast_multiple_items(
    store_id: int,
    item_ids: list,
    history_df: pd.DataFrame = None,
    model=None,
    feature_cols: list = None
) -> list:
    """
    Generates 7-day forecasts for multiple products at a specific store.
    """
    if model is None or feature_cols is None:
        loaded_model, loaded_features = load_trained_forecaster()
        model = model or loaded_model
        feature_cols = feature_cols or loaded_features

    if history_df is None:
        history_df = load_and_preprocess_data()

    results = []
    for item_id in item_ids:
        try:
            res = forecast_next_7_days(
                store_id=store_id,
                item_id=item_id,
                history_df=history_df,
                model=model,
                feature_cols=feature_cols
            )
            results.append(res)
        except Exception as e:
            print(f"Error forecasting for Store {store_id}, Item {item_id}: {e}")
    return results


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="RetailIQ Multi-Horizon Demand Forecasting")
    parser.add_argument("--store", type=int, default=1, help="Store ID (1-10, default: 1)")
    parser.add_argument("--item", type=int, default=10, help="Item / Product ID (1-50, default: 10)")
    parser.add_argument("--days", type=int, default=7, help="Number of days to forecast ahead (e.g., 3, 7, 10, 15, 30. Default: 7)")
    parser.add_argument("--all-items", action="store_true", help="Forecast for all 50 items at the given store")
    args = parser.parse_args()

    if args.all_items:
        print(f"\nGenerating {args.days}-day forecasts for ALL 50 items at Store {args.store}...")
        all_forecasts = [
            predict_demand(store_id=args.store, item_id=item_id, days_ahead=args.days)
            for item_id in range(1, 51)
        ]
        print(f"Successfully generated forecasts for {len(all_forecasts)} items.")
        print("\nFirst 3 items summary:")
        for fc in all_forecasts[:3]:
            print(f"  Item {fc['item']:2d} | {args.days}-day predicted demand: {fc['total_demand']:4d} units | Daily: {fc['forecast']}")
    else:
        print(f"\nExecuting {args.days}-day forecast for Store {args.store}, Item/Product {args.item}...")
        res = predict_demand(store_id=args.store, item_id=args.item, days_ahead=args.days)
        print("\nForecast Result:")
        print(f"Store ID:               {res['store']}")
        print(f"Item / Product ID:      {res['item']}")
        print(f"Forecast Horizon:       {res['days_ahead']} days")
        print(f"Forecast Dates:         {res['forecast_dates']}")
        print(f"Daily Demand (units):   {res['forecast']}")
        print(f"Total Predicted Demand: {res['total_demand']} units")

