"""Model Customer - Lưu thông tin khách hàng lẻ."""
from __future__ import annotations

from uuid import UUID
from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

class Customer(Base):
    __tablename__ = "customers"

    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    source: Mapped[str | None] = mapped_column(String(50), nullable=True) # web, contact, import, manual
    owner_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    tags: Mapped[str | None] = mapped_column(String(255), nullable=True) # comma separated
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    owner = relationship("User", lazy="selectin")
    leads = relationship("Lead", back_populates="customer", cascade="all, delete-orphan")
    opportunities = relationship("Opportunity", back_populates="customer", cascade="all, delete-orphan")
