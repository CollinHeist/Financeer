from datetime import date
from typing import Literal, Self

from pydantic import model_validator
from pydantic.main import BaseModel

ExpenseType = Literal['one_time', 'recurring', 'monthly']

class NewExpenseSchema(BaseModel):
    name: str
    description: str
    amount: float
    type: ExpenseType
    frequency: int | None
    start_date: date
    end_date: date | None
    growth_schedule: list[dict]
    transaction_filters: list[dict]
    from_account_id: int
    to_account_id: int | None = None

    @model_validator(mode='after')
    def validate_dates(self) -> Self:
        """Validate that the end date is after the start date"""

        if self.end_date is not None and self.start_date >= self.end_date:
            raise ValueError('End date must be after start date')
        return self

class ReturnExpenseSchema(BaseModel):
    id: int
    name: str
    description: str
    amount: float
    type: ExpenseType
    frequency: int | None
    start_date: date
    end_date: date | None
    growth_schedule: list[dict]
    transaction_filters: list[dict]
    from_account_id: int
    to_account_id: int | None
