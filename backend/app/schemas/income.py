from typing import Literal, Self, TypedDict
from datetime import date

from pydantic.main import BaseModel
from pydantic import Field, model_validator


FrequencyUnit = Literal['days', 'weeks', 'months', 'years']

class Frequency(BaseModel):
    value: int = Field(ge=1)
    unit: FrequencyUnit

class FrequencyDict(TypedDict):
    value: int
    unit: FrequencyUnit

class RaiseItem(BaseModel):
    amount: float
    is_percentage: bool
    start_date: date
    end_date: date | None = None
    frequency: Frequency | None = None

    @model_validator(mode='after')
    def validate_dates(self) -> Self:
        """Validate that the end date is after the start date"""

        if self.end_date is not None and self.start_date > self.end_date:
            raise ValueError('End date must be after start date')
        return self

    @model_validator(mode='after')
    def validate_amount(self) -> Self:
        """Validate that the amount is not zero"""

        if self.amount == 0:
            raise ValueError('Amount must be non-zero')
        return self

class RaiseItemDict(TypedDict):
    amount: float
    is_percentage: bool
    start_date: date
    end_date: date | None
    frequency: FrequencyDict | None

class NewIncomeSchema(BaseModel):
    name: str
    amount: float
    frequency: Frequency | None
    start_date: date
    end_date: date | None = None
    account_id: int
    raise_schedule: list[RaiseItem] = []

    @model_validator(mode='after')
    def validate_dates(self) -> Self:
        """Validate that the end date is after the start date"""

        if self.end_date is not None and self.start_date > self.end_date:
            raise ValueError('End date must be after start date')
        return self

class UpdateIncomeSchema(BaseModel):
    name: str | None = None
    amount: float | None = None
    frequency: Frequency | None = None
    start_date: date | None = None
    end_date: date | None = None
    account_id: int | None = None
    raise_schedule: list[RaiseItem] | None = None

    @model_validator(mode='after')
    def validate_dates(self) -> Self:
        """Validate that the end date is after the start date"""

        if (self.start_date is not None and self.end_date is not None
            and self.start_date > self.end_date):
            raise ValueError('End date must be after start date')
        return self

class ReturnIncomeSchema(BaseModel):
    id: int
    name: str
    amount: float
    effective_amount: float
    frequency: Frequency | None
    start_date: date
    end_date: date | None
    account_id: int
    raise_schedule: list[RaiseItem]
