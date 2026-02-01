"""add email verification fields

Revision ID: n8i9j0k1l2m3
Revises: m7h8i9j0k1l2
Create Date: 2026-02-01

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "n8i9j0k1l2m3"
down_revision: Union[str, None] = "m7h8i9j0k1l2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Adiciona campos de verificacao de email na tabela users
    op.add_column(
        "users",
        sa.Column("email_verified", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.add_column(
        "users",
        sa.Column("email_verification_token", sa.String(), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("email_verification_token_expires_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("last_verification_email_sent_at", sa.DateTime(timezone=True), nullable=True),
    )

    # Indice para busca rapida por token
    op.create_index(
        "ix_users_email_verification_token",
        "users",
        ["email_verification_token"],
    )


def downgrade() -> None:
    op.drop_index("ix_users_email_verification_token", table_name="users")
    op.drop_column("users", "last_verification_email_sent_at")
    op.drop_column("users", "email_verification_token_expires_at")
    op.drop_column("users", "email_verification_token")
    op.drop_column("users", "email_verified")
