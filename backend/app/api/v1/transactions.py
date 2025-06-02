from collections import defaultdict
from datetime import date, timedelta, datetime
from typing import Literal

from app.core.upload import (
    add_transactions_to_database,
    remove_redundant_transactions,
)
from fastapi import APIRouter, Body, Depends, Query, HTTPException
from fastapi_pagination import Page
from fastapi_pagination.ext.sqlalchemy import paginate
from sqlalchemy import and_, or_, true
from sqlalchemy.orm import joinedload
from sqlalchemy.orm.session import Session

from app.core.auth import get_current_user
from app.db.deps import get_database
from app.core.dates import date_range
from app.core.transactions import apply_transaction_filters
from app.db.query import (
    require_account,
    require_bill,
    require_expense,
    require_income,
    require_transaction,
    require_transfer,
)
from app.models.account import Account
from app.models.bill import Bill
from app.models.expense import Expense
from app.models.income import Income
from app.models.transfer import Transfer
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.core import TransactionFilter
from app.schemas.transaction import (
    NewSplitTransactionSchema,
    NewTransactionSchema,
    ReturnTransactionSchema,
    ReturnTransactionSchemaNoAccount,
    ReturnUpcomingTransactionSchema,
    UpdateTransactionSchema,
    BillBreakdownResponse,
    BillBreakdownItem
)
from app.services.plaid import PlaidService
from app.utils.logging import log


transaction_router = APIRouter(
    prefix='/transactions',
    tags=['Transactions'],
)


@transaction_router.get('/all')
def get_transactions(
    account_ids: list[int] | None = Query(default=None),
    contains: str | None = Query(default=None),
    unassigned_only: bool = Query(default=False),
    db: Session = Depends(get_database),
) -> Page[ReturnTransactionSchema]:
    """
    Get all Transactions which match the provided filters.

    - account_ids: Optional Account IDs to filter by.
    - contains: Optional string to filter by in the Transaction's
    description or note.
    - unassigned_only: Whether to only include Transactions which are not
    associated with an Bill or Income.
    """ 

    filters = []
    if account_ids is not None:
        filters.append(Transaction.account_id.in_(account_ids))
    if contains is not None:
        filters.append(or_(
            Transaction.description.contains(contains),
            Transaction.note.contains(contains),
        ))
    if unassigned_only:
        filters.append(and_(
            Transaction.bill_id.is_(None),
            Transaction.expense_id.is_(None),
            Transaction.income_id.is_(None),
            Transaction.transfer_id.is_(None),
        ))

    return paginate(
        db.query(Transaction)
            .filter(and_(*filters))
            .order_by(Transaction.date.desc())
            .options(
                joinedload(Transaction.account),
                joinedload(Transaction.bill),
                joinedload(Transaction.income),
            )
    )


@transaction_router.put('/filters')
def query_transactions_from_filters(
    id: int = Query(...),
    type: Literal['bill', 'expense', 'income', 'transfer'] = Query(...),
    filters: list[list[TransactionFilter]] = Body(default=[]),
    db: Session = Depends(get_database),
) -> list[ReturnTransactionSchema]:
    """
    Get all Transactions which would meet the prospective filter
    criteria.

    - id: The ID of the Bill, Expense, Income, or Transfer to get
    Transactions for.
    - type: The type of model to get Transactions for.
    - filters: The filters to apply to the Transactions.
    """

    if type == 'bill':
        model = require_bill(db, id, raise_exception=True)
    elif type == 'expense':
        model = require_expense(db, id, raise_exception=True)
    elif type == 'income':
        model = require_income(db, id, raise_exception=True)
    elif type == 'transfer':
        model = require_transfer(db, id, raise_exception=True)

    return (
        apply_transaction_filters(
            model,
            filters,
            db,
            include_currently_selected=True,
        )
        .order_by(Transaction.date.desc())
        .all()
    ) # type: ignore


