from datetime import date
from typing import List, Optional

from pydantic import BaseModel


class ReturnMonthlyCashFlowItemSchema(BaseModel):
    date: date
    income: float
    expenses: float

class ReturnMonthlyAccountSnapshotSchema(BaseModel):
    spent: float
    budget: float
    bill_id: int | None = None
    bill_name: str | None = None
    expense_id: int | None = None
    expense_name: str | None = None

class DailyExpenseComparison(BaseModel):
    day_of_month: int
    historical_average: float
    current_month: Optional[float] = None

class ReturnMonthlyOverviewSchema(BaseModel):
    income: float
    expenses: float
    balance: float
    savings_rate: float
