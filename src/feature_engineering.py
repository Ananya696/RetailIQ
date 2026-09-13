"""
Feature Engineering Module for RetailIQ Demand Forecasting
Handles calendar, lag, and rolling feature extraction with strict data leakage prevention.
"""

import os
import pandas as pd
import numpy as np

# Canonical feature list expected by the trained model
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

TARGET_COL = "sales"


def resolve_data_path(filepath: str = None) -> str:
    """Finds the dataset path across common project locations."""
    if filepath and os.path.exists(filepath):
        return filepath

    candidates = [
        "train copy.csv",
        "train_copy.csv",
        os.path.join("kaggle_data", "train copy.csv"),
        os.path.join("kaggle_data", "train_copy.csv"),
        os.path.join("data", "train copy.csv"),
        os.path.join("data", "train_copy.csv"),
        os.path.join("..", "kaggle_data", "train copy.csv"),
        os.path.join("..", "kaggle_data", "train_copy.csv"),
    ]
    for p in candidates:
        if os.path.exists(p):
            return p
    raise FileNotFoundError("Could not locate train_copy.csv dataset file.")


def load_and_preprocess_data(filepath: str = None) -> pd.DataFrame:
    """
    Loads train_copy.csv, parses date to datetime, and sorts by (store, item, date).
    """
    actual_path = resolve_data_path(filepath)
    df = pd.read_csv(actual_path)
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values(["store", "item", "date"]).reset_index(drop=True)
    return df


def add_calendar_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Extracts time and calendar features from the date column.
    """
    df = df.copy()
    df["year"] = df["date"].dt.year
    df["month"] = df["date"].dt.month
    df["day"] = df["date"].dt.day
    df["day_of_week"] = df["date"].dt.dayofweek  # 0=Monday ... 6=Sunday
    df["week_of_year"] = df["date"].dt.isocalendar().week.astype(int)
    df["quarter"] = df["date"].dt.quarter
    df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)
    return df


def add_lag_features(df: pd.DataFrame, lags: list = None) -> pd.DataFrame:
    """
    Creates lag features grouped strictly by store and item.
    """
    if lags is None:
        lags = [1, 7, 14, 30]
    df = df.copy()
    for lag in lags:
        df[f"lag_{lag}"] = df.groupby(["store", "item"])["sales"].shift(lag)
    return df


def add_rolling_features(df: pd.DataFrame, windows: list = None) -> pd.DataFrame:
    """
    Creates rolling mean features using only prior sales (shift(1) before rolling)
    to prevent target leakage.
    """
    if windows is None:
        windows = [7, 14, 30]
    df = df.copy()
    for w in windows:
        df[f"rolling_mean_{w}"] = (
            df.groupby(["store", "item"])["sales"]
              .transform(lambda x: x.shift(1).rolling(window=w).mean())
        )
    return df


def prepare_training_data(filepath: str = None) -> pd.DataFrame:
    """
    Executes the full preprocessing and feature engineering pipeline on the raw dataset,
    and drops the initial NaN rows corresponding to the 30-day burn-in window.
    """
    df = load_and_preprocess_data(filepath)
    df = add_calendar_features(df)
    df = add_lag_features(df, lags=[1, 7, 14, 30])
    df = add_rolling_features(df, windows=[7, 14, 30])
    df_clean = df.dropna().reset_index(drop=True)
    return df_clean
