from csv import reader as csv_reader
from datetime import datetime
from io import StringIO

from fastapi.datastructures import UploadFile
from sqlalchemy.orm.session import Session

from app.models.transaction import Transaction
from app.models.balance import Balance
from app.models.upload import Upload
from app.schemas.balance import NewBalanceSchema
from app.schemas.transaction import NewTransactionSchema
from app.utils.logging import log


def create_upload(file: UploadFile, account_id: int, db: Session) -> Upload:
    """
    Create a new Upload from a file. This new Upload will be added to
    the database, but will not have any Transactions associated with it.

    Args:
        file: The file to create the Upload from.
        account_id: The ID of the Account that the Upload belongs to.
        db: The database session.

    Returns:
        The created Upload.
    """

    upload = Upload(
        filename=file.filename,
        data=file.file.read(),
        upload_date=datetime.now(),
        account_id=account_id,
    )
    db.add(upload)
    db.commit()

    return upload


def parse_generic_upload(upload: Upload) -> list[NewTransactionSchema]:
    """
    Parse a generic upload into a list of NewTransactionSchemas.

    Args:
        upload: The Upload to parse.

    Returns:
        A list of NewTransactionSchemas.
    """

    # Parse the raw Upload data into a CSV stream
    file_stream = StringIO(upload.data.decode('utf-8'))
    reader = csv_reader(file_stream)

    return [
        NewTransactionSchema(
            date=datetime.strptime(line[0], '%Y-%m-%d'),
            description=line[1],
            note=line[2],
            amount=line[3],
            bill_id=line[4] or None,
            expense_id=line[6] or None,
            income_id=line[5] or None,
            transfer_id=line[7] or None,
            account_id=upload.account_id,
        )
        for line in reader
        if line and line[0] and line[0].lower() != 'date'
    ]


def remove_redundant_transactions(
        transactions: list[NewTransactionSchema],
        db: Session,
    ) -> list[NewTransactionSchema]:
    """
    Remove any transactions which already exist in the database from the
    list of transactions.

    Args:
        transactions: The list of NewTransactionSchemas to remove
            redundant transactions from.
        db: The database session.

    Returns:
        A list of NewTransactionSchemas with the redundant transactions
        removed.
    """

    def is_redundant(transaction: NewTransactionSchema) -> bool:
        """Check if a transaction is redundant."""

        redundant = db.query(Transaction).filter(
            Transaction.date == transaction.date,
            Transaction.amount == transaction.amount,
            Transaction.account_id == transaction.account_id,
        ).first()

        if redundant:
            log.debug(f'Redundant transaction: {redundant}')
        return redundant

    return [
        transaction
        for transaction in transactions
        if not is_redundant(transaction)
    ]


def add_transactions_to_database(
    transactions: list[NewTransactionSchema],
    upload_id: int,
    db: Session,
) -> list[Transaction]:
    """
    Add the list of NewTransactionSchemas to the database.

    Args:
        transactions: The list of NewTransactionSchemas to add.
        upload_id: The ID of the Upload that the Transactions belong to.
        db: The database session.

    Returns:
        A list of Transactions.
    """

    db_transactions = []
    for transaction in remove_redundant_transactions(transactions, db):
        new_transaction = Transaction(
            **transaction.model_dump(exclude={'related_transaction_ids'}),
            upload_id=upload_id,
        )
        db.add(new_transaction)
        db_transactions.append(new_transaction)

    db.commit()

    return db_transactions


def add_balances_to_database(
    balances: list[NewBalanceSchema],
    db: Session,
) -> list[Balance]:
    """
    Add the list of NewBalanceSchemas to the database.

    Args:
        balances: The list of NewBalanceSchemas to add.
        upload_id: The ID of the Upload that the Balances belong to.
        db: The database session.

    Returns:
        A list of Balances. May be not the same length as the input list
        if there are duplicates or existing Balances.
    """

    db_balances = []
    for balance in balances:
        # Skip if there is already a Balance for this Account and Date
        if not db.query(Balance).filter(
            Balance.account_id == balance.account_id,
            Balance.date == balance.date,
        ).first():
            new_balance = Balance(
                account_id=balance.account_id,
                date=balance.date,
                balance=balance.balance,
            )
            db.add(new_balance)
            db_balances.append(new_balance)

    db.commit()

    return db_balances
