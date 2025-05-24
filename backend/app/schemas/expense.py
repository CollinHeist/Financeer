from pydantic import BaseModel

from app.schemas.account import ReturnAccountSchema
from app.schemas.core import TransactionFilter


class NewExpenseSchema(BaseModel):
    account_id: int
    name: str
    description: str
    amount: float
    is_active: bool
    transaction_filters: list[list[TransactionFilter]] = []
    allow_rollover: bool
    max_rollover_amount: float | None = None

class UpdateExpenseSchema(BaseModel):
    account_id: int = None
    name: str = None
    description: str = None
    amount: float = None
    is_active: bool = None
    transaction_filters: list[list[TransactionFilter]] = None
    allow_rollover: bool | None = None
    max_rollover_amount: float | None = None

class ReturnExpenseSchema(BaseModel):
    id: int
    account_id: int
    account: ReturnAccountSchema
    name: str
    description: str
    amount: float
    is_active: bool
    transaction_filters: list[list[TransactionFilter]]
    allow_rollover: bool
    max_rollover_amount: float | None