@transaction_router.post('/filters')
def apply_all_transaction_filters(
    db: Session = Depends(get_database),
) -> None:
    """
    Apply all Transaction filters to all Transactions in the database.
    """

    for model, field in [
        (Bill, Transaction.bill_id),
        (Expense, Transaction.expense_id),
        (Income, Transaction.income_id),
        (Transfer, Transaction.transfer_id),
    ]:
        for item in db.query(model).all():
            filters = [
                [TransactionFilter.model_validate(filter) for filter in filter_group]
                for filter_group in item.transaction_filters
            ]

            if not filters:
                continue
            # Associate the Bill with all matching Transactions
            apply_transaction_filters(
                item, filters, db, include_currently_selected=False
            ).update({field: item.id}, synchronize_session='fetch')

    db.commit()

    return None


@transaction_router.post('/transaction/new')
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
    if new_transaction.bill_id is not None:
        require_bill(db, new_transaction.bill_id)
    if new_transaction.income_id is not None:
        require_income(db, new_transaction.income_id)
    if new_transaction.transfer_id is not None:
        require_transfer(db, new_transaction.transfer_id)
    related_transactions = []
    if new_transaction.related_transaction_ids:
        related_transactions = [
            require_transaction(db, id)
            for id in new_transaction.related_transaction_ids
        ]

    # Create and add to the database; exclude related_transaction_ids
    # as these will be set after the Transaction is created
    transaction = Transaction(**new_transaction.model_dump(
        exclude={'related_transaction_ids'}
    ))
    transaction.related_transactions = related_transactions

    db.add(transaction)
    db.commit()

    return transaction


@transaction_router.get('/transaction/{transaction_id}')
def get_transaction_by_id(
    transaction_id: int,
    db: Session = Depends(get_database),
) -> ReturnTransactionSchema:
    """
    Get the details of a Transaction.

    - transaction_id: ID of the Transaction to get details for.
    """


    return require_transaction(db, transaction_id)


@transaction_router.delete('/transaction/{transaction_id}')
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


@transaction_router.put('/transaction/{transaction_id}')
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
    if updated_transaction.bill_id is not None:
        require_bill(db, updated_transaction.bill_id)
    if updated_transaction.expense_id is not None:
        require_expense(db, updated_transaction.expense_id)
    if updated_transaction.income_id is not None:
        require_income(db, updated_transaction.income_id)
    if updated_transaction.transfer_id is not None:
        require_transfer(db, updated_transaction.transfer_id)
    related_transactions = []
    if updated_transaction.related_transaction_ids:
        related_transactions = [
            require_transaction(db, id)
            for id in updated_transaction.related_transaction_ids
        ]

    for key, value in updated_transaction.model_dump().items():
        if key not in {'related_transaction_ids'}:
            setattr(transaction, key, value)
    transaction.related_transactions = related_transactions

    db.commit()

    return transaction


