"""Pydantic schemas cho module CRM & Lead Management."""
from __future__ import annotations

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, EmailStr

# ─────────────────────────────────────────────────────────────────────
# Interaction Schemas
# ─────────────────────────────────────────────────────────────────────

class InteractionBase(BaseModel):
    entity_type: str = Field(..., pattern=r"^(lead|customer|opportunity)$")
    entity_id: UUID
    type: str = Field(..., pattern=r"^(call|note|email|sms)$")
    content: str = Field(..., min_length=1, max_length=5000)
    channel: str | None = Field(None, max_length=50)

class InteractionCreate(InteractionBase):
    pass

class InteractionOut(InteractionBase):
    id: UUID
    created_by: UUID
    created_at: datetime

    model_config = {"from_attributes": True}

# ─────────────────────────────────────────────────────────────────────
# Opportunity Schemas
# ─────────────────────────────────────────────────────────────────────

class OpportunityBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    stage: str = Field(..., pattern=r"^(new|qualified|proposal|won|lost)$")
    est_value: float | None = Field(None, ge=0)
    owner_id: UUID | None = None
    expected_close_date: datetime | None = None

class OpportunityCreate(OpportunityBase):
    customer_id: UUID

class OpportunityUpdate(BaseModel):
    title: str | None = Field(None, min_length=2, max_length=255)
    stage: str | None = Field(None, pattern=r"^(new|qualified|proposal|won|lost)$")
    est_value: float | None = Field(None, ge=0)
    owner_id: UUID | None = None
    expected_close_date: datetime | None = None

class OpportunityOut(OpportunityBase):
    id: UUID
    customer_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

# ─────────────────────────────────────────────────────────────────────
# Customer Schemas
# ─────────────────────────────────────────────────────────────────────

class CustomerBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    phone: str = Field(..., min_length=9, max_length=20)
    email: EmailStr | None = None
    address: str | None = None
    source: str | None = Field(None, max_length=50)
    owner_id: UUID | None = None
    tags: str | None = Field(None, max_length=255)
    note: str | None = None

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    full_name: str | None = Field(None, min_length=2, max_length=255)
    phone: str | None = Field(None, min_length=9, max_length=20)
    email: EmailStr | None = None
    address: str | None = None
    source: str | None = Field(None, max_length=50)
    owner_id: UUID | None = None
    tags: str | None = Field(None, max_length=255)
    note: str | None = None

class CustomerOut(CustomerBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

# ─────────────────────────────────────────────────────────────────────
# Lead Schemas
# ─────────────────────────────────────────────────────────────────────

class LeadBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    phone: str = Field(..., min_length=9, max_length=20)
    email: EmailStr | None = None
    source: str = Field("manual", max_length=50)
    source_ref_id: UUID | None = None
    status: str = Field("new", pattern=r"^(new|contacted|qualified|converted|lost)$")
    owner_id: UUID | None = None
    customer_id: UUID | None = None

class LeadCreate(LeadBase):
    pass

class LeadUpdate(BaseModel):
    full_name: str | None = Field(None, min_length=2, max_length=255)
    phone: str | None = Field(None, min_length=9, max_length=20)
    email: EmailStr | None = None
    source: str | None = Field(None, max_length=50)
    source_ref_id: UUID | None = None
    status: str | None = Field(None, pattern=r"^(new|contacted|qualified|converted|lost)$")
    owner_id: UUID | None = None
    customer_id: UUID | None = None

class LeadOut(LeadBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

# ─────────────────────────────────────────────────────────────────────
# Journey / Convert DTOs
# ─────────────────────────────────────────────────────────────────────

class LeadConvertResult(BaseModel):
    customer_id: UUID
    opportunity_id: UUID | None

class CustomerJourneyOut(BaseModel):
    customer: CustomerOut
    interactions: list[InteractionOut]
    opportunities: list[OpportunityOut]
