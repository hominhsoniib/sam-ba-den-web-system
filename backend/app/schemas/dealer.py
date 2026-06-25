"""Pydantic schemas cho module Quản lý Đại lý (M5)."""
from __future__ import annotations

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, field_validator

# ─────────────────────────────────────────────────────────────────────
# Dealer Schemas
# ─────────────────────────────────────────────────────────────────────

class DealerBase(BaseModel):
    code: str = Field(..., min_length=2, max_length=30)
    name: str = Field(..., min_length=2, max_length=255)
    tier: str = Field(..., pattern=r"^(tier_1|tier_2)$")
    region: str = Field(..., min_length=2, max_length=100)
    address: str | None = None
    contact_name: str | None = None
    phone: str | None = None
    lat: float | None = None
    lng: float | None = None
    credit_limit: float = Field(default=0.0, ge=0.0)
    payment_term_days: int = Field(default=0, ge=0)

class DealerCreate(DealerBase):
    user_id: UUID | None = None

class DealerUpdate(BaseModel):
    code: str | None = Field(None, min_length=2, max_length=30)
    name: str | None = Field(None, min_length=2, max_length=255)
    tier: str | None = Field(None, pattern=r"^(tier_1|tier_2)$")
    region: str | None = Field(None, min_length=2, max_length=100)
    address: str | None = None
    contact_name: str | None = None
    phone: str | None = None
    lat: float | None = None
    lng: float | None = None
    credit_limit: float | None = Field(None, ge=0.0)
    payment_term_days: int | None = Field(None, ge=0)
    status: str | None = Field(None, pattern=r"^(pending|active|suspended)$")

class DealerOut(DealerBase):
    id: UUID
    status: str
    user_id: UUID | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

class DealerApprove(BaseModel):
    code: str = Field(..., min_length=2, max_length=30)
    tier: str = Field(..., pattern=r"^(tier_1|tier_2)$")
    region: str = Field(..., min_length=2, max_length=100)
    credit_limit: float = Field(default=0.0, ge=0.0)
    payment_term_days: int = Field(default=0, ge=0)

# ─────────────────────────────────────────────────────────────────────
# DealerDiscount Schemas
# ─────────────────────────────────────────────────────────────────────

class DealerDiscountBase(BaseModel):
    dealer_id: UUID | None = None
    tier: str | None = Field(None, pattern=r"^(tier_1|tier_2)$")
    product_id: UUID | None = None
    category_id: UUID | None = None
    discount_percent: float = Field(..., ge=0.0, le=100.0)
    start_at: datetime
    end_at: datetime | None = None
    is_active: bool = True

class DealerDiscountCreate(DealerDiscountBase):
    pass

class DealerDiscountOut(DealerDiscountBase):
    id: UUID

    model_config = {"from_attributes": True}

# ─────────────────────────────────────────────────────────────────────
# DealerLedger Schemas
# ─────────────────────────────────────────────────────────────────────

class DealerLedgerBase(BaseModel):
    entry_type: str = Field(..., pattern=r"^(debit|credit)$")
    amount: float = Field(..., gt=0.0)
    ref_type: str = Field(..., pattern=r"^(order|payment|adjustment|return)$")
    ref_id: UUID | None = None
    note: str | None = None

class DealerLedgerCreate(BaseModel):
    entry_type: str = Field("credit", pattern=r"^(debit|credit)$")
    amount: float = Field(..., gt=0.0)
    ref_type: str = Field("payment", pattern=r"^(order|payment|adjustment|return)$")
    ref_id: UUID | None = None
    note: str | None = None

class DealerLedgerOut(DealerLedgerBase):
    id: UUID
    dealer_id: UUID
    created_by: UUID
    created_at: datetime

    model_config = {"from_attributes": True}

# ─────────────────────────────────────────────────────────────────────
# Summary Schemas
# ─────────────────────────────────────────────────────────────────────

class DealerDebtSummary(BaseModel):
    total_debit: float
    total_credit: float
    balance: float
    credit_limit: float
    available_credit: float
