"""

RetailIQ - Unified ML Pipeline

--------------------------------

Features:

1. Sales prediction model training

2. Multi-day recursive demand forecasting

3. Restock recommendations

4. Batch forecasting for multiple store-item combinations

5. Model evaluation and serialization



Dataset expected columns:

    date, store, item, sales



Model:

    RandomForestRegressor

"""



import os

import argparse

import joblib

import numpy as np

import pandas as pd



from datetime import datetime

from sklearn.ensemble import RandomForestRegressor

from sklearn.metrics import (

    mean_absolute_error,

    mean_squared_error,

    r2_score

)





# ============================================================

# CONFIGURATION

# ============================================================



from pathlib import Path







BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models"
MODEL_PATH = MODEL_DIR / "forecast_model_v2.pkl"

# Cache historical data for the lifetime of the running process.
# This avoids repeatedly reading and sorting train.csv for forecast/API requests.
_HISTORY_CACHE = None



TARGET_COL = "sales"



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

    "lag_1",

    "lag_7",

    "lag_14",

    "lag_30",

    "rolling_mean_7",

    "rolling_mean_14",

    "rolling_mean_30"

]





# ============================================================

# 1. DATA LOADING

# ============================================================



def resolve_data_path():

    """

    Resolve the training dataset relative to this Python file,

    so the script works regardless of the current working directory.

    """

    base_dir = Path(__file__).resolve().parent



    candidates = [

        base_dir / "kaggle_data" / "train.csv",

        base_dir / "data" / "train.csv",

        base_dir / "train.csv",

    ]



    for path in candidates:

        if path.exists():

            return path



    raise FileNotFoundError(

        "Training dataset not found. Expected train.csv in "

        "kaggle_data/, data/, or the project root."

    )



def load_data():

    """

    Load and prepare raw sales data.

    """



    path = resolve_data_path()



    print(f"Loading dataset: {path}")



    df = pd.read_csv(path)



    required_columns = {

        "date",

        "store",

        "item",

        "sales"

    }



    missing = required_columns - set(df.columns)



    if missing:

        raise ValueError(

            f"Missing required columns: {missing}"

        )



    df["date"] = pd.to_datetime(df["date"])



    df = df.sort_values(

        ["store", "item", "date"]

    ).reset_index(drop=True)



    return df





def get_historical_data():
    """
    Load and cache the historical sales dataset.

    Repeated forecast/API requests in the same process reuse this dataframe
    instead of repeatedly reading and sorting train.csv.
    """
    global _HISTORY_CACHE

    if _HISTORY_CACHE is None:
        _HISTORY_CACHE = load_data()

    return _HISTORY_CACHE


def get_store_item_history(store_id, item_id):
    """Return historical sales for one store-item combination."""
    history = get_historical_data()

    item_history = history[
        (history["store"] == store_id) &
        (history["item"] == item_id)
    ].copy()

    if len(item_history) < 30:
        raise ValueError(
            f"Not enough history for Store {store_id}, Item {item_id}. "
            "At least 30 records are required."
        )

    return item_history.reset_index(drop=True)


# ============================================================

# 2. FEATURE ENGINEERING

# ============================================================



def add_calendar_features(df):

    """

    Add calendar-based features.

    """



    df = df.copy()



    df["year"] = df["date"].dt.year

    df["month"] = df["date"].dt.month

    df["day"] = df["date"].dt.day

    df["day_of_week"] = df["date"].dt.dayofweek

    df["week_of_year"] = df["date"].dt.isocalendar().week.astype(int)

    df["quarter"] = df["date"].dt.quarter



    df["is_weekend"] = (

        df["day_of_week"] >= 5

    ).astype(int)



    return df





def add_lag_features(df):

    """

    Add historical sales lag features.



    Lag values are calculated separately for each

    store-item combination.

    """



    df = df.copy()



    grouped_sales = df.groupby(

        ["store", "item"]

    )[TARGET_COL]



    df["lag_1"] = grouped_sales.shift(1)

    df["lag_7"] = grouped_sales.shift(7)

    df["lag_14"] = grouped_sales.shift(14)

    df["lag_30"] = grouped_sales.shift(30)



    return df





