import unittest
import numpy as np
import pandas as pd
from src.restock import calculate_restock, batch_restock_recommendations
from src.forecast import forecast_next_7_days, load_trained_forecaster
from src.feature_engineering import load_and_preprocess_data

class TestRetailIQML(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.model, cls.feature_cols = load_trained_forecaster()
        cls.df = load_and_preprocess_data()

    def test_restock_calculation_basic(self):
        # Case 1: Predicted demand > current stock
        res = calculate_restock(predicted_demand=204, current_stock=120, product_id=10)
        self.assertEqual(res["recommendedRestock"], 84)
        self.assertEqual(res["predictedDemand"], 204)
        self.assertEqual(res["currentStock"], 120)
        self.assertEqual(res["productId"], 10)

        # Case 2: Current stock >= predicted demand (no restock needed)
        res_surplus = calculate_restock(predicted_demand=100, current_stock=150, product_id=10)
        self.assertEqual(res_surplus["recommendedRestock"], 0)

        # Case 3: Zero current stock
        res_zero = calculate_restock(predicted_demand=100, current_stock=0, product_id=10)
        self.assertEqual(res_zero["recommendedRestock"], 100)

    def test_7_day_forecast_structure(self):
        forecast_res = forecast_next_7_days(
            store_id=2,
            item_id=5,
            history_df=self.df,
            model=self.model,
            feature_cols=self.feature_cols
        )
        self.assertEqual(forecast_res["store"], 2)
        self.assertEqual(forecast_res["item"], 5)
        self.assertEqual(len(forecast_res["forecast_dates"]), 7)
        self.assertEqual(len(forecast_res["forecast"]), 7)
        self.assertGreater(forecast_res["total_demand"], 0)
        for val in forecast_res["forecast"]:
            self.assertGreaterEqual(val, 0)

    def test_batch_restock(self):
        forecasts = [
            {"item": 1, "store": 1, "total_demand": 100},
            {"item": 2, "store": 1, "total_demand": 50},
        ]
        stock_map = {1: 80, 2: 70}
        recs = batch_restock_recommendations(forecasts, stock_map)
        self.assertEqual(len(recs), 2)
        self.assertEqual(recs[0]["recommendedRestock"], 20)
        self.assertEqual(recs[1]["recommendedRestock"], 0)

if __name__ == "__main__":
    unittest.main()
