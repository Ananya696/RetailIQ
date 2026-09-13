import os
import pickle
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, root_mean_squared_error

# ==============================================================================
# 1. LOAD DATASET
# ==============================================================================
# Locate dataset flexibly whether running from root or from within kaggle_data
data_path = "train copy.csv"
if not os.path.exists(data_path):
    if os.path.exists(os.path.join("kaggle_data", "train copy.csv")):
        data_path = os.path.join("kaggle_data", "train copy.csv")
    elif os.path.exists("train_copy.csv"):
        data_path = "train_copy.csv"
    elif os.path.exists(os.path.join("data", "train_copy.csv")):
        data_path = os.path.join("data", "train_copy.csv")

print(f"Loading dataset from: {data_path}")
df = pd.read_csv(data_path)

print("Shape:", df.shape)
print("\nColumns:", df.columns.tolist())
print("\nFirst 5 rows:")
print(df.head())
print("\nData types:")
print(df.dtypes)
print("\nMissing values:")
print(df.isnull().sum())


# ==============================================================================
# 2. DATE CONVERSION & PREPROCESSING
# ==============================================================================
# Right now, date is being read as: string/object.
# We convert the date from string to datetime because a string only represents
# the date as text, whereas datetime allows Pandas to understand it as an actual
# point in time. This makes it easy and reliable to extract features like year,
# month, day, and day of week, and also perform date arithmetic and time-based
# operations needed for forecasting.
df["date"] = pd.to_datetime(df["date"])

print("\nData types after date conversion:")
print(df.dtypes)


# ==============================================================================
# 3. SORTING DATA CHRONOLOGICALLY
# ==============================================================================
# Sort data chronologically for each store and item
# The chronological order must be maintained separately for each store-item combination
df = df.sort_values(["store", "item", "date"]).reset_index(drop=True)

print("\nFirst 5 rows after sorting:")
print(df.head())


# ==============================================================================
# 4. CALENDAR FEATURE ENGINEERING
# ==============================================================================
# Extract calendar features from date
df["year"] = df["date"].dt.year
df["month"] = df["date"].dt.month
df["day"] = df["date"].dt.day
df["day_of_week"] = df["date"].dt.dayofweek  # 0 = Monday ... 6 = Sunday
df["week_of_year"] = df["date"].dt.isocalendar().week.astype(int)
df["quarter"] = df["date"].dt.quarter

# Weekend indicator: 1 for Saturday (5) & Sunday (6), 0 otherwise
df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)

print("\nCalendar features sample:")
print(df[[
    "date",
    "year",
    "month",
    "day",
    "day_of_week",
    "week_of_year",
    "quarter",
    "is_weekend"
]].head(10))


# ==============================================================================
# 5. LAG FEATURES
# ==============================================================================
# Create lag features separately for each store + item combination:
# lag_1  → sales from 1 day ago (yesterday)
# lag_7  → sales from 7 days ago (same day last week)
# lag_14 → sales from 14 days ago (same day two weeks ago)
# lag_30 → sales from 30 days ago (~1 month ago)
df["lag_1"] = df.groupby(["store", "item"])["sales"].shift(1)
df["lag_7"] = df.groupby(["store", "item"])["sales"].shift(7)
df["lag_14"] = df.groupby(["store", "item"])["sales"].shift(14)
df["lag_30"] = df.groupby(["store", "item"])["sales"].shift(30)

print("\nLag features sample:")
print(df[[
    "date",
    "store",
    "item",
    "sales",
    "lag_1",
    "lag_7",
    "lag_14",
    "lag_30"
]].head(10))


# ==============================================================================
# 6. ROLLING FEATURES
# ==============================================================================
# Lag features tell us about specific past days, but one day might be an outlier.
# Rolling averages give the model the recent overall demand level.
#
# CRITICAL: We shift(1) first so today's sales are NOT included in today's
# rolling average. This prevents target data leakage.
df["rolling_mean_7"] = (
    df.groupby(["store", "item"])["sales"]
      .transform(lambda x: x.shift(1).rolling(window=7).mean())
)

df["rolling_mean_14"] = (
    df.groupby(["store", "item"])["sales"]
      .transform(lambda x: x.shift(1).rolling(window=14).mean())
)

