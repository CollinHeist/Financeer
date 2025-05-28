from pydantic import BaseModel

from app.schemas.core import TransactionFilter


class NewExpenseSchema(BaseModel):
    name: str
    description: str
    amount: float
    is_active: bool
    transaction_filters: list[list[TransactionFilter]] = []
    allow_rollover: bool
    max_rollover_amount: float | None = None

class UpdateExpenseSchema(BaseModel):
    name: str = None
    description: str = None
    amount: float = None
    is_active: bool = None
    transaction_filters: list[list[TransactionFilter]] = None
    allow_rollover: bool | None = None
    max_rollover_amount: float | None = None

class ReturnExpenseSchema(BaseModel):
    id: int
    name: str
    description: str
    amount: float
    is_active: bool
    transaction_filters: list[list[TransactionFilter]]
    allow_rollover: bool
    max_rollover_amount: float | None
