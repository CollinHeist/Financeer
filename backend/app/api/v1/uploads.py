from fastapi import APIRouter, Depends, Query
from fastapi.datastructures import UploadFile
from sqlalchemy.orm.session import Session

from app.db.deps import get_database
from app.core.upload import (
    add_balances_to_database,
    add_transactions_to_database,
    create_upload,
    parse_generic_upload,
)
from app.schemas.transaction import ReturnTransactionSchema
from app.services.apple import parse_apple_upload
from app.services.capital_one import parse_capital_one_upload
from app.services.chase import parse_chase_upload
from app.services.citi import parse_citi_upload
from app.services.iccu import parse_iccu_upload
from app.services.vanguard import parse_vanguard_upload
from app.utils.logging import log


upload_router = APIRouter(
    prefix='/uploads',
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


@upload_router.post('/new/apple')
def upload_apple_transactions(
    files: list[UploadFile],
    account_id: int = Query(...),
    db: Session = Depends(get_database),
) -> list[ReturnTransactionSchema]:
    """
    Upload Apple Card Transaction .csv file(s).

    - files: A list of Apple Card Transaction .csv files.
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


@upload_router.post('/new/capital-one')
def upload_capital_one_transactions(
    files: list[UploadFile],
    account_id: int = Query(...),
    db: Session = Depends(get_database),
) -> list[ReturnTransactionSchema]:
    """
    Upload Capital One Transaction .csv file(s).

    - files: A list of Capital One Transaction .csv files.
    - account_id: The ID of the Account to upload the Transactions to.
    """

    transactions = []
    for file in files:
        upload = create_upload(file, account_id, db)

        raw_transactions = parse_capital_one_upload(upload)

        transactions.extend(
            add_transactions_to_database(raw_transactions, upload.id, db)
        )

    return transactions


@upload_router.post('/new/chase')
def upload_chase_transactions(
    files: list[UploadFile],
    account_id: int = Query(...),
    db: Session = Depends(get_database),
) -> list[ReturnTransactionSchema]:
    """
    Upload an Chase Bank Transaction .csv file.

    - files: A list of Chase Bank Transaction .csv files.
    - account_id: The ID of the Account to upload the Transactions to.
    """

    transactions = []
    for file in files:
        upload = create_upload(file, account_id, db)

        raw_transactions = parse_chase_upload(upload)

        transactions.extend(
            add_transactions_to_database(raw_transactions, upload.id, db)
        )

    return transactions


@upload_router.post('/new/citi')
def upload_citi_transactions(
    files: list[UploadFile],
    account_id: int = Query(...),
    db: Session = Depends(get_database),
) -> list[ReturnTransactionSchema]:
    """
    Upload an Citi Bank Transaction .csv file.

    - files: A list of Citi Bank Transaction .csv files.
    - account_id: The ID of the Account to upload the Transactions to.
    """

    transactions = []
    for file in files:
        upload = create_upload(file, account_id, db)

        transactions.extend(
            add_transactions_to_database(
                parse_citi_upload(upload), upload.id, db
            )
        )

    return transactions


@upload_router.post('/new/iccu')
def upload_iccu_transactions(
    files: list[UploadFile],
    account_id: int = Query(...),
    db: Session = Depends(get_database),
) -> list[ReturnTransactionSchema]:
    """
    Upload an Idaho Central Credit Union (ICCU) Transaction .csv file.

    - files: A list of ICCU Transaction .csv files.
    - account_id: The ID of the Account to upload the Transactions to.
    """

    transactions = []
    for file in files:
        upload = create_upload(file, account_id, db)

        balances, raw_transactions = parse_iccu_upload(upload)

        add_balances_to_database(balances, db)
        transactions.extend(
            add_transactions_to_database(raw_transactions, upload.id, db)
        )

    return transactions


@upload_router.post('/new/vanguard')
def upload_vanguard_transactions(
    files: list[UploadFile],
    account_id: int = Query(...),
    db: Session = Depends(get_database),
) -> list[ReturnTransactionSchema]:
    """
    Upload a Vanguard Transaction .csv file.

    - account_id: The ID of the Account to upload the Transactions to.
    """

    transactions = []
    for file in files:
        upload = create_upload(file, account_id, db)

        transactions.extend(
            add_transactions_to_database(
                parse_vanguard_upload(upload), upload.id, db
            )
        )
        log.info(f'Uploaded {len(transactions)} transactions from {file.filename}')

    return transactions
