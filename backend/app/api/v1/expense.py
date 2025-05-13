from datetime import date, timedelta

from app.core.dates import date_range
from fastapi import APIRouter, Body, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm.session import Session

from app.api.deps import get_database
from app.db.query import require_account, require_expense
from app.models.expense import Expense
from app.schemas.expense import (
    NewExpenseSchema,
    ReturnExpenseSchema,
    ReturnUpcomingExpenseSchema,
)

expense_router = APIRouter(
    prefix='/expense',
    tags=['Expenses'],
)


@expense_router.post('/new')
def create_expense(
    new_expense: NewExpenseSchema = Body(...),
    db: Session = Depends(get_database),
) -> ReturnExpenseSchema:

    # Verify the source and destination Accounts exist
    _ = require_account(db, new_expense.from_account_id, raise_exception=True)
    if new_expense.to_account_id is not None:
        _ = require_account(db, new_expense.to_account_id, raise_exception=True)

    expense = Expense(**new_expense.model_dump())
    db.add(expense)
    db.commit()

    return expense


@expense_router.get('/all')
def get_all_expenses(
    db: Session = Depends(get_database),
) -> list[ReturnExpenseSchema]:

    return db.query(Expense).all()


@expense_router.get('/{expense_id}')
def get_expense_by_id(
    expense_id: int,
    db: Session = Depends(get_database),
) -> ReturnExpenseSchema:

    return require_expense(db, expense_id, raise_exception=True)


@expense_router.delete('/{expense_id}')
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_database),
) -> None:

    expense = require_expense(db, expense_id, raise_exception=True)
    db.delete(expense)
    db.commit()


@expense_router.get('/account/{account_id}/all')
def get_all_expenses_for_account(
    account_id: int,
    db: Session = Depends(get_database),
) -> list[ReturnExpenseSchema]:

    return (
        db.query(Expense)
            .filter(
                or_(
                    Expense.from_account_id == account_id,
                    Expense.to_account_id == account_id,
                ),
            )
            .all()
     ) # type: ignore


@expense_router.get('/account/{account_id}/from')
def get_expenses_from_account(
    account_id: int,
    db: Session = Depends(get_database),
) -> list[ReturnExpenseSchema]:

    return db.query(Expense).filter(Expense.from_account_id == account_id).all() # type: ignore


@expense_router.get('/account/{account_id}/to')
def get_expenses_to_account(
    account_id: int,
    db: Session = Depends(get_database),
) -> list[ReturnExpenseSchema]:

    return db.query(Expense).filter(Expense.to_account_id == account_id).all() # type: ignore


@expense_router.get('/account/{account_id}/upcoming')
def get_upcoming_expenses_to_and_from_account(
    account_id: int,
    start: date = Query(default_factory=lambda: date.today()),
    end: date = Query(default_factory=lambda: date.today() + timedelta(days=14)),
    db: Session = Depends(get_database),
) -> list[ReturnUpcomingExpenseSchema]:

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

    upcoming_expenses = []
    for date_ in date_range(start, end):
        for expense in expenses:
            if (amount := expense.get_effective_amount(date_)) != 0.0:
                upcoming_expenses.append(ReturnUpcomingExpenseSchema(
                    name=expense.name,
                    amount=-amount if expense.to_account_id == account_id else amount,
                    date=date_,
                    expense_id=expense.id,
                ))

    return upcoming_expenses
