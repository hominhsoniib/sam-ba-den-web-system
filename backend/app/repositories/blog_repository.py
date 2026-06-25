"""Truy vấn dữ liệu Blog (tách khỏi service)."""
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.blog import BlogCategory, BlogPost, Tag


class BlogRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ---- Category ----
    async def get_category(self, category_id: UUID) -> BlogCategory | None:
        return await self.db.get(BlogCategory, category_id)

    async def category_slug_exists(self, slug: str) -> bool:
        stmt = select(BlogCategory.id).where(BlogCategory.slug == slug)
        return (await self.db.execute(stmt)).first() is not None

    async def list_categories(self) -> list[BlogCategory]:
        stmt = select(BlogCategory).order_by(
            BlogCategory.sort_order, BlogCategory.name
        )
        return list((await self.db.execute(stmt)).scalars().all())

    async def add_category(self, cat: BlogCategory) -> BlogCategory:
        self.db.add(cat)
        await self.db.flush()
        await self.db.refresh(cat)
        return cat

    # ---- Tag ----
    async def get_or_create_tags(self, names: list[str]) -> list[Tag]:
        from app.utils.slugify import slugify

        result: list[Tag] = []
        for name in names:
            name = name.strip()
            if not name:
                continue
            slug = slugify(name)
            tag = (
                await self.db.execute(select(Tag).where(Tag.slug == slug))
            ).scalar_one_or_none()
            if tag is None:
                tag = Tag(name=name, slug=slug)
                self.db.add(tag)
                await self.db.flush()
            result.append(tag)
        return result

    # ---- Post ----
    async def get_post(self, post_id: UUID) -> BlogPost | None:
        from sqlalchemy.orm import selectinload

        stmt = (
            select(BlogPost)
            .where(BlogPost.id == post_id)
            .options(
                selectinload(BlogPost.category),
                selectinload(BlogPost.author),
                selectinload(BlogPost.tags),
            )
        )
        return (await self.db.execute(stmt)).scalar_one_or_none()

    async def post_slug_exists(self, slug: str) -> bool:
        stmt = select(BlogPost.id).where(BlogPost.slug == slug)
        return (await self.db.execute(stmt)).first() is not None

    async def get_published_by_slug(self, slug: str) -> BlogPost | None:
        from sqlalchemy.orm import selectinload

        stmt = (
            select(BlogPost)
            .where(
                BlogPost.slug == slug,
                BlogPost.status == "published",
                BlogPost.deleted_at.is_(None),
            )
            .options(
                selectinload(BlogPost.category),
                selectinload(BlogPost.author),
                selectinload(BlogPost.tags),
            )
        )
        return (await self.db.execute(stmt)).scalar_one_or_none()

    async def add_post(self, post: BlogPost) -> BlogPost:
        self.db.add(post)
        await self.db.flush()
        await self.db.refresh(post)
        return post

    async def list_admin(
        self, status: str | None, page: int, page_size: int
    ) -> tuple[list[BlogPost], int]:
        from sqlalchemy.orm import selectinload
        base = (
            select(BlogPost)
            .where(BlogPost.deleted_at.is_(None))
            .options(selectinload(BlogPost.category))
        )
        if status:
            base = base.where(BlogPost.status == status)
        total = (
            await self.db.execute(
                select(func.count()).select_from(base.subquery())
            )
        ).scalar_one()
        stmt = (
            base.order_by(BlogPost.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        rows = list((await self.db.execute(stmt)).scalars().all())
        return rows, total

    async def list_public(
        self, category_slug: str | None, page: int, page_size: int
    ) -> tuple[list[BlogPost], int]:
        from sqlalchemy.orm import selectinload
        base = select(BlogPost).where(
            BlogPost.status == "published", BlogPost.deleted_at.is_(None)
        ).options(selectinload(BlogPost.category))
        if category_slug:
            base = base.join(BlogCategory).where(
                BlogCategory.slug == category_slug
            )
        total = (
            await self.db.execute(
                select(func.count()).select_from(base.subquery())
            )
        ).scalar_one()
        stmt = (
            base.order_by(BlogPost.published_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        rows = list((await self.db.execute(stmt)).scalars().all())
        return rows, total

    async def related(
        self, post: BlogPost, limit: int = 3
    ) -> list[BlogPost]:
        stmt = (
            select(BlogPost)
            .where(
                BlogPost.category_id == post.category_id,
                BlogPost.id != post.id,
                BlogPost.status == "published",
                BlogPost.deleted_at.is_(None),
            )
            .order_by(BlogPost.published_at.desc())
            .limit(limit)
        )
        return list((await self.db.execute(stmt)).scalars().all())

    async def all_published_slugs(self) -> list[tuple[str, str]]:
        """Trả (slug, category_slug) cho sitemap."""
        stmt = (
            select(BlogPost.slug, BlogCategory.slug)
            .join(BlogCategory)
            .where(BlogPost.status == "published", BlogPost.deleted_at.is_(None))
        )
        return [(r[0], r[1]) for r in (await self.db.execute(stmt)).all()]
