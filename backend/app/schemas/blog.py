"""DTO cho Blog SEO (M3)."""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

# ---------- Category ----------


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    slug: str | None = None  # tự sinh nếu bỏ trống
    description: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    sort_order: int = 0


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str
    slug: str
    description: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    sort_order: int


# ---------- Post (Admin) ----------


class PostCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    slug: str | None = None
    excerpt: str | None = None
    content: str = Field(min_length=1)
    cover_image_url: str | None = None
    category_id: UUID
    tag_names: list[str] = []
    seo_title: str | None = None
    seo_description: str | None = None
    seo_keywords: str | None = None
    canonical_url: str | None = None
    og_title: str | None = None
    og_description: str | None = None
    og_image_url: str | None = None
    meta_robots: str = "index,follow"
    disclaimer: str | None = None


class PostUpdate(BaseModel):
    title: str | None = None
    excerpt: str | None = None
    content: str | None = None
    cover_image_url: str | None = None
    category_id: UUID | None = None
    tag_names: list[str] | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    seo_keywords: str | None = None
    canonical_url: str | None = None
    og_title: str | None = None
    og_description: str | None = None
    og_image_url: str | None = None
    meta_robots: str | None = None
    disclaimer: str | None = None


class StatusUpdate(BaseModel):
    # hành động workflow: submit / approve / publish / archive / back_to_draft
    action: str


class TagOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str
    slug: str


class PostListItem(BaseModel):
    """Bản rút gọn cho danh sách (admin & public)."""
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    title: str
    slug: str
    excerpt: str | None = None
    cover_image_url: str | None = None
    status: str
    category: CategoryOut
    published_at: datetime | None = None
    view_count: int = 0


class PostAdminDetail(PostListItem):
    content: str
    author_name: str
    tags: list[TagOut] = []
    seo_title: str | None = None
    seo_description: str | None = None
    seo_keywords: str | None = None
    canonical_url: str | None = None
    og_title: str | None = None
    og_description: str | None = None
    og_image_url: str | None = None
    meta_robots: str
    disclaimer: str | None = None
    created_at: datetime
    updated_at: datetime


# ---------- Post (Public) ----------


class SeoMeta(BaseModel):
    title: str
    description: str | None = None
    keywords: str | None = None
    canonical_url: str | None = None
    robots: str = "index,follow"
    og_title: str | None = None
    og_description: str | None = None
    og_image: str | None = None


class PostPublicDetail(BaseModel):
    id: UUID
    title: str
    slug: str
    excerpt: str | None = None
    content: str
    cover_image_url: str | None = None
    category: CategoryOut
    author_name: str
    tags: list[TagOut] = []
    published_at: datetime | None = None
    disclaimer: str | None = None
    seo: SeoMeta
    json_ld: list[dict] = []
    related: list[PostListItem] = []
