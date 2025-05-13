from fastapi import APIRouter, Body, Depends
from fastapi_pagination import Page
from fastapi_pagination.ext.sqlalchemy import paginate
from sqlalchemy.orm.session import Session

from app.api.deps import get_database
from app.db.query import (
    require_account,
    require_expense,
    require_income,
    require_transaction,
)
from app.models.transaction import Transaction
from app.schemas.transaction import (
    NewTransactionSchema,
    ReturnTransactionSchema
)

transaction_router = APIRouter(
    prefix='/transaction',
    tags=['Transactions'],
)


@transaction_router.post('/new')
def create_transaction(
    new_transaction: NewTransactionSchema = Body(...),
    db: Session = Depends(get_database),
) -> ReturnTransactionSchema:
    """
    Create a new Transaction.

    - new_transaction: The Transaction to create.
    """

    # Verify all associated models exist
    _ = require_account(db, new_transaction.account_id)
    if new_transaction.expense_id is not None:
        _ = require_expense(db, new_transaction.expense_id)
    if new_transaction.income_id is not None:
        _ = require_income(db, new_transaction.income_id)

    # Create and add to the database
    transaction = Transaction(
        date=new_transaction.date,
        description=new_transaction.description,
        note=new_transaction.note,
        amount=new_transaction.amount,
        account_id=new_transaction.account_id,
        expense_id=new_transaction.expense_id,
        income_id=new_transaction.income_id,
        upload_id=None,
    )
    db.add(transaction)
    db.commit()

    return transaction


@transaction_router.get('/all')
def get_transactions(
    db: Session = Depends(get_database),
) -> Page[ReturnTransactionSchema]:

    return paginate(db.query(Transaction))


@transaction_router.get('/{transaction_id}')
def get_transaction_by_id(
    transaction_id: int,
    db: Session = Depends(get_database),
) -> ReturnTransactionSchema:

    return require_transaction(db, transaction_id)


@transaction_router.delete('/{transaction_id}')
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_database),
) -> None:

    transaction = require_transaction(db, transaction_id)
    db.delete(transaction)
    db.commit()

