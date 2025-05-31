from datetime import datetime
from sqlalchemy.orm import Session

from app.models.plaid import PlaidItem


def store_access_token(
    access_token: str,
    user_id: int,
    db: Session,
) -> PlaidItem:
    """
    Store a Plaid access token in the database.
    
    Args:
        access_token: The access token to store
        user_id: The ID of the user who owns this token.
        db: The database session.

    Returns:
        The created PlaidItem.
    """

    plaid_item = PlaidItem(access_token=access_token, user_id=user_id)
    db.add(plaid_item)
    db.commit()
    db.refresh(plaid_item)

    return plaid_item
