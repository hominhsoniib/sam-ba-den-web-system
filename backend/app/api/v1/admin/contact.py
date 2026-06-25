"""Admin router: xem + quản lý danh sách contact submissions (yêu cầu auth)."""
from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_permission
from app.repositories.contact import ContactRepository
from app.schemas.common import ApiResponse, PageMeta
from app.schemas.contact import ContactAdminItem, ContactStatusUpdate

router = APIRouter(prefix="/admin/contacts", tags=["admin-contacts"])


@router.get(
    "",
    response_model=ApiResponse[list[ContactAdminItem]],
    summary="Danh sách liên hệ / đăng ký đại lý",
    dependencies=[Depends(require_permission("contact.view"))],
)
async def list_contacts(
    source: str | None = Query(None, description="'contact' hoặc 'dealer'"),
    status: str | None = Query(None, description="'new','in_review','replied','closed'"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[list[ContactAdminItem]]:
    repo = ContactRepository(db)
    items, total = await repo.list_all(
        source=source, status=status, page=page, page_size=page_size
    )
    return ApiResponse(
        data=[ContactAdminItem.model_validate(i) for i in items],
        meta=PageMeta(total=total, page=page, page_size=page_size).model_dump(),
    )


@router.get(
    "/{contact_id}",
    response_model=ApiResponse[ContactAdminItem],
    summary="Chi tiết một liên hệ",
    dependencies=[Depends(require_permission("contact.view"))],
)
async def get_contact(
    contact_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[ContactAdminItem]:
    repo = ContactRepository(db)
    obj = await repo.get_by_id(contact_id)
    if not obj:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("NOT_FOUND", "Không tìm thấy bản ghi")
    return ApiResponse(data=ContactAdminItem.model_validate(obj))


@router.patch(
    "/{contact_id}/status",
    response_model=ApiResponse[ContactAdminItem],
    summary="Cập nhật trạng thái xử lý",
    dependencies=[Depends(require_permission("contact.edit"))],
)
async def update_status(
    contact_id: UUID,
    body: ContactStatusUpdate,
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[ContactAdminItem]:
    repo = ContactRepository(db)
    obj = await repo.update_status(contact_id, body)
    if not obj:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("NOT_FOUND", "Không tìm thấy bản ghi")
    return ApiResponse(data=ContactAdminItem.model_validate(obj))
