"""Router công khai (không cần auth) — health & demo."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.crm import LeadCreate, InteractionCreate
from app.services.crm_service import CrmService

router = APIRouter(prefix="/public", tags=["public"])


class PublicLeadCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    phone: str = Field(..., min_length=9, max_length=20)
    need: str = Field("khac", pattern=r"^(mua-le|dai-ly|khac)$")
    message: str | None = None


@router.get("/ping", response_model=ApiResponse[dict])
async def ping():
    return ApiResponse(data={"message": "Sâm Bà Đen API đang chạy"})


@router.post("/leads", response_model=ApiResponse[dict])
async def submit_public_lead(
    payload: PublicLeadCreate,
    db: AsyncSession = Depends(get_db),
):
    crm_service = CrmService(db)

    # 1. Create the lead
    lead_in = LeadCreate(
        full_name=payload.full_name,
        phone=payload.phone,
        source=f"landing_page_{payload.need}",
        status="new",
    )
    lead = await crm_service.create_lead(lead_in)

    # 2. If message exists, log it as an interaction note under Super Admin
    if payload.message and payload.message.strip():
        # Find system user or first active admin to attribute the interaction
        admin_email = "admin@sambaden.vn"
        stmt = select(User).where(User.email == admin_email)
        admin = (await db.execute(stmt)).scalar_one_or_none()

        if not admin:
            # Fallback to first user
            stmt = select(User).limit(1)
            admin = (await db.execute(stmt)).scalar_one_or_none()

        if admin:
            int_in = InteractionCreate(
                entity_type="lead",
                entity_id=lead.id,
                type="note",
                content=f"Lời nhắn từ Landing Page ({payload.need}): {payload.message.strip()}",
                channel=payload.phone,
            )
            await crm_service.create_interaction(int_in, admin.id)

    return ApiResponse(
        data={"lead_id": str(lead.id)},
        meta={"message": f"Cảm ơn {payload.full_name}! Chúng tôi sẽ liên hệ với bạn sớm."},
    )

