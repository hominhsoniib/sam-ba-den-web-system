"""Model PaymentTransaction - Lưu trữ thông tin giao dịch thanh toán (VNPay...)."""
from __future__ import annotations
from uuid import UUID

from sqlalchemy import ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    # Giao dịch có thể liên quan tới Đại lý hoặc Đơn hàng cụ thể
    dealer_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("dealers.id", ondelete="SET NULL"), nullable=True, index=True
    )
    order_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("orders.id", ondelete="SET NULL"), nullable=True, index=True
    )

    amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    payment_method: Mapped[str] = mapped_column(String(20), default="vnpay", nullable=False)
    
    # Mã tham chiếu duy nhất của cửa hàng gửi đi vnp_TxnRef
    txn_ref: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    
    # Mã giao dịch ghi nhận tại VNPay vnp_TransactionNo
    vnpay_tran_no: Mapped[str | None] = mapped_column(String(50), nullable=True)
    
    # Trạng thái: pending, success, failed
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False, index=True)
    
    # Chuỗi JSON thô phản hồi từ VNPay để đối soát
    raw_response: Mapped[str | None] = mapped_column(Text, nullable=True)

    dealer = relationship("Dealer", lazy="selectin")
    order = relationship("Order", lazy="selectin")
