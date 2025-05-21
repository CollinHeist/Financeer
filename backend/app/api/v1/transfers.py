from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy.orm import joinedload
from sqlalchemy.orm.session import Session

from app.api.deps import get_database
from app.db.query import require_account, require_transfer
from app.models.transfer import Transfer
from app.schemas.transfers import (
    NewTransferSchema,
    ReturnTransferSchema,
    UpdateTransferSchema,
)


transfers_router = APIRouter(
    prefix='/transfers',
    tags=['Transfers'],
)


@transfers_router.get('/all')
def get_all_transfers(
    db: Session = Depends(get_database),
) -> list[ReturnTransferSchema]:
    """Get all Transfers from the database."""

    return (
        db.query(Transfer)
            .order_by(Transfer.name)
            .options(
                joinedload(Transfer.from_account),
                joinedload(Transfer.to_account)
            )
            .all()
    ) # type: ignore


@transfers_router.post('/transfer/new')
def create_new_transfer(
    new_transfer: NewTransferSchema = Body(...),
    db: Session = Depends(get_database),
) -> ReturnTransferSchema:
    """
    Add a new Transfer to the database.

    - new_transfer: The new Transfer details.
    """

    # Verify that both Accounts exist
    require_account(db, new_transfer.from_account_id)
    to_account = require_account(db, new_transfer.to_account_id)

    # Verify the recieving Account is a Credit Card if the Transfer is
    # marked as a payoff
    if new_transfer.payoff_balance:
        if to_account.type != 'credit_card':
            raise HTTPException(
                status_code=400,
                detail='Credit Card Account is required for payoff transfers'
            )

    # Add to the database
    transfer = Transfer(**new_transfer.model_dump())
    db.add(transfer)
    db.commit()

    return transfer


@transfers_router.get('/transfer/{transfer_id}')
def get_transfer(
    transfer_id: int,
    db: Session = Depends(get_database),
) -> ReturnTransferSchema:
    """
    Get a Transfer by its ID.

    - transfer_id: The ID of the Transfer to get.
    """

    return require_transfer(db, transfer_id)


@transfers_router.put('/transfer/{transfer_id}')
def update_transfer(
    transfer_id: int,
    update_transfer: NewTransferSchema = Body(...),
    db: Session = Depends(get_database),
) -> ReturnTransferSchema:
    """
    Update a Transfer by its ID.

    - transfer_id: The ID of the Transfer to update.
    - update_transfer: The updated Transfer details.
    """

    transfer = require_transfer(db, transfer_id)

    for key, value in update_transfer.model_dump().items():
        if key != 'related_transaction_ids':
            setattr(transfer, key, value)

    db.commit()

    return transfer


@transfers_router.patch('/transfer/{transfer_id}')
def patch_transfer(
    transfer_id: int,
    update_transfer: UpdateTransferSchema = Body(...),
    db: Session = Depends(get_database),
) -> ReturnTransferSchema:
    """
    Partially update a Transfer.

    - transfer_id: The ID of the Transfer to update.
    - update_transfer: The updated Trasfer.
    """

    # Get the existing Transfer
    transfer = require_transfer(db, transfer_id)
    
    # Verify IDs if they're being updated
    if 'from_account_id' in update_transfer.model_fields_set:
        require_account(db, update_transfer.from_account_id)
    if 'to_account_id' in update_transfer.model_fields_set:
        require_account(db, update_transfer.to_account_id)

    # Update only the provided fields
    for key, value in update_transfer.model_dump().items():
        if key in update_transfer.model_fields_set:
            setattr(transfer, key, value)

    db.commit()

    return transfer


@transfers_router.delete('/transfer/{transfer_id}')
def delete_transfer(
    transfer_id: int,
    db: Session = Depends(get_database),
) -> None:
    """
    Delete a Transfer by its ID.

    - transfer_id: The ID of the Transfer to delete.
    """

    db.delete(require_transfer(db, transfer_id))
    db.commit()
