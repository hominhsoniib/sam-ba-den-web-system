"""Router quản trị CRM & Lead Management (M4)."""
from __future__ import annotations

from uuid import UUID
from fastapi import APIRouter, Depends, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_permission, get_current_user
from app.models.user import User
from app.schemas.crm import (
    LeadCreate, LeadUpdate, LeadOut, CustomerCreate, CustomerUpdate, CustomerOut,
    InteractionCreate, InteractionOut, OpportunityCreate, OpportunityUpdate, OpportunityOut,
    LeadConvertResult, CustomerJourneyOut
)
from app.schemas.common import ApiResponse
from app.services.crm_service import CrmService

router = APIRouter(prefix="/admin/crm", tags=["admin:crm"])

# ─────────────────────────────────────────────────────────────────────
# Leads Endpoints
# ─────────────────────────────────────────────────────────────────────

@router.get(
    "/leads",
    response_model=ApiResponse[list[LeadOut]],
    dependencies=[Depends(require_permission("customer.read"))],
)
async def list_leads(
    status: str | None = Query(None, description="Lọc theo trạng thái"),
    owner_id: UUID | None = Query(None, description="Lọc theo sales phụ trách"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    rows, total = await CrmService(db).list_leads(status, owner_id, page, page_size)
    return ApiResponse(
        data=[LeadOut.model_validate(r) for r in rows],
        meta={"total": total, "page": page, "page_size": page_size}
    )

@router.post(
    "/leads",
    response_model=ApiResponse[LeadOut],
    dependencies=[Depends(require_permission("customer.write"))],
)
async def create_lead(
    payload: LeadCreate,
    db: AsyncSession = Depends(get_db)
):
    obj = await CrmService(db).create_lead(payload)
    return ApiResponse(data=LeadOut.model_validate(obj))

@router.put(
    "/leads/{id}",
    response_model=ApiResponse[LeadOut],
    dependencies=[Depends(require_permission("customer.write"))],
)
async def update_lead(
    payload: LeadUpdate,
    id: UUID = Path(...),
    db: AsyncSession = Depends(get_db)
):
    obj = await CrmService(db).update_lead(id, payload)
    return ApiResponse(data=LeadOut.model_validate(obj))

@router.post(
    "/leads/{id}/convert",
    response_model=ApiResponse[LeadConvertResult],
)
async def convert_lead(
    id: UUID = Path(...),
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(require_permission("customer.write"))
):
    result = await CrmService(db).convert_lead(id, actor.id)
    return ApiResponse(data=result)

# ─────────────────────────────────────────────────────────────────────
# Customers Endpoints
# ─────────────────────────────────────────────────────────────────────

@router.get(
    "/customers",
    response_model=ApiResponse[list[CustomerOut]],
    dependencies=[Depends(require_permission("customer.read"))],
)
async def list_customers(
    owner_id: UUID | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    rows, total = await CrmService(db).list_customers(owner_id, page, page_size)
    return ApiResponse(
        data=[CustomerOut.model_validate(r) for r in rows],
        meta={"total": total, "page": page, "page_size": page_size}
    )

@router.post(
    "/customers",
    response_model=ApiResponse[CustomerOut],
    dependencies=[Depends(require_permission("customer.write"))],
)
async def create_customer(
    payload: CustomerCreate,
    db: AsyncSession = Depends(get_db)
):
    obj = await CrmService(db).create_customer(payload)
    return ApiResponse(data=CustomerOut.model_validate(obj))

@router.put(
    "/customers/{id}",
    response_model=ApiResponse[CustomerOut],
    dependencies=[Depends(require_permission("customer.write"))],
)
async def update_customer(
    payload: CustomerUpdate,
    id: UUID = Path(...),
    db: AsyncSession = Depends(get_db)
):
    obj = await CrmService(db).update_customer(id, payload)
    return ApiResponse(data=CustomerOut.model_validate(obj))

@router.get(
    "/customers/{id}/journey",
    response_model=ApiResponse[CustomerJourneyOut],
    dependencies=[Depends(require_permission("customer.read"))],
)
async def get_customer_journey(
    id: UUID = Path(...),
    db: AsyncSession = Depends(get_db)
):
    journey = await CrmService(db).get_customer_journey(id)
    return ApiResponse(data=journey)

# ─────────────────────────────────────────────────────────────────────
# Interactions Endpoints
# ─────────────────────────────────────────────────────────────────────

@router.post(
    "/interactions",
    response_model=ApiResponse[InteractionOut],
)
async def create_interaction(
    payload: InteractionCreate,
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(require_permission("customer.write"))
):
    obj = await CrmService(db).create_interaction(payload, actor.id)
    return ApiResponse(data=InteractionOut.model_validate(obj))

# ─────────────────────────────────────────────────────────────────────
# Opportunities Endpoints
# ─────────────────────────────────────────────────────────────────────

@router.post(
    "/opportunities",
    response_model=ApiResponse[OpportunityOut],
    dependencies=[Depends(require_permission("customer.write"))],
)
async def create_opportunity(
    payload: OpportunityCreate,
    db: AsyncSession = Depends(get_db)
):
    obj = await CrmService(db).create_opportunity(payload)
    return ApiResponse(data=OpportunityOut.model_validate(obj))

@router.put(
    "/opportunities/{id}",
    response_model=ApiResponse[OpportunityOut],
    dependencies=[Depends(require_permission("customer.write"))],
)
async def update_opportunity(
    payload: OpportunityUpdate,
    id: UUID = Path(...),
    db: AsyncSession = Depends(get_db)
):
    obj = await CrmService(db).update_opportunity(id, payload)
    return ApiResponse(data=OpportunityOut.model_validate(obj))
