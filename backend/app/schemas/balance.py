from datetime import date

from pydantic import BaseModel


class NewBalanceSchema(BaseModel):
    account_id: int
    date: date
    balance: float

class ReturnBalanceSchema(BaseModel):
    id: int
    account_id: int
    date: date
    balance: float
