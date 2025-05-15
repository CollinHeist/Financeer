from datetime import date, datetime
from pathlib import Path

from sqlalchemy.orm import Session

from app.core.upload import add_transactions_to_database, parse_iccu_upload
from app.models import Account, Expense, Income, Transaction, Upload


TEST_TRANSACTIONS = [
    # Groceries from checking
    {
        'date': date(2025, 4, 20),
        'description': 'Groceries',
        'note': '',
        'amount': -85.55,
        'account_id': 1,
        'expense_id': None,
        'income_id': None,
    },
    # Savings transfer from checking to savings
    {
        'date': date(2025, 5, 1),
        'description': 'Savings Transfer',
        'note': '',
        'amount': -250,
        'account_id': 1,
        'expense_id': 3,
        'income_id': None,
    },
    {
        'date': date(2025, 5, 1),
        'description': 'Savings Transfer',
        'note': '',
        'amount': 250,
        'account_id': 2,
        'expense_id': None,
        'income_id': None,
    },
    # Paycheck into checking
    {
        'date': date(2025, 5, 14),
        'description': 'Paycheck',
        'note': '',
        'amount': 2500,
        'account_id': 1,
        'expense_id': 1,
        'income_id': None,
    }
]


def initialize_test_data(db: Session) -> None:

    # Add test accounts
    account = Account(
        name='Checking',
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
    credit_card = Account(
        name='Credit Card',
        type='credit',
        account_number=1234567890,
        routing_number=9876543210,
        interest=0.249,
    )
    db.add(credit_card)
    db.commit()

    # Add test expenses
    car_loan = Expense(
        name='Car Loan',
        description='Car Loan',
        amount=-950,
        type='recurring',
        frequency={'value': 1, 'unit': 'months'},
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
        description='Student Loan',
        amount=-350,
        type='recurring',
        frequency={'value': 1, 'unit': 'months'},
        start_date=date(2024, 6, 1),
        end_date=date(2028, 6, 1),
        from_account_id=account.id,
    )
    db.add(student_loan)
    savings = Expense(
        name='Savings',
        description='Savings Transfer',
        amount=-250,
        type='recurring',
        frequency={'value': 1, 'unit': 'months'},
        start_date=date(2024, 6, 1),
        end_date=date(2028, 6, 1),
        from_account_id=account.id,
        to_account_id=savings_account.id,
    )
    db.add(savings)
    downpayment = Expense(
        name='Downpayment',
        description='Downpayment on new house',
        amount=-25000,
        type='one_time',
        start_date=date(2025, 8, 1),
        from_account_id=account.id,
    )
    db.add(downpayment)
    car_insurance = Expense(
        name='Car Insurance',
        description='Car Insurance',
        amount=-500,
        type='recurring',
        frequency={'value': 6, 'unit': 'months'},
        start_date=date(2023, 1, 12),
        from_account_id=credit_card.id,
    )
    db.add(car_insurance)

    car_wash = Expense(
        name='Car Wash',
        description='Car Wash',
        amount=-25,
        type='recurring',
        frequency={'value': 1, 'unit': 'months'},
        start_date=date(2024, 1, 10),
        end_date=None,
        from_account_id=credit_card.id,
        to_account_id=None,
        change_schedule=[],
        transaction_filters=[],
    )
    db.add(car_wash)
    spotify = Expense(
        name='Spotify',
        description='Spotify',
        amount=-14.99,
        type='recurring',
        frequency={'value': 1, 'unit': 'months'},
        start_date=date(2022, 1, 10),
        end_date=None,
        from_account_id=credit_card.id,
        to_account_id=None,
        change_schedule=[],
        transaction_filters=[],
    )
    db.add(spotify)

    # Add test incomes
    base_income = Income(
        name='Salary',
        amount=2950,
        frequency={'value': 2, 'unit': 'weeks'},
        start_date=date(2021, 1, 14),
        end_date=date(2045, 1, 14),
        account_id=account.id,
        raise_schedule=[
            # COLA
            {
                'type': 'raise',
                'amount': 1.05,
                'is_percentage': True,
                'start_date': date(2022, 1, 28),
                'end_date': None,
                'frequency': {'value': 1, 'unit': 'years'},
            },
            # Raises
            {
                'type': 'raise',
                'amount': 1.0349,
                'is_percentage': True,
                'start_date': date(2022, 7, 14),
                'end_date': date(2032, 7, 14),
                'frequency': {'value': 6, 'unit': 'months'},
            },
        ],
    )
    db.add(base_income)

    github_income = Income(
        name='Github Salary',
        amount=425,
        frequency={'value': 1, 'unit': 'months'},
        start_date=date(2023, 6, 15),
        account_id=account.id,
        raise_schedule=[],
    )
    db.add(github_income)

    # Upload Transactions
    iccu_transactions = Path(__file__).parent.parent.parent.parent / 'iccu_upload.csv'
    if iccu_transactions.exists():
        upload = Upload(
            filename=iccu_transactions.name,
            data=iccu_transactions.read_bytes(),
            upload_date=datetime.now(),
            account_id=account.id,
        )
        db.add(upload)
        transactions = parse_iccu_upload(upload)
        add_transactions_to_database(transactions, upload.id, db)
    # Import hard-coded test transactions
    else:
        for transaction in TEST_TRANSACTIONS:
            db.add(Transaction(**transaction))

    db.commit()
