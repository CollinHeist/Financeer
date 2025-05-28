from collections import defaultdict
from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.deps import get_database
from app.core.dates import get_month_start, get_month_end, date_meets_frequency
from app.models.bill import Bill
from app.models.expense import Expense
from app.models.transaction import Transaction
from app.schemas.cashflow import (
    ReturnMonthlyAccountSnapshotSchema,
    ReturnMonthlyCashFlowItemSchema,
    DailyExpenseComparison,
)
from app.utils.logging import log


cashflow_router = APIRouter(
    prefix='/cash-flow',
    tags=['Cashflow'],
)


@cashflow_router.get('/monthly/{account_id}')
def get_monthly_cash_flow(
    account_id: int,
    start_date: date = Query(...),
    end_date: date = Query(...),
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


@cashflow_router.get('/average-daily-expenses/account/{account_id}')
def get_average_daily_expenses(
    account_id: int,
    start_date: date = Query(...),
    end_date: date = Query(...),
    db: Session = Depends(get_database),
) -> list[DailyExpenseComparison]:
    """
    Calculate the average expenses for each day of the month for an Account between start_date and end_date.
    Only considers transactions with negative amounts (expenses).
    Separates current month's transactions from historical averages.

    - start_date: The start date of the date range.
    - end_date: The end date of the date range.
    - account_id: The ID of the account to calculate expenses for.
    """

    # Get current month's transactions
    current_month_start = date(end_date.year, end_date.month, 1)
    current_month_transactions = (
        db.query(Transaction)
        .filter(
            Transaction.account_id == account_id,
            Transaction.date >= current_month_start,
            Transaction.date <= end_date,
            Transaction.amount < 0
        )
        .all()
    )

    # Get historical transactions (excluding current month)
    historical_transactions = (
        db.query(Transaction)
        .filter(
            Transaction.account_id == account_id,
            Transaction.date >= start_date,
            Transaction.date < current_month_start,
            Transaction.amount < 0
        )
        .all()
    )

    # Calculate historical averages
    historical_expenses = defaultdict(lambda: {"total": 0.0, "count": 0})
    for transaction in historical_transactions:
        day = transaction.date.day
        historical_expenses[day]["total"] += abs(transaction.amount)
        historical_expenses[day]["count"] += 1

    # Calculate current month's daily expenses
    current_month_expenses = defaultdict(lambda: {"total": 0.0})
    for transaction in current_month_transactions:
        day = transaction.date.day
        current_month_expenses[day]["total"] += abs(transaction.amount)
        log.debug(f'[{day}] = {current_month_expenses[day]["total"]} + {transaction.amount}')

    # Combine data for each day
    daily_comparisons = []
    for day in range(1, 32):
        historical_avg = (
            historical_expenses[day]["total"] / historical_expenses[day]["count"]
            if historical_expenses[day]["count"] > 0
            else 0.0
        )
        
        daily_comparisons.append(DailyExpenseComparison(
            day_of_month=day,
            historical_average=round(historical_avg, 2),
            current_month=round(current_month_expenses[day]["total"], 2) if day in current_month_expenses else None
        ))

    return daily_comparisons


@cashflow_router.get('/monthly/account/{account_id}/snapshot')
def get_monthly_account_snapshot(
    account_id: int,
    start_date: date = Query(default_factory=lambda: get_month_start(date.today())),
    end_date: date = Query(default_factory=lambda: get_month_end(date.today())),
    db: Session = Depends(get_database),
) -> list[ReturnMonthlyAccountSnapshotSchema]:
    """
    Get a snapshot of the monthly cash flow for an Account between start_date and end_date.
    """

    # Get all Bills which are active during the month
    bills = (
        db.query(Bill)
            .filter(
                Bill.account_id == account_id,
                Bill.start_date <= end_date,
                or_(Bill.end_date.is_(None), Bill.end_date >= start_date),
            )
            .all()
    )

    # Get all Expenses which are active during the month
    expenses = (
        db.query(Expense)
            .filter(Expense.is_active)
            .all()
    )

    # Get all Transactions from the month
    transactions = (
        db.query(Transaction)
            .filter(
                Transaction.account_id == account_id,
                Transaction.date >= start_date,
                Transaction.date <= end_date,
            )
            .all()
    )

    # Calculate spent amounts for each bill and expense
    bill_spent = defaultdict(float)
    expense_spent = defaultdict(float)

    # Group transactions by bill_id and expense_id
    for transaction in transactions:
        if transaction.bill_id:
            bill_spent[transaction.bill_id] += transaction.amount
        if transaction.expense_id:
            expense_spent[transaction.expense_id] += transaction.amount

    # Create return items for bills
    bill_items = []
    for bill in bills:
        # Calculate the effective budget amount for this month
        budget_amount = 0.0
        if bill.type == 'one_time':
            # For one-time bills, only include if they occur in this month
            if bill.start_date >= start_date:
                budget_amount = bill.get_effective_amount(bill.start_date)
        elif bill.frequency is not None:  # recurring bills
            current_date = start_date
            while current_date <= end_date:
                if date_meets_frequency(current_date, bill.start_date, bill.frequency):
                    budget_amount += bill.get_effective_amount(current_date)
                current_date = current_date + timedelta(days=1)

        if budget_amount < -0.01 or budget_amount > 0.01:
            bill_items.append(ReturnMonthlyAccountSnapshotSchema(
                spent=bill_spent[bill.id],
                budget=budget_amount,
                bill_id=bill.id,
                bill_name=bill.name,
            ))

    # Create return items for expenses
    expense_items = [
        ReturnMonthlyAccountSnapshotSchema(
            spent=expense_spent[expense.id],
            budget=expense.amount,
            expense_id=expense.id,
            expense_name=expense.name,
        )
        for expense in expenses
    ]

    # Combine and return all items
    return bill_items + expense_items

    
