"""Pydantic schemas cho Contact Submission."""
from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator
import re


# ─────────────────────────────────────────────────────────────────────
# Input schemas (từ frontend)
# ─────────────────────────────────────────────────────────────────────

class ContactCreate(BaseModel):
    """Payload từ form Liên hệ (/lien-he)."""

    full_name: str = Field(..., min_length=2, max_length=255, description="Họ và tên")
    phone: str = Field(..., min_length=9, max_length=15, description="Số điện thoại")
    email: EmailStr | None = Field(None, description="Email (tuỳ chọn)")
    subject: str | None = Field(None, max_length=255, description="Chủ đề")
    message: str = Field(..., min_length=5, max_length=2000, description="Nội dung")

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        digits = re.sub(r"[\s\.\-]", "", v)
        if not re.fullmatch(r"(0|\+84)[0-9]{8,10}", digits):
            raise ValueError("Số điện thoại không hợp lệ")
        return digits


class DealerCreate(BaseModel):
    """Payload từ form Đăng ký Đại lý (/dai-ly)."""

    full_name: str = Field(..., min_length=2, max_length=255)
    phone: str = Field(..., min_length=9, max_length=15)
    email: EmailStr | None = Field(None)
    area: str = Field(..., min_length=3, max_length=255, description="Khu vực kinh doanh")
    message: str | None = Field(None, max_length=1000, description="Ghi chú")

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        digits = re.sub(r"[\s\.\-]", "", v)
        if not re.fullmatch(r"(0|\+84)[0-9]{8,10}", digits):
            raise ValueError("Số điện thoại không hợp lệ")
        return digits


# ─────────────────────────────────────────────────────────────────────
# Output schemas (trả về client / admin)
# ─────────────────────────────────────────────────────────────────────

class ContactOut(BaseModel):
    """Response gọn sau khi submit thành công."""
    id: UUID
    message: str = "Chúng tôi đã nhận được thông tin và sẽ liên hệ sớm nhất!"

    model_config = {"from_attributes": True}


class ContactAdminItem(BaseModel):
    """Dùng cho danh sách trong Admin CMS."""
    id: UUID
    full_name: str
    phone: str
    email: str | None
    source: str
    subject: str | None
    message: str | None
    area: str | None
    status: str
    admin_note: str | None
    replied_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ContactStatusUpdate(BaseModel):
    """Admin cập nhật trạng thái / ghi chú."""
    status: str = Field(..., pattern=r"^(new|in_review|replied|closed)$")
    admin_note: str | None = Field(None, max_length=1000)
