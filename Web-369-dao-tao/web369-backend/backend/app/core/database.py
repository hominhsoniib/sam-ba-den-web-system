from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

_connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    _connect_args = {"check_same_thread": False}

# pool_pre_ping: kiểm tra kết nối còn sống trước mỗi lần dùng — tự động mở lại
# kết nối mới nếu Neon (hoặc bất kỳ Postgres nào) đã âm thầm đóng kết nối rảnh,
# thay vì crash với "SSL connection has been closed unexpectedly".
# pool_recycle: chủ động tái tạo kết nối cũ hơn 280s (Neon thường đóng kết nối
# rảnh sau ~5 phút) — phòng trường hợp pre_ping không kịp bắt lỗi ở biên.
engine = create_engine(
    settings.DATABASE_URL,
    connect_args=_connect_args,
    pool_pre_ping=True,
    pool_recycle=280,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
