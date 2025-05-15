from typing import Literal

from pydantic import BaseModel


AccountType = Literal[
    'checking',
    'credit',
    'investment',
    'loan',
    'savings',
]

SummaryTimePeriod = Literal[
    'today',
    'this week',
    'this month',
    'this quarter',
    'this year',
]

class NewAccountSchema(BaseModel):
    name: str
    type: AccountType
    account_number: int | None = None
    routing_number: int | None = None
    interest: float

class ReturnAccountSchema(BaseModel):
    id: int
    name: str
    type: AccountType
    account_number: int | None
    routing_number: int | None
    interest: float

class ReturnAccountSummarySchema(BaseModel):
    balance: float
    income: float
    expenses: float
