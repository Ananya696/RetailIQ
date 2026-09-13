"""
RetailIQ Demand Forecasting, 7-Day Prediction & Restock Recommendation ML Module
Member 1 Core Package
"""

def __getattr__(name):
    if name in [
        "load_and_preprocess_data",
        "add_calendar_features",
        "add_lag_features",
        "add_rolling_features",
        "prepare_training_data",
        "FEATURE_COLS",
        "TARGET_COL"
    ]:
        from . import feature_engineering as fe
        return getattr(fe, name)
    elif name in ["predict_demand", "forecast_next_7_days", "forecast_multiple_items", "load_trained_forecaster"]:
        from . import forecast as fc
        return getattr(fc, name)
    elif name in ["calculate_restock", "batch_restock_recommendations"]:
        from . import restock as rs
        return getattr(rs, name)
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")

__all__ = [
    "load_and_preprocess_data",
    "add_calendar_features",
    "add_lag_features",
    "add_rolling_features",
    "prepare_training_data",
    "FEATURE_COLS",
    "TARGET_COL",
    "predict_demand",
    "forecast_next_7_days",
    "forecast_multiple_items",
    "load_trained_forecaster",
    "calculate_restock",
    "batch_restock_recommendations"
]
