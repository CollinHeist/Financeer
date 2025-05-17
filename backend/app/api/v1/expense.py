from datetime import date

from fastapi import APIRouter, Body, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm.session import Session

from app.api.deps import get_database
from app.core.expenses import apply_transaction_filters
from app.db.query import require_account, require_expense
from app.models.expense import Expense
from app.models.income import Income
from app.models.transaction import Transaction
from app.schemas.core import TransactionFilter
from app.schemas.expense import (
    NewExpenseSchema,
    ReturnExpenseSchema,
    UpdateExpenseSchema,
)
from app.schemas.transaction import ReturnTransactionSchemaNoAccount


expense_router = APIRouter(
    prefix='/expenses',
    tags=['Expenses'],
)


@expense_router.get('/all')
def get_all_expenses(
    on: date | None = Query(default_factory=lambda: date.today()),
    db: Session = Depends(get_database),
) -> list[ReturnExpenseSchema]:

    filters = []
    if on is not None:
        filters.append(Expense.start_date <= on)
        filters.append(or_(Expense.end_date.is_(None), Expense.end_date >= on))

    return db.query(Expense).filter(*filters).order_by(Expense.name).all() # type: ignore


@expense_router.post('/expense/new')
def create_expense(
    new_expense: NewExpenseSchema = Body(...),
    db: Session = Depends(get_database),
) -> ReturnExpenseSchema:
    """
    Create a new Expense.

    - new_expense: Definition of the new Expense to create.
    """

    # Verify the source and destination Accounts exist
    require_account(db, new_expense.from_account_id, raise_exception=True)
    if new_expense.to_account_id is not None:
        require_account(db, new_expense.to_account_id, raise_exception=True)

    expense = Expense(**new_expense.model_dump())
    db.add(expense)
    db.commit()

    return expense


@expense_router.get('/expense/{expense_id}')
def get_expense_by_id(
    expense_id: int,
    db: Session = Depends(get_database),
) -> ReturnExpenseSchema:
    """
    Get the Expense with the given ID.

    - expense_id: The ID of the Expense to get.
    """

    return require_expense(db, expense_id, raise_exception=True)


@expense_router.delete('/expense/{expense_id}')
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_database),
) -> None:
    """
    Delete the Expense with the given ID.

    - expense_id: The ID of the Expense to delete.
    """

    expense = require_expense(db, expense_id, raise_exception=True)
    db.delete(expense)
    db.commit()


@expense_router.put('/expense/{expense_id}')
def update_expense(
    expense_id: int,
    expense_update: NewExpenseSchema = Body(...),
    db: Session = Depends(get_database),
) -> ReturnExpenseSchema:

    # Get the existing expense
    expense = require_expense(db, expense_id, raise_exception=True)

    # Verify the source and destination Accounts exist
    require_account(db, expense_update.from_account_id, raise_exception=True)
    if expense_update.to_account_id is not None:
        require_account(db, expense_update.to_account_id, raise_exception=True)

    # Update all attributes
    for key, value in expense_update.model_dump().items():
        setattr(expense, key, value)

    db.commit()

    return expense


@expense_router.patch('/expense/{expense_id}')
def partially_update_expense(
    expense_id: int,
    expense_update: UpdateExpenseSchema = Body(...),
    db: Session = Depends(get_database),
) -> ReturnExpenseSchema:

    # Get the existing expense
    expense = require_expense(db, expense_id, raise_exception=True)
    
    # Verify account IDs if they're being updated
    if ('from_account_id' in expense_update.model_fields_set
        and expense_update.from_account_id is not None):
        require_account(db, expense_update.from_account_id, raise_exception=True)

    if ('to_account_id' in expense_update.model_fields_set
        and expense_update.to_account_id is not None):
        require_account(db, expense_update.to_account_id, raise_exception=True)

    # Update only the provided fields
    for key, value in expense_update.model_dump().items():
        if key in expense_update.model_fields_set:
            setattr(expense, key, value)

    db.commit()

    return expense


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
            .order_by(Expense.name)
            .all()
     ) # type: ignore


@expense_router.get('/account/{account_id}/from')
def get_expenses_from_account(
    account_id: int,
    db: Session = Depends(get_database),
) -> list[ReturnExpenseSchema]:

    return [
        ReturnExpenseSchema.model_validate(expense)
        for expense in
        db.query(Expense).filter(Expense.from_account_id == account_id).all()
    ]


@expense_router.get('/account/{account_id}/to')
def get_expenses_to_account(
    account_id: int,
    db: Session = Depends(get_database),
) -> list[ReturnExpenseSchema]:

    return [
        ReturnExpenseSchema.model_validate(expense)
        for expense in
        db.query(Expense).filter(Expense.to_account_id == account_id).all()
    ]


@expense_router.post('/expense/{expense_id}/transaction-filters')
def apply_expense_transaction_filters_(
    expense_id: int,
    db: Session = Depends(get_database),
) -> list[ReturnTransactionSchemaNoAccount]:
    """
    Apply the given Transaction filters of the given Expense to all
    Transactions in the database. This only affects Transactions which
    do not already have an associated Expense.

    - expense_id: The ID of the Expense to apply the filters to.
    """

    # Get the associated Expense and Transaction filters
    expense = require_expense(db, expense_id, raise_exception=True)
    filters = [
        [TransactionFilter.model_validate(filter) for filter in filter_group]
        for filter_group in expense.transaction_filters
    ]

    if not filters:
        return []

    # Associate the Expense with the matching Transactions
    for transaction in apply_transaction_filters(expense, filters, db).all():
        transaction.expense = expense

    db.commit()

    # Return the filtered Transactions
    return expense.transactions # type: ignore


@expense_router.post('/expense-filters')
def apply_all_expense_filters(
    db: Session = Depends(get_database),
) -> None:
    """
    Apply all Transaction filters of all Expenses to all Transactions in
    the database.
    """

    # Apply all Transaction filters of all defined Expenses
    for expense in db.query(Expense).all():
        filters = [
            [TransactionFilter.model_validate(filter) for filter in filter_group]
            for filter_group in expense.transaction_filters
        ]

        if not filters:
            continue

        # Associate the Expense with the matching Transactions
        apply_transaction_filters(
            expense, filters, db, include_currently_selected=False
        ).update({Transaction.expense_id: expense.id}, synchronize_session='fetch')

    # Apply all Transaction filters of all defined Incomes
    for income in db.query(Income).all():
        filters = [
            [TransactionFilter.model_validate(filter) for filter in filter_group]
            for filter_group in income.transaction_filters
        ]

        if not filters:
            continue

        # Associate the Expense with the matching Transactions
        apply_transaction_filters(
            income, filters, db, include_currently_selected=False
        ).update({Transaction.income_id: income.id}, synchronize_session='fetch')

    db.commit()

    return None
