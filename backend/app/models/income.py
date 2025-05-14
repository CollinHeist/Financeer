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
from app.core.dates import date_meets_frequency, date_range
from app.schemas.income import FrequencyDict, RaiseItemDict

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

    @property
    def effective_amount(self) -> float:
        """
        Calculate the effective amount for the current day after
        applying all defined changes.
        
        This property evaluates all entries in the `change_schedule` and
        applies them in order if their effective_date is between the income's
        start_date and today (or end_date if specified and it's before today).
        """

        # Determine the effective range
        today = date.today()
        start = self.start_date
        end = min(today, self.end_date) if self.end_date else today

        # If today is before start_date or after end_date, return 0
        if today < start or (self.end_date and today > self.end_date):
            return 0

        # Start with the base amount
        amount = self.amount
        
        # Apply changes in chronological order for each day in the range
        for current_date in date_range(start, end):
            # Find changes that apply on this specific date
            for raise_ in self.raise_schedule:
                # Skip if the change is not effective on this date
                if (raise_['start_date'] > current_date
                    or (raise_['end_date'] and raise_['end_date'] < current_date)):
                    continue

                # One-time changes are only applied on their start date
                if raise_['frequency'] is None:
                    if raise_['start_date'] != current_date:
                        continue
                else:
                    if not date_meets_frequency(
                        current_date, raise_['start_date'], raise_['frequency']
                    ):
                        continue

                # Apply each change that occurs on this date
                if raise_['is_percentage']:
                    amount *= raise_['amount']
                else:
                    amount += raise_['amount']

        return amount


    def get_effective_amount(self, date: date) -> float:
        """
        Get the effective amount of the Income for a given date.

        Args:
            date: The date to get the effective amount for.

        Returns:
            The effective amount of the Income for the given date.
        """

        # If the Income is not active for the given date, return 0.0
        if (self.start_date > date
            or (self.end_date is not None and self.end_date < date)):
            return 0.0

        # If a one-time Income on this date, return the amount, or 0
        if self.frequency is None:
            if self.start_date == date:
                return self.amount
            return 0.0

        # If a recurring Income, check if the date aligns with the
        # indicated frequency
        if not date_meets_frequency(date, self.start_date, self.frequency):
            return 0.0

        # Apply the raise schedule to the amount
        amount = self.amount
        for raise_ in self.raise_schedule:
            if (raise_['start_date'] <= date
                and (raise_['end_date'] is None or raise_['end_date'] >= date)):
                if raise_['is_percentage']:
                    amount *= raise_['amount']
                else:
                    amount += raise_['amount']

        return amount
