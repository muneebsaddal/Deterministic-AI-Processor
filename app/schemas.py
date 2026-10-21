from pydantic import BaseModel, Field
from datetime import date
from typing import Literal

class OrderSchema(BaseModel):

    customer_name: str = Field(description="Full name of customer")
    item: str = Field(description="Product name")
    quantity: int = Field(gt=0, description="Number of items ordered")
    order_date: date = Field(description="Date of order in YYYY-MM-DD format")
    total_amount: float = Field(gt=0, description="Total cost in numeric form")
    currency: Literal["USD", "EUR", "GBP"] = Field(description="Three-letter currency code")

    class Config:
        extra = "forbid"