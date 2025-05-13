from typing import Literal, Self, TypedDict
from datetime import date

from pydantic.main import BaseModel
from pydantic import Field, model_validator


FrequencyUnit = Literal['days', 'weeks', 'months', 'years', 'decades']

class Frequency(BaseModel):
    value: int = Field(ge=1)
    unit: FrequencyUnit

class FrequencyDict(TypedDict):
    value: int
    unit: FrequencyUnit

class IncomeChangeItem(BaseModel):
    type: Literal['bonus', 'raise']
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

class NewIncomeSchema(BaseModel):
    name: str
    amount: float
    frequency: Frequency | None
    start_date: date
    end_date: date | None = None
    account_id: int
    change_schedule: list[IncomeChangeItem] = []

    @model_validator(mode='after')
    def validate_dates(self) -> Self:
        """Validate that the end date is after the start date"""

        if self.end_date is not None and self.start_date > self.end_date:
            raise ValueError('End date must be after start date')
        return self

class ReturnIncomeSchema(BaseModel):
    id: int
    name: str
    amount: float
    frequency: Frequency | None
    start_date: date
    end_date: date | None
    account_id: int
    change_schedule: list[IncomeChangeItem]
