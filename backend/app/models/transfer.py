from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import (
    Date,
    Float,
    ForeignKey,
    JSON,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.dates import date_meets_frequency
from app.db.base import Base
from app.schemas.income import FrequencyDict

if TYPE_CHECKING:
    from app.models.account import Account
    from app.models.transaction import Transaction


class Transfer(Base):
    __tablename__ = 'transfers'

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    name: Mapped[str] = mapped_column(String, index=True)
    description: Mapped[str] = mapped_column(default='', index=True)
    amount: Mapped[float] = mapped_column(Float)
    frequency: Mapped[FrequencyDict | None] = mapped_column(
        JSON,
        nullable=True,
    )
    start_date: Mapped[date] = mapped_column(Date, index=True)
    end_date: Mapped[date | None] = mapped_column(Date, index=True)
    payoff_balance: Mapped[bool]

    # Account relationships
    from_account_id: Mapped[int] = mapped_column(
        ForeignKey('accounts.id'),
        index=True
    )
    from_account: Mapped['Account'] = relationship(
        'Account',
        foreign_keys=[from_account_id],
        back_populates='outgoing_transfers'
    )

    to_account_id: Mapped[int] = mapped_column(
        ForeignKey('accounts.id'),
        index=True
    )
    to_account: Mapped['Account'] = relationship(
        'Account',
        foreign_keys=[to_account_id],
        back_populates='incoming_transfers'
    )

    # Transaction relationship
    transactions: Mapped[list["Transaction"]] = relationship(
        'Transaction',
        back_populates='transfer',
        cascade='all, delete-orphan'
    )


    def get_effective_amount(self, date: date, account_id: int) -> float:
        """
        Get the effective amount of the Transfer for a given date.

        Args:
            date: The date to get the effective amount for.
            account_id: The Account ID to get the effective amount for.
                This is used to determine the direction of the Transfer.

        Returns:
            The effective amount of the Transfer for the given date.
        """

        # If the Transfer is not active for the given date, return 0.0
        if (self.start_date > date
            or (self.end_date is not None and self.end_date < date)):
            return 0.0

        # If a one-time Transfer on this date, return the amount, or 0
        scalar = -1 if account_id == self.to_account_id else 1
        if self.frequency is None:
            if self.start_date == date:
                if self.payoff_balance:
                    return self.to_account.get_card_balance(date) * scalar
                return self.amount * scalar
            return 0.0

        # If a recurring Transfer, check if the date aligns with the
        # indicated frequency
        if date_meets_frequency(date, self.start_date, self.frequency):
            if self.payoff_balance:
                return self.to_account.get_card_balance(date) * scalar
            return self.amount * scalar

        return 0.0
