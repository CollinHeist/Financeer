from datetime import date as date_type

from pydantic import BaseModel

from app.schemas.account import ReturnAccountSchema
from app.schemas.bill import ReturnBillSchema
from app.schemas.expense import ReturnExpenseSchema
from app.schemas.income import ReturnIncomeSchema


class NewSplitTransactionSchema(BaseModel):
    amount: float
    note: str

class NewTransactionSchema(BaseModel):
    date: date_type
    description: str
    note: str = ''
    amount: float
    account_id: int
    bill_id: int | None = None
    expense_id: int | None = None
    income_id: int | None = None
    transfer_id: int | None = None
    related_transaction_ids: list[int] | None = None

class UpdateTransactionSchema(BaseModel):
    date: date_type = None
    description: str = None
    note: str = None
    amount: float = None
    account_id: int = None
    bill_id: int | None = None
    expense_id: int | None = None
    income_id: int | None = None
    transfer_id: int | None = None
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
    bill_id: int | None
    expense_id: int | None
    income_id: int | None
    transfer_id: int | None
    related_transactions: list[ReturnRelatedTransactionSchema] = []
    related_to_transactions: list[ReturnRelatedTransactionSchema] = []

class ReturnTransactionSchema(ReturnTransactionSchemaNoAccount):
    account: ReturnAccountSchema
    bill: ReturnBillSchema | None
    expense: ReturnExpenseSchema | None
    income: ReturnIncomeSchema | None

class ReturnUpcomingTransactionSchema(BaseModel):
    name: str
    amount: float
    date: date_type
    bill_id: int | None = None
    expense_id: int | None = None
    income_id: int | None = None
    transfer_id: int | None = None

class BillBreakdownItem(BaseModel):
    bill_name: str
    total_amount: float
    transaction_count: int

class BillBreakdownResponse(BaseModel):
    total_bill: float
    breakdown: list[BillBreakdownItem]
