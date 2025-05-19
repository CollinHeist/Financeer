from datetime import date
from typing import Literal, Self, TypedDict

from pydantic import Field, model_validator
from pydantic.main import BaseModel

from app.schemas.core import TransactionFilter


ExpenseType = Literal['one_time', 'recurring']
FrequencyUnit = Literal['days', 'weeks', 'months', 'years']

class Frequency(BaseModel):
    value: int = Field(ge=1)
    unit: FrequencyUnit

class FrequencyDict(TypedDict):
    value: int
    unit: FrequencyUnit

class ExpenseChangeItem(BaseModel):
    type: Literal['bonus', 'raise']
    amount: float
    is_percentage: bool
    start_date: date
    end_date: date | None
    frequency: int | None = Field(ge=0) # How many days between successive occurrences

    @model_validator(mode='after')
    def validate_dates(self) -> Self:
        """Validate that the end date is after the start date"""

        if self.end_date is not None and self.start_date > self.end_date:
            raise ValueError('End date must be after start date')
        return self

class ExpenseChangeItemDict(TypedDict):
    type: Literal['bonus', 'raise']
    amount: float
    is_percentage: bool
    start_date: date
    end_date: date | None
    frequency: int | None

class NewExpenseSchema(BaseModel):
    name: str
    description: str
    amount: float
    type: ExpenseType
    frequency: Frequency | None
    start_date: date
    end_date: date | None
    change_schedule: list[ExpenseChangeItem] = []
    transaction_filters: list[list[TransactionFilter]] = []
    account_id: int

    @model_validator(mode='after')
    def validate_dates(self) -> Self:
        """Validate that the end date is after the start date"""

        if self.end_date is not None and self.start_date >= self.end_date:
            raise ValueError('End date must be after start date')
        return self

    @model_validator(mode='after')
    def validate_frequency(self) -> Self:
        if self.type == 'recurring' and self.frequency is None:
            raise ValueError('Frequency is required for recurring expenses')
        return self

class UpdateExpenseSchema(BaseModel):
    name: str = None
    description: str = None
    amount: float = None
    type: ExpenseType = None
    frequency: Frequency | None = None
    start_date: date = None
    end_date: date | None = None
    change_schedule: list[ExpenseChangeItem] = None
    transaction_filters: list[list[TransactionFilter]] = None
    account_id: int = None

    @model_validator(mode='after')
    def validate_dates(self) -> Self:
        """Validate that the end date is after the start date"""

        if (self.start_date is not None and self.end_date is not None
            and self.start_date >= self.end_date):
            raise ValueError('End date must be after start date')
        return self

    @model_validator(mode='after')
    def validate_frequency(self) -> Self:
        if self.type == 'recurring' and self.frequency is None:
            raise ValueError('Frequency is required for recurring expenses')
        return self

class ReturnExpenseSchema(BaseModel):
    id: int
    name: str
    description: str
    amount: float
    type: ExpenseType
    frequency: Frequency | None
    start_date: date
    end_date: date | None
    change_schedule: list[dict]
    transaction_filters: list[list[TransactionFilter]]
    account_id: int
