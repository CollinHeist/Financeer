from datetime import date, timedelta

from fastapi import APIRouter, Body, Depends, Query
from fastapi_pagination import Page
from fastapi_pagination.ext.sqlalchemy import paginate
from sqlalchemy import or_
from sqlalchemy.orm import joinedload
from sqlalchemy.orm.session import Session

from app.api.deps import get_database
from app.core.dates import date_range
from app.db.query import (
    require_account,
    require_expense,
    require_income,
    require_transaction,
)
from app.models.expense import Expense
from app.models.income import Income
from app.models.transaction import Transaction
from app.schemas.transaction import (
    NewTransactionSchema,
    ReturnTransactionSchema,
    ReturnUpcomingTransactionSchema,
    UpdateTransactionSchema
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
    require_account(db, new_transaction.account_id)
    if new_transaction.expense_id is not None:
        require_expense(db, new_transaction.expense_id)
    if new_transaction.income_id is not None:
        require_income(db, new_transaction.income_id)
    related_transactions = []
    if new_transaction.related_transaction_ids:
        related_transactions = [
            require_transaction(db, id)
            for id in new_transaction.related_transaction_ids
        ]

    # Create and add to the database; exclude related_transaction_ids
    # as these will be set after the Transaction is created
    transaction = Transaction(
        **new_transaction.model_dump(exclude={'related_transaction_ids'})
    )
    transaction.related_transactions = related_transactions
    db.add(transaction)
    db.commit()

    return transaction


@transaction_router.get('/all')
def get_transactions(
    db: Session = Depends(get_database),
) -> Page[ReturnTransactionSchema]:

    return paginate(
        db.query(Transaction)
            .order_by(Transaction.date.desc())
            .options(
                joinedload(Transaction.account),
                joinedload(Transaction.expense),
                joinedload(Transaction.income),
            )
    )


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
    """
    Delete a Transaction.

    - transaction_id: The ID of the Transaction to delete.
    """

    db.delete(require_transaction(db, transaction_id))
    db.commit()


@transaction_router.put('/{transaction_id}')
def update_transaction(
    transaction_id: int,
    updated_transaction: NewTransactionSchema = Body(...),
    db: Session = Depends(get_database),
) -> ReturnTransactionSchema:
    """
    Update a Transaction.

    - transaction_id: The ID of the Transaction to update.
    - updated_transaction: The updated Transaction.
    """

    transaction = require_transaction(db, transaction_id)

    # Verify all associated models exist
    require_account(db, updated_transaction.account_id)
    if updated_transaction.expense_id is not None:
        require_expense(db, updated_transaction.expense_id)
    if updated_transaction.income_id is not None:
        require_income(db, updated_transaction.income_id)
    related_transactions = []
    if updated_transaction.related_transaction_ids:
        related_transactions = [
            require_transaction(db, id)
            for id in updated_transaction.related_transaction_ids
        ]

    for key, value in updated_transaction.model_dump().items():
        if key != 'related_transaction_ids':
            setattr(transaction, key, value)
    transaction.related_transactions = related_transactions

    db.commit()

    return transaction


@transaction_router.patch('/{transaction_id}')
def partial_update_transaction(
    transaction_id: int,
    updated_transaction: UpdateTransactionSchema = Body(...),
    db: Session = Depends(get_database),
) -> ReturnTransactionSchema:
    """
    Partially update a Transaction.

    - transaction_id: The ID of the Transaction to update.
    - updated_transaction: The updated Transaction.
    """

    # Get the existing Transaction
    transaction = require_transaction(db, transaction_id, raise_exception=True)
    
    # Verify IDs if they're being updated
    if 'account_id' in updated_transaction.model_fields_set:
        require_account(db, updated_transaction.account_id, raise_exception=True)
    if ('expense_id' in updated_transaction.model_fields_set
        and updated_transaction.expense_id is not None):
        require_expense(db, updated_transaction.expense_id, raise_exception=True)
    if ('income_id' in updated_transaction.model_fields_set
        and updated_transaction.income_id is not None):
        require_income(db, updated_transaction.income_id, raise_exception=True)
    related_transactions = []
    if ('related_transaction_ids' in updated_transaction.model_fields_set
        and updated_transaction.related_transaction_ids is not None):
        related_transactions = [
            require_transaction(db, id)
            for id in updated_transaction.related_transaction_ids
        ]

    # Update only the provided fields
    for key, value in updated_transaction.model_dump().items():
        if key in updated_transaction.model_fields_set:
            setattr(transaction, key, value)
    transaction.related_transactions = related_transactions

    db.commit()

    return transaction


@transaction_router.get('/upcoming/account/{account_id}')
def get_upcoming_account_transactions(
    account_id: int,
    start: date = Query(default_factory=lambda: date.today()),
    end: date = Query(default_factory=lambda: date.today() + timedelta(days=14)),
    db: Session = Depends(get_database),
) -> list[ReturnUpcomingTransactionSchema]:
    """
    Get all upcoming transactions to and from the given Account.

    - account_id: The ID of the Account to get upcoming transactions for.
    - start: The start date of the time period to get upcoming transactions for.
    - end: The end date of the time period to get upcoming transactions for.
    """

    # Get all Expenses which will be active over the given time period
    expenses = (
        db.query(Expense)
            .filter(
                or_(
                    Expense.from_account_id == account_id,
                    Expense.to_account_id == account_id,
                ),
                Expense.start_date <= end,
                or_(Expense.end_date.is_(None), Expense.end_date >= start),
            ).all()
    )

    # Get all Incomes which will be active over the given time period
    incomes = (
        db.query(Income)
            .filter(
                Income.account_id == account_id,
                Income.start_date <= end,
                or_(Income.end_date.is_(None), Income.end_date >= start),
            ).all()
    )

    upcoming_expenses = []
    for date_ in date_range(start, end):
        for expense in expenses:
            if (amount := expense.get_effective_amount(date_)) != 0.0:
                amount *= -1 if expense.to_account_id == account_id else 1
                upcoming_expenses.append(
                    ReturnUpcomingTransactionSchema(
                        name=expense.name,
                        amount=amount,
                        date=date_,
                        expense_id=expense.id,
                    )
                )
        for income in incomes:
            if (amount := income.get_effective_amount(date_)) != 0.0:
                upcoming_expenses.append(
                    ReturnUpcomingTransactionSchema(
                        name=income.name,
                        amount=amount,
                        date=date_,
                        expense_id=income.id,
                    )
                )

    return upcoming_expenses
