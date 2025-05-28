"""
Remove Account from Expenses

Revision ID: b519e10b3c3c
Revises: 88d7c3f882ce
Create Date: 2025-05-27 21:14:36.768391
"""

from typing import Sequence

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b519e10b3c3c'
down_revision: str | None = '88d7c3f882ce'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""

    op.drop_index('ix_expenses_account_id', table_name='expenses')
    with op.batch_alter_table('expenses') as batch_op:
        batch_op.drop_column('account_id')


def downgrade() -> None:
    """Downgrade schema."""

    op.add_column('expenses', sa.Column('account_id', sa.INTEGER(), nullable=False))
    op.create_foreign_key(None, 'expenses', 'accounts', ['account_id'], ['id'], ondelete='CASCADE')
    op.create_index('ix_expenses_account_id', 'expenses', ['account_id'], unique=False)
