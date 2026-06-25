"""Model DealerLedger - Bút toán sổ cái công nợ đại lý (B2B - Append-Only)."""
from __future__ import annotations

from uuid import UUID
from sqlalchemy import ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

class DealerLedger(Base):
    __tablename__ = "dealer_ledger"

    dealer_id: Mapped[UUID] = mapped_column(ForeignKey("dealers.id", ondelete="CASCADE"), nullable=False, index=True)
    entry_type: Mapped[str] = mapped_column(String(10), nullable=False) # debit (ghi nợ), credit (ghi có)
    amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    ref_type: Mapped[str] = mapped_column(String(20), nullable=False) # order, payment, adjustment, return
    ref_id: Mapped[UUID | None] = mapped_column(nullable=True) # ID của đơn hàng hoặc phiếu chi
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[UUID] = mapped_column(ForeignKey("users.id"), nullable=False)

    dealer = relationship("Dealer", back_populates="ledger_entries")
    creator = relationship("User", lazy="selectin")
