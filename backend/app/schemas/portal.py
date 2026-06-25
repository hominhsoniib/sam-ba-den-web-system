"""Pydantic schemas cho Cổng thông tin Đại lý (Dealer Portal)."""
from __future__ import annotations

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

class PortalDealerProfile(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    code: str
    name: str
    tier: str
    region: str
    address: str | None = None
    contact_name: str | None = None
    phone: str | None = None
    credit_limit: float
    payment_term_days: int
    status: str
    balance: float = 0.0 # Tính toán nợ hiện tại (Số dư Sổ cái)


class PortalProduct(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    sku: str
    name: str
    category_id: UUID | None = None
    image_url: str | None = None
    description: str | None = None
    unit: str
    
    # Giá bán mặc định
    base_price: float
    
    # Giá sỉ áp dụng riêng cho Đại lý này
    dealer_price: float
    discount_percent: float = 0.0

    in_stock: bool = True # Chỉ hiện còn hàng/hết hàng thay vì số lượng chính xác


class PortalOrderCreateItem(BaseModel):
    product_id: UUID
    quantity: int = Field(..., gt=0)


class PortalOrderCreate(BaseModel):
    items: list[PortalOrderCreateItem]
    shipping_address: str | None = None
    note: str | None = None


class PortalPaymentCreate(BaseModel):
    amount: float = Field(..., gt=0)


class PortalPaymentUrlOut(BaseModel):
    payment_url: str


class PortalPaymentVerifyOut(BaseModel):
    status: str
    amount: float
    txn_ref: str
    message: str
