"""DTO cho Quản lý Role & Permission (RBAC)."""
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

class PermissionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    code: str
    description: str | None = None


class RoleBase(BaseModel):
    name: str = Field(..., max_length=50)
    description: str | None = Field(None, max_length=255)


class RoleCreate(RoleBase):
    permission_ids: list[UUID] = []


class RoleUpdate(RoleBase):
    permission_ids: list[UUID] = []


class RoleOut(RoleBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    permissions: list[PermissionOut] = []


class UserRoleUpdate(BaseModel):
    role_ids: list[UUID] = []
