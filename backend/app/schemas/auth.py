"""DTO cho Auth và User."""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    full_name: str
    is_active: bool
    last_login_at: datetime | None = None
    permissions: list[str] = []


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role_names: list[str] = []
