from typing import TYPE_CHECKING

from sqlalchemy import Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.schemas.account import AccountType

if TYPE_CHECKING:
    from app.models.expense import Expense
    from app.models.income import Income
    from app.models.transaction import Transaction
    from app.models.upload import Upload


class Account(Base):
    __tablename__ = 'accounts'

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    name: Mapped[str] = mapped_column(String, index=True)
    type: Mapped['AccountType'] = mapped_column(String, index=True)
    account_number: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
    routing_number: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
    interest: Mapped[float] = mapped_column(Float, default=0.0)

    incomes: Mapped[list['Income']] = relationship(
        'Income',
        back_populates='account',
    )

    transactions: Mapped[list['Transaction']] = relationship(
        'Transaction',
        back_populates='account',
    )

    uploads: Mapped[list['Upload']] = relationship(
        'Upload',
        back_populates='account',
    )
