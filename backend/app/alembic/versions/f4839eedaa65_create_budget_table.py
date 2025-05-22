"""
Create Budget Table

Revision ID: f4839eedaa65
Revises: ac29bd5c01cd
Create Date: 2025-05-21 22:00:40.821923
"""

from typing import Sequence

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f4839eedaa65'
down_revision: str | None = 'ac29bd5c01cd'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""

    op.create_table('budgets',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('allow_rollover', sa.Boolean(), nullable=False),
        sa.Column('max_rollover_amount', sa.Float(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_budgets_id'), 'budgets', ['id'], unique=False)
    op.create_index(op.f('ix_budgets_name'), 'budgets', ['name'], unique=False)
    op.create_table('budget_transactions',
        sa.Column('budget_id', sa.Integer(), nullable=False),
        sa.Column('transaction_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['budget_id'], ['budgets.id'], ),
        sa.ForeignKeyConstraint(['transaction_id'], ['transactions.id'], ),
        sa.PrimaryKeyConstraint('budget_id', 'transaction_id')
    )
    op.add_column(
        'transfers',
        sa.Column(
            'transaction_filters',
            sa.JSON(),
            nullable=False,
            server_default='[]',
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_column('transfers', 'transaction_filters')
    op.drop_table('budget_transactions')
    op.drop_index(op.f('ix_budgets_name'), table_name='budgets')
    op.drop_index(op.f('ix_budgets_id'), table_name='budgets')
    op.drop_table('budgets')
