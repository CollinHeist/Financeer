"""
Separate Expenses and Transfers

Revision ID: 6a1c187359ec
Revises: d4dfe94091b5
Create Date: 2025-05-18 14:31:49.744490
"""

from typing import Sequence

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6a1c187359ec'
down_revision: str | None = 'd4dfe94091b5'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


# Models necessary for data migration
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session

Base = declarative_base()

class Account(Base):
    __tablename__ = 'accounts'

    id = sa.Column(sa.Integer, primary_key=True, index=True)
    name = sa.Column(sa.String, nullable=False)
    type = sa.Column(sa.String, nullable=False, index=True)
    account_number = sa.Column(sa.Integer, nullable=True)
    routing_number = sa.Column(sa.Integer, nullable=True)
    interest = sa.Column(sa.Float, nullable=False, default=0.0)

class Balance(Base):
    __tablename__ = 'balances'
    
    id = sa.Column(sa.Integer, primary_key=True, index=True)
    date = sa.Column(sa.Date, nullable=False, index=True)
    balance = sa.Column(sa.Float, nullable=False)
    account_id = sa.Column(sa.ForeignKey('accounts.id'), nullable=False)

class Expense(Base):
    __tablename__ = 'expenses'
    
    id = sa.Column(sa.Integer, primary_key=True, index=True)
    name = sa.Column(sa.String, nullable=False, index=True)
    description = sa.Column(sa.String, nullable=False, default='')
    amount = sa.Column(sa.Float, nullable=False)
    type = sa.Column(sa.String, nullable=False, index=True)
    frequency = sa.Column(sa.JSON, nullable=True)
    start_date = sa.Column(sa.Date, nullable=False, index=True)
    end_date = sa.Column(sa.Date, nullable=True)
    change_schedule = sa.Column(sa.JSON, nullable=False, default=[])
    transaction_filters = sa.Column(sa.JSON, nullable=False, default=[])

    account_id = sa.Column(sa.ForeignKey('accounts.id'), nullable=False)
    to_account_id = sa.Column(sa.ForeignKey('accounts.id'), nullable=False)
    # from_account_id = sa.Column(sa.ForeignKey('accounts.id'), nullable=True)

class Income(Base):
    __tablename__ = 'incomes'
    
    id = sa.Column(sa.Integer, primary_key=True, index=True)
    name = sa.Column(sa.String, nullable=False, index=True)
    amount = sa.Column(sa.Float, nullable=False)
    frequency = sa.Column(sa.JSON, nullable=True)
    start_date = sa.Column(sa.Date, nullable=False, index=True)
    end_date = sa.Column(sa.Date, nullable=True)
    account_id = sa.Column(sa.ForeignKey('accounts.id'), nullable=False)
    raise_schedule = sa.Column(sa.JSON, nullable=False, default=[])
    transaction_filters = sa.Column(sa.JSON, nullable=False, default=[])

class Transaction(Base):
    __tablename__ = 'transactions'

    id = sa.Column(sa.Integer, primary_key=True, index=True)
    date = sa.Column(sa.Date, nullable=False, index=True)
    description = sa.Column(sa.String, nullable=False, default='')
    note = sa.Column(sa.String, nullable=False, default='')
    amount = sa.Column(sa.Float, nullable=False)
    account_id = sa.Column(sa.ForeignKey('accounts.id'), nullable=False)
    income_id = sa.Column(sa.ForeignKey('incomes.id'), nullable=True)
    expense_id = sa.Column(sa.ForeignKey('expenses.id'), nullable=True)
    upload_id = sa.Column(sa.ForeignKey('uploads.id'), nullable=True)
    """
    transfer_id: Mapped[int | None] = mapped_column(ForeignKey('transfers.id'))
    """

class Transfer(Base):
    __tablename__ = 'transfers'

    id = sa.Column(sa.Integer, primary_key=True)
    name = sa.Column(sa.String, nullable=False)
    description = sa.Column(sa.String, nullable=False, default='')
    amount = sa.Column(sa.Float, nullable=False)
    frequency = sa.Column(sa.JSON, nullable=True)
    start_date = sa.Column(sa.Date, nullable=False)
    end_date = sa.Column(sa.Date, nullable=True)
    from_account_id = sa.Column(sa.ForeignKey('accounts.id'), nullable=False)
    to_account_id = sa.Column(sa.ForeignKey('accounts.id'), nullable=False)