@transaction_router.patch('/transaction/{transaction_id}')
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
    transaction = require_transaction(db, transaction_id)

    # Verify IDs if they're being updated
    if 'account_id' in updated_transaction.model_fields_set:
        require_account(db, updated_transaction.account_id)
    if ('bill_id' in updated_transaction.model_fields_set
        and updated_transaction.bill_id is not None):
        require_bill(db, updated_transaction.bill_id)
    if ('expense_id' in updated_transaction.model_fields_set
        and updated_transaction.expense_id is not None):
        require_expense(db, updated_transaction.expense_id)
    if ('income_id' in updated_transaction.model_fields_set
        and updated_transaction.income_id is not None):
        require_income(db, updated_transaction.income_id)
    if ('transfer_id' in updated_transaction.model_fields_set
        and updated_transaction.transfer_id is not None):
        require_transfer(db, updated_transaction.transfer_id)
    if ('related_transaction_ids' in updated_transaction.model_fields_set
        and updated_transaction.related_transaction_ids is not None):
        transaction.related_transactions = [
            require_transaction(db, id)
            for id in updated_transaction.related_transaction_ids
        ]

    # Update only the provided fields
    for key, value in updated_transaction.model_dump().items():
        if key in updated_transaction.model_fields_set:
            if key not in {'related_transaction_ids'}:
                setattr(transaction, key, value)

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

    # Get all Bills which will be active over the given time period
    bills = (
        db.query(Bill)
            .filter(
                Bill.account_id == account_id,
                Bill.start_date <= end,
                or_(Bill.end_date.is_(None), Bill.end_date >= start),
            )
            .all()
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

    transfers = (
        db.query(Transfer)
            .filter(
                or_(
                    Transfer.from_account_id == account_id,
                    Transfer.to_account_id == account_id,
                ),
                Transfer.start_date <= end,
                or_(Transfer.end_date.is_(None), Transfer.end_date >= start),
            ).all()
    )

    upcoming_bills = []
    for date_ in date_range(start, end):
        for bill in bills:
            if (amount := bill.get_effective_amount(date_)) != 0.0:
                upcoming_bills.append(
                    ReturnUpcomingTransactionSchema(
                        name=bill.name,
                        amount=amount,
                        date=date_,
                        bill_id=bill.id,
                    )
                )
        for income in incomes:
            if (amount := income.get_effective_amount(date_)) != 0.0:
                upcoming_bills.append(
                    ReturnUpcomingTransactionSchema(
                        name=income.name,
                        amount=amount,
                        date=date_,
                        income_id=income.id,
                    )
                )
        for transfer in transfers:
            if (amount := transfer.get_effective_amount(date_, account_id)):
                amount *= -1 if account_id == transfer.from_account_id else 1
                upcoming_bills.append(
                    ReturnUpcomingTransactionSchema(
                        name=f'Transfer to {transfer.to_account.name}',
                        amount=amount,
                        date=date_,
                        transfer_id=transfer.id,
                    )
                )

    return upcoming_bills


@transaction_router.get('/bill/{bill_id}')
def get_bill_transactions(
    bill_id: int,
    db: Session = Depends(get_database),
) -> list[ReturnTransactionSchemaNoAccount]:
    """Get all Transactions associated with the given Bill."""

    return (
        db.query(Transaction)
            .filter(Transaction.bill_id == bill_id)
            .order_by(Transaction.date.desc())
            .all()
    ) # type: ignore


@transaction_router.get('/expense/{expense_id}')
def get_expense_transactions(
    expense_id: int,
    db: Session = Depends(get_database),
) -> list[ReturnTransactionSchemaNoAccount]:
    """Get all Transactions associated with the given Expense."""

    return (
        db.query(Transaction)
            .filter(Transaction.expense_id == expense_id)
            .order_by(Transaction.date.desc())
            .all()
    ) # type: ignore


@transaction_router.get('/income/{income_id}')
def get_income_transactions(
    income_id: int,
    db: Session = Depends(get_database),
) -> list[ReturnTransactionSchemaNoAccount]:
    """Get all Transactions associated with the given Income."""

    return (
        db.query(Transaction)
            .filter(Transaction.income_id == income_id)
            .order_by(Transaction.date.desc())
            .all()
    ) # type: ignore


@transaction_router.get('/account/{account_id}/bill-breakdown')
def get_account_bill_breakdown(
    account_id: int | Literal['all'],
    start_date: date = Query(...),
    end_date: date = Query(...),
    db: Session = Depends(get_database),
) -> BillBreakdownResponse:
    """
    Get a breakdown of bills for an account within a date range.
    
    - account_id: The ID of the account to get bill breakdown for
    - start_date: The start date of the period to analyze
    - end_date: The end date of the period to analyze
    """

    # Ignore Transfers to Credit Accounts if getting all Acount details
    ignore_transfer_ids: list[int] = []
    if account_id == 'all':
        ignore_transfer_ids = [
            transfer.id
            for transfer in
            db.query(Transfer)
                .filter(Transfer.to_account_id.in_([
                    account.id
                    for account in
                    db.query(Account).filter(Account.type == 'credit').all()
                ]))
                .all()
        ]

    # Get all transactions for the account in the date range
    transactions = (
        db.query(Transaction)
            .filter(
                (
                    true()
                    if account_id == 'all'
                    else Transaction.account_id == account_id
                ),
                Transaction.date >= start_date,
                Transaction.date <= end_date,
                Transaction.amount < 0, # Only include Bills
                or_(
                    Transaction.transfer_id.is_(None),
                    Transaction.transfer_id.not_in(ignore_transfer_ids),
                )
            )
            .options(
                joinedload(Transaction.bill),
                joinedload(Transaction.expense),
            )
            .all()
    )

    transfers = {
        transaction.id: require_transfer(
            db, transaction.transfer_id
        ).to_account.name
        for transaction in db.query(Transaction).filter(
            Transaction.transfer_id.in_([
                transfer.id
                for transfer in db.query(Transfer).filter(
                    (
                        true()
                        if account_id == 'all'
                        else Transfer.from_account_id == account_id
                    ),
                    Transfer.start_date <= end_date,
                    or_(
                        Transfer.end_date.is_(None),
                        Transfer.end_date >= start_date,
                    ),
                ).all()
            ]),
            (
                true()
                if account_id == 'all'
                else Transaction.account_id == account_id
            ),
            Transaction.date >= start_date,
            Transaction.date <= end_date,
        ).all()
        if transaction.transfer_id is not None
    }

    # Group Transactions by Bill/Expense/Transfer name and calculate totals
    bill_totals = defaultdict(lambda: {'total': 0.0, 'count': 0})
    for transaction in transactions:
        bill_name = 'Uncategorized'
        if transaction.bill:
            bill_name = transaction.bill.name
        elif transaction.expense:
            bill_name = transaction.expense.name
        elif transaction.id in transfers:
            bill_name = f'Transfer to {transfers[transaction.id]}'
        else:
            print(f'{transaction.date} "{transaction.description}" is not a bill, expense, or transfer')
            print(f'  {transaction.transfer_id=} {ignore_transfer_ids}')
        bill_totals[bill_name]['total'] += abs(transaction.amount)
        bill_totals[bill_name]['count'] += 1

    # Convert to response format
    breakdown = sorted(
        [
            BillBreakdownItem(
                bill_name=name,
                total_amount=data['total'],
                transaction_count=data['count'] # type: ignore
            )
            for name, data in bill_totals.items()
        ],
        key=lambda x: x.total_amount, reverse=True
    )

    return BillBreakdownResponse(
        total_bill=sum(item.total_amount for item in breakdown),
        breakdown=breakdown
    )


@transaction_router.get('/transfer/{transfer_id}')
def get_transfer_transactions(
    transfer_id: int,
    db: Session = Depends(get_database),
) -> list[ReturnTransactionSchemaNoAccount]:
    """Get all Transactions associated with the given Transfer."""

    return (
        db.query(Transaction)
            .filter(Transaction.transfer_id == transfer_id)
            .order_by(Transaction.date.desc())
            .all()
    ) # type: ignore


@transaction_router.post('/transaction/{transaction_id}/split')
def split_transaction(
    transaction_id: int,
    splits: list[NewSplitTransactionSchema] = Body(...),
    db: Session = Depends(get_database),
) -> list[ReturnTransactionSchema]:
    """Split a Transaction into multiple Transactions."""

    # Get the original Transaction
    transaction = require_transaction(db, transaction_id)

    # Create the new Transactions
    new_transactions: list[Transaction] = []
    for index, split in enumerate(splits):
        new_transaction = Transaction(
            account_id=transaction.account_id,
            date=transaction.date,
            description=(
                f'{transaction.description} - Split {index + 1} of {len(splits)}'
            ),
            note=f'{transaction.note} - {split.note}',
            amount=split.amount,
        )
        db.add(new_transaction)
        new_transactions.append(new_transaction)
    db.commit()

    # Set the original Transaction amount to zero; associate with new
    # Transactions
    transaction.amount = 0.0
    transaction.related_transactions = new_transactions
    db.commit()

    return new_transactions # type: ignore


@transaction_router.post('/account/{account_id}/sync')
async def sync_account_transactions(
    account_id: int,
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
    db: Session = Depends(get_database),
    user: User = Depends(get_current_user),
) -> list[ReturnTransactionSchema]:
    """
    Sync all Transactions from Plaid for a given Account..

    - account_id: The ID of the Account to sync transactions for.
    - start_date: The start date of the time period to sync transactions
    for. If not provided, the date of the last sync will be used.
    - end_date: The end date of the time period to sync transactions
    for. If not provided, the current date will be used.
    """

    # Get the Account
    account = require_account(db, account_id)
    if ((plaid_item := account.plaid_item) is None
        or not account.plaid_account_id):
        raise HTTPException(
            status_code=400,
            detail='Account is not linked to Plaid'
        )

    # Get the Plaid item and verify it belongs to the user
    if plaid_item.user_id != user.id:
        raise HTTPException(
            status_code=403,
            detail='Plaid item does not belong to the current User'
        )

    # Create new transactions in our database; remove redundant ones
    plaid_service = PlaidService()
    new_transactions = remove_redundant_transactions(
        [
            NewTransactionSchema(
                account_id=account_id,
                date=transaction['date'],
                description=transaction['name'],
                amount=transaction['amount'],
                plaid_transaction_id=transaction['id']
            )
            for transaction in plaid_service.get_transactions(
                access_token=plaid_item.access_token,
                account_ids=[account.plaid_account_id],
                start_date=start_date or plaid_item.last_refresh,
                end_date=end_date,
            )
        ],
        db
    )

    # Add the new Transactions to the database
    transactions = add_transactions_to_database(new_transactions, db)

    # Update last refresh time
    plaid_item.last_refresh = datetime.now()
    db.commit()

    return transactions # type: ignore


@transaction_router.post('/sync')
async def sync_all_account_transactions(
    start_date: datetime | None = Query(default=None),
    db: Session = Depends(get_database),
    user: User = Depends(get_current_user),
) -> list[ReturnTransactionSchema]:
    """
    Sync all transactions for all accounts.

    - start_date: The start date of the time period to sync transactions
    for. If not provided, the date of the last sync will be used.
    """

    plaid_service = PlaidService()
    transactions: list[ReturnTransactionSchema] = []
    for account in db.query(Account).all():
        # Skip this Account if it not linked to Plaid
        if ((plaid_item := account.plaid_item) is None
            or not account.plaid_account_id
            or plaid_item.user_id != user.id):
            log.debug(
                f'Skipping account {account.id} because it is not linked to Plaid'
            )
            continue

        # Create new Transactions in the database; remove redundant ones
        log.debug(
            f'Syncing Transactions from '
            f'{start_date or plaid_item.last_refresh} to today'
        )
        new_transactions = remove_redundant_transactions(
            [
                NewTransactionSchema(
                    account_id=account.id,
                    date=transaction['date'],
                    description=transaction['name'],
                    amount=transaction['amount'],
                    plaid_transaction_id=transaction['id']
                )
                for transaction in plaid_service.get_transactions(
                    access_token=plaid_item.access_token,
                    account_ids=[account.plaid_account_id],
                    start_date=start_date or plaid_item.last_refresh,
                )
            ],
            db
        )
        log.debug(
            f'Synced {len(new_transactions)} transactions for account {account.id}'
        )

        # Add the new Transactions to the database
        transactions.extend(add_transactions_to_database(new_transactions, db))

        # Update last refresh time
        plaid_item.last_refresh = datetime.now()
        db.commit()

    return transactions # type: ignore
