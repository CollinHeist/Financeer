from fastapi import APIRouter, Depends, Query
from fastapi.datastructures import UploadFile
from sqlalchemy.orm.session import Session

from app.api.deps import get_database
from app.core.upload import (
    add_balances_to_database,
    add_transactions_to_database,
    create_upload,
    parse_generic_upload,
)
from app.services.apple import parse_apple_upload
from app.schemas.transaction import ReturnTransactionSchema
from app.services.citi import parse_citi_upload
from app.services.iccu import parse_iccu_upload


upload_router = APIRouter(
    prefix='/upload',
    tags=['Uploads'],
)


@upload_router.post('/new/generic')
def upload_generic_transactions(
    file: UploadFile,
    account_id: int = Query(...),
    db: Session = Depends(get_database),
) -> list[ReturnTransactionSchema]:
    """
    Upload a generic Transaction file. This needs to be a CSV file with
    the format as:

    date, description, note, amount, expense_id, income_id

    - account_id: The ID of the Account to upload the Transactions to.
    """

    upload = create_upload(file, account_id, db)

    transactions = parse_generic_upload(upload)

    return add_transactions_to_database(transactions, upload.id, db)


@upload_router.post('/new/iccu')
def upload_iccu_transactions(
    file: UploadFile,
    account_id: int = Query(...),
    db: Session = Depends(get_database),
) -> list[ReturnTransactionSchema]:
    """
    Upload an Idaho Central Credit Union (ICCU) TransactionCSV file.

    - account_id: The ID of the Account to upload the Transactions to.
    """

    upload = create_upload(file, account_id, db)

    balances, transactions = parse_iccu_upload(upload)

    add_balances_to_database(balances, db)

    return add_transactions_to_database(transactions, upload.id, db) # type: ignore


@upload_router.post('/new/citi')
def upload_citi_transactions(
    file: UploadFile,
    account_id: int = Query(...),
    db: Session = Depends(get_database),
) -> list[ReturnTransactionSchema]:
    """
    Upload an Citi Bank Transaction .csv file.

    - account_id: The ID of the Account to upload the Transactions to.
    """

    upload = create_upload(file, account_id, db)

    transactions = parse_citi_upload(upload)

    return add_transactions_to_database(transactions, upload.id, db) # type: ignore


@upload_router.post('/new/apple')
def upload_apple_transactions(
    files: list[UploadFile],
    account_id: int = Query(...),
    db: Session = Depends(get_database),
) -> list[ReturnTransactionSchema]:
    """
    Upload Apple Card Transaction .csv file(s).

    - account_id: The ID of the Account to upload the Transactions to.
    """

    transactions = []
    for file in files:
        upload = create_upload(file, account_id, db)

        raw_transactions = parse_apple_upload(upload)

        transactions.extend(
            add_transactions_to_database(raw_transactions, upload.id, db)
        )

    return transactions
