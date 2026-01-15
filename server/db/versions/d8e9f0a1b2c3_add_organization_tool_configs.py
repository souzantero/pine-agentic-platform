"""add organization_configs table

Revision ID: d8e9f0a1b2c3
Revises: c7d8e9f0a1b2
Create Date: 2026-01-15 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'd8e9f0a1b2c3'
down_revision: Union[str, Sequence[str], None] = 'c7d8e9f0a1b2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Criar enums usando SQL direto para evitar problemas com checkfirst
    op.execute("CREATE TYPE configtype AS ENUM ('TOOL')")
    op.execute("CREATE TYPE configkey AS ENUM ('WEB_SEARCH')")

    # Criar tabela organization_configs
    op.create_table(
        'organization_configs',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('organization_id', sa.UUID(), nullable=False),
        sa.Column('type', postgresql.ENUM('TOOL', name='configtype', create_type=False), nullable=False),
        sa.Column('key', postgresql.ENUM('WEB_SEARCH', name='configkey', create_type=False), nullable=False),
        sa.Column('is_enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('config', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('organization_id', 'type', 'key'),
    )
    op.create_index('ix_organization_configs_organization_id', 'organization_configs', ['organization_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_organization_configs_organization_id', table_name='organization_configs')
    op.drop_table('organization_configs')
    op.execute("DROP TYPE IF EXISTS configkey")
    op.execute("DROP TYPE IF EXISTS configtype")