df["rolling_mean_30"] = (
    df.groupby(["store", "item"])["sales"]
      .transform(lambda x: x.shift(1).rolling(window=30).mean())
)

print("\nRolling features sample:")
print(df[[
    "date",
    "store",
    "item",
    "sales",
    "lag_1",
    "rolling_mean_7",
    "rolling_mean_14",
    "rolling_mean_30"
]].head(10))


# ==============================================================================
# 7. HANDLE FEATURE NaNs (NO DATA LEAKAGE)
# ==============================================================================
# Why NaNs occur:
# The lag_30 and rolling_mean_30 features require at least 30 days of past sales.
# For each of the 500 store-item combinations, the first 30 days of records
# (Jan 1, 2013 to Jan 30, 2013) do not have 30 days of prior history.
#
# Handling strategy:
# We drop these initial incomplete rows (30 days * 500 combinations = 15,000 rows).
# We NEVER impute them using future sales to prevent lookahead data leakage.
print("\nShape before dropping NaNs:", df.shape)
df_clean = df.dropna().reset_index(drop=True)
print("Shape after dropping NaNs:", df_clean.shape)
print(f"Dropped {df.shape[0] - df_clean.shape[0]} rows (the first 30 days of historical burn-in for all 500 store-item pairs).")


# ==============================================================================
# 8. FEATURE SET & TARGET DEFINITION
# ==============================================================================
feature_cols = [
    "store",
    "item",
    "year",
    "month",
    "day",
    "day_of_week",
    "week_of_year",
    "quarter",
    "is_weekend",
    "lag_1",
    "lag_7",
    "lag_14",
    "lag_30",
    "rolling_mean_7",
    "rolling_mean_14",
    "rolling_mean_30"
]
target_col = "sales"

print(f"\nTotal Features ({len(feature_cols)}):", feature_cols)
print("Target Variable:", target_col)


# ==============================================================================
# 9. TIME-BASED (CHRONOLOGICAL) TRAIN / TEST SPLIT
# ==============================================================================
# In time-series forecasting, we NEVER use random train_test_split or shuffle data.
# The model must only learn from the past and be evaluated on future unseen periods.
#
# Split definition:
# TRAIN: 2013-01-31 to 2016-12-31 (4 years of history)
# TEST:  2017-01-01 to 2017-12-31 (Final 1 year holdout)
train_df = df_clean[df_clean["year"] < 2017].copy()
test_df = df_clean[df_clean["year"] == 2017].copy()

X_train, y_train = train_df[feature_cols], train_df[target_col]
X_test, y_test = test_df[feature_cols], test_df[target_col]

print(f"\nTrain Set: {train_df['date'].min().strftime('%Y-%m-%d')} to {train_df['date'].max().strftime('%Y-%m-%d')} ({len(train_df):,} rows)")
print(f"Test Set:  {test_df['date'].min().strftime('%Y-%m-%d')} to {test_df['date'].max().strftime('%Y-%m-%d')} ({len(test_df):,} rows)")


# ==============================================================================
# 10. BASELINE MODEL
# ==============================================================================
# A simple naive baseline: prediction = lag_7 (sales from the same weekday last week).
# This proves whether the machine learning model creates real value over a standard retail rule of thumb.
baseline_predictions = test_df["lag_7"]

baseline_mae = mean_absolute_error(y_test, baseline_predictions)
baseline_rmse = root_mean_squared_error(y_test, baseline_predictions)
# Calculate MAPE safely (avoid division by zero)
non_zero_mask = y_test != 0
baseline_mape = np.mean(np.abs((y_test[non_zero_mask] - baseline_predictions[non_zero_mask]) / y_test[non_zero_mask])) * 100

print("\n" + "=" * 50)
print("BASELINE MODEL EVALUATION (prediction = lag_7)")
print("=" * 50)
print(f"Baseline MAE:  {baseline_mae:.4f}")
print(f"Baseline RMSE: {baseline_rmse:.4f}")
print(f"Baseline MAPE: {baseline_mape:.2f}%")


# ==============================================================================
# 11. RANDOM FOREST MODEL TRAINING
# ==============================================================================
print("\n" + "=" * 50)
print("TRAINING RANDOM FOREST REGRESSOR...")
print("=" * 50)

