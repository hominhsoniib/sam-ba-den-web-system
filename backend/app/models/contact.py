"""Model ContactSubmission — lưu lead từ form Liên hệ và Đăng ký Đại lý."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ContactSubmission(Base):
    """Bảng lưu mọi lượt gửi form từ web public.

    source:
      - 'contact'  — form Liên hệ (/lien-he)
      - 'dealer'   — form Đăng ký Đại lý (/dai-ly)
    status:
      - 'new'       — chưa xử lý
      - 'in_review' — đang xem xét
      - 'replied'   — đã phản hồi
      - 'closed'    — đã đóng
    """

    __tablename__ = "contact_submissions"

    # ---- Thông tin người gửi ----
    full_name: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str] = mapped_column(String(30))
    email: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)

    # ---- Nội dung ----
    source: Mapped[str] = mapped_column(String(20), default="contact", index=True)
    subject: Mapped[str | None] = mapped_column(String(255), nullable=True)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ---- Thêm dành cho đăng ký đại lý ----
    area: Mapped[str | None] = mapped_column(String(255), nullable=True)   # khu vực kinh doanh

    # ---- Trạng thái xử lý (admin dùng) ----
    status: Mapped[str] = mapped_column(String(20), default="new", index=True)
    admin_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    replied_at: Mapped[datetime | None] = mapped_column(nullable=True)

    # ---- Metadata kỹ thuật ----
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)
