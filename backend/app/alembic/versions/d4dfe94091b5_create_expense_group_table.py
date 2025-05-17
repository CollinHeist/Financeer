"""
Create Expense Group Table

Revision ID: d4dfe94091b5
Revises: bc98ec03b28c
Create Date: 2025-05-16 21:54:07.419511
"""

from typing import Sequence

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4dfe94091b5'
down_revision: str | None = 'bc98ec03b28c'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""

    op.create_table('expense_groups',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_expense_groups_id'), 'expense_groups', ['id'], unique=False)
    op.create_index(op.f('ix_expense_groups_name'), 'expense_groups', ['name'], unique=False)
    op.create_table('expense_group_expenses',
        sa.Column('expense_group_id', sa.Integer(), nullable=False),
        sa.Column('expense_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['expense_group_id'], ['expense_groups.id'], ),
        sa.ForeignKeyConstraint(['expense_id'], ['expenses.id'], ),
        sa.PrimaryKeyConstraint('expense_group_id', 'expense_id')
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_table('expense_group_expenses')
    op.drop_index(op.f('ix_expense_groups_name'), table_name='expense_groups')
    op.drop_index(op.f('ix_expense_groups_id'), table_name='expense_groups')
    op.drop_table('expense_groups')
