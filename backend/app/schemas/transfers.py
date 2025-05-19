from datetime import date
from typing import Self

from pydantic import BaseModel, Field, model_validator

from app.schemas.income import FrequencyDict


class NewTransferSchema(BaseModel):
    name: str
    description: str = ''
    amount: float = Field(gt=0)
    frequency: FrequencyDict | None
    start_date: date
    end_date: date | None = None
    from_account_id: int
    to_account_id: int
    payoff_balance: bool = False

    @model_validator(mode='after')
    def validate_dates(self) -> Self:
        """Validate that the end date is after the start date"""

        if (self.start_date is not None and self.end_date is not None
            and self.start_date >= self.end_date):
            raise ValueError('End date must be after start date')
        return self

class UpdateTransferSchema(BaseModel):
    name: str = None
    description: str = None
    amount: float = Field(gt=0, default=None)
    frequency: FrequencyDict | None = None
    start_date: date = None
    end_date: date | None = None
    from_account_id: int = None
    to_account_id: int = None
    payoff_balance: bool = None

class ReturnTransferSchema(BaseModel):
    id: int
    name: str
    description: str
    amount: float
    frequency: FrequencyDict | None
    start_date: date
    end_date: date | None
    from_account_id: int
    to_account_id: int
    payoff_balance: bool
