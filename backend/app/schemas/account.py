from typing import Literal

from pydantic import BaseModel


AccountType = Literal[
    'debit',
    'credit',
    'checking',
    'investment',
    'loan',
    'other',
    'saving',
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
