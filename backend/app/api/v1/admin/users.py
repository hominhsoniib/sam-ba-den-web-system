"""Router quản trị User (yêu cầu permission user.write)."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_permission
from app.schemas.auth import UserCreate, UserOut
from app.schemas.common import ApiResponse
from app.schemas.rbac import PermissionOut, RoleCreate, RoleOut, RoleUpdate, UserRoleUpdate
from app.services.auth_service import AuthService
from app.services.rbac_service import RbacService
from uuid import UUID

router = APIRouter(prefix="/admin", tags=["admin:users"])


@router.post(
    "/users",
    response_model=ApiResponse[UserOut],
    dependencies=[Depends(require_permission("user.write"))],
)
async def create_user(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    user = await AuthService(db).create_user(payload)
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


@router.get(
    "/users",
    response_model=ApiResponse[list[UserOut]],
    dependencies=[Depends(require_permission("user.read"))],
)
async def list_users(db: AsyncSession = Depends(get_db)):
    from app.repositories.user_repository import UserRepository
    users = await UserRepository(db).list_all()
    return ApiResponse(
        data=[
            UserOut(
                id=u.id,
                email=u.email,
                full_name=u.full_name,
                is_active=u.is_active,
                last_login_at=u.last_login_at,
                permissions=u.permission_codes,
            )
            for u in users
        ]
    )


@router.get(
    "/permissions",
    response_model=ApiResponse[list[PermissionOut]],
    dependencies=[Depends(require_permission("user.read"))],
)
async def list_permissions(db: AsyncSession = Depends(get_db)):
    perms = await RbacService(db).list_permissions()
    return ApiResponse(data=[PermissionOut.model_validate(p) for p in perms])


@router.get(
    "/roles",
    response_model=ApiResponse[list[RoleOut]],
    dependencies=[Depends(require_permission("user.read"))],
)
async def list_roles(db: AsyncSession = Depends(get_db)):
    roles = await RbacService(db).list_roles()
    return ApiResponse(data=[RoleOut.model_validate(r) for r in roles])


@router.post(
    "/roles",
    response_model=ApiResponse[RoleOut],
    dependencies=[Depends(require_permission("user.write"))],
)
async def create_role(payload: RoleCreate, db: AsyncSession = Depends(get_db)):
    role = await RbacService(db).create_role(payload)
    return ApiResponse(data=RoleOut.model_validate(role))


@router.put(
    "/roles/{role_id}",
    response_model=ApiResponse[RoleOut],
    dependencies=[Depends(require_permission("user.write"))],
)
async def update_role(role_id: UUID, payload: RoleUpdate, db: AsyncSession = Depends(get_db)):
    role = await RbacService(db).update_role(role_id, payload)
    return ApiResponse(data=RoleOut.model_validate(role))


@router.delete(
    "/roles/{role_id}",
    response_model=ApiResponse[dict],
    dependencies=[Depends(require_permission("user.write"))],
)
async def delete_role(role_id: UUID, db: AsyncSession = Depends(get_db)):
    await RbacService(db).delete_role(role_id)
    return ApiResponse(data={"success": True})


@router.put(
    "/users/{user_id}/roles",
    response_model=ApiResponse[UserOut],
    dependencies=[Depends(require_permission("user.write"))],
)
async def update_user_roles(user_id: UUID, payload: UserRoleUpdate, db: AsyncSession = Depends(get_db)):
    user = await RbacService(db).update_user_roles(user_id, payload.role_ids)
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

