"""DTO Đơn hàng (M7)."""
from decimal import Decimal
from uuid import UUID
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


# ── Trạng thái ─────────────────────────────────────────────────
OrderStatus = Literal[
    "draft",
    "confirmed",
    "shipping",
    "completed",
    "cancelled",
    "return_requested",
    "returned",
]

ALLOWED_TRANSITIONS: dict[str, list[str]] = {
    "draft": ["confirmed", "cancelled"],
    "confirmed": ["shipping", "cancelled"],
    "shipping": ["completed", "return_requested"],
    "completed": ["return_requested"],
    "return_requested": ["returned", "completed"],  # completed = từ chối trả
    "cancelled": [],
    "returned": [],
}


# ── Item ─────────────────────────────────────────────────────────
class OrderItemIn(BaseModel):
    product_id: UUID
    qty: int = Field(ge=1)
    # Nếu để None, service tự lấy giá theo channel + discount của dealer
    unit_price: Decimal | None = None
    discount_pct: Decimal = Field(default=0, ge=0, le=100)


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    product_id: UUID
    product_name: str
    sku: str | None = None
    unit_price: Decimal
    qty: int
    discount_pct: Decimal
    line_total: Decimal


# ── Status log ───────────────────────────────────────────────────
class OrderStatusLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    from_status: str | None
    to_status: str
    note: str | None
    changed_by: UUID
    created_at: datetime


# ── Order ────────────────────────────────────────────────────────
class OrderCreate(BaseModel):
    """Tạo đơn hàng mới (bắt đầu ở trạng thái draft)."""
    # Một trong hai phải có giá trị
    customer_id: UUID | None = None
    dealer_id: UUID | None = None

    channel: str = Field(default="retail", description="retail|tier_1|tier_2|tier_3|wholesale")
    warehouse: str = Field(default="main")

    shipping_name: str | None = None
    shipping_phone: str | None = None
    shipping_address: str | None = None
    shipping_province: str | None = None

    shipping_fee: Decimal = Field(default=0, ge=0)
    discount_amount: Decimal = Field(default=0, ge=0)

    note: str | None = None
    items: list[OrderItemIn] = Field(min_length=1)


class OrderStatusChange(BaseModel):
    """Cập nhật trạng thái đơn hàng."""
    to_status: str
    note: str | None = None


class OrderUpdate(BaseModel):
    """Cập nhật thông tin giao hàng / ghi chú (chỉ khi còn draft)."""
    shipping_name: str | None = None
    shipping_phone: str | None = None
    shipping_address: str | None = None
    shipping_province: str | None = None
    shipping_fee: Decimal | None = None
    discount_amount: Decimal | None = None
    note: str | None = None


class OrderListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    order_no: str
    status: str
    channel: str
    customer_id: UUID | None
    dealer_id: UUID | None
    # Tên hiển thị (lấy từ customer hoặc dealer)
    buyer_name: str | None = None
    subtotal: Decimal
    discount_amount: Decimal
    shipping_fee: Decimal
    total_amount: Decimal
    warehouse: str
    created_at: datetime
    updated_at: datetime


class OrderDetail(OrderListItem):
    shipping_name: str | None
    shipping_phone: str | None
    shipping_address: str | None
    shipping_province: str | None
    note: str | None
    cancel_reason: str | None
    items: list[OrderItemOut] = []
    status_logs: list[OrderStatusLogOut] = []
