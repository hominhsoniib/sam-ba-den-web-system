# -*- coding: utf-8 -*-
"""Tạo bảng contact_submissions để lưu lead từ form Liên hệ và Đại lý.

Revision ID: add_contact_submissions_20240624
Revises: add_blog_indexes_20230623
Create Date: 2026-06-24 18:00:00
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "add_contact_submissions_20240624"
down_revision = "add_blog_indexes_20230623"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "contact_submissions",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("(CURRENT_TIMESTAMP)")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("(CURRENT_TIMESTAMP)")),

        # Người gửi
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(30), nullable=False),
        sa.Column("email", sa.String(255), nullable=True),

        # Nội dung
        sa.Column("source", sa.String(20), nullable=False, server_default="contact"),
        sa.Column("subject", sa.String(255), nullable=True),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("area", sa.String(255), nullable=True),

        # Trạng thái xử lý (admin)
        sa.Column("status", sa.String(20), nullable=False, server_default="new"),
        sa.Column("admin_note", sa.Text(), nullable=True),
        sa.Column("replied_at", sa.DateTime(), nullable=True),

        # Metadata kỹ thuật
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("user_agent", sa.String(500), nullable=True),
    )
    # Indexes thường dùng để query
    op.create_index("ix_contact_submissions_source", "contact_submissions", ["source"])
    op.create_index("ix_contact_submissions_status", "contact_submissions", ["status"])
    op.create_index("ix_contact_submissions_email", "contact_submissions", ["email"])
    op.create_index("ix_contact_submissions_created_at", "contact_submissions", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_contact_submissions_created_at", table_name="contact_submissions")
    op.drop_index("ix_contact_submissions_email", table_name="contact_submissions")
    op.drop_index("ix_contact_submissions_status", table_name="contact_submissions")
    op.drop_index("ix_contact_submissions_source", table_name="contact_submissions")
    op.drop_table("contact_submissions")
