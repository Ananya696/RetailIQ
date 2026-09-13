"""
Inventory-Based Restock Recommendation Module for RetailIQ
Calculates replenishment units needed based on predicted multi-day demand and on-hand inventory.
"""

from typing import Union, Dict, Any, List


def calculate_restock(
    predicted_demand: Union[int, float],
    current_stock: Union[int, float],
    product_id: int = None,
    store_id: int = None
) -> Dict[str, Any]:
    """
    Calculates the recommended restock quantity.

    Formula:
        recommended_restock = max(0, total_predicted_demand - current_stock)

    Parameters:
        predicted_demand (int | float): Total predicted demand for next 7 days.
        current_stock (int | float): Current on-hand inventory level.
        product_id (int, optional): Identifier for the product/item.
        store_id (int, optional): Identifier for the store location.

    Returns:
        dict: Restock recommendation summary.
    """
    demand_int = int(round(predicted_demand))
    stock_int = int(current_stock)
    recommended_restock = max(0, demand_int - stock_int)

    result = {
        "predictedDemand": demand_int,
        "currentStock": stock_int,
        "recommendedRestock": recommended_restock
    }

    if product_id is not None:
        result["productId"] = product_id
    if store_id is not None:
        result["storeId"] = store_id

    return result


def batch_restock_recommendations(
    forecast_results: List[Dict[str, Any]],
    current_inventory_map: Dict[int, int]
) -> List[Dict[str, Any]]:
    """
    Calculates restock recommendations for a collection of product forecasts.

    Parameters:
        forecast_results (list[dict]): List of 7-day forecast results.
        current_inventory_map (dict): Mapping of product_id -> current_stock.

    Returns:
        list[dict]: List of restock recommendations for each item.
    """
    recommendations = []
    for item_forecast in forecast_results:
        item_id = item_forecast.get("item") or item_forecast.get("productId")
        store_id = item_forecast.get("store") or item_forecast.get("storeId")
        total_demand = item_forecast.get("total_demand") or item_forecast.get("predictedDemand", 0)
        current_stock = current_inventory_map.get(item_id, 0)

        rec = calculate_restock(
            predicted_demand=total_demand,
            current_stock=current_stock,
            product_id=item_id,
            store_id=store_id
        )
        recommendations.append(rec)

    return recommendations


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="RetailIQ Restock Recommendation Calculator")
    parser.add_argument("--demand", type=int, default=204, help="Predicted demand (default: 204)")
    parser.add_argument("--stock", type=int, default=120, help="Current stock level (default: 120)")
    parser.add_argument("--item", type=int, default=10, help="Product/Item ID (default: 10)")
    parser.add_argument("--store", type=int, default=1, help="Store ID (default: 1)")
    args = parser.parse_args()

    rec = calculate_restock(predicted_demand=args.demand, current_stock=args.stock, product_id=args.item, store_id=args.store)
    print("\nRestock Recommendation:")
    print(f"  Store ID:             {rec['storeId']}")
    print(f"  Product ID:           {rec['productId']}")
    print(f"  Predicted Demand:     {rec['predictedDemand']} units")
    print(f"  Current Stock:        {rec['currentStock']} units")
    print(f"  Recommended Restock:  {rec['recommendedRestock']} units")

