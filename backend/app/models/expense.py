from typing import TYPE_CHECKING

from sqlalchemy import JSON, String
from sqlalchemy.ext.mutable import MutableList
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.schemas.core import TransactionFilterDict

if TYPE_CHECKING:
    from app.models.transaction import Transaction


class Expense(Base):
    __tablename__ = 'expenses'

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    name: Mapped[str] = mapped_column(String, index=True)
    description: Mapped[str]
    amount: Mapped[float]
    is_active: Mapped[bool]
    transaction_filters: Mapped[list[TransactionFilterDict]] = mapped_column(
        MutableList.as_mutable(JSON),
        default=[],
    )
    allow_rollover: Mapped[bool]
    max_rollover_amount: Mapped[float | None]

    transactions: Mapped[list['Transaction']] = relationship(
        'Transaction',
        back_populates='expense',
    )
