from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Column, ForeignKey, String, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.transaction import Transaction


# Association table for many-to-many relationship between Budget and Transaction
budget_transactions = Table(
    'budget_transactions',
    Base.metadata,
    Column('budget_id', ForeignKey('budgets.id'), primary_key=True),
    Column('transaction_id', ForeignKey('transactions.id'), primary_key=True),
)


class Budget(Base):
    __tablename__ = 'budgets'

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    name: Mapped[str] = mapped_column(String, index=True)
    description: Mapped[str]
    amount: Mapped[float]
    is_active: Mapped[bool]
    allow_rollover: Mapped[bool]
    max_rollover_amount: Mapped[float | None]

    transactions: Mapped[list['Transaction']] = relationship(
        'Transaction',
        secondary=budget_transactions,
        back_populates='budgets',
    )

    def get_spent_amount(self, target_date: date) -> float:
        """
        Calculate the total amount spent in this budget up to the target date.
        
        Args:
            target_date: The date to calculate the spent amount up to.
            
        Returns:
            The total amount spent in this budget.
        """

        return sum(
            transaction.amount
            for transaction in self.transactions
            if transaction.date <= target_date
        )


    def get_remaining_amount(self, target_date: date) -> float:
        """
        Calculate the remaining budget amount up to the target date.
        
        Args:
            target_date: The date to calculate the remaining amount up to.
            
        Returns:
            The remaining budget amount.
        """

        return self.amount - self.get_spent_amount(target_date)


    def get_utilization_percentage(self, target_date: date) -> float:
        """
        Calculate the percentage of the budget that has been utilized.
        
        Args:
            target_date: The date to calculate the utilization up to.
            
        Returns:
            The percentage of budget utilized (0-100).
        """

        if self.amount == 0:
            return 0.0
        return (self.get_spent_amount(target_date) / self.amount) * 100