rf_model = RandomForestRegressor(
    n_estimators=100,
    max_depth=16,
    min_samples_split=10,
    random_state=42,
    n_jobs=-1
)

rf_model.fit(X_train, y_train)
print("Random Forest model training completed successfully.")


# ==============================================================================
# 12. MODEL EVALUATION & COMPARISON
# ==============================================================================
rf_predictions = rf_model.predict(X_test)

rf_mae = mean_absolute_error(y_test, rf_predictions)
rf_rmse = root_mean_squared_error(y_test, rf_predictions)
rf_mape = np.mean(np.abs((y_test[non_zero_mask] - rf_predictions[non_zero_mask]) / y_test[non_zero_mask])) * 100

mae_improvement = ((baseline_mae - rf_mae) / baseline_mae) * 100
rmse_improvement = ((baseline_rmse - rf_rmse) / baseline_rmse) * 100
mape_improvement = ((baseline_mape - rf_mape) / baseline_mape) * 100

print("\n" + "=" * 60)
print(f"{'METRIC':<15} | {'BASELINE (lag_7)':<18} | {'RANDOM FOREST':<15} | {'IMPROVEMENT':<12}")
print("-" * 60)
print(f"{'MAE':<15} | {baseline_mae:<18.4f} | {rf_mae:<15.4f} | {mae_improvement:>+10.2f}%")
print(f"{'RMSE':<15} | {baseline_rmse:<18.4f} | {rf_rmse:<15.4f} | {rmse_improvement:>+10.2f}%")
print(f"{'MAPE':<15} | {f'{baseline_mape:.2f}%':<18} | {f'{rf_mape:.2f}%':<15} | {mape_improvement:>+10.2f}%")
print("=" * 60)


# ==============================================================================
# 13. SAVE TRAINED MODEL & METADATA
# ==============================================================================
# Determine models directory path
models_dir = "models"
if not os.path.exists(models_dir):
    # If run from inside kaggle_data/, go up one level or create locally
    if os.path.exists(os.path.join("..", "models")):
        models_dir = os.path.join("..", "models")
    else:
        os.makedirs(models_dir, exist_ok=True)

model_file_path = os.path.join(models_dir, "sales_forecasting_model.pkl")

# Save model along with feature metadata for exact inference consistency
model_payload = {
    "model": rf_model,
    "feature_cols": feature_cols,
    "target_col": target_col,
    "training_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    "metrics": {
        "rf_mae": rf_mae,
        "rf_rmse": rf_rmse,
        "rf_mape": rf_mape,
        "baseline_mae": baseline_mae,
        "baseline_rmse": baseline_rmse
    }
}

with open(model_file_path, "wb") as f:
    pickle.dump(model_payload, f)

print(f"\nModel and metadata saved to: {model_file_path}")