class Upload(Base):
    __tablename__ = 'uploads'
    
    id = sa.Column(sa.Integer, primary_key=True, index=True)
    filename = sa.Column(sa.String, nullable=False, index=True)
    data = sa.Column(sa.LargeBinary, nullable=False)
    upload_date = sa.Column(sa.DateTime, nullable=False, index=True)
    account_id = sa.Column(sa.ForeignKey('accounts.id'), nullable=False)

def upgrade() -> None:
    """Upgrade schema."""

    op.create_table('transfers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('frequency', sa.JSON(), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('from_account_id', sa.Integer(), nullable=False),
        sa.Column('to_account_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['from_account_id'], ['accounts.id'], ),
        sa.ForeignKeyConstraint(['to_account_id'], ['accounts.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(
        op.f('ix_transfers_from_account_id'),
        'transfers',
        ['from_account_id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_transfers_id'),
        'transfers',
        ['id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_transfers_name'),
        'transfers',
        ['name'],
        unique=False,
    )
    op.create_index(
        op.f('ix_transfers_start_date'),
        'transfers',
        ['start_date'],
        unique=False,
    )
    # op.add_column('expenses', sa.Column('account_id', sa.Integer(), nullable=True))
    with op.batch_alter_table('expenses') as batch_op:
        batch_op.alter_column('from_account_id', new_column_name='account_id')

    op.add_column('transactions', sa.Column('transfer_id', sa.Integer(), nullable=True))
    with op.batch_alter_table('transactions') as batch_op:
        batch_op.create_foreign_key(
            'ix_transactions_transfer_id',
            'transfers',
            ['transfer_id'],
            ['id'],
        )

    # Perform data migration
    session = Session(bind=op.get_bind())

    # Convert to/from Expenses into Transfers
    for expense in session.query(Expense).all():
        # Convert to/from Expenses into Transfers
        if expense.to_account_id is None:
            continue

        transfer = Transfer(
            name=expense.name,
            description=expense.description,
            amount=expense.amount,
            frequency=expense.frequency,
            start_date=expense.start_date,
            end_date=expense.end_date,
            from_account_id=expense.account_id,
            to_account_id=expense.to_account_id,
        )
        session.add(transfer)

    session.commit()

    # Now that data migration is complete, we can drop the to_account_id column
    with op.batch_alter_table('expenses') as batch_op:
        batch_op.drop_column('to_account_id')

    with op.batch_alter_table('transactions') as batch_op:
        batch_op.create_foreign_key(
            'fk_transactions_transfers',
            'transfers',
            ['interface_id'],
            ['id']
        )
    op.create_index(op.f('ix_transfers_to_account_id'), 'transfers', ['to_account_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_constraint(None, 'transactions', type_='foreignkey')
    op.drop_column('transactions', 'transfer_id')
    op.add_column('expenses', sa.Column('to_account_id', sa.INTEGER(), nullable=True))
    op.add_column('expenses', sa.Column('from_account_id', sa.INTEGER(), nullable=False))
    op.drop_constraint(None, 'expenses', type_='foreignkey')
    op.create_foreign_key(None, 'expenses', 'accounts', ['to_account_id'], ['id'])
    op.create_foreign_key(None, 'expenses', 'accounts', ['from_account_id'], ['id'])
    op.drop_column('expenses', 'account_id')
    op.drop_index(op.f('ix_transfers_to_account_id'), table_name='transfers')
    op.drop_index(op.f('ix_transfers_start_date'), table_name='transfers')
    op.drop_index(op.f('ix_transfers_name'), table_name='transfers')
    op.drop_index(op.f('ix_transfers_id'), table_name='transfers')
    op.drop_index(op.f('ix_transfers_from_account_id'), table_name='transfers')
    op.drop_table('transfers')
