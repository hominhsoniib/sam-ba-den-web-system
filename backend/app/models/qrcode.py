"""Models QR Code & Traceability (M8).

Cấu trúc:
  ProductBatch (Lô hàng)
    ↳ QRCode (Mã QR của từng đơn vị/thùng trong lô)
      ↳ QRScanLog (Log mỗi lần quét)

Chống hàng giả:
  - Mỗi QR code có UUID token duy nhất (không đoán được)
  - Trạng thái: pending (chưa in) → active (đã phát hành) → used → revoked
  - Mỗi lần scan được log lại IP + user_agent + timestamp
"""
from __future__ import annotations
from uuid import UUID, uuid4

from sqlalchemy import ForeignKey, Integer, Numeric, String, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ProductBatch(Base):
    """Lô hàng sản xuất."""
    __tablename__ = "product_batches"

    # Mã lô (vd: BAT-20250601-001)
    batch_no: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    product_id: Mapped[UUID] = mapped_column(ForeignKey("products.id"), nullable=False, index=True)

    # Thông tin sản xuất
    manufacture_date: Mapped[str | None] = mapped_column(String(20), nullable=True)   # YYYY-MM-DD
    expiry_date: Mapped[str | None] = mapped_column(String(20), nullable=True)         # YYYY-MM-DD
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    warehouse: Mapped[str] = mapped_column(String(50), nullable=False, default="main")

    # Nguồn gốc
    supplier_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    origin_region: Mapped[str | None] = mapped_column(String(100), nullable=True)  # "Tây Ninh", ...
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Trạng thái lô: active | archived
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active", index=True)

    # Số QR đã tạo
    qr_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    product = relationship("Product", lazy="selectin")
    qr_codes: Mapped[list[QRCode]] = relationship(
        back_populates="batch",
        lazy="noload",  # Load on demand (số lượng lớn)
        cascade="all, delete-orphan",
    )
    created_by: Mapped[UUID] = mapped_column(ForeignKey("users.id"), nullable=False)


class QRCode(Base):
    """Mã QR duy nhất gắn với lô hàng.
    
    token = UUID ngẫu nhiên, dùng trong URL: /qr/{token}
    """
    __tablename__ = "qr_codes"

    batch_id: Mapped[UUID] = mapped_column(
        ForeignKey("product_batches.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # Token ngẫu nhiên (dùng trong URL), không trùng, không đoán được
    token: Mapped[str] = mapped_column(
        String(36), unique=True, index=True, nullable=False,
        default=lambda: str(uuid4())
    )
    # Nhãn hiển thị (vd: "Hộp #001")
    label: Mapped[str | None] = mapped_column(String(100), nullable=True)
    # Trạng thái: pending | active | revoked
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active", index=True)
    # Số lần scan
    scan_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # Chỉ cho phép scan 1 lần (anti-counterfeit strict mode)
    single_use: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    batch: Mapped[ProductBatch] = relationship(back_populates="qr_codes")
    scan_logs: Mapped[list[QRScanLog]] = relationship(
        back_populates="qr_code",
        lazy="noload",
        cascade="all, delete-orphan",
        order_by="QRScanLog.created_at.desc()",
    )


class QRScanLog(Base):
    """Log mỗi lần quét QR code."""
    __tablename__ = "qr_scan_logs"

    qr_code_id: Mapped[UUID] = mapped_column(
        ForeignKey("qr_codes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # Thông tin người quét
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)
    # Referer (từ đâu scan - mobile app, web, ...)
    referer: Mapped[str | None] = mapped_column(String(500), nullable=True)
    # Kết quả: authentic | already_used | revoked | not_found
    result: Mapped[str] = mapped_column(String(20), nullable=False, default="authentic")

    qr_code: Mapped[QRCode] = relationship(back_populates="scan_logs")
