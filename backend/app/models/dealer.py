"""Model Dealer - Lưu thông tin Đại lý (B2B)."""
from __future__ import annotations

from uuid import UUID
from sqlalchemy import ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

class Dealer(Base):
    __tablename__ = "dealers"

    code: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    tier: Mapped[str] = mapped_column(String(20), nullable=False) # tier_1, tier_2
    region: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    contact_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    
    # Định vị tọa độ bản đồ
    lat: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)
    lng: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)
    
    credit_limit: Mapped[float] = mapped_column(Numeric(14, 2), default=0.0, nullable=False)
    payment_term_days: Mapped[int] = mapped_column(default=0, nullable=False)
    
    user_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True, nullable=False) # pending, active, suspended

    user = relationship("User", lazy="selectin")
    discounts = relationship("DealerDiscount", back_populates="dealer", cascade="all, delete-orphan")
    ledger_entries = relationship("DealerLedger", back_populates="dealer", cascade="all, delete-orphan")
