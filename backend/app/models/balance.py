from datetime import date as date_type
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.account import Account


class Balance(Base):
    __tablename__ = 'balances'

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    date: Mapped[date_type] = mapped_column(Date, index=True)
    balance: Mapped[float]

    account_id: Mapped[int] = mapped_column(ForeignKey('accounts.id'))
    account: Mapped['Account'] = relationship(
        'Account',
        back_populates='balances',
    )


    def __repr__(self) -> str:
        return f'Balance[{self.id}] for ${self.balance:,.02f} on {self.date.strftime("%Y-%m-%d")}'
