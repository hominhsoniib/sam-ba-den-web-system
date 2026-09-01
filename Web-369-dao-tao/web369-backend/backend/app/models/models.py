from sqlalchemy import Column, String, Integer, DateTime, Boolean
from datetime import datetime
from app.core.database import Base


class Member(Base):
    __tablename__ = "members"

    id = Column(String, primary_key=True)  # vd: HTX369-0082
    name = Column(String, nullable=False)
    phone = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=True)  # null cho tới khi được duyệt & cấp mật khẩu tạm
    must_change_password = Column(Boolean, nullable=False, default=False)  # True sau khi admin cấp mật khẩu tạm — bắt buộc đổi ở lần đăng nhập kế tiếp
    cccd = Column(String, nullable=True)
    cccd_date = Column(String, nullable=True)
    email = Column(String, nullable=True)
    member_type = Column(String, nullable=False, default="Thành viên chính thức")
    status = Column(String, nullable=False, default="Đang chờ xác nhận")
    role = Column(String, nullable=False, default="Thành viên")
    capital = Column(Integer, default=0)
    referrer_id = Column(String, nullable=True)  # Mã TV người giới thiệu (nếu có)
    referrer_name = Column(String, nullable=True)  # Tên người giới thiệu (nếu có)
    competency_points = Column(Integer, default=0)
    certificates = Column(Integer, default=0)
    badges = Column(Integer, default=0)
    joined_date = Column(DateTime, default=datetime.utcnow)


class Course(Base):
    __tablename__ = "courses"

    id = Column(String, primary_key=True)
    category_icon = Column(String, default="📚")
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    min_role = Column(String, nullable=False, default="Thành viên")
    lesson_count = Column(Integer, default=0)
    sort_order = Column(Integer, default=0)
