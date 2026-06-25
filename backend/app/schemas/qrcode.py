"""DTO QR Code & Traceability (M8)."""
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class QRScanLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    qr_code_id: UUID
    ip_address: str | None = None
    user_agent: str | None = None
    referer: str | None = None
    result: str
    created_at: datetime


class QRCodeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    batch_id: UUID
    token: str
    label: str | None = None
    status: str
    scan_count: int
    single_use: bool
    created_at: datetime


class ProductBatchCreate(BaseModel):
    batch_no: str | None = Field(default=None, max_length=50)
    product_id: UUID
    manufacture_date: str | None = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    expiry_date: str | None = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    quantity: int = Field(default=1, ge=1, le=1000)  # Max 1000 codes per batch for safety
    warehouse: str = Field(default="main", max_length=50)
    supplier_name: str | None = Field(default=None, max_length=255)
    origin_region: str | None = Field(default="Tây Ninh", max_length=100)
    notes: str | None = None


class ProductBatchUpdate(BaseModel):
    manufacture_date: str | None = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    expiry_date: str | None = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    warehouse: str | None = Field(default=None, max_length=50)
    supplier_name: str | None = Field(default=None, max_length=255)
    origin_region: str | None = Field(default=None, max_length=100)
    notes: str | None = None
    status: str | None = Field(default=None, max_length=20)


class ProductBatchOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    batch_no: str
    product_id: UUID
    product_name: str | None = None
    sku: str | None = None
    manufacture_date: str | None
    expiry_date: str | None
    quantity: int
    warehouse: str
    supplier_name: str | None
    origin_region: str | None
    notes: str | None
    status: str
    qr_count: int
    created_by: UUID
    created_at: datetime
    updated_at: datetime


class QRVerifyResponse(BaseModel):
    authentic: bool
    status: str  # active, revoked, not_found, etc.
    scan_count: int
    first_scan_at: datetime | None = None
    batch: ProductBatchOut | None = None
    message: str
    warning: str | None = None
