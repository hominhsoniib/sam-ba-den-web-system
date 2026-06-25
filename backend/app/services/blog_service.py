"""Logic nghiệp vụ Blog: CRUD, workflow trạng thái, dựng dữ liệu public + SEO."""
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.models.blog import BlogCategory, BlogPost
from app.models.user import User
from app.repositories.blog_repository import BlogRepository
from app.schemas.blog import (
    CategoryCreate,
    PostCreate,
    PostPublicDetail,
    PostUpdate,
    SeoMeta,
)
from app.utils.json_ld import build_article_json_ld, build_breadcrumb_json_ld
from app.utils.slugify import slugify

# Máy trạng thái workflow: action -> (từ trạng thái hợp lệ, sang trạng thái)
TRANSITIONS = {
    "submit": ({"draft"}, "review"),
    "approve": ({"review"}, "published"),
    "publish": ({"draft", "review"}, "published"),
    "archive": ({"published"}, "archived"),
    "back_to_draft": ({"review", "archived"}, "draft"),
}


class BlogService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = BlogRepository(db)

    # ---------- Category ----------
    async def create_category(self, payload: CategoryCreate) -> BlogCategory:
        slug = payload.slug or slugify(payload.name)
        if await self.repo.category_slug_exists(slug):
            raise ConflictError("slug_exists", f"Slug danh mục đã tồn tại: {slug}")
        cat = BlogCategory(
            name=payload.name,
            slug=slug,
            description=payload.description,
            seo_title=payload.seo_title,
            seo_description=payload.seo_description,
            sort_order=payload.sort_order,
        )
        cat = await self.repo.add_category(cat)
        await self.db.commit()
        return cat

    async def list_categories(self) -> list[BlogCategory]:
        return await self.repo.list_categories()

    # ---------- Post ----------
    async def _unique_slug(self, base: str) -> str:
        slug = base
        i = 2
        while await self.repo.post_slug_exists(slug):
            slug = f"{base}-{i}"
            i += 1
        return slug

    async def create_post(self, payload: PostCreate, author: User) -> BlogPost:
        if await self.repo.get_category(payload.category_id) is None:
            raise NotFoundError("category_not_found", "Danh mục không tồn tại")
        base_slug = payload.slug or slugify(payload.title)
        if not base_slug:
            raise ValidationError("invalid_title", "Tiêu đề không tạo được slug")
        slug = await self._unique_slug(base_slug)
        tags = await self.repo.get_or_create_tags(payload.tag_names)

        post = BlogPost(
            title=payload.title,
            slug=slug,
            excerpt=payload.excerpt,
            content=payload.content,
            cover_image_url=payload.cover_image_url,
            category_id=payload.category_id,
            author_id=author.id,
            status="draft",
            seo_title=payload.seo_title,
            seo_description=payload.seo_description,
            seo_keywords=payload.seo_keywords,
            canonical_url=payload.canonical_url,
            og_title=payload.og_title,
            og_description=payload.og_description,
            og_image_url=payload.og_image_url,
            meta_robots=payload.meta_robots,
            disclaimer=payload.disclaimer,
            tags=tags,
        )
        post = await self.repo.add_post(post)
        await self.db.commit()
        return await self.repo.get_post(post.id)

    async def update_post(self, post_id: UUID, payload: PostUpdate) -> BlogPost:
        post = await self.repo.get_post(post_id)
        if post is None or post.deleted_at is not None:
            raise NotFoundError("post_not_found", "Bài viết không tồn tại")

        data = payload.model_dump(exclude_unset=True)
        if "category_id" in data:
            if await self.repo.get_category(data["category_id"]) is None:
                raise NotFoundError("category_not_found", "Danh mục không tồn tại")
        if "tag_names" in data:
            post.tags = await self.repo.get_or_create_tags(data.pop("tag_names"))
        for field, value in data.items():
            setattr(post, field, value)
        await self.db.commit()
        return await self.repo.get_post(post.id)

    async def change_status(self, post_id: UUID, action: str) -> BlogPost:
        post = await self.repo.get_post(post_id)
        if post is None or post.deleted_at is not None:
            raise NotFoundError("post_not_found", "Bài viết không tồn tại")
        if action not in TRANSITIONS:
            raise ValidationError("invalid_action", f"Hành động không hợp lệ: {action}")
        allowed_from, to_status = TRANSITIONS[action]
        if post.status not in allowed_from:
            raise ConflictError(
                "invalid_transition",
                f"Không thể '{action}' khi đang ở trạng thái '{post.status}'",
            )
        post.status = to_status
        if to_status == "published" and post.published_at is None:
            post.published_at = datetime.now(UTC)
        await self.db.commit()
        return await self.repo.get_post(post.id)

    async def soft_delete(self, post_id: UUID) -> None:
        post = await self.repo.get_post(post_id)
        if post is None or post.deleted_at is not None:
            raise NotFoundError("post_not_found", "Bài viết không tồn tại")
        post.deleted_at = datetime.now(UTC)
        await self.db.commit()

    async def list_admin(self, status, page, page_size):
        return await self.repo.list_admin(status, page, page_size)

    # ---------- Public ----------
    async def get_public_detail(self, slug: str) -> PostPublicDetail:
        post = await self.repo.get_published_by_slug(slug)
        if post is None:
            raise NotFoundError("post_not_found", "Bài viết không tồn tại")
        post.view_count += 1
        await self.db.commit()
        post = await self.repo.get_published_by_slug(slug)

        related = await self.repo.related(post)
        return self._to_public_detail(post, related)

    async def list_public(self, category_slug, page, page_size):
        return await self.repo.list_public(category_slug, page, page_size)

    def _to_public_detail(self, post: BlogPost, related) -> PostPublicDetail:
        site = settings_site_url()
        url = f"{site}/blog/{post.slug}"
        seo = SeoMeta(
            title=post.seo_title or post.title,
            description=post.seo_description or post.excerpt,
            keywords=post.seo_keywords,
            canonical_url=post.canonical_url or url,
            robots=post.meta_robots,
            og_title=post.og_title or post.seo_title or post.title,
            og_description=post.og_description or post.seo_description or post.excerpt,
            og_image=post.og_image_url or post.cover_image_url,
        )
        article = build_article_json_ld(
            title=post.title,
            description=seo.description,
            url=url,
            image_url=seo.og_image,
            author_name=post.author.full_name,
            published_at=post.published_at.isoformat() if post.published_at else None,
            updated_at=post.updated_at.isoformat() if post.updated_at else None,
            category_name=post.category.name,
        )
        breadcrumb = build_breadcrumb_json_ld(
            [
                ("Trang chủ", site),
                ("Blog", f"{site}/blog"),
                (post.category.name, f"{site}/blog?danh-muc={post.category.slug}"),
                (post.title, url),
            ]
        )
        return PostPublicDetail(
            id=post.id,
            title=post.title,
            slug=post.slug,
            excerpt=post.excerpt,
            content=post.content,
            cover_image_url=post.cover_image_url,
            category=post.category,
            author_name=post.author.full_name,
            tags=post.tags,
            published_at=post.published_at,
            disclaimer=post.disclaimer,
            seo=seo,
            json_ld=[article, breadcrumb],
            related=related,
        )


def settings_site_url() -> str:
    # Site URL công khai (đặt trong config; fallback localhost cho dev)
    return getattr(settings, "site_url", "http://localhost:5173")
