"""Router quản trị Dealers (M5) dành cho Admin CMS."""
from __future__ import annotations

from uuid import UUID
from fastapi import APIRouter, Depends, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_permission, get_current_user
from app.models.user import User
from app.schemas.dealer import (
    DealerCreate, DealerUpdate, DealerOut, DealerApprove,
    DealerDiscountCreate, DealerDiscountOut, DealerLedgerCreate, DealerLedgerOut,
    DealerDebtSummary
)
from app.schemas.common import ApiResponse
from app.services.dealer_service import DealerService

router = APIRouter(prefix="/admin/dealers", tags=["admin:dealers"])

# ─────────────────────────────────────────────────────────────────────
# Dealer CRUD
# ─────────────────────────────────────────────────────────────────────

@router.get(
    "",
    response_model=ApiResponse[list[DealerOut]],
    dependencies=[Depends(require_permission("dealer.read"))],
)
async def list_dealers(
    region: str | None = Query(None, description="Lọc theo vùng địa lý"),
    status: str | None = Query(None, description="Lọc theo trạng thái"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    rows, total = await DealerService(db).list_dealers(region, status, page, page_size)
    return ApiResponse(
        data=[DealerOut.model_validate(r) for r in rows],
        meta={"total": total, "page": page, "page_size": page_size}
    )

@router.get(
    "/{id}",
    response_model=ApiResponse[DealerOut],
    dependencies=[Depends(require_permission("dealer.read"))],
)
async def get_dealer(
    id: UUID = Path(...),
    db: AsyncSession = Depends(get_db)
):
    obj = await DealerService(db).get_dealer(id)
    if not obj:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("dealer_not_found", "Đại lý không tồn tại")
    return ApiResponse(data=DealerOut.model_validate(obj))

@router.post(
    "",
    response_model=ApiResponse[DealerOut],
    dependencies=[Depends(require_permission("dealer.write"))],
)
async def create_dealer(
    payload: DealerCreate,
    db: AsyncSession = Depends(get_db)
):
    obj = await DealerService(db).create_dealer(payload)
    return ApiResponse(data=DealerOut.model_validate(obj))

@router.put(
    "/{id}",
    response_model=ApiResponse[DealerOut],
    dependencies=[Depends(require_permission("dealer.write"))],
)
async def update_dealer(
    payload: DealerUpdate,
    id: UUID = Path(...),
    db: AsyncSession = Depends(get_db)
):
    obj = await DealerService(db).update_dealer(id, payload)
    return ApiResponse(data=DealerOut.model_validate(obj))

# ─────────────────────────────────────────────────────────────────────
# Approve Registration
# ─────────────────────────────────────────────────────────────────────

@router.post(
    "/{contact_id}/approve",
    response_model=ApiResponse[DealerOut],
)
async def approve_dealer(
    payload: DealerApprove,
    contact_id: UUID = Path(...),
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(require_permission("dealer.write"))
):
    obj = await DealerService(db).approve_dealer_registration(contact_id, payload, actor.id)
    return ApiResponse(data=DealerOut.model_validate(obj))

# ─────────────────────────────────────────────────────────────────────
# Ledger & Debt
# ─────────────────────────────────────────────────────────────────────

@router.get(
    "/{id}/ledger",
    response_model=ApiResponse[DealerDebtSummary],
    dependencies=[Depends(require_permission("dealer.read"))],
)
async def get_dealer_ledger_summary(
    id: UUID = Path(...),
    db: AsyncSession = Depends(get_db)
):
    summary = await DealerService(db).get_debt_summary(id)
    return ApiResponse(data=summary)

@router.get(
    "/{id}/ledger/entries",
    response_model=ApiResponse[list[DealerLedgerOut]],
    dependencies=[Depends(require_permission("dealer.read"))],
)
async def list_dealer_ledger_entries(
    id: UUID = Path(...),
    db: AsyncSession = Depends(get_db)
):
    rows = await DealerService(db).list_ledger_entries(id)
    return ApiResponse(data=[DealerLedgerOut.model_validate(r) for r in rows])

@router.post(
    "/{id}/ledger/payment",
    response_model=ApiResponse[DealerLedgerOut],
)
async def record_payment(
    payload: DealerLedgerCreate,
    id: UUID = Path(...),
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(require_permission("dealer.write"))
):
    # Enforce entry_type is credit for payment recording
    payload.entry_type = "credit"
    payload.ref_type = "payment"
    obj = await DealerService(db).record_ledger_entry(id, payload, actor.id)
    return ApiResponse(data=DealerLedgerOut.model_validate(obj))

# ─────────────────────────────────────────────────────────────────────
# Discounts
# ─────────────────────────────────────────────────────────────────────

@router.get(
    "/{id}/discounts",
    response_model=ApiResponse[list[DealerDiscountOut]],
    dependencies=[Depends(require_permission("dealer.read"))],
)
async def list_dealer_discounts(
    id: UUID = Path(...),
    db: AsyncSession = Depends(get_db)
):
    rows = await DealerService(db).list_discounts(id)
    return ApiResponse(data=[DealerDiscountOut.model_validate(r) for r in rows])

@router.post(
    "/{id}/discounts",
    response_model=ApiResponse[DealerDiscountOut],
    dependencies=[Depends(require_permission("dealer.write"))],
)
async def create_dealer_discount(
    payload: DealerDiscountCreate,
    id: UUID = Path(...),
    db: AsyncSession = Depends(get_db)
):
    payload.dealer_id = id
    obj = await DealerService(db).create_discount(payload)
    return ApiResponse(data=DealerDiscountOut.model_validate(obj))
