"""Model Opportunity - Cơ hội bán hàng."""
from __future__ import annotations

from datetime import datetime
from uuid import UUID
from sqlalchemy import ForeignKey, String, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

class Opportunity(Base):
    __tablename__ = "opportunities"

    customer_id: Mapped[UUID] = mapped_column(ForeignKey("customers.id"), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    stage: Mapped[str] = mapped_column(String(20), default="new", index=True, nullable=False) # new, qualified, proposal, won, lost
    est_value: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    owner_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    expected_close_date: Mapped[datetime | None] = mapped_column(nullable=True)

    customer = relationship("Customer", back_populates="opportunities", lazy="selectin")
    owner = relationship("User", lazy="selectin")
