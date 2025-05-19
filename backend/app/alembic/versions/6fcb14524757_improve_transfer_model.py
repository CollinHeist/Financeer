"""
Improve Transfer model

Revision ID: 6fcb14524757
Revises: 6a1c187359ec
Create Date: 2025-05-18 19:19:47.079094
"""

from typing import Sequence

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6fcb14524757'
down_revision: str | None = '6a1c187359ec'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""

    op.add_column(
        'transfers',
        sa.Column(
            'payoff_balance',
            sa.Boolean(),
            nullable=False,
            server_default='false',
        ),
    )
    op.create_index(
        op.f('ix_transfers_description'),
        'transfers',
        ['description'],
        unique=False,
    )
    op.create_index(
        op.f('ix_transfers_end_date'),
        'transfers',
        ['end_date'],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_index(op.f('ix_transfers_end_date'), table_name='transfers')
    op.drop_index(op.f('ix_transfers_description'), table_name='transfers')
    op.drop_column('transfers', 'payoff_balance')
