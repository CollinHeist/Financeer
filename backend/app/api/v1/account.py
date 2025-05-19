from datetime import datetime, timedelta
from app.models.transaction import Transaction
from fastapi import APIRouter, Body, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm.session import Session

from app.api.deps import get_database
from app.db.query import require_account
from app.models.account import Account
from app.models.balance import Balance
from app.schemas.account import (
    NewAccountSchema,
    ReturnAccountSchema,
    ReturnAccountSummarySchema,
    SummaryTimePeriod,
)


account_router = APIRouter(
    prefix='/account',
    tags=['Account'],
)


@account_router.post('/new')
def create_account(
    new_account: NewAccountSchema = Body(...),
    db: Session = Depends(get_database),
) -> ReturnAccountSchema:

    # Add the new Account to the database
    account = Account(**new_account.model_dump(exclude={'balance'}))
    db.add(account)
    db.commit()

    # Add the starting Balance for the Account
    db.add(Balance(
        account_id=account.id,
        date=new_account.balance.date,
        balance=new_account.balance.balance,
    ))
    db.commit()

    return account


@account_router.get('/all')
def get_all_accounts(
    db: Session = Depends(get_database),
) -> list[ReturnAccountSchema]:

    return db.query(Account).order_by(Account.name).all() # type: ignore


@account_router.get('/banks')
def get_bank_accounts(
    db: Session = Depends(get_database),
) -> list[ReturnAccountSchema]:

    return [
        ReturnAccountSchema(**account.__dict__)
        for account in db.query(Account)
            .filter(
                or_(
                    Account.type == 'checking',
                    Account.type == 'investment',
                    Account.type == 'savings',
                )
            )
            .all()
    ]


@account_router.get('/{account_id}')
def get_account_by_id(
    account_id: int,
    db: Session = Depends(get_database),
) -> ReturnAccountSchema:

    return require_account(db, account_id, raise_exception=True)


@account_router.delete('/{account_id}')
def delete_account(
    account_id: int,
    db: Session = Depends(get_database),
) -> None:

    account = require_account(db, account_id, raise_exception=True)
    db.delete(account)
    db.commit()

    return None


@account_router.get('/{account_id}/summary')
def get_account_summary(
    account_id: int,
    time_period: SummaryTimePeriod = Query(default='this month'),
    db: Session = Depends(get_database),
) -> ReturnAccountSummarySchema:

    # Get the start date for the time period
    today = datetime.now().date()
    if time_period == 'today':
        start_date = today
    elif time_period == 'this week':
        start_date = today - timedelta(days=today.weekday())
    elif time_period == 'this month':
        start_date = today.replace(day=1)
    elif time_period == 'this quarter':
        start_date = today.replace(month=((today.month - 1) // 3) * 3 + 1)

    # Get the transactions for the account
    transactions = (
        db.query(Transaction)
            .filter(
                Transaction.account_id == account_id,
                Transaction.date >= start_date,
            )
            .all()
    )

    # If there is no last Balance, use the transaction totals
    if (last_balance := require_account(db, account_id).last_balance) is None:
        balance = sum(t.amount for t in transactions if t.amount)
    # Otherwise, add the last Balance to the transaction totals since
    # the date of the last Balance
    else:
        balance = (
            last_balance.balance
            + sum(
                t.amount for t in db.query(Transaction)
                    .filter(
                        Transaction.account_id == account_id,
                        Transaction.date > last_balance.date,
                    )
                    .all()
            )
        )

    return ReturnAccountSummarySchema(
        balance=balance,
        income=sum(t.amount for t in transactions if t.amount > 0),
        expenses=sum(t.amount for t in transactions if t.amount < 0),
    )