# ==============================================================================
# 14. 7-DAY RECURSIVE MULTI-DAY FORECASTING MODULE
# ==============================================================================
def forecast_next_7_days(store_id, item_id, history_df, model=None, feature_names=None):
    """
    Recursively forecasts demand for the next 7 consecutive days for a given store and item.
    
    Why recursive forecasting is essential:
    The model relies on lag features (e.g., lag_1 = yesterday's sales).
    When predicting Day 2, Day 1's actual sales are unknown (in the future).
    Therefore, Day 1's *predicted* demand becomes the lag_1 feature for Day 2,
    and rolling averages are updated accordingly.
    
    Parameters:
        store_id (int): ID of the store (1-10)
        item_id (int): ID of the item/product (1-50)
        history_df (pd.DataFrame): Historical data containing store, item, date, and sales.
        model: Trained regression model (defaults to rf_model)
        feature_names: List of model feature names (defaults to feature_cols)
        
    Returns:
        dict: 7-day forecasted demand breakdown and total demand.
    """
    if model is None:
        model = rf_model
    if feature_names is None:
        feature_names = feature_cols
        
    # Filter for the specific store and item and sort chronologically
    df_si = history_df[(history_df["store"] == store_id) & (history_df["item"] == item_id)].sort_values("date").copy()
    
    if len(df_si) < 30:
        raise ValueError(f"Need at least 30 days of history for store {store_id}, item {item_id}. Got {len(df_si)}.")
        
    recent_dates = list(pd.to_datetime(df_si["date"].values))
    recent_sales = list(df_si["sales"].values)
    last_date = recent_dates[-1]
    
    forecast_dates = []
    daily_predictions = []
    
    for day_step in range(1, 8):
        target_date = last_date + timedelta(days=day_step)
        forecast_dates.append(target_date.strftime("%Y-%m-%d"))
        
        # Calendar features for target date
        cal_year = target_date.year
        cal_month = target_date.month
        cal_day = target_date.day
        cal_day_of_week = target_date.dayofweek
        cal_week_of_year = int(target_date.isocalendar()[1])
        cal_quarter = target_date.quarter
        cal_is_weekend = 1 if cal_day_of_week >= 5 else 0
        
        # Lag features from recent sales history (which expands with each recursive prediction)
        lag_1 = recent_sales[-1]
        lag_7 = recent_sales[-7]
        lag_14 = recent_sales[-14]
        lag_30 = recent_sales[-30]
        
        # Rolling features from recent history
        rolling_7 = float(np.mean(recent_sales[-7:]))
        rolling_14 = float(np.mean(recent_sales[-14:]))
        rolling_30 = float(np.mean(recent_sales[-30:]))
        
        # Construct feature vector
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
        
        X_step = pd.DataFrame([step_features])[feature_names]
        predicted_sales = float(model.predict(X_step)[0])
        
        # Guard against negative predictions
        predicted_sales = max(0.0, predicted_sales)
        
        daily_pred_int = int(round(predicted_sales))
        daily_predictions.append(daily_pred_int)
        
        # Append prediction to history buffer for subsequent recursive steps
        recent_sales.append(predicted_sales)
        recent_dates.append(target_date)
        
    total_predicted_demand = int(sum(daily_predictions))
    
    return {
        "store": store_id,
        "item": item_id,
        "forecast_dates": forecast_dates,
        "forecast": daily_predictions,
        "total_demand": total_predicted_demand
    }


# ==============================================================================
# 15. INVENTORY RESTOCK RECOMMENDATION MODULE
# ==============================================================================
def calculate_restock(predicted_demand, current_stock, product_id=None):
    """
    Calculates inventory restock recommendation based on predicted 7-day demand.
    
    Formula:
        recommended_restock = max(0, total_predicted_demand - current_stock)
        
    Parameters:
        predicted_demand (int | float): Total predicted demand for next 7 days.
        current_stock (int | float): Current on-hand inventory count.
        product_id (int, optional): ID of the product/item.
        
    Returns:
        dict: Recommendation payload containing stock, demand, and recommended restock.
    """
    recommended_restock = max(0, int(round(predicted_demand - current_stock)))
    
    result = {
        "predictedDemand": int(round(predicted_demand)),
        "currentStock": int(current_stock),
        "recommendedRestock": recommended_restock
    }
    
    if product_id is not None:
        result["productId"] = product_id
        
    return result


# ==============================================================================
# 16. DEMONSTRATION OF 7-DAY FORECASTING & RESTOCK RECOMMENDATION
# ==============================================================================
if __name__ == "__main__":
    print("\n" + "=" * 50)
    print("DEMO: 7-DAY DEMAND FORECAST & RESTOCK CALCULATION")
    print("=" * 50)
    
    sample_store = 1
    sample_item = 10
    sample_stock = 120
    
    # Generate 7-day forecast
    forecast_result = forecast_next_7_days(
        store_id=sample_store,
        item_id=sample_item,
        history_df=df_clean
    )
    
    print(f"\nForecast for Store {sample_store}, Item {sample_item}:")
    print("Forecast Dates:", forecast_result["forecast_dates"])
    print("Daily Forecast (units):", forecast_result["forecast"])
    print("Total 7-Day Predicted Demand:", forecast_result["total_demand"], "units")
    
    # Calculate restock recommendation
    restock_result = calculate_restock(
        predicted_demand=forecast_result["total_demand"],
        current_stock=sample_stock,
        product_id=sample_item
    )
    
    print("\nRestock Recommendation Output:")
    print(restock_result)
    print("=" * 50)