from datetime import date
from typing import Self

from pydantic import BaseModel, Field, model_validator

from app.schemas.core import TransactionFilter
from app.schemas.income import Frequency
from app.schemas.account import ReturnAccountSchema


class NewTransferSchema(BaseModel):
    name: str
    description: str = ''
    amount: float = Field(gt=0)
    frequency: Frequency | None
    start_date: date
    end_date: date | None = None
    from_account_id: int
    to_account_id: int
    transaction_filters: list[list[TransactionFilter]] = []
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
    frequency: Frequency | None = None
    start_date: date = None
    end_date: date | None = None
    from_account_id: int = None
    to_account_id: int = None
    transaction_filters: list[list[TransactionFilter]] = None
    payoff_balance: bool = None

class ReturnTransferSchema(BaseModel):
    id: int
    name: str
    description: str
    amount: float
    frequency: Frequency | None
    start_date: date
    end_date: date | None
    from_account_id: int
    from_account: ReturnAccountSchema
    to_account_id: int
    to_account: ReturnAccountSchema
    transaction_filters: list[list[TransactionFilter]]
    payoff_balance: bool
