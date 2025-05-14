from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import (
    Date,
    Float,
    ForeignKey,
    JSON,
    String,
)
from sqlalchemy.ext.mutable import MutableList
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, JSONWithDates
from app.schemas.income import FrequencyDict

if TYPE_CHECKING:
    from app.models.account import Account
    from app.models.transaction import Transaction


class Income(Base):
    __tablename__ = 'incomes'

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    name: Mapped[str] = mapped_column(String, index=True)
    amount: Mapped[float] = mapped_column(Float)
    frequency: Mapped[FrequencyDict | None] = mapped_column(
        JSON,
        nullable=True,
    )
    start_date: Mapped[date] = mapped_column(Date, index=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    account_id: Mapped[int] = mapped_column(ForeignKey('accounts.id'))
    account: Mapped['Account'] = relationship(
        'Account',
        back_populates='incomes',
    )

    raise_schedule: Mapped[list[RaiseItemDict]] = mapped_column(
        MutableList.as_mutable(JSONWithDates),
        default=[],
    )

    transactions: Mapped[list['Transaction']] = relationship(
        'Transaction',
        back_populates='income',
    )
