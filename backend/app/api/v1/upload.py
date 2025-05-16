from fastapi import APIRouter, Depends, Query
from fastapi.datastructures import UploadFile
from sqlalchemy.orm.session import Session

from app.api.deps import get_database
from app.core.upload import (
    add_transactions_to_database,
    create_upload,
    parse_generic_upload,
)
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

    transactions = parse_iccu_upload(upload)

    return add_transactions_to_database(transactions, upload.id, db)


@upload_router.post('/new/citi')
def upload_citi_transactions(
    file: UploadFile,
    account_id: int = Query(...),
    db: Session = Depends(get_database),
) -> list[ReturnTransactionSchema]:
    """
    Upload an Citi Bank TransactionCSV file.

    - account_id: The ID of the Account to upload the Transactions to.
    """

    upload = create_upload(file, account_id, db)

    transactions = parse_citi_upload(upload)

    return add_transactions_to_database(transactions, upload.id, db)
