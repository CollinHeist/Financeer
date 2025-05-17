"""
Add Transaction Filters to Incomes

Revision ID: bc98ec03b28c
Revises: 405d9851c541
Create Date: 2025-05-16 21:49:36.653797
"""

from typing import Sequence

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bc98ec03b28c'
down_revision: str | None = '405d9851c541'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""

    op.add_column(
        'incomes',
        sa.Column(
            'transaction_filters',
            sa.JSON(),
            nullable=False,
            server_default='[]',
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_column('incomes', 'transaction_filters')
