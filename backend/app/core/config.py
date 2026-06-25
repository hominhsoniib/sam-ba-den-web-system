"""Cấu hình ứng dụng — đọc từ biến môi trường (.env)."""
from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # App
    app_name: str = "Sâm Bà Đen API"
    env: str = "development"
    debug: bool = True
    api_v1_prefix: str = "/api/v1"

    # Database
    database_url: str = Field(
        default="postgresql+asyncpg://samba:samba@localhost:5432/sambaden"
    )
    db_echo: bool = False

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # JWT
    jwt_secret: str = Field(default="CHANGE_ME_IN_PRODUCTION_please_use_long_random")
    jwt_algorithm: str = "HS256"
    access_token_ttl: int = 900  # 15 phút
    refresh_token_ttl: int = 604800  # 7 ngày

    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Files & Landing directories
    files_dir: str = "d:/App_Claude_Antigravity/Web_Landipage/files"
    landing_dir: str = "d:/App_Claude_Antigravity/Web_Landipage/landing"

    # Order
    order_no_prefix: str = "SBD"

    # Public site (cho SEO canonical/sitemap)
    site_url: str = "http://localhost:5173"

    # VNPay
    vnpay_tmn_code: str = "SBD2026"
    vnpay_hash_secret: str = "SANDBOX_HASH_SECRET_XYZ"
    vnpay_url: str = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
    vnpay_return_url: str = "http://localhost:5173/portal/payment/callback"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
