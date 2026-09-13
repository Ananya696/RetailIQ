import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import pickle

# ---- 1. Load the data ----
sales = pd.read_csv("sales.csv")
sales["soldAt"] = pd.to_datetime(sales["soldAt"])

# ---- 2. Aggregate: total quantity sold PER PRODUCT PER DAY ----
daily_sales = sales.groupby(["productId", "soldAt"])["quantity"].sum().reset_index()

# ---- 3. Feature Engineering ----
# Turn the date into useful numeric features the model can learn from
daily_sales["dayOfWeek"] = daily_sales["soldAt"].dt.dayofweek       # 0=Monday, 6=Sunday
daily_sales["dayOfMonth"] = daily_sales["soldAt"].dt.day
daily_sales["month"] = daily_sales["soldAt"].dt.month
daily_sales["dayIndex"] = (daily_sales["soldAt"] - daily_sales["soldAt"].min()).dt.days  # day number since start

# ---- 4. Prepare data for training ----
features = ["productId", "dayOfWeek", "dayOfMonth", "month", "dayIndex"]
X = daily_sales[features]
y = daily_sales["quantity"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# ---- 5. Train the model ----
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# ---- 6. Check how accurate it is ----
predictions = model.predict(X_test)
mae = mean_absolute_error(y_test, predictions)
print(f"Model trained. Average prediction error: {mae:.2f} units")

# ---- 7. Save the trained model ----
with open("sales_prediction_model.pkl", "wb") as f:
    pickle.dump(model, f)

print("Model saved as sales_prediction_model.pkl")