"""Public router: nhận form Liên hệ + Đăng ký Đại lý từ web-public."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.repositories.contact import ContactRepository
from app.schemas.common import ApiResponse
from app.schemas.contact import ContactCreate, ContactOut, DealerCreate

router = APIRouter(prefix="/public/contact", tags=["public-contact"])


def _get_client_ip(request: Request) -> str | None:
    """Lấy IP thực qua header X-Forwarded-For (nếu sau proxy)."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


@router.post(
    "",
    response_model=ApiResponse[ContactOut],
    summary="Gửi form Liên hệ",
    description="Endpoint công khai — khách hàng gửi thông tin liên hệ từ trang /lien-he.",
)
async def submit_contact(
    body: ContactCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[ContactOut]:
    repo = ContactRepository(db)
    obj = await repo.create_contact(
        data=body,
        ip=_get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return ApiResponse(data=ContactOut(id=obj.id))


@router.post(
    "/dealer",
    response_model=ApiResponse[ContactOut],
    summary="Đăng ký Đại lý",
    description="Endpoint công khai — đối tác đăng ký trở thành đại lý từ trang /dai-ly.",
)
async def submit_dealer(
    body: DealerCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[ContactOut]:
    repo = ContactRepository(db)
    obj = await repo.create_dealer(
        data=body,
        ip=_get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return ApiResponse(data=ContactOut(id=obj.id))
