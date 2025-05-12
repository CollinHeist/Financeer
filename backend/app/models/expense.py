from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import (
    Date,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
)
from sqlalchemy.ext.mutable import MutableList
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.schemas.expense import ExpenseType

if TYPE_CHECKING:
    from app.models.account import Account
    from app.models.transaction import Transaction


class Expense(Base):
    __tablename__ = 'expenses'

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    name: Mapped[str] = mapped_column(String, index=True)
    description: Mapped[str] = mapped_column(String)
    amount: Mapped[float] = mapped_column(Float)
    type: Mapped[ExpenseType] = mapped_column(String, index=True)
    frequency: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        default=None,
    )

    start_date: Mapped[date] = mapped_column(Date, index=True)
    end_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        default=None,
    )

    growth_schedule: Mapped[list[dict]] = mapped_column(
        MutableList.as_mutable(JSON),
        default=[],
    )
    transaction_filters: Mapped[list[dict]] = mapped_column(
        MutableList.as_mutable(JSON),
        default=[],
    )

    transactions: Mapped[list['Transaction']] = relationship(
        'Transaction',
        back_populates='expense',
    )

    from_account_id: Mapped[int] = mapped_column(ForeignKey('accounts.id'))
    from_account: Mapped['Account'] = relationship(
        'Account',
        # back_populates='from_expenses',
        foreign_keys=[from_account_id],
    )

    to_account_id: Mapped[int | None] = mapped_column(
        ForeignKey('accounts.id'),
        nullable=True,
    )
    to_account: Mapped['Account | None'] = relationship(
        'Account',
        # back_populates='to_expenses',
        foreign_keys=[to_account_id],
    )
