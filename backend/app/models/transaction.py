from datetime import date as dt_date
from typing import TYPE_CHECKING

from sqlalchemy import Date, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.account import Account
    from app.models.expense import Expense
    from app.models.income import Income
    from app.models.transfer import Transfer
    from app.models.upload import Upload


class Transaction(Base):
    __tablename__ = 'transactions'

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    date: Mapped[dt_date] = mapped_column(Date, index=True)
    description: Mapped[str] = mapped_column(String)
    note: Mapped[str] = mapped_column(String, default='')
    amount: Mapped[float] = mapped_column(Float)

    account_id: Mapped[int] = mapped_column(ForeignKey('accounts.id'))
    account: Mapped['Account'] = relationship(back_populates='transactions')

    expense_id: Mapped[int | None] = mapped_column(ForeignKey('expenses.id'))
    expense: Mapped['Expense'] = relationship(back_populates='transactions')

    income_id: Mapped[int | None] = mapped_column(ForeignKey('incomes.id'))
    income: Mapped['Income | None'] = relationship(back_populates='transactions')

    upload_id: Mapped[int | None] = mapped_column(ForeignKey('uploads.id'))
    upload: Mapped['Upload | None'] = relationship(back_populates='transactions')

    transfer_id: Mapped[int | None] = mapped_column(ForeignKey('transfers.id'))

    related_transactions: Mapped[list['Transaction']] = relationship(
        'Transaction',
        secondary='transaction_relationships',
        primaryjoin='Transaction.id==transaction_relationships.c.transaction_id',
        secondaryjoin='Transaction.id==transaction_relationships.c.related_transaction_id',
        backref='related_to_transactions'
    )

    @property
    def related_transaction_ids(self) -> list[int]:
        return [t.id for t in self.related_transactions]


# Association table for many-to-many relationship between transactions
class TransactionRelationship(Base):
    __tablename__ = 'transaction_relationships'

    transaction_id: Mapped[int] = mapped_column(
        ForeignKey('transactions.id'), primary_key=True
    )
    related_transaction_id: Mapped[int] = mapped_column(
        ForeignKey('transactions.id'), primary_key=True
    )
