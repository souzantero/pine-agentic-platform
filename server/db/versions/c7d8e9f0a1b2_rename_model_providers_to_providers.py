"""rename model_providers to providers and add type column

Revision ID: c7d8e9f0a1b2
Revises: a1b2c3d4e5f6
Create Date: 2026-01-15 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c7d8e9f0a1b2'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Criar enum ProviderType
    provider_type_enum = sa.Enum('LLM', 'WEB_SEARCH', name='providertype')
    provider_type_enum.create(op.get_bind(), checkfirst=True)

    # Criar novo enum Provider (inclui provedores de LLM e Web Search)
    provider_enum = sa.Enum(
        'OPENAI', 'OPENROUTER', 'ANTHROPIC', 'GOOGLE', 'TAVILY',
        name='provider'
    )
    provider_enum.create(op.get_bind(), checkfirst=True)

    # Renomear tabela
    op.rename_table('organization_model_providers', 'organization_providers')

    # Adicionar coluna type com valor default LLM
    op.add_column(
        'organization_providers',
        sa.Column('type', sa.Enum('LLM', 'WEB_SEARCH', name='providertype'), nullable=True)
    )

    # Atualizar registros existentes para type = LLM
    op.execute("UPDATE organization_providers SET type = 'LLM'")

    # Tornar coluna NOT NULL
    op.alter_column('organization_providers', 'type', nullable=False)

    # Remover constraint antiga
    op.drop_constraint(
        'organization_model_providers_organization_id_provider_key',
        'organization_providers',
        type_='unique'
    )

    # Converter coluna provider do enum antigo para o novo
    op.execute("""
        ALTER TABLE organization_providers
        ALTER COLUMN provider TYPE provider
        USING provider::text::provider
    """)

    # Criar nova constraint unica incluindo type
    op.create_unique_constraint(
        'organization_providers_organization_id_type_provider_key',
        'organization_providers',
        ['organization_id', 'type', 'provider']
    )

    # Remover enum antigo
    op.execute("DROP TYPE IF EXISTS modelprovider")


def downgrade() -> None:
    """Downgrade schema."""
    # Recriar enum antigo
    model_provider_enum = sa.Enum(
        'OPENAI', 'OPENROUTER', 'ANTHROPIC', 'GOOGLE',
        name='modelprovider'
    )
    model_provider_enum.create(op.get_bind(), checkfirst=True)

    # Remover constraint nova
    op.drop_constraint(
        'organization_providers_organization_id_type_provider_key',
        'organization_providers',
        type_='unique'
    )

    # Converter coluna provider de volta para enum antigo (remove TAVILY se existir)
    op.execute("DELETE FROM organization_providers WHERE provider = 'TAVILY'")
    op.execute("""
        ALTER TABLE organization_providers
        ALTER COLUMN provider TYPE modelprovider
        USING provider::text::modelprovider
    """)

    # Remover coluna type
    op.drop_column('organization_providers', 'type')

    # Renomear tabela de volta
    op.rename_table('organization_providers', 'organization_model_providers')

    # Recriar constraint antiga
    op.create_unique_constraint(
        'organization_model_providers_organization_id_provider_key',
        'organization_model_providers',
        ['organization_id', 'provider']
    )

    # Remover enums novos
    op.execute("DROP TYPE IF EXISTS provider")
    op.execute("DROP TYPE IF EXISTS providertype")
