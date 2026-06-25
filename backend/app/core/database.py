"""Khởi tạo SQLAlchemy async engine + session + Base model."""
from collections.abc import AsyncGenerator
from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import func
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from app.core.config import settings

engine = create_async_engine(
    settings.database_url,
    echo=settings.db_echo,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False, autoflush=False
)


class Base(DeclarativeBase):
    """Base có sẵn id UUID + timestamps cho mọi bảng."""

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now()
    )


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency: cấp 1 session cho mỗi request, tự đóng."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
