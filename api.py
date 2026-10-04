from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from datetime import date

from forecast_model_v2_final_m6 import (
    forecast_next_days,
    calculate_restock,
    get_store_item_history,
)

from long_horizon_model import (
    predict_future_date,
    predict_future_days
)


app = FastAPI(
    title="RetailIQ ML API",
    version="1.0.0",
)


class ForecastRequest(BaseModel):
    store_id: int = Field(..., ge=1)
    item_id: int = Field(..., ge=1)
    start_date: date
    days: int = Field(7, ge=1, le=3650)


class DateForecastRequest(BaseModel):
    store_id: int = Field(..., ge=1)
    item_id: int = Field(..., ge=1)
    date: date

class RestockRequest(BaseModel):
    predicted_demand: int = Field(..., ge=0)
    current_stock: int = Field(..., ge=0)
    product_id: int = Field(..., ge=1)
    store_id: int = Field(..., ge=1)


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "RetailIQ ML API"
    }


@app.post("/forecast")
def forecast(request: ForecastRequest):
    try:
        result = predict_future_days(
            store_id=request.store_id,
            item_id=request.item_id,
            start_date=request.start_date,
            days=request.days
        )

        return {
            "storeId": request.store_id,
            "itemId": request.item_id,
            "startDate": request.start_date.isoformat(),
            "days": request.days,
            "forecast": result
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.post("/forecast/date")
def forecast_by_date(request: DateForecastRequest):
    try:
        prediction = predict_future_date(
            store_id=request.store_id,
            item_id=request.item_id,
            target_date=request.date
        )

        return {
            "storeId": request.store_id,
            "itemId": request.item_id,
            "date": request.date.isoformat(),
            "predictedDemand": prediction
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )



@app.post("/restock")
def restock(request: RestockRequest):
    try:
        result = calculate_restock(
            predicted_demand=request.predicted_demand,
            current_stock=request.current_stock,
            product_id=request.product_id,
            store_id=request.store_id,
        )

        return result

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
        
        