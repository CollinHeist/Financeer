from datetime import date, datetime
from pathlib import Path

from sqlalchemy.orm import Session

from app.core.upload import add_transactions_to_database, parse_iccu_upload
from app.models import Account, Expense, Income, Upload


def initialize_test_data(db: Session) -> None:

    # Add test accounts
    account = Account(
        name='ICCU Checking',
        type='checking',
        account_number=1234567890,
        routing_number=9876543210,
        interest=0.0,
    )
    db.add(account)
    savings_account = Account(
        name='Savings',
        type='savings',
        account_number=9,
        routing_number=1,
        interest=0.03,
    )
    db.add(savings_account)
    db.commit()

    # Add test expenses
    car_loan = Expense(
        name='Car Loan',
        description='AdelFi Tesla Loan',
        amount=-950,
        type='monthly',
        start_date=date(2022, 1, 10),
        end_date=date(2028, 1, 10),
        from_account_id=account.id,
        to_account_id=None,
        change_schedule=[],
        transaction_filters=[],
    )
    db.add(car_loan)

    student_loan = Expense(
        name='Student Loan',
        description='ICCU Student Loan',
        amount=-350,
        type='monthly',
        start_date=date(2024, 6, 1),
        end_date=date(2028, 6, 1),
        from_account_id=account.id,
        to_account_id=None,
        change_schedule=[],
        transaction_filters=[],
    )
    db.add(student_loan)

    savings = Expense(
        name='Savings',
        description='Savings Transfer',
        amount=-250,
        type='monthly',
        start_date=date(2024, 6, 1),
        end_date=date(2028, 6, 1),
        from_account_id=account.id,
        to_account_id=savings_account.id,
        change_schedule=[],
        transaction_filters=[],
    )
    db.add(savings)
    # Add test incomes
    ipco_income = Income(
        name='Idaho Power Salary',
        amount=2950,
        type='recurring',
        frequency=14,
        start_date=date(2021, 1, 10),
        end_date=date(2045, 1, 10),
        account_id=account.id,
        change_schedule=[
            # Bonus
            {
                'type': 'bonus',
                'amount': 0.05,
                'is_percentage': True,
                'start_date': date(2021, 3, 14),
                'frequency': 365,
            },
            # COLA
            {
                'type': 'raise',
                'amount': 1.05,
                'is_percentage': True,
                'start_date': date(2022, 1, 28),
                'frequency': 365,
            },
            # Raises
            {
                'type': 'raise',
                'amount': 1.0349,
                'is_percentage': True,
                'start_date': date(2022, 7, 14),
                'frequency': 7 * 4 * 6,
            },
        ],
    )
    db.add(ipco_income)

    github_income = Income(
        name='Github Salary',
        amount=425,
        type='monthly',
        frequency=None,
        start_date=date(2023, 6, 15),
        account_id=account.id,
        change_schedule=[],
    )
    db.add(github_income)

    # Upload Transactions
    iccu_transactions = Path(__file__).parent.parent.parent.parent / 'iccu_2024_upload.csv'
    upload = Upload(
        filename=iccu_transactions.name,
        data=iccu_transactions.read_bytes(),
        upload_date=datetime.now(),
        account_id=account.id,
    )
    db.add(upload)
    transactions = parse_iccu_upload(upload)
    add_transactions_to_database(transactions, upload.id, db)

    db.commit()
