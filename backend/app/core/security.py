"""Bảo mật: hash mật khẩu (argon2), JWT, dependency current_user + RBAC."""
from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import ForbiddenError, UnauthorizedError

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.api_v1_prefix}/auth/login", auto_error=False
)


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def _create_token(subject: str, ttl: int, token_type: str) -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": subject,
        "type": token_type,
        "iat": now,
        "exp": now + timedelta(seconds=ttl),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_access_token(user_id: UUID) -> str:
    return _create_token(str(user_id), settings.access_token_ttl, "access")


def create_refresh_token(user_id: UUID) -> str:
    return _create_token(str(user_id), settings.refresh_token_ttl, "refresh")


def decode_token(token: str, expected_type: str) -> UUID:
    try:
        payload = jwt.decode(
            token, settings.jwt_secret, algorithms=[settings.jwt_algorithm]
        )
    except JWTError as exc:
        raise UnauthorizedError("invalid_token", "Token không hợp lệ") from exc
    if payload.get("type") != expected_type:
        raise UnauthorizedError("invalid_token_type", "Loại token không đúng")
    sub = payload.get("sub")
    if not sub:
        raise UnauthorizedError("invalid_token", "Token thiếu subject")
    return UUID(sub)


async def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    """Giải mã access token → trả về User (kèm roles/permissions)."""
    from app.repositories.user_repository import UserRepository

    if not token:
        raise UnauthorizedError("not_authenticated", "Chưa đăng nhập")
    user_id = decode_token(token, "access")
    user = await UserRepository(db).get_with_permissions(user_id)
    if user is None or not user.is_active:
        raise UnauthorizedError("inactive_user", "Tài khoản không tồn tại hoặc bị khóa")
    return user


def require_permission(code: str):
    """Dependency factory: chặn nếu user thiếu permission `code`."""

    async def checker(user=Depends(get_current_user)):
        if not user.has_permission(code):
            raise ForbiddenError("forbidden", f"Không đủ quyền: {code}")
        return user

    return checker
