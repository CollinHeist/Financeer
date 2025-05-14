"""
Initialize Schema

Revision ID: 94de0cde84cc
Revises: 
Create Date: 2025-05-12 11:56:33.821941
"""

from typing import Sequence

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '94de0cde84cc'
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
    op.create_table('expenses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('frequency', sa.Integer(), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('change_schedule', sa.JSON(), nullable=False),
        sa.Column('transaction_filters', sa.JSON(), nullable=False),
        sa.Column('from_account_id', sa.Integer(), nullable=False),
        sa.Column('to_account_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['from_account_id'], ['accounts.id'], ),
        sa.ForeignKeyConstraint(['to_account_id'], ['accounts.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_expenses_id'), 'expenses', ['id'], unique=False)
    op.create_index(op.f('ix_expenses_name'), 'expenses', ['name'], unique=False)
    op.create_index(op.f('ix_expenses_start_date'), 'expenses', ['start_date'], unique=False)
    op.create_index(op.f('ix_expenses_type'), 'expenses', ['type'], unique=False)
    op.create_table('incomes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('frequency', sa.JSON(), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('account_id', sa.Integer(), nullable=False),
        sa.Column('raise_schedule', sa.JSON(), nullable=False),
        sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_incomes_id'), 'incomes', ['id'], unique=False)
    op.create_index(op.f('ix_incomes_name'), 'incomes', ['name'], unique=False)
    op.create_index(op.f('ix_incomes_start_date'), 'incomes', ['start_date'], unique=False)
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
    op.create_table('transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('description', sa.String(), nullable=False),
        sa.Column('note', sa.String(), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('account_id', sa.Integer(), nullable=False),
        sa.Column('expense_id', sa.Integer(), nullable=True),
        sa.Column('income_id', sa.Integer(), nullable=True),
        sa.Column('upload_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ),
        sa.ForeignKeyConstraint(['expense_id'], ['expenses.id'], ),
        sa.ForeignKeyConstraint(['income_id'], ['incomes.id'], ),
        sa.ForeignKeyConstraint(['upload_id'], ['uploads.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_transactions_date'), 'transactions', ['date'], unique=False)
    op.create_index(op.f('ix_transactions_id'), 'transactions', ['id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_index(op.f('ix_transactions_id'), table_name='transactions')
    op.drop_index(op.f('ix_transactions_date'), table_name='transactions')
    op.drop_table('transactions')
    op.drop_index(op.f('ix_uploads_upload_date'), table_name='uploads')
    op.drop_index(op.f('ix_uploads_id'), table_name='uploads')
    op.drop_index(op.f('ix_uploads_filename'), table_name='uploads')
    op.drop_table('uploads')
    op.drop_index(op.f('ix_incomes_type'), table_name='incomes')
    op.drop_index(op.f('ix_incomes_start_date'), table_name='incomes')
    op.drop_index(op.f('ix_incomes_name'), table_name='incomes')
    op.drop_index(op.f('ix_incomes_id'), table_name='incomes')
    op.drop_table('incomes')
    op.drop_index(op.f('ix_expenses_type'), table_name='expenses')
    op.drop_index(op.f('ix_expenses_start_date'), table_name='expenses')
    op.drop_index(op.f('ix_expenses_name'), table_name='expenses')
    op.drop_index(op.f('ix_expenses_id'), table_name='expenses')
    op.drop_table('expenses')
    op.drop_index(op.f('ix_accounts_type'), table_name='accounts')
    op.drop_index(op.f('ix_accounts_name'), table_name='accounts')
    op.drop_index(op.f('ix_accounts_id'), table_name='accounts')
    op.drop_table('accounts')
