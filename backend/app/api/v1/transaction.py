from datetime import date, timedelta

from fastapi import APIRouter, Body, Depends, Query
from fastapi_pagination import Page
from fastapi_pagination.ext.sqlalchemy import paginate
from sqlalchemy import or_
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
    ReturnUpcomingTransactionSchema
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
    transaction = Transaction(**new_transaction.model_dump())
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