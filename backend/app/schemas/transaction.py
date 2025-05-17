from datetime import date as date_type

from pydantic import BaseModel

from app.schemas.account import ReturnAccountSchema
from app.schemas.expense import ReturnExpenseSchema
from app.schemas.income import ReturnIncomeSchema


class NewTransactionSchema(BaseModel):
    date: date_type
    description: str
    note: str = ''
    amount: float
    account_id: int
    expense_id: int | None = None
    income_id: int | None = None
    related_transaction_ids: list[int] | None = None

class UpdateTransactionSchema(BaseModel):
    date: date_type = None
    description: str = None
    note: str = None
    amount: float = None
    account_id: int = None
    expense_id: int | None = None
    income_id: int | None = None
    related_transaction_ids: list[int] | None = None

class ReturnRelatedTransactionSchema(BaseModel):
    id: int
    date: date_type
    description: str
    note: str
    amount: float

class ReturnTransactionSchemaNoAccount(BaseModel):
    id: int
    date: date_type
    description: str
    note: str
    amount: float
    account_id: int
    expense_id: int | None
    income_id: int | None
    related_transactions: list[ReturnRelatedTransactionSchema] = []
    related_to_transactions: list[ReturnRelatedTransactionSchema] = []

class ReturnTransactionSchema(ReturnTransactionSchemaNoAccount):
    account: ReturnAccountSchema
    expense: ReturnExpenseSchema | None
    income: ReturnIncomeSchema | None    

class ReturnUpcomingTransactionSchema(BaseModel):
    name: str
    amount: float
    date: date_type
    expense_id: int | None = None
    income_id: int | None = None
