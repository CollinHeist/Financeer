from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.plaid import store_access_token
from app.db.deps import get_database
from app.db.query import require_account, require_plaid_item
from app.models.user import User
from app.models.plaid import PlaidItem
from app.services.plaid import PlaidService
from app.schemas.plaid import (
    NewLinkAccountSchema,
    ReturnAccessTokenResponse,
    ReturnLinkTokenResponse,
    ReturnPlaidAccountInfoSchema,
)


router = APIRouter(
    prefix='/plaid',
    tags=['Plaid'],
    dependencies=[Depends(get_current_user)],
)

plaid_service = PlaidService()


@router.post('/link-token')
async def create_link_token(
    current_user: User = Depends(get_current_user),
) -> ReturnLinkTokenResponse:
    """Create a link token for initializing a Plaid Link."""

    return ReturnLinkTokenResponse(
        link_token=plaid_service.create_link_token(current_user.username)
    )


@router.post('/exchange-token')
async def exchange_public_token(
    public_token: str = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database),
) -> ReturnAccessTokenResponse:
    """Exchange a public token for an access token and store it in the database."""

    # Exchange the public token for an access token
    access_token = plaid_service.exchange_public_token(public_token)

    # Store the access token in the database
    store_access_token(access_token, current_user.id, db)

    return ReturnAccessTokenResponse(access_token=access_token)


@router.post('/link-account')
async def link_plaid_account(
    link_account_request: NewLinkAccountSchema = Body(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_database),
) -> None:
    """
    Link a Plaid account to an existing Account.
    
    Args:
        link_account_request: The details of the accounts to link.
    """

    # Verify the PlaidItem exists and belongs to the user
    plaid_item = (
        db.query(PlaidItem)
            .filter(
                PlaidItem.id == link_account_request.plaid_item_id,
                PlaidItem.user_id == user.id
            )
            .first()
    )

    if not plaid_item:
        raise HTTPException(
            status_code=404,
            detail='PlaidItem not found or does not belong to user'
        )

    # Verify the Account exists and isn't already linked
    account = require_account(db, link_account_request.account_id)
    if account.plaid_account_id:
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


# @router.get('/access-token')
# async def get_access_token(
#     user: User = Depends(get_current_user),
#     db: Session = Depends(get_database),
# ) -> AccessTokenResponse:
#     """Get the stored access token for the current user."""

#     # Get the most recent Plaid item for the user
#     plaid_item = (
#         db.query(PlaidItem)
#             .filter(PlaidItem.user_id == user.id)
#             .order_by(PlaidItem.id.desc())
#             .first()
#     )

#     if not plaid_item:
#         raise HTTPException(
#             status_code=404,
#             detail='No Plaid access token found',
#         )

#     return AccessTokenResponse(access_token=plaid_item.access_token)


@router.get('/accounts')
async def get_accounts(
    plaid_item_id: int | None = Query(default=None),
    db: Session = Depends(get_database),
) -> list[ReturnPlaidAccountInfoSchema]:
    """
    Get account information for a given access token.

    - plaid_item_id: The ID of the PlaidItem to get accounts for. If not
    provided, all accounts for all PlaidItems will be returned.
    """

    # Return all Accounts for all PlaidItems
    if plaid_item_id is None:
        accounts = []
        for plaid_item in db.query(PlaidItem).all():
            accounts.extend([
                ReturnPlaidAccountInfoSchema(
                    **account, plaid_item_id=plaid_item.id
                )
                for account in plaid_service.get_accounts(
                    plaid_item.access_token
                )
            ])

        return accounts

    # Return all Accounts for the given PlaidItem
    return [
        ReturnPlaidAccountInfoSchema(**account, plaid_item_id=plaid_item_id)
        for account in plaid_service.get_accounts(
            require_plaid_item(db, plaid_item_id).access_token
        )
    ]
