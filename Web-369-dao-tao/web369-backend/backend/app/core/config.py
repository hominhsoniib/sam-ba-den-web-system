import os
from pydantic import BaseModel

_base_dir = os.path.dirname(os.path.abspath(__file__))
_default_db_dir = os.getenv("DATABASE_DIR", os.path.join(_base_dir, "..", "..", ".."))
default_db_url = "sqlite:///" + os.path.join(os.path.abspath(_default_db_dir), "web369.db")


class Settings(BaseModel):
    PROJECT_NAME: str = "HTX Gia đình 369 - Cổng thành viên"
    DATABASE_URL: str = os.getenv("DATABASE_URL", default_db_url)
    SECRET_KEY: str = os.getenv("SECRET_KEY", "CHANGE_ME_SECRET_KEY_369")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 giờ

    # Vai trò xếp hạng — dùng để so sánh quyền truy cập khóa học
    ROLE_RANK: dict = {
        "Thành viên": 0,
        "Tổ trưởng": 1,
        "Cán bộ quản lý": 2,
        "Ban điều hành": 3,
    }
    # Trạng thái thành viên được phép vào Cổng thành viên
    ALLOWED_STATUSES: list = ["Chính thức", "Liên kết góp vốn", "Liên kết không góp vốn"]
    # Vai trò có quyền duyệt thành viên
    APPROVER_ROLES: list = ["Ban điều hành", "Cán bộ quản lý"]
    DEFAULT_TEMP_PASSWORD: str = "123456"

    # Tài khoản Ban điều hành mặc định — chỉ tạo khi bảng members trống hoàn toàn
    BOOTSTRAP_ADMIN_PHONE: str = os.getenv("BOOTSTRAP_ADMIN_PHONE", "0900000000")
    BOOTSTRAP_ADMIN_PASSWORD: str = os.getenv("BOOTSTRAP_ADMIN_PASSWORD", "admin123")


settings = Settings()
# Neon/Heroku thường cấp URL dạng "postgres://" — SQLAlchemy 1.4+ chỉ chấp nhận "postgresql://"
if settings.DATABASE_URL.startswith("postgres://"):
    settings.DATABASE_URL = settings.DATABASE_URL.replace("postgres://", "postgresql://", 1)
