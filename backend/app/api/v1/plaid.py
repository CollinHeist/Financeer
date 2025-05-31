from datetime import datetime, date as date_

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.plaid import store_access_token
from app.db.deps import get_database
from app.db.query import require_account, require_plaid_item
from app.models.user import User
from app.models.plaid import PlaidItem
from app.services.plaid import PlaidService


router = APIRouter(
    prefix='/plaid',
    tags=['Plaid'],
    dependencies=[Depends(get_current_user)],
)

plaid_service = PlaidService()


class LinkTokenResponse(BaseModel):
    link_token: str


class PublicTokenRequest(BaseModel):
    public_token: str


class AccessTokenResponse(BaseModel):
    access_token: str

class AccountBalance(BaseModel):
    available: float
    current: float
    limit: float | None = None

class ReturnAccountInfoSchema(BaseModel):
    id: str
    plaid_item_id: int
    name: str
    # type: str | Any
    # subtype: str | None | Any
    mask: str | None
    balances: AccountBalance

class TransactionInfo(BaseModel):
    id: str
    account_id: str
    amount: float
    date: date_ | datetime | str
    name: str
    merchant_name: str | None
    category: list[str] | None
    pending: bool


class TransactionsResponse(BaseModel):
    transactions: list[TransactionInfo]
    total_transactions: int


class NewLinkAccountSchema(BaseModel):
    plaid_account_id: str
    plaid_item_id: int
    account_id: int


@router.post('/link-token')
async def create_link_token(
    current_user: User = Depends(get_current_user),
) -> LinkTokenResponse:
    """Create a link token for initializing Plaid Link."""

    return LinkTokenResponse(
        link_token=plaid_service.create_link_token(current_user.username)
    )


@router.post('/exchange-token')
async def exchange_public_token(
    request: PublicTokenRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database),
) -> AccessTokenResponse:
    """Exchange a public token for an access token and store it in the database."""

    # Exchange the public token for an access token
    access_token = plaid_service.exchange_public_token(request.public_token)

    # Store the access token in the database
    store_access_token(access_token, current_user.id, db)

    return AccessTokenResponse(access_token=access_token)


@router.post('/link-account')
async def link_plaid_account(
    link_account_request: NewLinkAccountSchema = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database),
) -> None:
    """
    Link a Plaid account to an existing Account.
    
    Args:
        request: The request containing the Plaid account ID, PlaidItem ID, and Account ID
        current_user: The current authenticated user
        db: Database session
    """

    # Verify the PlaidItem exists and belongs to the user
    plaid_item = (
        db.query(PlaidItem)
            .filter(
                PlaidItem.id == link_account_request.plaid_item_id,
                PlaidItem.user_id == current_user.id
            )
            .first()
    )

    if not plaid_item:
        raise HTTPException(
            status_code=404,
            detail='PlaidItem not found or does not belong to user'
        )

    # Verify the Account exists and isn't already linked
    if (account := require_account(db, link_account_request.account_id)).plaid_account_id:
        raise HTTPException(
            status_code=422,
            detail='Account is already linked to a Plaid connection'
        )

    # Verify the Plaid account exists and belongs to the PlaidItem
    matching_plaid_account = None
    for account_info in plaid_service.get_accounts(plaid_item.access_token):
        if account_info['id'] == link_account_request.plaid_account_id:
            matching_plaid_account = account_info
            break

    if not matching_plaid_account:
        raise HTTPException(
            status_code=404,
            detail='Plaid account not found or does not belong to the specified PlaidItem'
        )

    # Update the existing account with Plaid information
    account.plaid_account_id = link_account_request.plaid_account_id
    account.plaid_item_id = link_account_request.plaid_item_id
    db.commit()


@router.get('/access-token')
async def get_access_token(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database),
) -> AccessTokenResponse:
    """Get the stored access token for the current user."""

    # Get the most recent Plaid item for the user
    plaid_item = (
        db.query(PlaidItem)
            .filter(PlaidItem.user_id == current_user.id)
            .order_by(PlaidItem.id.desc())
            .first()
    )

    if not plaid_item:
        raise HTTPException(
            status_code=404,
            detail='No Plaid access token found',
        )

    return AccessTokenResponse(access_token=plaid_item.access_token)


@router.get('/accounts')
async def get_accounts(
    plaid_item_id: int | None = Query(default=None),
    db: Session = Depends(get_database),
) -> list[ReturnAccountInfoSchema]:
    """Get account information for a given access token."""

    if plaid_item_id is None:
        accounts = []
        for plaid_item in db.query(PlaidItem).all():
            accounts.extend([
                ReturnAccountInfoSchema(**account, plaid_item_id=plaid_item.id)
                for account in plaid_service.get_accounts(
                    plaid_item.access_token
                )
            ])

        return accounts

    return [
        ReturnAccountInfoSchema(**account, plaid_item_id=plaid_item_id)
        for account in plaid_service.get_accounts(
            require_plaid_item(db, plaid_item_id).access_token
        )
    ]


@router.get('/transactions')
async def get_transactions(
    access_token: str,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    account_ids: list[str] | None = None,
    count: int = 100,
    offset: int = 0,
) -> TransactionsResponse:
    """Get transactions for a given access token."""

    return plaid_service.get_transactions(
        access_token=access_token,
        start_date=start_date,
        end_date=end_date,
        account_ids=account_ids,
        count=count,
        offset=offset
    ) # type: ignore

