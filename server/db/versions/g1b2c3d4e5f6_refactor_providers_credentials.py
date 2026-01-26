"""refactor providers: remove api_key, rename config to credentials

Revision ID: g1b2c3d4e5f6
Revises: f0a1b2c3d4e5
Create Date: 2026-01-26 12:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'g1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'f0a1b2c3d4e5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Refatora tabela de providers: remove api_key, renomeia config para credentials."""

    # 1. Adicionar novos valores aos enums de config
    op.execute("ALTER TYPE configtype ADD VALUE IF NOT EXISTS 'FEATURE'")
    op.execute("ALTER TYPE configkey ADD VALUE IF NOT EXISTS 'STORAGE'")

    # 2. Migrar dados: mover api_key para dentro do config JSON
    # Para providers que tem api_key, adiciona como campo no JSON
    op.execute("""
        UPDATE organization_providers
        SET config = jsonb_set(
            COALESCE(config::jsonb, '{}'::jsonb),
            '{apiKey}',
            to_jsonb(api_key)
        )
        WHERE api_key IS NOT NULL AND api_key != ''
    """)

    # 3. Renomear coluna config para credentials
    op.alter_column('organization_providers', 'config', new_column_name='credentials')

    # 4. Remover coluna api_key
    op.drop_column('organization_providers', 'api_key')


def downgrade() -> None:
    """Reverte: adiciona api_key, renomeia credentials para config."""

    # 1. Adicionar coluna api_key de volta
    op.add_column(
        'organization_providers',
        sa.Column('api_key', sa.String(), nullable=True)
    )

    # 2. Migrar dados de volta: extrair apiKey do credentials JSON
    op.execute("""
        UPDATE organization_providers
        SET api_key = credentials->>'apiKey'
        WHERE credentials->>'apiKey' IS NOT NULL
    """)

    # 3. Tornar api_key NOT NULL (se necessario)
    op.alter_column('organization_providers', 'api_key', nullable=False)

    # 4. Renomear credentials de volta para config
    op.alter_column('organization_providers', 'credentials', new_column_name='config')
