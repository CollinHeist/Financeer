from datetime import date

from fastapi import APIRouter, Body, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm.session import Session

from app.db.deps import get_database
from app.db.query import require_account, require_income
from app.core.transactions import apply_transaction_filters
from app.models.income import Income
from app.schemas.core import TransactionFilter
from app.schemas.income import (
    NewIncomeSchema,
    ReturnIncomeSchema,
    UpdateIncomeSchema,
)
from app.schemas.transaction import ReturnTransactionSchemaNoAccount


income_router = APIRouter(
    prefix='/income',
    tags=['Income'],
)


@income_router.post('/new')
def create_income(
    new_income: NewIncomeSchema = Body(...),
    db: Session = Depends(get_database),
) -> ReturnIncomeSchema:

    # Verify the destination Account exists
    _ = require_account(db, new_income.account_id, raise_exception=True)

    income = Income(**new_income.model_dump())
    db.add(income)
    db.commit()

    return income


@income_router.get('/all')
def get_all_incomes(
    on: date | None = Query(default_factory=lambda: date.today()),
    db: Session = Depends(get_database),
) -> list[ReturnIncomeSchema]:

    filters = []
    if on is not None:
        filters.append(Income.start_date <= on)
        filters.append(or_(Income.end_date.is_(None), Income.end_date >= on))

    return db.query(Income).filter(*filters).order_by(Income.name).all() # type: ignore


@income_router.get('/{income_id}')
def get_income_by_id(
    income_id: int,
    db: Session = Depends(get_database),
) -> ReturnIncomeSchema:

    return require_income(db, income_id, raise_exception=True)


@income_router.delete('/{income_id}')
def delete_income(
    income_id: int,
    db: Session = Depends(get_database),
) -> None:

    income = require_income(db, income_id, raise_exception=True)
    db.delete(income)
    db.commit()


@income_router.put('/{income_id}')
def update_income(
    income_id: int,
    income_update: NewIncomeSchema = Body(...),
    db: Session = Depends(get_database),
) -> ReturnIncomeSchema:

    # Verify the income exists
    income = require_income(db, income_id, raise_exception=True)

    # Verify the destination Account exists
    require_account(db, income_update.account_id, raise_exception=True)

    # Update income attributes
    for key, value in income_update.model_dump().items():
        setattr(income, key, value)

    db.commit()

    return income


@income_router.patch('/{income_id}')
def patch_income(
    income_id: int,
    income_update: UpdateIncomeSchema = Body(...),
    db: Session = Depends(get_database),
) -> ReturnIncomeSchema:

    # Verify the income exists
    income = require_income(db, income_id, raise_exception=True)

    # Verify the new Account exists if it's being updated
    if ('account_id' in income_update.model_fields_set
        and income_update.account_id is not None):
        require_account(db, income_update.account_id, raise_exception=True)

    # Only update fields that were explicitly specified
    for field_name, value in income_update.model_dump().items():
        if field_name in income_update.model_fields_set:
            setattr(income, field_name, value)

    db.commit()

    return income


@income_router.post('/income/{income_id}/income-filters')
def apply_income_transaction_filters_(
    income_id: int,
    db: Session = Depends(get_database),
) -> list[ReturnTransactionSchemaNoAccount]:
    """
    Apply the given Transaction filters of the given Income to all
    Transactions in the database. This only affects Transactions which
    do not already have an associated Income.

    - income_id: The ID of the Income to apply the filters to.
    """

    # Get the associated Income
    income = require_income(db, income_id, raise_exception=True)
    filters = [
        [TransactionFilter.model_validate(filter) for filter in filter_group]
        for filter_group in income.transaction_filters
    ]

    if not filters:
        return []

    # Associate the Expense with the matching Transactions
    for transaction in apply_transaction_filters(income, filters, db).all():
        transaction.income = income

    db.commit()

    # Return the filtered Transactions
    return income.transactions # type: ignore
