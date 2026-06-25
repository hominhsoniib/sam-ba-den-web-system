"""Model DealerDiscount - Lưu chiết khấu đại lý theo tier hoặc cá nhân."""
from __future__ import annotations

from datetime import datetime
from uuid import UUID
from sqlalchemy import ForeignKey, Numeric, String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

class DealerDiscount(Base):
    __tablename__ = "dealer_discounts"

    dealer_id: Mapped[UUID | None] = mapped_column(ForeignKey("dealers.id", ondelete="CASCADE"), nullable=True, index=True)
    tier: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True) # tier_1, tier_2
    product_id: Mapped[UUID | None] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), nullable=True, index=True)
    category_id: Mapped[UUID | None] = mapped_column(ForeignKey("product_categories.id", ondelete="CASCADE"), nullable=True, index=True)
    
    discount_percent: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False) # ví dụ: 15.50 cho 15.5%
    start_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    dealer = relationship("Dealer", back_populates="discounts")
    product = relationship("Product", lazy="selectin")
    category = relationship("ProductCategory", lazy="selectin")
