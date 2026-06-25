"""DTO cho Sản phẩm (M6) - Đầy đủ: SKU, barcode, multi-pricing, inventory."""
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# ---------- Category ----------
class ProductCategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    slug: str | None = None
    description: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    sort_order: int = 0


class ProductCategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str
    slug: str
    description: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    sort_order: int


# ---------- Image ----------
class ProductImageIn(BaseModel):
    image_url: str
    alt_text: str | None = None
    is_primary: bool = False
    sort_order: int = 0


class ProductImageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    image_url: str
    alt_text: str | None = None
    is_primary: bool
    sort_order: int


# ---------- Price ----------
class ProductPriceIn(BaseModel):
    """Đầu vào để set giá theo kênh."""
    channel: str = Field(
        description="retail | tier_1 | tier_2 | tier_3 | wholesale"
    )
    price: Decimal = Field(ge=0)
    is_active: bool = True
    note: str | None = None


class ProductPriceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    channel: str
    price: Decimal
    is_active: bool
    note: str | None = None


# ---------- Inventory ----------
class ProductInventoryIn(BaseModel):
    """Đầu vào để set tồn kho theo kho."""
    warehouse: str = Field(default="main", max_length=50)
    qty_on_hand: int = Field(ge=0, default=0)
    qty_reserved: int = Field(ge=0, default=0)
    low_stock_threshold: int = Field(ge=0, default=10)


class ProductInventoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    warehouse: str
    qty_on_hand: int
    qty_reserved: int
    qty_available: int
    low_stock_threshold: int


# ---------- Product (Admin) ----------
class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    slug: str | None = None
    sku: str | None = None
    barcode: str | None = None
    category_id: UUID
    short_desc: str | None = None
    description: str | None = None
    reference_price: Decimal | None = None
    unit: str | None = None
    packaging_info: str | None = None
    weight_g: int | None = None
    usage_info: str | None = None
    disclaimer: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    og_image_url: str | None = None
    status: str = "active"
    sort_order: int = 0
    images: list[ProductImageIn] = []
    prices: list[ProductPriceIn] = []
    inventory: list[ProductInventoryIn] = []


class ProductUpdate(BaseModel):
    name: str | None = None
    sku: str | None = None
    barcode: str | None = None
    category_id: UUID | None = None
    short_desc: str | None = None
    description: str | None = None
    reference_price: Decimal | None = None
    unit: str | None = None
    packaging_info: str | None = None
    weight_g: int | None = None
    usage_info: str | None = None
    disclaimer: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    og_image_url: str | None = None
    status: str | None = None
    sort_order: int | None = None
    images: list[ProductImageIn] | None = None
    prices: list[ProductPriceIn] | None = None
    inventory: list[ProductInventoryIn] | None = None


class ProductListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str
    slug: str
    sku: str | None = None
    barcode: str | None = None
    short_desc: str | None = None
    reference_price: Decimal | None = None
    unit: str | None = None
    status: str
    category: ProductCategoryOut
    primary_image: str | None = None
    # Tồn kho tổng (sum tất cả kho)
    total_stock: int = 0


class ProductAdminDetail(ProductListItem):
    description: str | None = None
    packaging_info: str | None = None
    weight_g: int | None = None
    usage_info: str | None = None
    disclaimer: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    og_image_url: str | None = None
    sort_order: int
    images: list[ProductImageOut] = []
    prices: list[ProductPriceOut] = []
    inventory: list[ProductInventoryOut] = []


# ---------- Inventory adjustment ----------
class InventoryAdjustIn(BaseModel):
    """Điều chỉnh tồn kho (nhập/xuất/điều chỉnh thủ công)."""
    warehouse: str = "main"
    delta: int = Field(description="Số lượng thay đổi (dương = nhập, âm = xuất)")
    reason: str | None = Field(None, max_length=255)


# ---------- Product (Public) ----------
class SeoMeta(BaseModel):
    title: str
    description: str | None = None
    canonical_url: str | None = None
    robots: str = "index,follow"
    og_title: str | None = None
    og_description: str | None = None
    og_image: str | None = None


class ProductPublicDetail(BaseModel):
    id: UUID
    name: str
    slug: str
    short_desc: str | None = None
    description: str | None = None
    reference_price: Decimal | None = None
    unit: str | None = None
    usage_info: str | None = None
    disclaimer: str | None = None
    category: ProductCategoryOut
    images: list[ProductImageOut] = []
    seo: SeoMeta
    json_ld: list[dict] = []
    related: list[ProductListItem] = []
