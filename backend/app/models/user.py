"""Models Auth & RBAC: User, Role, Permission + bảng nối N-N."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, Column, ForeignKey, String, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

# Bảng nối N-N
user_roles = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
)

role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column(
        "permission_id",
        ForeignKey("permissions.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class User(Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_login_at: Mapped[datetime | None] = mapped_column(nullable=True)

    roles: Mapped[list[Role]] = relationship(
        secondary=user_roles, back_populates="users", lazy="selectin"
    )

    def has_permission(self, code: str) -> bool:
        for role in self.roles:
            for perm in role.permissions:
                if perm.code == code:
                    return True
        return False

    @property
    def permission_codes(self) -> list[str]:
        return sorted({p.code for r in self.roles for p in r.permissions})


class Role(Base):
    __tablename__ = "roles"

    name: Mapped[str] = mapped_column(String(50), unique=True)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)

    users: Mapped[list[User]] = relationship(
        secondary=user_roles, back_populates="roles"
    )
    permissions: Mapped[list[Permission]] = relationship(
        secondary=role_permissions, back_populates="roles", lazy="selectin"
    )


class Permission(Base):
    __tablename__ = "permissions"

    code: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)

    roles: Mapped[list[Role]] = relationship(
        secondary=role_permissions, back_populates="permissions"
    )
