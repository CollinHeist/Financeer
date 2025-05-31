from typing import TYPE_CHECKING
from datetime import date

from sqlalchemy import Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.core.dates import date_range
from app.schemas.account import AccountType
from app.utils.logging import log

if TYPE_CHECKING:
    from app.models.balance import Balance
    from app.models.bill import Bill
    from app.models.income import Income
    from app.models.plaid import PlaidItem
    from app.models.transaction import Transaction
    from app.models.transfer import Transfer
    from app.models.upload import Upload


class Account(Base):
    __tablename__ = 'accounts'

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    plaid_account_id: Mapped[str | None] = mapped_column(
        String, index=True, nullable=True
    )

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

    plaid_item_id: Mapped[int | None] = mapped_column(
        ForeignKey('plaid_items.id'), nullable=True
    )
    plaid_item: Mapped['PlaidItem | None'] = relationship(
        'PlaidItem',
        back_populates='accounts',
    )

    bills: Mapped[list['Bill']] = relationship(
        'Bill',
        back_populates='account',
        cascade='all, delete, delete-orphan',
    )

    incomes: Mapped[list['Income']] = relationship(
        'Income',
        back_populates='account',
        cascade='all, delete, delete-orphan',
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
        cascade='all, delete, delete-orphan',
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


    @property
    def last_balance(self) -> 'Balance':
        """The most recent Balance for the Account."""

        return self.balances[0]


    def get_card_balance(self, target_date: date, /) -> float:
        """
        Get the balance for the account on a specific date. This only
        accounts for Bills from the Account, not Incomes or Transfers.

        Args:
            target_date: The date to get the balance for

        Returns:
            The projected balance for the account on the given date.
        """

        # Get the last balance before the target date
        last_balance = [
            balance for balance in self.balances
            if balance.date <= target_date
        ][-1]
        starting_balance = last_balance.balance

        # Check if there is an incoming Transfer which will reset the
        # balance to 0
        start_date = last_balance.date
        for transfer in self.incoming_transfers:
            if (
                transfer.payoff_balance
                and transfer.to_account_id == self.id
                and transfer.start_date <= target_date
                and (transfer.end_date is None or transfer.end_date >= target_date)
            ):
                if (next_date := transfer.get_next_active_date(start_date)) is not None:
                    start_date = next_date
                    starting_balance = 0.0
                    break

        for date_ in date_range(start_date, target_date):
            for bill in self.bills:
                starting_balance += bill.get_effective_amount(date_)
        log.debug(f'  Card balance for {self.name} on {target_date} is ${starting_balance:,.2f}; stepped through {last_balance.date} -> {target_date}')
        return starting_balance
