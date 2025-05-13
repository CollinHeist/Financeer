"""
Added Transaction references

Revision ID: 57771956bc1e
Revises: 94de0cde84cc
Create Date: 2025-05-13 12:17:47.605829
"""

from typing import Sequence

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '57771956bc1e'
down_revision: str | None = '94de0cde84cc'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""

    op.create_table('transaction_relationships',
        sa.Column('transaction_id', sa.Integer(), nullable=False),
        sa.Column('related_transaction_id', sa.Integer(), nullable=False),
        sa.Column('relationship_type', sa.String(), nullable=False),
        sa.ForeignKeyConstraint(['related_transaction_id'], ['transactions.id'], ),
        sa.ForeignKeyConstraint(['transaction_id'], ['transactions.id'], ),
        sa.PrimaryKeyConstraint('transaction_id', 'related_transaction_id')
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_table('transaction_relationships')    # ### end Alembic commands ###
