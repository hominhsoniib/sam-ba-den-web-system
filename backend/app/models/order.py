"""Models Đơn hàng (M7): Order, OrderItem, OrderStatusLog.

Vòng đời đơn hàng:
  draft → confirmed → shipping → completed
                    ↘ cancelled
  Riêng với return: completed → return_requested → returned

Khi xác nhận (confirmed):
  - Ghi nợ vào dealer_ledger (nếu đơn B2B)
  - Trừ qty_on_hand & tăng qty_reserved trong product_inventory

Khi huỷ/trả hàng:
  - Giải phóng qty_reserved
  - Ghi có vào dealer_ledger (nếu cần)
"""
from __future__ import annotations
from uuid import UUID

from sqlalchemy import ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Order(Base):
    __tablename__ = "orders"

    # Mã đơn hàng hiển thị cho người dùng (VD: ORD-20250101-0001)
    order_no: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)

    # Người đặt – có thể là customer (B2C) hoặc dealer (B2B)
    customer_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("customers.id"), nullable=True, index=True
    )
    dealer_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("dealers.id"), nullable=True, index=True
    )

    # Kênh bán (xác định bảng giá): retail | tier_1 | tier_2 | tier_3 | wholesale
    channel: Mapped[str] = mapped_column(String(30), nullable=False, default="retail")

    # Trạng thái đơn hàng
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="draft", index=True
    )
    # draft | confirmed | shipping | completed | cancelled | return_requested | returned

    # Địa chỉ giao hàng
    shipping_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    shipping_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    shipping_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    shipping_province: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Tài chính
    subtotal: Mapped[float] = mapped_column(Numeric(14, 2), default=0.0, nullable=False)
    discount_amount: Mapped[float] = mapped_column(Numeric(14, 2), default=0.0, nullable=False)
    shipping_fee: Mapped[float] = mapped_column(Numeric(14, 2), default=0.0, nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(14, 2), default=0.0, nullable=False)

    # Ghi chú
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Lý do huỷ/trả
    cancel_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Kho xuất hàng
    warehouse: Mapped[str] = mapped_column(String(50), nullable=False, default="main")

    # Người tạo đơn (staff)
    created_by: Mapped[UUID] = mapped_column(ForeignKey("users.id"), nullable=False)

    # Relationships
    items: Mapped[list[OrderItem]] = relationship(
        back_populates="order",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    status_logs: Mapped[list[OrderStatusLog]] = relationship(
        back_populates="order",
        lazy="selectin",
        order_by="OrderStatusLog.created_at",
        cascade="all, delete-orphan",
    )
    customer = relationship("Customer", lazy="selectin")
    dealer = relationship("Dealer", lazy="selectin")
    creator = relationship("User", lazy="selectin")


class OrderItem(Base):
    __tablename__ = "order_items"

    order_id: Mapped[UUID] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True
    )
    product_id: Mapped[UUID] = mapped_column(
        ForeignKey("products.id"), nullable=False, index=True
    )

    # Snapshot giá tại thời điểm đặt hàng (bất biến sau confirmed)
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    sku: Mapped[str | None] = mapped_column(String(50), nullable=True)
    unit_price: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    qty: Mapped[int] = mapped_column(Integer, nullable=False)
    discount_pct: Mapped[float] = mapped_column(Numeric(5, 2), default=0.0, nullable=False)
    line_total: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)

    order: Mapped[Order] = relationship(back_populates="items")
    product = relationship("Product", lazy="selectin")


class OrderStatusLog(Base):
    __tablename__ = "order_status_logs"

    order_id: Mapped[UUID] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True
    )
    from_status: Mapped[str | None] = mapped_column(String(30), nullable=True)
    to_status: Mapped[str] = mapped_column(String(30), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    changed_by: Mapped[UUID] = mapped_column(ForeignKey("users.id"), nullable=False)

    order: Mapped[Order] = relationship(back_populates="status_logs")
    changer = relationship("User", lazy="selectin")
