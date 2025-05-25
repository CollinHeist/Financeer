from datetime import date

from fastapi import APIRouter, Body, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm.session import Session

from app.api.deps import get_database
from app.core.dates import date_range
from app.db.query import require_account, require_balance
from app.models.balance import Balance
from app.models.bill import Bill
from app.models.expense import Expense
from app.models.income import Income
from app.models.transfer import Transfer
from app.schemas.balance import (
    NewBalanceSchema,
    ReturnBalanceSchema,
    ReturnDailyBalanceSchema,
)


balance_router = APIRouter(
    prefix='/balances',
    tags=['Balance'],
)


@balance_router.post('/balance/new')
def create_balance(
    new_balance: NewBalanceSchema = Body(...),
    db: Session = Depends(get_database),
) -> ReturnBalanceSchema:
    """
    Add a new Balance for a given Account to the database.

    - new_balance: The new balance amount.
    """

    # Verify that the associated Account exists
    require_account(db, new_balance.account_id, raise_exception=True)

    # Add to the database
    balance = Balance(**new_balance.model_dump())
    db.add(balance)
    db.commit()

    return balance


@balance_router.delete('/balance/{balance_id}')
def delete_balance(
    balance_id: int,
    db: Session = Depends(get_database),
) -> None:
    """
    Delete a Balance from the database.

    - balance_id: The ID of the Balance to delete.
    """

    db.delete(require_balance(db, balance_id))
    db.commit()


@balance_router.get('/account/{account_id}')
def get_account_balances(
    account_id: int,
    db: Session = Depends(get_database),
) -> list[ReturnBalanceSchema]:
    """
    Get all Balances for a given Account.

    - account_id: The ID of the Account to get the Balances for.
    """

    return db.query(Balance).filter(Balance.account_id == account_id).all() # type: ignore


@balance_router.get('/account/{account_id}/daily')
def get_daily_balances(
    account_id: int,
    start_date: date = Query(...),
    end_date: date = Query(...),
    db: Session = Depends(get_database),
) -> list[ReturnDailyBalanceSchema]:
    """
    Get or project daily balances for a given Account between start and end dates.
    If a balance doesn't exist for a particular date, it will project the balance
    using the Account's bills and the most recent known balance.

    - account_id: The ID of the Account to get the balances for
    - start_date: The start date for the balance range (inclusive)
    - end_date: The end date for the balance range (inclusive)
    """

    # Get all Balances for the Account up to the end date
    balances = (
        db.query(Balance)
        .filter(
            Balance.account_id == account_id,
            Balance.date <= end_date
        )
        .order_by(Balance.date.desc())
        .all()
    )

    # Get all Bills, Transfers, and Incomes for this Account
    bills = (
        db.query(Bill)
            .filter(
                Bill.account_id == account_id,
                Bill.start_date <= end_date,
                (Bill.end_date >= start_date) | (Bill.end_date.is_(None))
            )
            .all()
    )

    # expenses = (
    #     db.query(Expense)
    #         .filter(
    #             Expense.account_id == account_id,
    #             Expense.start_date <= end_date,
    #             (Expense.end_date >= start_date) | (Expense.end_date.is_(None))
    #         )
    #         .all()
    # )

    transfers = (
        db.query(Transfer)
            .filter(
                or_(
                    Transfer.from_account_id == account_id,
                    Transfer.to_account_id == account_id,
                ),
                Transfer.start_date <= end_date,
                (Transfer.end_date >= start_date) | (Transfer.end_date.is_(None))
            )
            .all()
    )

    incomes = (
        db.query(Income)
            .filter(
                Income.account_id == account_id,
                Income.start_date <= end_date,
                (Income.end_date >= start_date) | (Income.end_date.is_(None))
            )
            .all()
    )

    # Create a dictionary of date -> Balance for quick lookup
    balance_dict = {b.date: b for b in balances}

    # Find the most recent balance before or on the end date
    most_recent_balance = None
    most_recent_date = None
    for balance in balances:
        if balance.date <= end_date:
            most_recent_balance = balance.balance
            most_recent_date = balance.date
            break

    if not most_recent_balance or not most_recent_date:
        return []

    # Generate daily balances
    daily_balances = []
    current_balance = most_recent_balance
    current_date = most_recent_date

    # First, project backwards from most recent balance to start date
    while current_date > start_date:
        current_date = current_date.replace(day=current_date.day - 1)
        # Subtract the effects of bills, transfers, and incomes for this date
        for bill in bills:
            current_balance -= bill.get_effective_amount(current_date)
        for income in incomes:
            current_balance -= income.get_effective_amount(current_date)
        for transfer in transfers:
            current_balance -= transfer.get_effective_amount(current_date, account_id)
        
        # If we have an actual balance for this date, use it instead
        if current_date in balance_dict:
            current_balance = balance_dict[current_date].balance

    # Now project forward from start date to end date
    for current_date in date_range(start_date, end_date):
        # Use actual Balance if it exists
        if current_date in balance_dict:
            current_balance = balance_dict[current_date].balance
        # Project the balance using known Bills
        else:
            for bill in bills:
                current_balance += bill.get_effective_amount(current_date)
            for income in incomes:
                current_balance += income.get_effective_amount(current_date)
            for transfer in transfers:
                current_balance += transfer.get_effective_amount(current_date, account_id)

        daily_balances.append(ReturnDailyBalanceSchema(
            date=current_date,
            balance=current_balance,
        ))

    return daily_balances
