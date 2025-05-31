"""
Add PlaidItem

Revision ID: 4c1f036946c2
Revises: 1bab8d579d8c
Create Date: 2025-05-30 11:36:37.315664
"""

from typing import Sequence

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4c1f036946c2'
down_revision: str | None = '1bab8d579d8c'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""

    op.create_table('plaid_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('access_token', sa.String(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_plaid_items_id'), 'plaid_items', ['id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_index(op.f('ix_plaid_items_id'), table_name='plaid_items')
    op.drop_table('plaid_items')
