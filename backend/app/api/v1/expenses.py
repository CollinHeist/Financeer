from datetime import date

from fastapi import APIRouter, Body, Depends, Query
from sqlalchemy import and_, or_
from sqlalchemy.orm import joinedload
from sqlalchemy.orm.session import Session

from app.db.deps import get_database
from app.db.query import require_expense
from app.models.expense import Expense
from app.schemas.expense import (
    NewExpenseSchema,
    ReturnExpenseSchema,
    UpdateExpenseSchema,
)
from app.schemas.transaction import ReturnTransactionSchema


expense_router = APIRouter(
    prefix='/expenses',
    tags=['Expenses'],
)


@expense_router.get('/all')
def get_all_expenses(
    is_active: bool | None = Query(default=None),
    contains: str | None = Query(default=None),
    db: Session = Depends(get_database),
) -> list[ReturnExpenseSchema]:
    """
    Get all Expenses which match the provided filters.

    Args:
        is_active: Optional filter for active/inactive budgets.
        contains: Optional string to filter by in the Budget's name or description.
    """

    filters = []
    if is_active is not None:
        filters.append(Expense.is_active == is_active)
    if contains is not None:
        filters.append(or_(
            Expense.name.contains(contains),
            Expense.description.contains(contains),
        ))

    return (
        db.query(Expense)
            .filter(and_(*filters))
            .order_by(Expense.name)
            .options(joinedload(Expense.transactions))
            .all()
    ) # type: ignore


@expense_router.post('/expense/new')
def create_expense(
    new_expense: NewExpenseSchema = Body(...),
    db: Session = Depends(get_database),
) -> ReturnExpenseSchema:
    """
    Create a new Expense.

    Args:
        new_expense: The Expense to create.
    """

    expense = Expense(**new_expense.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)

    return expense


@expense_router.get('/expense/{expense_id}')
def get_expense_by_id(
    expense_id: int,
    db: Session = Depends(get_database),
) -> ReturnExpenseSchema:
    """
    Get the details of an Expense.

    Args:
        expense_id: ID of the Expense to get details for.
    """

    return require_expense(db, expense_id)


@expense_router.delete('/expense/{expense_id}')
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_database),
) -> None:
    """
    Delete an Expense.

    Args:
        expense_id: The ID of the Expense to delete.
    """

    db.delete(require_expense(db, expense_id))
    db.commit()


@expense_router.put('/expense/{expense_id}')
def update_expense(
    expense_id: int,
    updated_expense: NewExpenseSchema = Body(...),
    db: Session = Depends(get_database),
) -> ReturnExpenseSchema:
    """
    Update an Expense.

    Args:
        expense_id: The ID of the Expense to update.
        updated_expense: The updated Expense.
    """

    expense = require_expense(db, expense_id)
    for key, value in updated_expense.model_dump().items():
        setattr(expense, key, value)

    db.commit()
    db.refresh(expense)

    return expense


@expense_router.patch('/expense/{expense_id}')
def partially_update_expense(
    expense_id: int,
    updated_expense: UpdateExpenseSchema = Body(...),
    db: Session = Depends(get_database),
) -> ReturnExpenseSchema:
    """
    Partially update an Expense.

    Args:
        expense_id: The ID of the Expense to update.
        updated_expense: The updated Expense.
    """

    # Update only the provided fields
    expense = require_expense(db, expense_id)
    for key, value in updated_expense.model_dump().items():
        if key in updated_expense.model_fields_set:
            setattr(expense, key, value)

    db.commit()
    db.refresh(expense)

    return expense


@expense_router.get('/budget/{budget_id}/transactions')
def get_expense_transactions(
    expense_id: int,
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    db: Session = Depends(get_database),
) -> list[ReturnTransactionSchema]:
    """
    Get all Transactions associated with a Expense.

    Args:
        expense_id: The ID of the Expense to get transactions for.
        start_date: Optional start date to filter transactions.
        end_date: Optional end date to filter transactions.
    """

    expense = require_expense(db, expense_id)
    transactions = expense.transactions

    if start_date is not None:
        transactions = [t for t in transactions if t.date >= start_date]
    if end_date is not None:
        transactions = [t for t in transactions if t.date <= end_date]

    return transactions # type: ignore
