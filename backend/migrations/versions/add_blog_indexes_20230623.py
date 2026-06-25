# -*- coding: utf-8 -*-
"""Add indexes to blog_posts table

Revision ID: add_blog_indexes_20230623
Revises: None
Create Date: 2026-06-23 13:55:00
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "add_blog_indexes_20230623"
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Add index on author_id
    op.create_index("ix_blog_posts_author_id", "blog_posts", ["author_id"], unique=False)
    # Add index on published_at
    op.create_index("ix_blog_posts_published_at", "blog_posts", ["published_at"], unique=False)

def downgrade():
    op.drop_index("ix_blog_posts_author_id", table_name="blog_posts")
    op.drop_index("ix_blog_posts_published_at", table_name="blog_posts")
