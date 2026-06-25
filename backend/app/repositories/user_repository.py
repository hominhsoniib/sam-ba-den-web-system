"""Truy vấn dữ liệu User (tách khỏi service)."""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.user import Role, User


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_email(self, email: str) -> User | None:
        stmt = (
            select(User)
            .where(User.email == email)
            .options(selectinload(User.roles).selectinload(Role.permissions))
        )
        return (await self.db.execute(stmt)).scalar_one_or_none()

    async def get_with_permissions(self, user_id: UUID) -> User | None:
        stmt = (
            select(User)
            .where(User.id == user_id)
            .options(selectinload(User.roles).selectinload(Role.permissions))
        )
        return (await self.db.execute(stmt)).scalar_one_or_none()

    async def get_roles_by_names(self, names: list[str]) -> list[Role]:
        if not names:
            return []
        stmt = select(Role).where(Role.name.in_(names))
        return list((await self.db.execute(stmt)).scalars().all())

    async def add(self, user: User) -> User:
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def list_all(self) -> list[User]:
        stmt = (
            select(User)
            .options(selectinload(User.roles).selectinload(Role.permissions))
            .order_by(User.full_name)
        )
        return list((await self.db.execute(stmt)).scalars().all())

