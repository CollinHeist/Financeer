from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.account import Account
    from app.models.user import User


class PlaidItem(Base):
    __tablename__ = 'plaid_items'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    access_token: Mapped[str] = mapped_column(String, nullable=False)
    last_refresh: Mapped[datetime] = mapped_column(default=func.now())

    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'))
    user: Mapped['User'] = relationship('User', back_populates='plaid_items')

    accounts: Mapped[list['Account']] = relationship(
        'Account',
        back_populates='plaid_item',
    )
