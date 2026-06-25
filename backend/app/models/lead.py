"""Model Lead - Lưu trữ thông tin lead/khách hàng tiềm năng."""
from __future__ import annotations

from uuid import UUID
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

class Lead(Base):
    __tablename__ = "leads"

    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source: Mapped[str] = mapped_column(String(50), nullable=False, default="manual") # contact_form, dealer_register, manual
    source_ref_id: Mapped[UUID | None] = mapped_column(nullable=True) # UUID of contact_submission if converted
    status: Mapped[str] = mapped_column(String(20), default="new", index=True, nullable=False) # new, contacted, qualified, converted, lost
    owner_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    customer_id: Mapped[UUID | None] = mapped_column(ForeignKey("customers.id"), nullable=True)

    owner = relationship("User", lazy="selectin")
    customer = relationship("Customer", back_populates="leads", lazy="selectin")
