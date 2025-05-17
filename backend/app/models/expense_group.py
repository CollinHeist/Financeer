from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import (
    String,
    Table,
    Column,
    ForeignKey,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.expense import Expense


# Association table for many-to-many relationship between ExpenseGroup and Expense
expense_group_expenses = Table(
    'expense_group_expenses',
    Base.metadata,
    Column('expense_group_id', ForeignKey('expense_groups.id'), primary_key=True),
    Column('expense_id', ForeignKey('expenses.id'), primary_key=True),
)


class ExpenseGroup(Base):
    __tablename__ = 'expense_groups'

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, index=True)
    description: Mapped[str]

    # Many-to-many relationship with Expense
    expenses: Mapped[list['Expense']] = relationship(
        'Expense',
        secondary=expense_group_expenses,
        backref='expense_groups',
    )


    def get_total_amount(self, date: date) -> float:
        """
        Calculate the total amount of all expenses in the group for a
        given date.

        Args:
            date: The date to calculate the total amount for.

        Returns:
            The sum of all effective amounts of expenses in the group
            for the given date.
        """

        return sum(
            expense.get_effective_amount(date)
            for expense in self.expenses
            if expense.type == 'recurring'
        )