def add_rolling_features(df):

    """

    Add rolling historical sales features.



    shift(1) is used so that the current day's

    sales are NOT included in its own features.

    """



    df = df.copy()



    grouped = df.groupby(

        ["store", "item"]

    )[TARGET_COL]



    shifted = grouped.shift(1)



    df["rolling_mean_7"] = (

        shifted

        .groupby(

            [df["store"], df["item"]]

        )

        .rolling(7)

        .mean()

        .reset_index(level=[0, 1], drop=True)

    )



    df["rolling_mean_14"] = (

        shifted

        .groupby(

            [df["store"], df["item"]]

        )

        .rolling(14)

        .mean()

        .reset_index(level=[0, 1], drop=True)

    )



    df["rolling_mean_30"] = (

        shifted

        .groupby(

            [df["store"], df["item"]]

        )

        .rolling(30)

        .mean()

        .reset_index(level=[0, 1], drop=True)

    )



    return df





def prepare_features(df):

    """

    Complete feature-engineering pipeline.

    """



    df = df.copy()



    df = add_calendar_features(df)

    df = add_lag_features(df)

    df = add_rolling_features(df)



    return df





# ============================================================

# 3. SALES PREDICTION MODEL TRAINING

# ============================================================



def train_model(df):

    """

    Train Random Forest sales prediction model.



    Chronological split:

        Training -> before 2017

        Testing  -> 2017

    """



    print("\nPreparing training features...")



    df_features = prepare_features(df)



    # Remove rows where lag/rolling features are unavailable

    df_features = df_features.dropna(

        subset=FEATURE_COLS + [TARGET_COL]

    ).copy()



    print(

        f"Usable training rows: "

        f"{len(df_features):,}"

    )



    # --------------------------------------------------------

    # Chronological train/test split

    # --------------------------------------------------------



    train_df = df_features[

        df_features["year"] < 2017

    ]



    test_df = df_features[

        df_features["year"] == 2017

    ]



    if train_df.empty or test_df.empty:

        raise ValueError(

            "Training or test set is empty."

        )



    X_train = train_df[FEATURE_COLS]

    y_train = train_df[TARGET_COL]



    X_test = test_df[FEATURE_COLS]

    y_test = test_df[TARGET_COL]



    print(

        f"Training rows: {len(train_df):,}"

    )



    print(

        f"Testing rows: {len(test_df):,}"

    )



    # --------------------------------------------------------

    # Baseline: previous week's sales

    # --------------------------------------------------------



    baseline_predictions = test_df["lag_7"]



    baseline_mae = mean_absolute_error(

        y_test,

        baseline_predictions

    )



    baseline_rmse = np.sqrt(

        mean_squared_error(

            y_test,

            baseline_predictions

        )

    )



    baseline_r2 = r2_score(

        y_test,

        baseline_predictions

    )



    print("\nBaseline (lag_7)")

    print(

        f"MAE  : {baseline_mae:.4f}"

    )

    print(

        f"RMSE : {baseline_rmse:.4f}"

    )

    print(

        f"R²   : {baseline_r2:.4f}"

    )



    # --------------------------------------------------------

    # Random Forest

    # --------------------------------------------------------



    print("\nTraining Random Forest...")



    model = RandomForestRegressor(

        n_estimators=100,

        max_depth=16,

        min_samples_split=10,

        random_state=42,

        n_jobs=-1

    )



    model.fit(

        X_train,

        y_train

    )



    # --------------------------------------------------------

    # Evaluation

    # --------------------------------------------------------



    predictions = model.predict(X_test)



    predictions = np.maximum(

        predictions,

        0

    )



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



    print("\nRandom Forest Results")

    print(

        f"MAE  : {mae:.4f}"

    )

    print(

        f"RMSE : {rmse:.4f}"

    )

    print(

        f"R²   : {r2:.4f}"

    )



    metrics = {

        "test_mae": float(mae),

        "test_rmse": float(rmse),

        "test_r2": float(r2),

        "baseline_mae": float(baseline_mae),

        "baseline_rmse": float(baseline_rmse),

        "baseline_r2": float(baseline_r2)

    }



    return model, metrics





