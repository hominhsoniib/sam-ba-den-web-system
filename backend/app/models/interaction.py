"""Model Interaction - Nhật ký tương tác chăm sóc khách hàng."""
from __future__ import annotations

from uuid import UUID
from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

class Interaction(Base):
    __tablename__ = "interactions"

    entity_type: Mapped[str] = mapped_column(String(20), nullable=False) # lead, customer, opportunity
    entity_id: Mapped[UUID] = mapped_column(nullable=False, index=True)
    type: Mapped[str] = mapped_column(String(20), nullable=False) # call, note, email, sms
    content: Mapped[str] = mapped_column(Text, nullable=False)
    channel: Mapped[str | None] = mapped_column(String(50), nullable=True) # phone number, email address, Zalo etc.
    created_by: Mapped[UUID] = mapped_column(ForeignKey("users.id"), nullable=False)

    creator = relationship("User", lazy="selectin")
