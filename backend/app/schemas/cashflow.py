from datetime import date

from pydantic import BaseModel


class ReturnMonthlyCashFlowItemSchema(BaseModel):
    date: date
    income: float
    expenses: float
