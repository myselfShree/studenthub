"""add_security_fields_to_users

Revision ID: a3f82c1d9e05
Revises: 16fa853ccab1
Create Date: 2026-09-26

Adds four security columns to the users table:
  - password_reset_token       (VARCHAR 255, nullable, indexed)
  - password_reset_token_expires (TIMESTAMPTZ, nullable)
  - failed_login_attempts      (INTEGER, not null, default 0)
  - locked_until               (TIMESTAMPTZ, nullable)
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "a3f82c1d9e05"
down_revision = "16fa853ccab1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("password_reset_token", sa.String(255), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column(
            "password_reset_token_expires",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "failed_login_attempts",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
    )
    op.add_column(
        "users",
        sa.Column("locked_until", sa.DateTime(timezone=True), nullable=True),
    )
    # Index for fast token lookup
    op.create_index(
        "ix_users_password_reset_token",
        "users",
        ["password_reset_token"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_users_password_reset_token", table_name="users")
    op.drop_column("users", "locked_until")
    op.drop_column("users", "failed_login_attempts")
    op.drop_column("users", "password_reset_token_expires")
    op.drop_column("users", "password_reset_token")
