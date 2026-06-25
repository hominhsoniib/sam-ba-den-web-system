"""Truy vấn dữ liệu Sản phẩm (M6)."""
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.product import Product, ProductCategory


class ProductRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ---- Category ----
    async def get_category(self, cat_id: UUID) -> ProductCategory | None:
        return await self.db.get(ProductCategory, cat_id)

    async def category_slug_exists(self, slug: str) -> bool:
        stmt = select(ProductCategory.id).where(ProductCategory.slug == slug)
        return (await self.db.execute(stmt)).first() is not None

    async def list_categories(self) -> list[ProductCategory]:
        stmt = select(ProductCategory).order_by(
            ProductCategory.sort_order, ProductCategory.name
        )
        return list((await self.db.execute(stmt)).scalars().all())

    async def add_category(self, cat: ProductCategory) -> ProductCategory:
        self.db.add(cat)
        await self.db.flush()
        await self.db.refresh(cat)
        return cat

    # ---- Product ----
    def _full(self):
        return (
            selectinload(Product.category),
            selectinload(Product.images),
        )

    async def get_product(self, pid: UUID) -> Product | None:
        stmt = (
            select(Product).where(Product.id == pid).options(*self._full())
        )
        return (await self.db.execute(stmt)).scalar_one_or_none()

    async def get_by_slug_active(self, slug: str) -> Product | None:
        stmt = (
            select(Product)
            .where(Product.slug == slug, Product.status == "active")
            .options(*self._full())
        )
        return (await self.db.execute(stmt)).scalar_one_or_none()

    async def product_slug_exists(self, slug: str) -> bool:
        stmt = select(Product.id).where(Product.slug == slug)
        return (await self.db.execute(stmt)).first() is not None

    async def add_product(self, product: Product) -> Product:
        self.db.add(product)
        await self.db.flush()
        await self.db.refresh(product)
        return product

    async def list_admin(
        self, status: str | None, page: int, page_size: int
    ) -> tuple[list[Product], int]:
        base = select(Product).options(*self._full())
        if status:
            base = base.where(Product.status == status)
        total = (
            await self.db.execute(select(func.count()).select_from(base.subquery()))
        ).scalar_one()
        stmt = (
            base.order_by(Product.sort_order, Product.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        rows = list((await self.db.execute(stmt)).scalars().all())
        return rows, total

    async def list_public(
        self, category_slug: str | None, page: int, page_size: int
    ) -> tuple[list[Product], int]:
        base = (
            select(Product)
            .where(Product.status == "active")
            .options(*self._full())
        )
        if category_slug:
            base = base.join(ProductCategory).where(
                ProductCategory.slug == category_slug
            )
        total = (
            await self.db.execute(select(func.count()).select_from(base.subquery()))
        ).scalar_one()
        stmt = (
            base.order_by(Product.sort_order, Product.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        rows = list((await self.db.execute(stmt)).scalars().all())
        return rows, total

    async def related(self, product: Product, limit: int = 4) -> list[Product]:
        stmt = (
            select(Product)
            .where(
                Product.category_id == product.category_id,
                Product.id != product.id,
                Product.status == "active",
            )
            .options(*self._full())
            .order_by(Product.sort_order)
            .limit(limit)
        )
        return list((await self.db.execute(stmt)).scalars().all())

    async def all_active_slugs(self) -> list[str]:
        stmt = select(Product.slug).where(Product.status == "active")
        return [r[0] for r in (await self.db.execute(stmt)).all()]
