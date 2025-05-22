from datetime import date

from fastapi import APIRouter, Body, Depends, Query
from sqlalchemy import and_, or_
from sqlalchemy.orm import joinedload
from sqlalchemy.orm.session import Session

from app.api.deps import get_database
from app.db.query import require_budget
from app.models.budget import Budget
from app.schemas.budget import (
    NewBudgetSchema,
    ReturnBudgetSchema,
    UpdateBudgetSchema,
)
from app.schemas.transaction import ReturnTransactionSchema


budget_router = APIRouter(
    prefix='/budgets',
    tags=['Budgets'],
)


@budget_router.post('/budget/new')
def create_budget(
    new_budget: NewBudgetSchema = Body(...),
    db: Session = Depends(get_database),
) -> ReturnBudgetSchema:
    """
    Create a new Budget.

    Args:
        new_budget: The Budget to create.
    """

    budget = Budget(**new_budget.model_dump())
    db.add(budget)
    db.commit()
    db.refresh(budget)

    return budget


@budget_router.get('/all')
def get_budgets(
    is_active: bool | None = Query(default=None),
    contains: str | None = Query(default=None),
    db: Session = Depends(get_database),
) -> list[ReturnBudgetSchema]:
    """
    Get all Budgets which match the provided filters.

    Args:
        is_active: Optional filter for active/inactive budgets.
        contains: Optional string to filter by in the Budget's name or description.
    """

    filters = []
    if is_active is not None:
        filters.append(Budget.is_active == is_active)
    if contains is not None:
        filters.append(or_(
            Budget.name.contains(contains),
            Budget.description.contains(contains),
        ))

    return (
        db.query(Budget)
            .filter(and_(*filters))
            .order_by(Budget.name)
            .options(joinedload(Budget.transactions))
            .all()
    ) # type: ignore


@budget_router.get('/budget/{budget_id}')
def get_budget_by_id(
    budget_id: int,
    db: Session = Depends(get_database),
) -> ReturnBudgetSchema:
    """
    Get the details of a Budget.

    Args:
        budget_id: ID of the Budget to get details for.
    """

    return require_budget(db, budget_id)


@budget_router.delete('/budget/{budget_id}')
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_database),
) -> None:
    """
    Delete a Budget.

    Args:
        budget_id: The ID of the Budget to delete.
    """

    db.delete(require_budget(db, budget_id))
    db.commit()


@budget_router.put('/budget/{budget_id}')
def update_budget(
    budget_id: int,
    updated_budget: NewBudgetSchema = Body(...),
    db: Session = Depends(get_database),
) -> ReturnBudgetSchema:
    """
    Update a Budget.

    Args:
        budget_id: The ID of the Budget to update.
        updated_budget: The updated Budget.
    """

    budget = require_budget(db, budget_id)

    for key, value in updated_budget.model_dump().items():
        setattr(budget, key, value)

    db.commit()
    db.refresh(budget)

    return budget


@budget_router.patch('/budget/{budget_id}')
def partial_update_budget(
    budget_id: int,
    updated_budget: UpdateBudgetSchema = Body(...),
    db: Session = Depends(get_database),
) -> ReturnBudgetSchema:
    """
    Partially update a Budget.

    Args:
        budget_id: The ID of the Budget to update.
        updated_budget: The updated Budget.
    """

    budget = require_budget(db, budget_id)

    # Update only the provided fields
    for key, value in updated_budget.model_dump().items():
        if key in updated_budget.model_fields_set:
            setattr(budget, key, value)

    db.commit()
    db.refresh(budget)

    return budget


@budget_router.get('/budget/{budget_id}/transactions')
def get_budget_transactions(
    budget_id: int,
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    db: Session = Depends(get_database),
) -> list[ReturnTransactionSchema]:
    """
    Get all Transactions associated with a Budget.

    Args:
        budget_id: The ID of the Budget to get transactions for.
        start_date: Optional start date to filter transactions.
        end_date: Optional end date to filter transactions.
    """

    budget = require_budget(db, budget_id)
    transactions = budget.transactions

    if start_date is not None:
        transactions = [t for t in transactions if t.date >= start_date]
    if end_date is not None:
        transactions = [t for t in transactions if t.date <= end_date]

    return transactions


@budget_router.get('/budget/{budget_id}/status')
def get_budget_status(
    budget_id: int,
    target_date: date = Query(default_factory=date.today),
    db: Session = Depends(get_database),
) -> dict:
    """
    Get the current status of a Budget.

    Args:
        budget_id: The ID of the Budget to get status for.
        target_date: The date to calculate the status for.
    """

    budget = require_budget(db, budget_id)
    
    spent_amount = budget.get_spent_amount(target_date)
    remaining_amount = budget.get_remaining_amount(target_date)
    utilization_percentage = budget.get_utilization_percentage(target_date)

    return {
        "budget_id": budget.id,
        "name": budget.name,
        "total_amount": budget.amount,
        "spent_amount": spent_amount,
        "remaining_amount": remaining_amount,
        "utilization_percentage": utilization_percentage,
        "is_active": budget.is_active,
        "allow_rollover": budget.allow_rollover,
        "max_rollover_amount": budget.max_rollover_amount,
    } 
