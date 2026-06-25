import logging
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.user import Permission, Role, User
from app.schemas.rbac import RoleCreate, RoleUpdate

logger = logging.getLogger(__name__)

class RbacService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_permissions(self) -> list[Permission]:
        stmt = select(Permission).order_by(Permission.code)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def list_roles(self) -> list[Role]:
        stmt = select(Role).options(selectinload(Role.permissions)).order_by(Role.name)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_role(self, role_id: UUID) -> Role:
        stmt = select(Role).options(selectinload(Role.permissions)).where(Role.id == role_id)
        result = await self.db.execute(stmt)
        role = result.scalar_one_or_none()
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
        return role

    async def create_role(self, payload: RoleCreate) -> Role:
        # Check duplicate name
        existing = await self.db.execute(select(Role).where(Role.name == payload.name))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Tên role đã tồn tại")

        # Fetch permissions
        permissions = []
        if payload.permission_ids:
            res = await self.db.execute(
                select(Permission).where(Permission.id.in_(payload.permission_ids))
            )
            permissions = list(res.scalars().all())
            if len(permissions) != len(payload.permission_ids):
                raise HTTPException(status_code=400, detail="Một số Permission ID không hợp lệ")

        new_role = Role(name=payload.name, description=payload.description)
        new_role.permissions = permissions
        self.db.add(new_role)
        await self.db.commit()
        await self.db.refresh(new_role)
        return new_role

    async def update_role(self, role_id: UUID, payload: RoleUpdate) -> Role:
        role = await self.get_role(role_id)
        
        if payload.name != role.name:
            existing = await self.db.execute(select(Role).where(Role.name == payload.name))
            if existing.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="Tên role đã tồn tại")
        
        role.name = payload.name
        role.description = payload.description

        # Update permissions
        permissions = []
        if payload.permission_ids:
            res = await self.db.execute(
                select(Permission).where(Permission.id.in_(payload.permission_ids))
            )
            permissions = list(res.scalars().all())
            if len(permissions) != len(payload.permission_ids):
                raise HTTPException(status_code=400, detail="Một số Permission ID không hợp lệ")
                
        role.permissions = permissions
        await self.db.commit()
        await self.db.refresh(role)
        return role

    async def delete_role(self, role_id: UUID):
        role = await self.get_role(role_id)
        await self.db.delete(role)
        await self.db.commit()

    async def update_user_roles(self, user_id: UUID, role_ids: list[UUID]) -> User:
        stmt = select(User).options(selectinload(User.roles)).where(User.id == user_id)
        res = await self.db.execute(stmt)
        user = res.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        roles = []
        if role_ids:
            r_res = await self.db.execute(select(Role).where(Role.id.in_(role_ids)))
            roles = list(r_res.scalars().all())
            if len(roles) != len(role_ids):
                raise HTTPException(status_code=400, detail="Một số Role ID không hợp lệ")

        user.roles = roles
        await self.db.commit()
        await self.db.refresh(user)
        return user