# ============================================================

# 4. FINAL MODEL TRAINING

# ============================================================



def train_final_model(df):

    """

    Train the final production model using the

    complete available dataset.

    """



    df_features = prepare_features(df)



    df_features = df_features.dropna(

        subset=FEATURE_COLS + [TARGET_COL]

    ).copy()



    X = df_features[FEATURE_COLS]

    y = df_features[TARGET_COL]



    print(

        f"\nTraining final model on "

        f"{len(df_features):,} rows..."

    )



    model = RandomForestRegressor(

        n_estimators=100,

        max_depth=16,

        min_samples_split=10,

        random_state=42,

        n_jobs=-1

    )



    model.fit(X, y)



    return model





# ============================================================

# 5. SAVE MODEL

# ============================================================



def save_model(

    model,

    metrics=None

):

    """

    Save trained model together with metadata.

    """



    os.makedirs(

        MODEL_DIR,

        exist_ok=True

    )



    payload = {

        "model": model,

        "feature_cols": FEATURE_COLS,

        "target_col": TARGET_COL,

        "training_date": datetime.now().isoformat(),

        "metrics": metrics or {}

    }



    joblib.dump(

        payload,

        MODEL_PATH

    )



    print(

        f"\nModel saved to: {MODEL_PATH}"

    )





# ============================================================

# 6. LOAD MODEL

# ============================================================



def load_model(

    model_path=MODEL_PATH

):

    """

    Load trained model and feature configuration.

    """



    if not Path(model_path).exists():

        raise FileNotFoundError(

            f"Model not found: {model_path}\n"

            "Run training first."

        )



    payload = joblib.load(

        model_path

    )



    if isinstance(payload, dict):

        model = payload["model"]



        feature_cols = payload.get(

            "feature_cols",

            FEATURE_COLS

        )



        return model, feature_cols



    return payload, FEATURE_COLS





# ============================================================

# 7. FORECASTING HELPER

# ============================================================



