"""Logic nghiệp vụ Sản phẩm (M6): CRUD, bảng giá đa kênh, tồn kho, SEO/JSON-LD."""
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.models.product import Product, ProductCategory, ProductImage, ProductPrice, ProductInventory
from app.repositories.product_repository import ProductRepository
from app.schemas.product import (
    InventoryAdjustIn,
    ProductCategoryCreate,
    ProductCreate,
    ProductPublicDetail,
    ProductUpdate,
    SeoMeta,
)
from app.utils.slugify import slugify


def _primary_image(product: Product) -> str | None:
    if not product.images:
        return None
    for img in product.images:
        if img.is_primary:
            return img.image_url
    return product.images[0].image_url


def _total_stock(product: Product) -> int:
    """Tổng tồn kho khả dụng (qty_on_hand - qty_reserved) trên tất cả kho."""
    return sum(max(0, inv.qty_on_hand - inv.qty_reserved) for inv in product.inventory)


class ProductService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = ProductRepository(db)

    # ---------- Category ----------
    async def create_category(self, payload: ProductCategoryCreate) -> ProductCategory:
        slug = payload.slug or slugify(payload.name)
        if await self.repo.category_slug_exists(slug):
            raise ConflictError("slug_exists", f"Slug danh mục đã tồn tại: {slug}")
        cat = ProductCategory(
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

    async def list_categories(self):
        return await self.repo.list_categories()

    # ---------- Product ----------
    async def _unique_slug(self, base: str) -> str:
        slug, i = base, 2
        while await self.repo.product_slug_exists(slug):
            slug = f"{base}-{i}"
            i += 1
        return slug

    async def create_product(self, payload: ProductCreate) -> Product:
        if await self.repo.get_category(payload.category_id) is None:
            raise NotFoundError("category_not_found", "Danh mục không tồn tại")
        base_slug = payload.slug or slugify(payload.name)
        if not base_slug:
            raise ValidationError("invalid_name", "Tên không tạo được slug")
        slug = await self._unique_slug(base_slug)

        product = Product(
            name=payload.name,
            slug=slug,
            sku=payload.sku,
            barcode=payload.barcode,
            category_id=payload.category_id,
            short_desc=payload.short_desc,
            description=payload.description,
            reference_price=payload.reference_price,
            unit=payload.unit,
            packaging_info=payload.packaging_info,
            weight_g=payload.weight_g,
            usage_info=payload.usage_info,
            disclaimer=payload.disclaimer,
            seo_title=payload.seo_title,
            seo_description=payload.seo_description,
            og_image_url=payload.og_image_url,
            status=payload.status,
            sort_order=payload.sort_order,
            images=[
                ProductImage(
                    image_url=im.image_url,
                    alt_text=im.alt_text,
                    is_primary=im.is_primary,
                    sort_order=im.sort_order,
                )
                for im in payload.images
            ],
            prices=[
                ProductPrice(
                    channel=pr.channel,
                    price=pr.price,
                    is_active=pr.is_active,
                    note=pr.note,
                )
                for pr in payload.prices
            ],
            inventory=[
                ProductInventory(
                    warehouse=inv.warehouse,
                    qty_on_hand=inv.qty_on_hand,
                    qty_reserved=inv.qty_reserved,
                    low_stock_threshold=inv.low_stock_threshold,
                )
                for inv in payload.inventory
            ],
        )
        product = await self.repo.add_product(product)
        await self.db.commit()
        return await self.repo.get_product(product.id)

    async def update_product(self, pid: UUID, payload: ProductUpdate) -> Product:
        product = await self.repo.get_product(pid)
        if product is None:
            raise NotFoundError("product_not_found", "Sản phẩm không tồn tại")
        data = payload.model_dump(exclude_unset=True)
        if "category_id" in data:
            if await self.repo.get_category(data["category_id"]) is None:
                raise NotFoundError("category_not_found", "Danh mục không tồn tại")

        # Xử lý images riêng (replace toàn bộ)
        if "images" in data:
            imgs = data.pop("images")
            product.images = [
                ProductImage(
                    image_url=im["image_url"],
                    alt_text=im.get("alt_text"),
                    is_primary=im.get("is_primary", False),
                    sort_order=im.get("sort_order", 0),
                )
                for im in imgs
            ]

        # Xử lý prices riêng (replace toàn bộ)
        if "prices" in data:
            prices = data.pop("prices")
            product.prices = [
                ProductPrice(
                    channel=pr["channel"],
                    price=pr["price"],
                    is_active=pr.get("is_active", True),
                    note=pr.get("note"),
                )
                for pr in prices
            ]

        # Xử lý inventory riêng (replace toàn bộ)
        if "inventory" in data:
            inventory = data.pop("inventory")
            product.inventory = [
                ProductInventory(
                    warehouse=inv["warehouse"],
                    qty_on_hand=inv["qty_on_hand"],
                    qty_reserved=inv.get("qty_reserved", 0),
                    low_stock_threshold=inv.get("low_stock_threshold", 10),
                )
                for inv in inventory
            ]

        for field, value in data.items():
            setattr(product, field, value)
        await self.db.commit()
        return await self.repo.get_product(pid)

    async def delete_product(self, pid: UUID) -> None:
        product = await self.repo.get_product(pid)
        if product is None:
            raise NotFoundError("product_not_found", "Sản phẩm không tồn tại")
        await self.db.delete(product)
        await self.db.commit()

    async def list_admin(self, status, page, page_size):
        return await self.repo.list_admin(status, page, page_size)

    async def list_public(self, category_slug, page, page_size):
        return await self.repo.list_public(category_slug, page, page_size)

    # ---------- Inventory adjustment ----------
    async def adjust_inventory(self, pid: UUID, payload: InventoryAdjustIn) -> Product:
        """Điều chỉnh tồn kho (nhập/xuất thủ công).
        
        Dùng SELECT ... FOR UPDATE để tránh race condition.
        """
        product = await self.repo.get_product(pid)
        if product is None:
            raise NotFoundError("product_not_found", "Sản phẩm không tồn tại")

        # Tìm bản ghi inventory của kho này
        inv_row = next(
            (inv for inv in product.inventory if inv.warehouse == payload.warehouse),
            None,
        )

        if inv_row is None:
            # Tạo mới bản ghi inventory cho kho nếu chưa có
            inv_row = ProductInventory(
                product_id=pid,
                warehouse=payload.warehouse,
                qty_on_hand=0,
                qty_reserved=0,
                low_stock_threshold=10,
            )
            self.db.add(inv_row)
            await self.db.flush()

        new_qty = inv_row.qty_on_hand + payload.delta
        if new_qty < 0:
            raise ValidationError(
                "insufficient_stock",
                f"Tồn kho không đủ. Hiện tại: {inv_row.qty_on_hand}, yêu cầu xuất: {abs(payload.delta)}"
            )

        inv_row.qty_on_hand = new_qty
        await self.db.commit()
        return await self.repo.get_product(pid)

    # ---------- Public detail ----------
    async def get_public_detail(self, slug: str) -> ProductPublicDetail:
        product = await self.repo.get_by_slug_active(slug)
        if product is None:
            raise NotFoundError("product_not_found", "Sản phẩm không tồn tại")
        related = await self.repo.related(product)
        return self._to_public(product, related)

    def _to_public(self, p: Product, related) -> ProductPublicDetail:
        site = getattr(settings, "site_url", "http://localhost:4174")
        url = f"{site}/san-pham/{p.slug}"
        primary = _primary_image(p)
        seo = SeoMeta(
            title=p.seo_title or p.name,
            description=p.seo_description or p.short_desc,
            canonical_url=url,
            robots="index,follow",
            og_title=p.seo_title or p.name,
            og_description=p.seo_description or p.short_desc,
            og_image=p.og_image_url or primary,
        )
        json_ld = self._product_json_ld(p, url, primary)
        related_items = [self._to_list_item(r) for r in related]
        return ProductPublicDetail(
            id=p.id,
            name=p.name,
            slug=p.slug,
            short_desc=p.short_desc,
            description=p.description,
            reference_price=p.reference_price,
            unit=p.unit,
            usage_info=p.usage_info,
            disclaimer=p.disclaimer,
            category=p.category,
            images=p.images,
            seo=seo,
            json_ld=[json_ld],
            related=related_items,
        )

    @staticmethod
    def _product_json_ld(p: Product, url: str, image: str | None) -> dict:
        data: dict = {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": p.name,
            "url": url,
            "category": p.category.name,
            "brand": {"@type": "Brand", "name": "Sâm Bà Đen"},
        }
        if p.short_desc:
            data["description"] = p.short_desc
        if image:
            data["image"] = image
        if p.sku:
            data["sku"] = p.sku
        if p.barcode:
            data["gtin13"] = p.barcode
        if p.reference_price is not None:
            data["offers"] = {
                "@type": "Offer",
                "price": str(Decimal(p.reference_price)),
                "priceCurrency": "VND",
                "availability": "https://schema.org/InStock",
                "url": url,
            }
        return data

    @staticmethod
    def _to_list_item(p: Product) -> dict:
        return {
            "id": p.id,
            "name": p.name,
            "slug": p.slug,
            "sku": p.sku,
            "barcode": p.barcode,
            "short_desc": p.short_desc,
            "reference_price": p.reference_price,
            "unit": p.unit,
            "status": p.status,
            "category": p.category,
            "primary_image": _primary_image(p),
            "total_stock": _total_stock(p),
        }


def to_list_item(p: Product) -> dict:
    return ProductService._to_list_item(p)
