from datetime import date
from typing import Literal

from pydantic import BaseModel

from app.schemas.balance import ReturnBalanceSchema
from app.schemas.plaid import ReturnPlaidItemSchema

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

class NewAccountBalanceSchema(BaseModel):
    date: date
    balance: float

class NewAccountSchema(BaseModel):
    name: str
    type: AccountType
    account_number: int | None = None
    routing_number: int | None = None
    interest: float = 0.0
    balance: NewAccountBalanceSchema

class ReturnAccountSchema(BaseModel):
    id: int
    name: str
    type: AccountType
    account_number: int | None
    routing_number: int | None
    interest: float
    last_balance: ReturnBalanceSchema | None = None
    plaid_item_id: int | None = None
    plaid_item: ReturnPlaidItemSchema | None = None

class ReturnAccountSummarySchema(BaseModel):
    balance: float
    income: float
    expenses: float
