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

from app.core.dates import date_meets_frequency
from app.db.base import Base, JSONWithDates
from app.schemas.core import TransactionFilterDict
from app.schemas.expense import (
    ExpenseType,
    ExpenseChangeItemDict,
    FrequencyDict,
)

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
    frequency: Mapped[FrequencyDict | None] = mapped_column(
        JSON,
        nullable=True,
        default=None,
    )

    start_date: Mapped[date] = mapped_column(Date, index=True)
    end_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        default=None,
    )

    change_schedule: Mapped[list['ExpenseChangeItemDict']] = mapped_column(
        MutableList.as_mutable(JSONWithDates),
        default=[],
    )
    transaction_filters: Mapped[list[TransactionFilterDict]] = mapped_column(
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


    def get_effective_amount(self, date: date) -> float:
        """
        Get the effective amount of the expense for a given date.

        Args:
            date: The date to get the effective amount for.

        Returns:
            The effective amount of the expense for the given date.
        """

        # If the expense is not active for the given date, return 0.0
        if (self.start_date > date
            or (self.end_date is not None and self.end_date < date)):
            return 0.0

        # If a one-time expense on this date, return the amount, or 0
        if self.type == 'one_time':
            if self.start_date == date:
                return self.amount
            return 0.0

        # If a recurring expense, check if the date aligns with the
        # indicated frequency
        if self.type == 'recurring' and self.frequency:
            if not date_meets_frequency(date, self.start_date, self.frequency):
                return 0.0

        # Apply the change schedule to the amount
        amount = self.amount
        for change in self.change_schedule:
            if (change['start_date'] <= date
                and (change['end_date'] is None or change['end_date'] >= date)):
                if change['is_percentage']:
                    amount *= change['amount']
                else:
                    amount += change['amount']

        # If the expense is a recurring expense, return the amount
        return amount
