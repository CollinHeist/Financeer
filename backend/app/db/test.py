from datetime import date, datetime, timedelta
from pathlib import Path
from random import randint, random

from sqlalchemy.orm import Session

from app.core.upload import add_transactions_to_database
from app.models import Account, Expense, Income, Transaction, Upload
from app.services.citi import parse_citi_upload
from app.services.iccu import parse_iccu_upload
from app.utils.logging import log


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
        'expense_id': None,
        'income_id': 1,
    },
    # Restaurant purchase on credit card
    {
        'date': date(2025, 5, 10),
        'description': 'Restaurant',
        'note': '',
        'amount': -80.00,
        'account_id': 3,
        'expense_id': None,
        'income_id': None,
    },
    # Restaurant payback into checking
    {
        'date': date(2025, 5, 11),
        'description': 'CashApp Payment',
        'note': 'Payback for restaurant purchase',
        'amount': 40,
        'account_id': 1,
        'expense_id': None,
        'income_id': None,
        'related_transaction_ids': [5],
    },
    # Spotify on credit card
    {
        'date': date(2025, 5, 14),
        'description': 'Spotify',
        'note': '',
        'amount': -14.99,
        'account_id': 3,
        'expense_id': 7,
        'income_id': None,
    },
]


def _generate_random_transactions(
    db: Session,
    amount: int = 100,
    start_date: date = date(2024, 8, 1),
    expense_probability: float = 0.8,
) -> None:
    for i in range(amount):
        related_transaction_ids = [
            randint(0, db.query(Transaction).count() - 1)
            for _ in range(randint(0, 5))
        ] if random() > 0.8 and i > 1 else []
        related_transactions = [
            db.query(Transaction).get(tid)
            for tid in related_transaction_ids
            if db.query(Transaction).get(tid) is not None
        ]
        transaction = Transaction(
            date=start_date + timedelta(days=randint(0, 365)),
            description=f'Random Transaction #{i}',
            amount=randint(-100, 100),
            account_id=randint(1, 3),
            expense_id=randint(1, 7) if random() > expense_probability else None,
            income_id=None,
        )
        transaction.related_transactions = related_transactions
        db.add(transaction)
        db.commit()


def upload_bank_transactions(db: Session) -> bool:

    root_dir = Path(__file__).parent.parent.parent.parent

    # Checking transactions
    checking_transactions = root_dir / 'bank_upload.csv'
    if checking_transactions.exists():
        upload = Upload(
            filename=checking_transactions.name,
            data=checking_transactions.read_bytes(),
            upload_date=datetime.now(),
            account_id=1,
        )
        db.add(upload)
        transactions = parse_iccu_upload(upload)
        add_transactions_to_database(transactions, upload.id, db)
        log.debug(
            f'Uploaded {len(transactions)} transactions from {upload.filename}'
        )

    # Credit card transactions
    credit_transactions = root_dir / 'credit_upload.csv'
    if credit_transactions.exists():
        upload = Upload(
            filename=credit_transactions.name,
            data=credit_transactions.read_bytes(),
            upload_date=datetime.now(),
            account_id=1,
        )
        db.add(upload)
        transactions = parse_citi_upload(upload)
        add_transactions_to_database(transactions, upload.id, db)
        log.debug(
            f'Uploaded {len(transactions)} transactions from {upload.filename}'
        )

    return checking_transactions.exists() or credit_transactions.exists()


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
        transaction_filters=[
            [{"on": "description", "type": "contains", "value": "AdelFi"}]
        ]
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
        transaction_filters=[
            [
                {
                    "on": "description",
                    "type": "contains",
                    "value": "American Education Services"
                }
            ]
        ]
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
        transaction_filters=[
            [{"on": "description", "type": "contains", "value": "USAA Insurance"}]
        ]
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
    for transaction in TEST_TRANSACTIONS:
        # Query related transactions if provided
        related = []
        if 'related_transaction_ids' in transaction:
            related = [
                db.query(Transaction).get(id)
                for id in transaction.pop('related_transaction_ids')
            ]

        trans = Transaction(**transaction)
        if related:
            trans.related_transactions = related # type: ignore
        db.add(trans)
        db.commit()

    if not upload_bank_transactions(db):
        _generate_random_transactions(db)

    db.commit()
