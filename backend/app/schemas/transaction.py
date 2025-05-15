from datetime import date

from pydantic.main import BaseModel

from app.schemas.account import ReturnAccountSchema
from app.schemas.expense import ReturnExpenseSchema
from app.schemas.income import ReturnIncomeSchema


class NewTransactionSchema(BaseModel):
    date: date
    description: str
    note: str = ''
    amount: float
    account_id: int
    expense_id: int | None = None
    income_id: int | None = None
    related_transaction_ids: list[int] | None = None

class ReturnRelatedTransactionSchema(BaseModel):
    id: int
    date: date
    description: str
    amount: float

class ReturnTransactionSchemaNoAccount(BaseModel):
    id: int
    date: date
    description: str
    note: str
    amount: float
    account_id: int
    expense_id: int | None
    income_id: int | None
    related_transactions: list[ReturnRelatedTransactionSchema]
    related_to_transactions: list[ReturnRelatedTransactionSchema] = []

class ReturnTransactionSchema(ReturnTransactionSchemaNoAccount):
    account: ReturnAccountSchema
    expense: ReturnExpenseSchema | None
    income: ReturnIncomeSchema | None    

class ReturnUpcomingTransactionSchema(BaseModel):
    name: str
    amount: float
    date: date
    expense_id: int | None = None
    income_id: int | None = None
