"""
Initialize Schema

Revision ID: 88d7c3f882ce
Revises: 
Create Date: 2025-05-23 10:40:07.089821
"""

from typing import Sequence

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '88d7c3f882ce'
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""

    op.create_table('accounts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('account_number', sa.Integer(), nullable=True),
        sa.Column('routing_number', sa.Integer(), nullable=True),
        sa.Column('interest', sa.Float(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_accounts_id'), 'accounts', ['id'], unique=False)
    op.create_index(op.f('ix_accounts_name'), 'accounts', ['name'], unique=False)
    op.create_index(op.f('ix_accounts_type'), 'accounts', ['type'], unique=False)
    op.create_table('transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('description', sa.String(), nullable=False),
        sa.Column('note', sa.String(), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('account_id', sa.Integer(), nullable=True),
        sa.Column('bill_id', sa.Integer(), nullable=True),
        sa.Column('expense_id', sa.Integer(), nullable=True),
        sa.Column('income_id', sa.Integer(), nullable=True),
        sa.Column('upload_id', sa.Integer(), nullable=True),
        sa.Column('transfer_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ),
        sa.ForeignKeyConstraint(['bill_id'], ['bills.id'], ),
        sa.ForeignKeyConstraint(['expense_id'], ['expenses.id'], ),
        sa.ForeignKeyConstraint(['income_id'], ['incomes.id'], ),
        sa.ForeignKeyConstraint(['transfer_id'], ['transfers.id'], ),
        sa.ForeignKeyConstraint(['upload_id'], ['uploads.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_transactions_date'), 'transactions', ['date'], unique=False)
    op.create_index(op.f('ix_transactions_id'), 'transactions', ['id'], unique=False)
    op.create_table('transfers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('frequency', sa.JSON(), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('payoff_balance', sa.Boolean(), nullable=False),
        sa.Column('transaction_filters', sa.JSON(), nullable=False),
        sa.Column('from_transaction_id', sa.Integer(), nullable=True),
        sa.Column('to_transaction_id', sa.Integer(), nullable=True),
        sa.Column('from_account_id', sa.Integer(), nullable=False),
        sa.Column('to_account_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['from_account_id'], ['accounts.id'], ),
        sa.ForeignKeyConstraint(['from_transaction_id'], ['transactions.id'], ),
        sa.ForeignKeyConstraint(['to_account_id'], ['accounts.id'], ),
        sa.ForeignKeyConstraint(['to_transaction_id'], ['transactions.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_transfers_description'), 'transfers', ['description'], unique=False)
    op.create_index(op.f('ix_transfers_end_date'), 'transfers', ['end_date'], unique=False)
    op.create_index(op.f('ix_transfers_from_account_id'), 'transfers', ['from_account_id'], unique=False)
    op.create_index(op.f('ix_transfers_from_transaction_id'), 'transfers', ['from_transaction_id'], unique=False)
    op.create_index(op.f('ix_transfers_id'), 'transfers', ['id'], unique=False)
    op.create_index(op.f('ix_transfers_name'), 'transfers', ['name'], unique=False)
    op.create_index(op.f('ix_transfers_start_date'), 'transfers', ['start_date'], unique=False)
    op.create_index(op.f('ix_transfers_to_account_id'), 'transfers', ['to_account_id'], unique=False)
    op.create_index(op.f('ix_transfers_to_transaction_id'), 'transfers', ['to_transaction_id'], unique=False)
    op.create_table('balances',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('balance', sa.Float(), nullable=False),
        sa.Column('account_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ondelete='cascade'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_balances_account_id'), 'balances', ['account_id'], unique=False)
    op.create_index(op.f('ix_balances_date'), 'balances', ['date'], unique=False)
    op.create_index(op.f('ix_balances_id'), 'balances', ['id'], unique=False)
    op.create_table('bills',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('frequency', sa.JSON(), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('change_schedule', sa.JSON(), nullable=False),
        sa.Column('transaction_filters', sa.JSON(), nullable=False),
        sa.Column('account_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ondelete='cascade'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_bills_account_id'), 'bills', ['account_id'], unique=False)
    op.create_index(op.f('ix_bills_id'), 'bills', ['id'], unique=False)
    op.create_index(op.f('ix_bills_name'), 'bills', ['name'], unique=False)
    op.create_index(op.f('ix_bills_start_date'), 'bills', ['start_date'], unique=False)
    op.create_index(op.f('ix_bills_type'), 'bills', ['type'], unique=False)
    op.create_table('expenses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('transaction_filters', sa.JSON(), nullable=False),
        sa.Column('allow_rollover', sa.Boolean(), nullable=False),
        sa.Column('max_rollover_amount', sa.Float(), nullable=True),
        sa.Column('account_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ondelete='cascade'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_expenses_account_id'), 'expenses', ['account_id'], unique=False)
    op.create_index(op.f('ix_expenses_id'), 'expenses', ['id'], unique=False)
    op.create_index(op.f('ix_expenses_name'), 'expenses', ['name'], unique=False)
    op.create_table('incomes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('frequency', sa.JSON(), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('account_id', sa.Integer(), nullable=False),
        sa.Column('raise_schedule', sa.JSON(), nullable=False),
        sa.Column('transaction_filters', sa.JSON(), nullable=False),
        sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_incomes_id'), 'incomes', ['id'], unique=False)
    op.create_index(op.f('ix_incomes_name'), 'incomes', ['name'], unique=False)
    op.create_index(op.f('ix_incomes_start_date'), 'incomes', ['start_date'], unique=False)
    op.create_table('transaction_relationships',
        sa.Column('transaction_id', sa.Integer(), nullable=False),
        sa.Column('related_transaction_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['related_transaction_id'], ['transactions.id'], ),
        sa.ForeignKeyConstraint(['transaction_id'], ['transactions.id'], ),
        sa.PrimaryKeyConstraint('transaction_id', 'related_transaction_id')
    )
    op.create_table('uploads',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('filename', sa.String(), nullable=False),
        sa.Column('data', sa.LargeBinary(), nullable=False),
        sa.Column('upload_date', sa.DateTime(), nullable=False),
        sa.Column('account_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_uploads_filename'), 'uploads', ['filename'], unique=False)
    op.create_index(op.f('ix_uploads_id'), 'uploads', ['id'], unique=False)
    op.create_index(op.f('ix_uploads_upload_date'), 'uploads', ['upload_date'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_index(op.f('ix_uploads_upload_date'), table_name='uploads')
    op.drop_index(op.f('ix_uploads_id'), table_name='uploads')
    op.drop_index(op.f('ix_uploads_filename'), table_name='uploads')
    op.drop_table('uploads')
    op.drop_table('transaction_relationships')
    op.drop_index(op.f('ix_incomes_start_date'), table_name='incomes')
    op.drop_index(op.f('ix_incomes_name'), table_name='incomes')
    op.drop_index(op.f('ix_incomes_id'), table_name='incomes')
    op.drop_table('incomes')
    op.drop_index(op.f('ix_expenses_name'), table_name='expenses')
    op.drop_index(op.f('ix_expenses_id'), table_name='expenses')
    op.drop_index(op.f('ix_expenses_account_id'), table_name='expenses')
    op.drop_table('expenses')
    op.drop_index(op.f('ix_bills_type'), table_name='bills')
    op.drop_index(op.f('ix_bills_start_date'), table_name='bills')
    op.drop_index(op.f('ix_bills_name'), table_name='bills')
    op.drop_index(op.f('ix_bills_id'), table_name='bills')
    op.drop_index(op.f('ix_bills_account_id'), table_name='bills')
    op.drop_table('bills')
    op.drop_index(op.f('ix_balances_id'), table_name='balances')
    op.drop_index(op.f('ix_balances_date'), table_name='balances')
    op.drop_index(op.f('ix_balances_account_id'), table_name='balances')
    op.drop_table('balances')
    op.drop_index(op.f('ix_transfers_to_transaction_id'), table_name='transfers')
    op.drop_index(op.f('ix_transfers_to_account_id'), table_name='transfers')
    op.drop_index(op.f('ix_transfers_start_date'), table_name='transfers')
    op.drop_index(op.f('ix_transfers_name'), table_name='transfers')
    op.drop_index(op.f('ix_transfers_id'), table_name='transfers')
    op.drop_index(op.f('ix_transfers_from_transaction_id'), table_name='transfers')
    op.drop_index(op.f('ix_transfers_from_account_id'), table_name='transfers')
    op.drop_index(op.f('ix_transfers_end_date'), table_name='transfers')
    op.drop_index(op.f('ix_transfers_description'), table_name='transfers')
    op.drop_table('transfers')
    op.drop_index(op.f('ix_transactions_id'), table_name='transactions')
    op.drop_index(op.f('ix_transactions_date'), table_name='transactions')
    op.drop_table('transactions')
    op.drop_index(op.f('ix_accounts_type'), table_name='accounts')
    op.drop_index(op.f('ix_accounts_name'), table_name='accounts')
    op.drop_index(op.f('ix_accounts_id'), table_name='accounts')
    op.drop_table('accounts')
