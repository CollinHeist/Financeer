"""
Add Balance Model

Revision ID: 405d9851c541
Revises: 57771956bc1e
Create Date: 2025-05-14 20:49:18.665872
"""

from typing import Sequence

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '405d9851c541'
down_revision: str | None = '57771956bc1e'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""

    op.create_table('balances',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('balance', sa.Float(), nullable=False),
        sa.Column('account_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_balances_date'), 'balances', ['date'], unique=False)
    op.create_index(op.f('ix_balances_id'), 'balances', ['id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_index(op.f('ix_balances_id'), table_name='balances')
    op.drop_index(op.f('ix_balances_date'), table_name='balances')
    op.drop_table('balances')
