"""
Separate to and from Transactions for Transfers

Revision ID: ac29bd5c01cd
Revises: 6fcb14524757
Create Date: 2025-05-19 15:41:15.215677
"""

from typing import Sequence

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ac29bd5c01cd'
down_revision: str | None = '6fcb14524757'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""

    op.add_column('transfers', sa.Column('from_transaction_id', sa.Integer(), nullable=True))
    op.add_column('transfers', sa.Column('to_transaction_id', sa.Integer(), nullable=True))
    op.create_index(op.f('ix_transfers_from_transaction_id'), 'transfers', ['from_transaction_id'], unique=False)
    op.create_index(op.f('ix_transfers_to_transaction_id'), 'transfers', ['to_transaction_id'], unique=False)
    with op.batch_alter_table('transfers') as batch_op:
        batch_op.create_foreign_key('fk_transfers_from_transaction_id', 'transactions', ['from_transaction_id'], ['id'])
        batch_op.create_foreign_key('fk_transfers_to_transaction_id', 'transactions', ['to_transaction_id'], ['id'])


def downgrade() -> None:
    """Downgrade schema."""

    with op.batch_alter_table('transfers') as batch_op:
        batch_op.drop_constraint('fk_transfers_from_transaction_id', type_='foreignkey')
        batch_op.drop_constraint('fk_transfers_to_transaction_id', type_='foreignkey')
    op.drop_index(op.f('ix_transfers_to_transaction_id'), table_name='transfers')
    op.drop_index(op.f('ix_transfers_from_transaction_id'), table_name='transfers')
    op.drop_column('transfers', 'to_transaction_id')
    op.drop_column('transfers', 'from_transaction_id')
