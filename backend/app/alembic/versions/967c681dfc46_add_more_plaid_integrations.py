"""
Add more Plaid integrations

Revision ID: 967c681dfc46
Revises: 4c1f036946c2
Create Date: 2025-05-30 16:16:41.119337
"""

from datetime import datetime
from typing import Sequence

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '967c681dfc46'
down_revision: str | None = '4c1f036946c2'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""

    op.add_column(
        'accounts',
        sa.Column('plaid_account_id', sa.String(), nullable=True)
    )
    op.add_column(
        'accounts',
        sa.Column('plaid_item_id', sa.Integer(), nullable=True)
    )
    op.create_index(
        op.f('ix_accounts_plaid_account_id'),
        'accounts',
        ['plaid_account_id'],unique=False
    )
    with op.batch_alter_table('accounts') as batch_op:
        batch_op.create_foreign_key(
            'fk_accounts_plaid_items',
            'plaid_items',
            ['plaid_item_id'],
            ['id'],
            ondelete='cascade'
        )
    op.add_column(
        'plaid_items',
        sa.Column(
            'last_refresh',
            sa.DateTime(),
            nullable=False,
            server_default=datetime.now().isoformat()
        )
    )
    op.add_column(
        'transactions',
        sa.Column('plaid_transaction_id', sa.String(), nullable=True)
    )
    op.create_index(
        op.f('ix_transactions_plaid_transaction_id'),
        'transactions',
        ['plaid_transaction_id'],
        unique=False
    )


def downgrade() -> None:
    """Downgrade schema."""


    op.drop_index(op.f('ix_transactions_plaid_transaction_id'), table_name='transactions')
    op.drop_column('transactions', 'plaid_transaction_id')
    op.drop_column('plaid_items', 'last_refresh')
    op.drop_constraint(None, 'accounts', type_='foreignkey')
    op.drop_index(op.f('ix_accounts_plaid_account_id'), table_name='accounts')
    op.drop_column('accounts', 'plaid_item_id')
    op.drop_column('accounts', 'plaid_account_id')

