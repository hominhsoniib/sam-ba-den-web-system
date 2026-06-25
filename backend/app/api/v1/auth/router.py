"""Router xác thực: login, refresh, me."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    TokenPair,
    UserOut,
)
from app.schemas.common import ApiResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=ApiResponse[TokenPair])
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    tokens = await AuthService(db).login(payload.email, payload.password)
    return ApiResponse(data=tokens)


@router.post("/refresh", response_model=ApiResponse[TokenPair])
async def refresh(payload: RefreshRequest, db: AsyncSession = Depends(get_db)):
    tokens = await AuthService(db).refresh(payload.refresh_token)
    return ApiResponse(data=tokens)


@router.get("/me", response_model=ApiResponse[UserOut])
async def me(user=Depends(get_current_user)):
    return ApiResponse(
        data=UserOut(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            is_active=user.is_active,
            last_login_at=user.last_login_at,
            permissions=user.permission_codes,
        )
    )