def get_feature_row(

    store_id,

    item_id,

    date,

    history

):

    """

    Construct one feature row for future prediction.

    """



    store_history = history[

        (history["store"] == store_id) &

        (history["item"] == item_id)

    ].sort_values("date")



    if len(store_history) < 30:

        raise ValueError(

            f"At least 30 historical records are "

            f"required for Store {store_id}, "

            f"Item {item_id}."

        )



    sales_values = (

        store_history["sales"]

        .astype(float)

        .tolist()

    )



    def get_lag(days):

        if len(sales_values) < days:

            return np.nan



        return sales_values[-days]



    def get_rolling(window):

        if len(sales_values) < window:

            return np.nan



        return float(

            np.mean(

                sales_values[-window:]

            )

        )



    row = {

        "store": store_id,

        "item": item_id,



        "year": date.year,

        "month": date.month,

        "day": date.day,

        "day_of_week": date.weekday(),

        "week_of_year": date.isocalendar().week,

        "quarter": ((date.month - 1) // 3) + 1,

        "is_weekend": int(

            date.weekday() >= 5

        ),



        "lag_1": get_lag(1),

        "lag_7": get_lag(7),

        "lag_14": get_lag(14),

        "lag_30": get_lag(30),



        "rolling_mean_7":

            get_rolling(7),



        "rolling_mean_14":

            get_rolling(14),



        "rolling_mean_30":

            get_rolling(30)

    }



    return row





# ============================================================

# 8. DEMAND FORECASTING

# ============================================================



def forecast_next_days(

    store_id,

    item_id,

    history_df,

    forecast_days=7,

    model=None,

    feature_cols=None

):

    """

    Recursively forecast future demand.



    Predictions from previous future days are

    added to history and used for subsequent

    predictions.

    """



    if forecast_days < 1:

        raise ValueError(

            "forecast_days must be >= 1."

        )



    if forecast_days > 30:

        raise ValueError(

            "Maximum supported forecast horizon is 30 days."

        )



    # Keep only the required store-item history

    history = history_df[

        (history_df["store"] == store_id) &

        (history_df["item"] == item_id)

    ].copy()



    history["date"] = pd.to_datetime(

        history["date"]

    )



    history = history.sort_values(

        "date"

    ).reset_index(drop=True)



    if model is None:

        model, feature_cols = load_model()



    if feature_cols is None:

        feature_cols = FEATURE_COLS



    item_history = history



    if len(item_history) < 30:

        raise ValueError(

            f"Not enough history for "

            f"Store {store_id}, Item {item_id}."

        )



    last_date = item_history["date"].max()



    forecasts = []

    forecast_dates = []



    # Recursive forecasting

    for step in range(1, forecast_days + 1):



        future_date = (

            last_date +

            pd.Timedelta(days=step)

        )



        feature_row = get_feature_row(

            store_id,

            item_id,

            future_date,

            history

        )



        X_future = pd.DataFrame(

            [feature_row]

        )



        X_future = X_future[

            feature_cols

        ]



        prediction = model.predict(

            X_future

        )[0]



        prediction = max(

            0,

            float(prediction)

        )



        forecasts.append(

            int(round(prediction))

        )



        forecast_dates.append(

            future_date.strftime("%Y-%m-%d")

        )



        history = pd.concat(

            [

                history,

                pd.DataFrame(

                    [{

                        "date": future_date,

                        "store": store_id,

                        "item": item_id,

                        "sales": prediction

                    }]

                )

            ],

            ignore_index=True

        )



    return {

        "store": store_id,

        "item": item_id,

        "forecast_dates": forecast_dates,

        "forecast": forecasts,

        "total_demand": int(sum(forecasts))

    }



def forecast_next_7_days(

    store_id,

    item_id,

    history_df,

    model=None,

    feature_cols=None

):

    """

    Convenience function for a 7-day forecast.

    """



    return forecast_next_days(

        store_id=store_id,

        item_id=item_id,

        history_df=history_df,

        forecast_days=7,

        model=model,

        feature_cols=feature_cols

    )





# ============================================================

# 9. MULTIPLE STORE-ITEM FORECASTING

# ============================================================



def forecast_multiple_items(

    items,

    history_df,

    forecast_days=7,

    model=None,

    feature_cols=None

):

    """

    Forecast multiple store-item combinations.



    items format:

        [

            (store_id, item_id),

            (store_id, item_id),

            ...

        ]

    """



    if model is None:

        model, feature_cols = load_model()



    results = []



    for store_id, item_id in items:



        try:

            result = forecast_next_days(

                store_id=store_id,

                item_id=item_id,

                history_df=history_df,

                forecast_days=forecast_days,

                model=model,

                feature_cols=feature_cols

            )



            results.append(result)



        except ValueError as e:



            print(

                f"Skipping Store {store_id}, "

                f"Item {item_id}: {e}"

            )



    return results





def forecast_all_items(

    history_df,

    forecast_days=7,

    model=None,

    feature_cols=None

):

    """

    Forecast every store-item combination

    available in the dataset.

    """



    if model is None:

        model, feature_cols = load_model()



    combinations = (

        history_df[

            ["store", "item"]

        ]

        .drop_duplicates()

        .itertuples(

            index=False,

            name=None

        )

    )



    return forecast_multiple_items(

        items=list(combinations),

        history_df=history_df,

        forecast_days=forecast_days,

        model=model,

        feature_cols=feature_cols

    )





# ============================================================

# 10. RESTOCK RECOMMENDATION

# ============================================================



def calculate_restock(
    predicted_demand,
    current_stock,
    product_id=None,
    store_id=None,
    safety_stock=None
):
    """
    Calculate recommended restock quantity.

    If safety_stock is not provided, use 20% of predicted demand.

    Formula:
        safety stock = 20% of predicted demand

        recommended restock =
        max(
            0,
            predicted demand
            + safety stock
            - current stock
        )
    """

    predicted_demand = max(
        0,
        int(round(predicted_demand))
    )

    current_stock = max(
        0,
        int(round(current_stock))
    )

    # Automatically calculate safety stock
    if safety_stock is None:
        safety_stock = int(round(predicted_demand * 0.20))

    safety_stock = max(
        0,
        int(round(safety_stock))
    )

    recommended = max(
        0,
        predicted_demand
        + safety_stock
        - current_stock
    )

    result = {
        "predictedDemand": predicted_demand,
        "currentStock": current_stock,
        "safetyStock": safety_stock,
        "recommendedRestock": recommended
    }

    if product_id is not None:
        result["productId"] = product_id

    if store_id is not None:
        result["storeId"] = store_id

    return result



# ============================================================

# 11. BATCH RESTOCK RECOMMENDATIONS

# ============================================================



def batch_restock_recommendations(

    forecast_results,

    current_inventory_map,

    safety_stock_ratio=0.0

):

    """

    Generate restock recommendations for multiple

    store-item combinations.



    forecast_results format:



        [

            {

                "item": 1,

                "store": 1,

                "total_demand": 100

            }

        ]



    current_inventory_map:



        {

            1: 80,

            2: 70

        }



    For store-specific inventory, use:



        {

            (store_id, item_id): stock

        }

    """



    recommendations = []



    for result in forecast_results:



        item_id = result["item"]

        store_id = result["store"]



        predicted_demand = result[

            "total_demand"

        ]



        # ----------------------------------------------------

        # Support both:

        # {item_id: stock}

        #

        # and:

        # {(store_id, item_id): stock}

        # ----------------------------------------------------



        if (

            store_id,

            item_id

        ) in current_inventory_map:



            current_stock = current_inventory_map[

                (store_id, item_id)

            ]



        else:



            current_stock = current_inventory_map.get(

                item_id,

                0

            )



        safety_stock = int(

            round(

                predicted_demand

                * safety_stock_ratio

            )

        )



        recommendation = calculate_restock(

            predicted_demand=predicted_demand,

            current_stock=current_stock,

            safety_stock=safety_stock,

            product_id=item_id,

            store_id=store_id

        )



        recommendations.append(

            recommendation

        )



    return recommendations





# ============================================================

# 12. GENERATE RESTOCK CSV

# ============================================================



def generate_restock_csv(

    forecast_results,

    inventory_map,

    output_path="restock_recommendations.csv",

    safety_stock_ratio=0.0

):

    """

    Generate a CSV containing restock recommendations.

    """



    recommendations = batch_restock_recommendations(

        forecast_results=forecast_results,

        current_inventory_map=inventory_map,

        safety_stock_ratio=safety_stock_ratio

    )



    rows = []



    for rec in recommendations:



        rows.append({

            "store": rec.get("storeId"),

            "item": rec.get("productId"),

            "predicted_demand_7d":

                rec["predictedDemand"],

            "current_stock":

                rec["currentStock"],

            "safety_stock":

                rec["safetyStock"],

            "recommended_restock_qty":

                rec["recommendedRestock"]

        })



    df = pd.DataFrame(rows)



    df.to_csv(

        output_path,

        index=False

    )



    print(

        f"Restock recommendations saved to: "

        f"{output_path}"

    )



    return df





# ============================================================

# 13. COMPLETE TRAINING PIPELINE

# ============================================================



def run_training_pipeline():

    """

    Complete training workflow:



        Load data

            ↓

        Feature engineering

            ↓

        Train/test evaluation

            ↓

        Final model training

            ↓

        Save model

    """



    print("=" * 70)

    print("RETAILIQ ML TRAINING PIPELINE")

    print("=" * 70)



    df = load_data()



    # Evaluate model

    _, metrics = train_model(df)



    # Train final production model

    final_model = train_final_model(df)



    # Save final model

    save_model(

        final_model,

        metrics

    )



    print("\nTraining completed successfully.")



    return final_model, metrics





# ============================================================

# 14. COMMAND LINE INTERFACE

# ============================================================



def health_check():
    """
    Validate that the forecasting system is actually usable.

    The checks use the current dataset and model on disk rather than
    hard-coded row counts, dates, metrics, or expected values.
    Raises AssertionError if any required component is unhealthy.
    """

    # Dataset checks
    data_path = resolve_data_path()
    assert data_path.exists(), f"Dataset not found: {data_path}"

    df = load_data()

    required_columns = {"date", "store", "item", "sales"}
    assert required_columns.issubset(df.columns), (
        "Dataset is missing required columns: "
        f"{required_columns - set(df.columns)}"
    )

    assert not df.empty, "Dataset is empty."
    assert df["date"].notna().all(), "Dataset contains invalid dates."
    assert df["store"].notna().all(), "Dataset contains missing store IDs."
    assert df["item"].notna().all(), "Dataset contains missing item IDs."
    assert df["sales"].notna().all(), "Dataset contains missing sales values."

    # Model checks
    assert Path(MODEL_PATH).exists(), (
        f"Model not found: {MODEL_PATH}"
    )

    model, feature_cols = load_model()

    assert model is not None, "Loaded model is None."
    assert feature_cols, "Model feature list is empty."
    assert set(feature_cols) == set(FEATURE_COLS), (
        "Model feature columns do not match the current feature definition."
    )
    assert hasattr(model, "predict"), "Loaded model does not support prediction."

    # Real prediction smoke test using an actual store-item pair.
    first_row = df.iloc[0]
    store_id = int(first_row["store"])
    item_id = int(first_row["item"])

    history = get_store_item_history(store_id, item_id)
    result = forecast_next_days(
        store_id=store_id,
        item_id=item_id,
        history_df=history,
        forecast_days=1,
        model=model,
        feature_cols=feature_cols
    )

    assert len(result["forecast"]) == 1, "Prediction smoke test failed."
    assert result["forecast"][0] >= 0, "Prediction returned a negative value."

    status = {
        "status": "healthy",
        "dataset": str(data_path),
        "dataset_rows": int(len(df)),
        "date_min": str(df["date"].min().date()),
        "date_max": str(df["date"].max().date()),
        "stores": int(df["store"].nunique()),
        "items": int(df["item"].nunique()),
        "model": str(MODEL_PATH),
        "feature_count": len(feature_cols),
        "smoke_test": "passed"
    }

    return status


# ============================================================
# 14. COMMAND LINE INTERFACE
# ============================================================

def main():

    parser = argparse.ArgumentParser(
        description=(
            "RetailIQ unified sales prediction, "
            "demand forecasting and restock system."
        )
    )

    parser.add_argument(
        "--train",
        action="store_true",
        help="Train and save the model."
    )

    parser.add_argument(
        "--health",
        action="store_true",
        help="Run system health checks."
    )

    parser.add_argument(
        "--store",
        type=int,
        help="Store ID for forecasting."
    )

    parser.add_argument(
        "--item",
        type=int,
        help="Item ID for forecasting."
    )

    parser.add_argument(
        "--days",
        type=int,
        default=7,
        help="Forecast horizon (1-30 days)."
    )

    args = parser.parse_args()

    if args.days < 1 or args.days > 30:
        parser.error("--days must be between 1 and 30.")

    # --------------------------------------------------------
    # HEALTH CHECK
    # --------------------------------------------------------

    if args.health:
        try:
            status = health_check()
            print("\nHealth Check")
            print("-" * 50)
            for key, value in status.items():
                print(f"{key}: {value}")
            print("-" * 50)
            return
        except AssertionError as exc:
            print(f"Health check failed: {exc}")
            raise SystemExit(1)

    # --------------------------------------------------------
    # TRAIN
    # --------------------------------------------------------

    if args.train:
        run_training_pipeline()
        return

    # --------------------------------------------------------
    # FORECAST
    # --------------------------------------------------------

    if args.store is not None and args.item is not None:

        df = get_store_item_history(
            args.store,
            args.item
        )

        model, feature_cols = load_model()

        result = forecast_next_days(
            store_id=args.store,
            item_id=args.item,
            history_df=df,
            forecast_days=args.days,
            model=model,
            feature_cols=feature_cols
        )

        print("\nForecast")
        print("-" * 50)

        for date, value in zip(
            result["forecast_dates"],
            result["forecast"]
        ):
            print(
                f"{date}: {value} units"
            )

        print("-" * 50)

        print(
            f"Total demand: "
            f"{result['total_demand']} units"
        )

        return

    # --------------------------------------------------------
    # DEFAULT
    # --------------------------------------------------------

    parser.print_help()


# ============================================================

# ENTRY POINT

# ============================================================



if __name__ == "__main__":

    main()