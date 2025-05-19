from typing import TYPE_CHECKING

from sqlalchemy import Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.schemas.account import AccountType

if TYPE_CHECKING:
    from app.models.balance import Balance
    from app.models.expense import Expense
    from app.models.income import Income
    from app.models.transaction import Transaction
    from app.models.transfer import Transfer
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

    expenses: Mapped[list['Expense']] = relationship(
        'Expense',
        back_populates='account',
    )

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

    balances: Mapped[list['Balance']] = relationship(
        'Balance',
        back_populates='account',
        order_by='desc(Balance.date)',
    )

    # Transfer relationships
    outgoing_transfers: Mapped[list['Transfer']] = relationship(
        'Transfer',
        foreign_keys='Transfer.from_account_id',
        back_populates='from_account'
    )

    incoming_transfers: Mapped[list['Transfer']] = relationship(
        'Transfer',
        foreign_keys='Transfer.to_account_id',
        back_populates='to_account'
    )


