"""Logic xác thực: đăng nhập, refresh, tạo user."""
from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import TokenPair, UserCreate


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = UserRepository(db)

    async def login(self, email: str, password: str) -> TokenPair:
        user = await self.repo.get_by_email(email)
        if user is None or not verify_password(password, user.password_hash):
            raise UnauthorizedError(
                "invalid_credentials", "Email hoặc mật khẩu không đúng"
            )
        if not user.is_active:
            raise UnauthorizedError("inactive_user", "Tài khoản bị khóa")
        user.last_login_at = datetime.now(UTC)
        await self.db.commit()
        return self._issue_tokens(user)

    async def refresh(self, refresh_token: str) -> TokenPair:
        user_id = decode_token(refresh_token, "refresh")
        user = await self.repo.get_with_permissions(user_id)
        if user is None or not user.is_active:
            raise UnauthorizedError("inactive_user", "Tài khoản không hợp lệ")
        return self._issue_tokens(user)

    async def create_user(self, payload: UserCreate) -> User:
        if await self.repo.get_by_email(payload.email):
            raise ConflictError("email_exists", "Email đã tồn tại")
        roles = await self.repo.get_roles_by_names(payload.role_names)
        user = User(
            email=payload.email,
            password_hash=hash_password(payload.password),
            full_name=payload.full_name,
            roles=roles,
        )
        user = await self.repo.add(user)
        await self.db.commit()
        return await self.repo.get_with_permissions(user.id)

    @staticmethod
    def _issue_tokens(user: User) -> TokenPair:
        return TokenPair(
            access_token=create_access_token(user.id),
            refresh_token=create_refresh_token(user.id),
        )
