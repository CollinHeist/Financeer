from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, LargeBinary, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.account import Account
    from app.models.transaction import Transaction


class Upload(Base):
    __tablename__ = 'uploads'

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    filename: Mapped[str] = mapped_column(String, index=True)
    data: Mapped[bytes] = mapped_column(LargeBinary)
    upload_date: Mapped[datetime] = mapped_column(DateTime, index=True)

    account_id: Mapped[int] = mapped_column(ForeignKey('accounts.id'))
    account: Mapped['Account'] = relationship(
        'Account',
        back_populates='uploads',
    )

    transactions: Mapped[list['Transaction']] = relationship(
        'Transaction',
        back_populates='upload',
    )
