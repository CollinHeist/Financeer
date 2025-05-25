from datetime import date

from fastapi import APIRouter, Body, Depends, Query
from sqlalchemy import and_
from sqlalchemy.orm.session import Session

from app.api.deps import get_database
from app.db.query import require_account, require_bill
from app.models.bill import Bill
from app.models.transaction import Transaction
from app.schemas.bill import (
    NewBillSchema,
    ReturnBillSchema,
    UpdateBillSchema,
)
from app.schemas.transaction import ReturnTransactionSchemaNoAccount


bill_router = APIRouter(
    prefix='/bills',
    tags=['Bills'],
)


@bill_router.get('/all')
def get_all_bills(
    on: date | None = Query(default_factory=lambda: date.today()),
    db: Session = Depends(get_database),
) -> list[ReturnBillSchema]:

    filters = []
    if on is not None:
        filters.append(Bill.start_date <= on)
        filters.append(or_(Bill.end_date.is_(None), Bill.end_date >= on))

    return db.query(Bill).filter(*filters).order_by(Bill.name).all() # type: ignore


@bill_router.post('/bill/new')
def create_bill(
    new_bill: NewBillSchema = Body(...),
    db: Session = Depends(get_database),
) -> ReturnBillSchema:
    """
    Create a new Bill.

    - new_bill: Definition of the new Bill to create.
    """

    # Verify the Account exists
    require_account(db, new_bill.account_id, raise_exception=True)

    bill = Bill(**new_bill.model_dump())
    db.add(bill)
    db.commit()

    return bill


@bill_router.get('/bill/{bill_id}')
def get_bill_by_id(
    bill_id: int,
    db: Session = Depends(get_database),
) -> ReturnBillSchema:
    """
    Get the Bill with the given ID.

    - bill_id: The ID of the Bill to get.
    """

    return require_bill(db, bill_id, raise_exception=True)


@bill_router.delete('/bill/{bill_id}')
def delete_bill(
    bill_id: int,
    db: Session = Depends(get_database),
) -> None:
    """
    Delete the Bill with the given ID.

    - bill_id: The ID of the Bill to delete.
    """

    bill = require_bill(db, bill_id, raise_exception=True)
    db.delete(bill)
    db.commit()


@bill_router.put('/bill/{bill_id}')
def update_bill(
    bill_id: int,
    bill_update: NewBillSchema = Body(...),
    db: Session = Depends(get_database),
) -> ReturnBillSchema:

    # Get the existing Bill
    bill = require_bill(db, bill_id, raise_exception=True)

    # Verify the source Account exists
    require_account(db, bill_update.account_id, raise_exception=True)

    # Update all attributes
    for key, value in bill_update.model_dump().items():
        setattr(bill, key, value)

    db.commit()

    return bill


@bill_router.patch('/bill/{bill_id}')
def partially_update_bill(
    bill_id: int,
    bill_update: UpdateBillSchema = Body(...),
    db: Session = Depends(get_database),
) -> ReturnBillSchema:

    # Get the existing Bill
    bill = require_bill(db, bill_id, raise_exception=True)
    
    # Verify Account ID if it's being updated
    if ('account_id' in bill_update.model_fields_set
        and bill_update.account_id is not None):
        require_account(db, bill_update.account_id, raise_exception=True)

    # Update only the provided fields
    for key, value in bill_update.model_dump().items():
        if key in bill_update.model_fields_set:
            setattr(bill, key, value)

    db.commit()

    return bill


@bill_router.get('/account/{account_id}/all')
def get_all_account_bills(
    account_id: int,
    db: Session = Depends(get_database),
) -> list[ReturnBillSchema]:

    return (
        db.query(Bill)
            .filter(Bill.account_id == account_id)
            .order_by(Bill.name)
            .all()
    ) # type: ignore


@bill_router.get('/suggest')
def suggest_bills(
    min_similarity: float = Query(0.8, ge=0.0, le=1.0),
    min_occurrences: int = Query(2, ge=1),
    db: Session = Depends(get_database),
) -> list[dict]:
    """
    Suggest possible Bills based on similar Transactions.
    
    - min_similarity: Minimum similarity score between transaction descriptions (0.0 to 1.0)
    - min_occurrences: Minimum number of similar transactions to suggest a bill
    """
    from difflib import SequenceMatcher
    from collections import defaultdict
    from statistics import mean, stdev

    # Get all unassigned transactions
    transactions = (
        db.query(Transaction)
            .filter(
                and_(
                    Transaction.bill_id.is_(None),
                    Transaction.expense_id.is_(None),
                    Transaction.income_id.is_(None),
                    Transaction.transfer_id.is_(None),
                )
            )
            .order_by(Transaction.date.desc())
            .all()
    )

    # Group Transactions by similar descriptions and amounts
    groups = defaultdict(list)
    processed = set()

    for i, t1 in enumerate(transactions):
        if t1.id in processed:
            continue

        current_group = [t1]
        processed.add(t1.id)

        # Compare with other transactions
        for t2 in transactions[i+1:]:
            if t2.id in processed:
                continue

            # Calculate similarity between descriptions
            similarity = SequenceMatcher(None, t1.description.lower(), t2.description.lower()).ratio()

            # Check if amounts are similar (within 10% of each other)
            amount_diff = abs(t1.amount - t2.amount) / max(abs(t1.amount), abs(t2.amount))

            if similarity >= min_similarity and amount_diff <= 0.1:
                current_group.append(t2)
                processed.add(t2.id)

        # Only keep groups with enough occurrences
        if len(current_group) >= min_occurrences:
            # Use the most common description as the group key
            desc_counts = defaultdict(int)
            for t in current_group:
                desc_counts[t.description.lower()] += 1
            group_key = max(desc_counts.items(), key=lambda x: x[1])[0]
            groups[group_key].extend(current_group)

    # Convert groups to Bill suggestions
    suggestions = []
    for desc, transactions in groups.items():
        amounts = [t.amount for t in transactions]
        dates = [t.date for t in transactions]

        # Calculate average amount and standard deviation
        avg_amount = mean(amounts)
        amount_std = stdev(amounts) if len(amounts) > 1 else 0

        # Calculate average days between transactions
        date_diffs = []
        for i in range(len(dates)-1):
            date_diffs.append((dates[i] - dates[i+1]).days)
        avg_days = mean(date_diffs) if date_diffs else None

        # Determine frequency
        frequency = None
        if avg_days is not None:
            if 27 <= avg_days <= 31:
                frequency = {"type": "monthly", "day": dates[0].day}
            elif 6 <= avg_days <= 8:
                frequency = {"type": "weekly", "day": dates[0].weekday()}
            elif 13 <= avg_days <= 15:
                frequency = {"type": "biweekly", "day": dates[0].weekday()}

        # Create transaction filter
        filter_value = desc
        if len(desc) > 3:
            # Try to find a common prefix
            words = desc.split()
            if len(words) > 1:
                filter_value = words[0]

        suggestion = {
            "name": desc.title(),
            "description": f"Suggested Bill based on {len(transactions)} similar transactions",
            "amount": round(avg_amount, 2),
            "amount_std": round(amount_std, 2),
            "frequency": frequency,
            "start_date": min(dates),
            "transaction_count": len(transactions),
            "transaction_filters": [[{
                "on": "description",
                "type": "contains",
                "value": filter_value
            }]],
            "example_transactions": [
                {
                    "date": t.date,
                    "description": t.description,
                    "amount": t.amount
                }
                for t in transactions[:3]  # Show first 3 examples
            ]
        }
        suggestions.append(suggestion)

    return suggestions
