"""Models Sản phẩm (M6): ProductCategory, Product, ProductImage, ProductPrice, ProductInventory.

M6 đầy đủ:
- ProductCategory: danh mục sản phẩm
- Product: thông tin sản phẩm (SKU, barcode, đơn vị, mô tả)
- ProductImage: ảnh sản phẩm (nhiều ảnh, 1 ảnh chính)
- ProductPrice: bảng giá đa kênh (retail, tier_1, tier_2, ...) 
- ProductInventory: tồn kho theo kho hàng
"""
from __future__ import annotations

from uuid import UUID

from sqlalchemy import ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ProductCategory(Base):
    __tablename__ = "product_categories"

    name: Mapped[str] = mapped_column(String(150))
    slug: Mapped[str] = mapped_column(String(180), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    seo_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    seo_description: Mapped[str | None] = mapped_column(String(320), nullable=True)
    sort_order: Mapped[int] = mapped_column(default=0)

    products: Mapped[list[Product]] = relationship(back_populates="category")


class Product(Base):
    __tablename__ = "products"

    name: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(280), unique=True, index=True)
    # Mã hàng nội bộ (SKU) và mã vạch quốc tế (barcode/EAN)
    sku: Mapped[str | None] = mapped_column(String(50), unique=True, nullable=True, index=True)
    barcode: Mapped[str | None] = mapped_column(String(50), unique=True, nullable=True, index=True)

    category_id: Mapped[UUID] = mapped_column(
        ForeignKey("product_categories.id"), index=True
    )
    short_desc: Mapped[str | None] = mapped_column(String(500), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    unit: Mapped[str | None] = mapped_column(String(20), nullable=True)  # kg, gói, chai,...
    # Quy cách đóng gói (vd: "1 thùng = 24 chai 500ml")
    packaging_info: Mapped[str | None] = mapped_column(String(255), nullable=True)
    usage_info: Mapped[str | None] = mapped_column(Text, nullable=True)
    disclaimer: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Giá bán lẻ tham khảo (VND) - hiển thị trên web
    reference_price: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)

    # Trọng lượng (grams) - dùng cho tính phí ship
    weight_g: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # SEO
    seo_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    seo_description: Mapped[str | None] = mapped_column(String(320), nullable=True)
    og_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    status: Mapped[str] = mapped_column(String(20), default="active", index=True)
    sort_order: Mapped[int] = mapped_column(default=0)

    category: Mapped[ProductCategory] = relationship(
        back_populates="products", lazy="selectin"
    )
    images: Mapped[list[ProductImage]] = relationship(
        back_populates="product",
        lazy="selectin",
        cascade="all, delete-orphan",
        order_by="ProductImage.sort_order",
    )
    prices: Mapped[list[ProductPrice]] = relationship(
        back_populates="product",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    inventory: Mapped[list[ProductInventory]] = relationship(
        back_populates="product",
        lazy="selectin",
        cascade="all, delete-orphan",
    )


class ProductImage(Base):
    __tablename__ = "product_images"

    product_id: Mapped[UUID] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"), index=True
    )
    image_url: Mapped[str] = mapped_column(String(500))
    alt_text: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_primary: Mapped[bool] = mapped_column(default=False)
    sort_order: Mapped[int] = mapped_column(default=0)

    product: Mapped[Product] = relationship(back_populates="images")


class ProductPrice(Base):
    """Bảng giá đa kênh.
    
    channel: 'retail' | 'tier_1' | 'tier_2' | 'tier_3' | 'wholesale'
    Mỗi sản phẩm chỉ có 1 giá / kênh (unique constraint).
    """
    __tablename__ = "product_prices"
    __table_args__ = (
        UniqueConstraint("product_id", "channel", name="uq_product_channel"),
    )

    product_id: Mapped[UUID] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"), index=True
    )
    # Kênh bán: retail, tier_1, tier_2, tier_3, wholesale
    channel: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    price: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    # Giá có thể bị vô hiệu hóa (ví dụ: ngừng bán theo kênh)
    is_active: Mapped[bool] = mapped_column(default=True)
    # Ghi chú (vd: "Áp dụng từ 01/2025")
    note: Mapped[str | None] = mapped_column(String(255), nullable=True)

    product: Mapped[Product] = relationship(back_populates="prices")


class ProductInventory(Base):
    """Tồn kho sản phẩm theo kho.
    
    warehouse: 'main' | 'hanoi' | 'hcm' | ... (mã kho)
    Mỗi sản phẩm chỉ có 1 bản ghi / kho (unique constraint).
    """
    __tablename__ = "product_inventory"
    __table_args__ = (
        UniqueConstraint("product_id", "warehouse", name="uq_product_warehouse"),
    )

    product_id: Mapped[UUID] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"), index=True
    )
    # Mã kho
    warehouse: Mapped[str] = mapped_column(String(50), nullable=False, default="main")
    # Số lượng tồn kho thực tế
    qty_on_hand: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    # Số lượng đang được giữ (đã vào đơn, chờ xuất)
    qty_reserved: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    # Mức cảnh báo tồn kho thấp (trigger alert)
    low_stock_threshold: Mapped[int] = mapped_column(Integer, default=10, nullable=False)

    product: Mapped[Product] = relationship(back_populates="inventory")

    @property
    def qty_available(self) -> int:
        """Tồn kho khả dụng = on_hand - reserved."""
        return max(0, self.qty_on_hand - self.qty_reserved)
