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
    transaction_filters: Mapped[list[dict]] = mapped_column(
        MutableList.as_mutable(JSONWithDates),
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

        # If a monthly expense not on this day of the month, return 0.0
        if self.type == 'monthly' and self.start_date.day != date.day:
            return 0.0

        # If a recurring expense, check if the date aligns with the
        # indicated frequency
        if self.type == 'recurring' and self.frequency:
            unit, frequency = self.frequency['unit'], self.frequency['value']
            if unit == 'days' and (date - self.start_date).days % frequency != 0:
                return 0.0
            if (unit == 'weeks'
                and (date - self.start_date).days % (frequency * 7) != 0):
                return 0.0
            if (unit == 'months'
                and (
                    date.day != self.start_date.day
                    or (date.month - self.start_date.month) % frequency != 0
                )):
                return 0.0
            if (unit == 'years'
                and (
                    date.day != self.start_date.day
                    or date.month != self.start_date.month
                    or (date.year - self.start_date.year) % frequency != 0
                )):
                return 0.0
            if (unit == 'decades'
                and (
                    date.day != self.start_date.day
                    or date.month != self.start_date.month
                    or (date.year - self.start_date.year) % (frequency * 10) != 0
                )):
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
