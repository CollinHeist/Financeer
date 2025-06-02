from datetime import date
from typing import Generator

from fastapi import HTTPException
from sqlalchemy.orm import Session, load_only

from app.core.dates import date_range
from app.db.query import require_account, require_plaid_item
from app.models.balance import Balance
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.balance import NewBalanceSchema
from app.services.plaid import PlaidService
from app.utils.logging import log


def get_starting_balance(
    account_id: int,
    date_: date,
    db: Session,
) -> tuple[float, date]:
    """Get the starting balance for an account at a given date."""

    # Get the most recent Balance for the Account
    balance = (
        db.query(Balance)
            .filter(
                Balance.account_id == account_id,
                Balance.date <= date_,
            )
            .order_by(Balance.date.desc())
            .first()
    )

    # No Balance found, return 0.0
    if not balance:
        return 0.0, date_

    # If the Balance is for the given date, return the balance
    if balance.date == date_:
        return balance.balance, balance.date

    # The balance is before the given date, apply Transactions from the
    # balance date to the latest Transaction date
    transactions = (
        db.query(Transaction)
            .filter(
                Transaction.account_id == account_id,
                Transaction.date > balance.date,
            )
            .order_by(Transaction.date.desc())
            .options(
                load_only(
                    Transaction.account_id,
                    Transaction.date,
                    Transaction.amount,
                ),
            )
            .all()
    )

    return (
        balance.balance + sum(t.amount for t in transactions),
        transactions[-1].date,
    )


def get_projected_balance(
    account_id: int,
    target_dates: list[date],
    db: Session,
) -> Generator[tuple[date, float], None, None]:
    """
    Get the projected balance for an account at a list of dates, taking into account
    the most recent Balance and projecting future Bills, Transfers, and Incomes.

    Args:
        account_id: The ID of the account to get the balance for
        target_dates: The list of dates to project the balance to
        db: The database session

    Yields:
        Tuples of (date, balance) for each target date
    """

    if not target_dates:
        return

    # Sort dates to ensure chronological processing
    target_dates = sorted(target_dates)

    # Get the starting balance and date
    starting_balance, start_date = get_starting_balance(account_id, target_dates[0], db)
    log.info(f'Starting balance: {starting_balance} on {start_date}')

    # If the first target date is before or equal to the start date, yield the starting balance
    if target_dates[0] <= start_date:
        yield target_dates[0], starting_balance
        current_balance = starting_balance
        current_date = start_date
    else:
        current_balance = starting_balance
        current_date = start_date

    # Get all bills, transfers, and incomes for the account
    if not (account := require_account(db, account_id)):
        for target_date in target_dates:
            yield target_date, starting_balance
        return

    # Project the balance forward by applying bills, transfers, and incomes
    for target_date in target_dates:
        log.info(f'Processing {target_date}')
        # Skip dates before the current date
        if target_date <= current_date:
            yield target_date, current_balance
            continue

        # Process each date up to the target date
        for date_ in date_range(current_date, target_date):
            # Apply bills
            for bill in account.bills:
                current_balance += bill.get_effective_amount(date_)

            # Apply incomes
            for income in account.incomes:
                current_balance += income.get_effective_amount(date_)

            # Apply both sets of Transfers
            for transfer in account.outgoing_transfers + account.incoming_transfers:
                current_balance += transfer.get_effective_amount(date_, account_id)
        log.debug(f'Apply models for {current_date} -> {target_date} (${current_balance:,.2f})')
        current_date = target_date
        yield target_date, current_balance


def sync_plaid_balance(
    account_id: int,
    user: User,
    db: Session,
) -> Balance:
    """Sync the balance for an account from Plaid."""

    # Verify the account exists and belongs to the user
    if (not (account := require_account(db, account_id)).plaid_account_id
        or not account.plaid_item_id):
        raise HTTPException(
            status_code=422,
            detail='Account is not linked to Plaid'
        )

    # Get the Plaid item
    plaid_item = require_plaid_item(db, account.plaid_item_id)
    if plaid_item.user_id != user.id:
        raise HTTPException(
            status_code=403,
            detail='Account does not belong to user'
        )

    # Get updated account information from Plaid
    plaid_accounts = PlaidService().get_accounts(plaid_item.access_token)
    matching_account = next(
        (acc for acc in plaid_accounts if acc['id'] == account.plaid_account_id),
        None
    )

    if not matching_account:
        raise HTTPException(
            status_code=404,
            detail='Plaid account not found'
        )

    new_balance = NewBalanceSchema(
        account_id=account_id,
        balance=matching_account['balances']['current'],
        date=date.today()
    )
    balance = Balance(**new_balance.model_dump())
    db.add(balance)
    db.commit()

    return balance
