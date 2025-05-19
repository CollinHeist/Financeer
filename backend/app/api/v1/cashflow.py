from collections import defaultdict
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_database
from app.models.transaction import Transaction
from app.schemas.cashflow import ReturnMonthlyCashFlowItemSchema


cashflow_router = APIRouter(
    prefix='/cash-flow',
    tags=['Cashflow'],
)


@cashflow_router.get('/monthly/{account_id}')
def get_monthly_cash_flow(
    account_id: int,
    start_date: Annotated[date, Query()],
    end_date: Annotated[date, Query()],
    db: Session = Depends(get_database),
) -> list[ReturnMonthlyCashFlowItemSchema]:
    """
    Get monthly cash flow details for an Account between start_date and
    end_date.

    - start_date: The start date of the date range.
    - end_date: The end date of the date range.
    - account_id: The ID of the account to get the cash flow for.
    """

    # Get all Transactions for the Account in the date range
    transactions = (
        db.query(Transaction)
        .filter(
            Transaction.account_id == account_id,
            Transaction.date >= start_date,
            Transaction.date <= end_date,
        )
        .all()
    )

    # Group transactions by month and calculate totals
    monthly_data = defaultdict(lambda: {'income': 0.0, 'expenses': 0.0})
    for transaction in transactions:
        month_key = date(transaction.date.year, transaction.date.month, 1)
        category = 'income' if transaction.amount > 0 else 'expenses'
        monthly_data[month_key][category] += abs(transaction.amount)

    # Convert to list of ReturnMonthlyCashFlowItemSchema
    return [
        ReturnMonthlyCashFlowItemSchema(
            date=month_date,
            income=data["income"],
            expenses=data["expenses"],
        )
        for month_date, data in sorted(monthly_data.items())
    ]

