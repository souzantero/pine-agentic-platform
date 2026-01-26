"""add STORAGE and EMBEDDING provider types and config column

Revision ID: f0a1b2c3d4e5
Revises: e9f0a1b2c3d4
Create Date: 2026-01-26 10:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'f0a1b2c3d4e5'
down_revision: Union[str, Sequence[str], None] = 'e9f0a1b2c3d4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Adiciona novos tipos de provedores e coluna config."""
    # Adicionar novos valores ao enum providertype
    op.execute("ALTER TYPE providertype ADD VALUE IF NOT EXISTS 'STORAGE'")
    op.execute("ALTER TYPE providertype ADD VALUE IF NOT EXISTS 'EMBEDDING'")

    # Adicionar novo valor ao enum provider
    op.execute("ALTER TYPE provider ADD VALUE IF NOT EXISTS 'AWS_S3'")

    # Adicionar coluna config em organization_providers
    op.add_column(
        'organization_providers',
        sa.Column('config', sa.JSON(), nullable=False, server_default='{}')
    )


def downgrade() -> None:
    """Remove coluna config (valores de enum nao podem ser removidos facilmente)."""
    op.drop_column('organization_providers', 'config')
