"""alembic migration – initial schema
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "init_schema"
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Users and RBAC tables
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True, index=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("last_login_at", sa.DateTime(), nullable=True),
    )
    op.create_table(
        "roles",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("name", sa.String(50), nullable=False, unique=True),
        sa.Column("description", sa.String(255), nullable=True),
    )
    op.create_table(
        "permissions",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("code", sa.String(100), nullable=False, unique=True, index=True),
        sa.Column("description", sa.String(255), nullable=True),
    )
    op.create_table(
        "user_roles",
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("role_id", sa.Uuid(), sa.ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    )
    op.create_table(
        "role_permissions",
        sa.Column("role_id", sa.Uuid(), sa.ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("permission_id", sa.Uuid(), sa.ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
    )
    # Blog tables
    op.create_table(
        "blog_categories",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("slug", sa.String(180), nullable=False, unique=True, index=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("seo_title", sa.String(255), nullable=True),
        sa.Column("seo_description", sa.String(320), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_table(
        "tags",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("slug", sa.String(120), nullable=False, unique=True, index=True),
    )
    op.create_table(
        "post_tags",
        sa.Column("post_id", sa.Uuid(), sa.ForeignKey("blog_posts.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("tag_id", sa.Uuid(), sa.ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
    )
    op.create_table(
        "blog_posts",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(280), nullable=False, unique=True, index=True),
        sa.Column("excerpt", sa.String(500), nullable=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("cover_image_url", sa.String(500), nullable=True),
        sa.Column("category_id", sa.Uuid(), sa.ForeignKey("blog_categories.id"), index=True),
        sa.Column("author_id", sa.Uuid(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="draft", index=True),
        sa.Column("seo_title", sa.String(255), nullable=True),
        sa.Column("seo_description", sa.String(320), nullable=True),
        sa.Column("seo_keywords", sa.String(500), nullable=True),
        sa.Column("canonical_url", sa.String(500), nullable=True),
        sa.Column("og_title", sa.String(255), nullable=True),
        sa.Column("og_description", sa.String(320), nullable=True),
        sa.Column("og_image_url", sa.String(500), nullable=True),
        sa.Column("meta_robots", sa.String(50), nullable=False, server_default="index,follow"),
        sa.Column("disclaimer", sa.Text(), nullable=True),
        sa.Column("published_at", sa.DateTime(), nullable=True),
        sa.Column("view_count", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
    )
    # Product tables
    op.create_table(
        "product_categories",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("slug", sa.String(180), nullable=False, unique=True, index=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("seo_title", sa.String(255), nullable=True),
        sa.Column("seo_description", sa.String(320), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_table(
        "products",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(280), nullable=False, unique=True, index=True),
        sa.Column("sku", sa.String(50), nullable=True, unique=True),
        sa.Column("category_id", sa.Uuid(), sa.ForeignKey("product_categories.id"), index=True),
        sa.Column("short_desc", sa.String(500), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("reference_price", sa.Numeric(14, 2), nullable=True),
        sa.Column("unit", sa.String(20), nullable=True),
        sa.Column("usage_info", sa.Text(), nullable=True),
        sa.Column("disclaimer", sa.Text(), nullable=True),
        sa.Column("seo_title", sa.String(255), nullable=True),
        sa.Column("seo_description", sa.String(320), nullable=True),
        sa.Column("og_image_url", sa.String(500), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="active", index=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_table(
        "product_images",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("product_id", sa.Uuid(), sa.ForeignKey("products.id", ondelete="CASCADE"), index=True),
        sa.Column("image_url", sa.String(500), nullable=False),
        sa.Column("alt_text", sa.String(255), nullable=True),
        sa.Column("is_primary", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
    )

def downgrade():
    op.drop_table("product_images")
    op.drop_table("products")
    op.drop_table("product_categories")
    op.drop_table("blog_posts")
    op.drop_table("post_tags")
    op.drop_table("tags")
    op.drop_table("blog_categories")
    op.drop_table("role_permissions")
    op.drop_table("user_roles")
    op.drop_table("permissions")
    op.drop_table("roles")
    op.drop_table("users")

