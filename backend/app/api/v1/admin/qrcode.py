"""Router quản trị Lô hàng & Mã QR (M8)."""
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user, require_permission
from app.schemas.common import ApiResponse
from app.schemas.qrcode import (
    ProductBatchCreate,
    ProductBatchUpdate,
    ProductBatchOut,
    QRCodeOut,
)
from app.services.qrcode_service import QRService

router = APIRouter(prefix="/admin/qrcode", tags=["admin:qrcode"])


def _to_batch_out(b) -> dict:
    return {
        "id": b.id,
        "batch_no": b.batch_no,
        "product_id": b.product_id,
        "product_name": b.product.name if b.product else None,
        "sku": b.product.sku if b.product else None,
        "manufacture_date": b.manufacture_date,
        "expiry_date": b.expiry_date,
        "quantity": b.quantity,
        "warehouse": b.warehouse,
        "supplier_name": b.supplier_name,
        "origin_region": b.origin_region,
        "notes": b.notes,
        "status": b.status,
        "qr_count": b.qr_count,
        "created_by": b.created_by,
        "created_at": b.created_at,
        "updated_at": b.updated_at,
    }


# ── Danh sách lô hàng ──────────────────────────────────────────────
@router.get("/batches", response_model=ApiResponse[list[ProductBatchOut]])
async def list_batches(
    product_id: UUID | None = Query(None),
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
    _=Depends(require_permission("qrcode.read")),
):
    svc = QRService(db, current_user.id)
    batches, total = await svc.list_batches(product_id, status, page, page_size)
    return ApiResponse(
        data=[ProductBatchOut(**_to_batch_out(b)) for b in batches],
        meta={"total": total, "page": page, "page_size": page_size},
    )


# ── Chi tiết lô hàng ───────────────────────────────────────────────
@router.get("/batches/{batch_id}", response_model=ApiResponse[ProductBatchOut])
async def get_batch(
    batch_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
    _=Depends(require_permission("qrcode.read")),
):
    svc = QRService(db, current_user.id)
    batch = await svc.get_batch(batch_id)
    return ApiResponse(data=ProductBatchOut(**_to_batch_out(batch)))


# ── Tạo lô hàng mới & Sinh mã QR ────────────────────────────────────
@router.post("/batches", response_model=ApiResponse[ProductBatchOut])
async def create_batch(
    payload: ProductBatchCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
    _=Depends(require_permission("qrcode.write")),
):
    svc = QRService(db, current_user.id)
    batch = await svc.create_batch(payload)
    return ApiResponse(data=ProductBatchOut(**_to_batch_out(batch)))


# ── Cập nhật lô hàng ────────────────────────────────────────────────
@router.put("/batches/{batch_id}", response_model=ApiResponse[ProductBatchOut])
async def update_batch(
    batch_id: UUID,
    payload: ProductBatchUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
    _=Depends(require_permission("qrcode.write")),
):
    svc = QRService(db, current_user.id)
    batch = await svc.update_batch(batch_id, payload)
    return ApiResponse(data=ProductBatchOut(**_to_batch_out(batch)))


# ── Danh sách mã QR của lô hàng ─────────────────────────────────────
@router.get("/batches/{batch_id}/qrcodes", response_model=ApiResponse[list[QRCodeOut]])
async def list_qrcodes(
    batch_id: UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
    _=Depends(require_permission("qrcode.read")),
):
    svc = QRService(db, current_user.id)
    qrcodes, total = await svc.list_qrcodes(batch_id, page, page_size)
    return ApiResponse(
        data=[QRCodeOut.model_validate(q) for q in qrcodes],
        meta={"total": total, "page": page, "page_size": page_size},
    )


# ── Thu hồi toàn bộ lô hàng ─────────────────────────────────────────
@router.post("/batches/{batch_id}/revoke", response_model=ApiResponse[ProductBatchOut])
async def revoke_batch(
    batch_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
    _=Depends(require_permission("qrcode.write")),
):
    svc = QRService(db, current_user.id)
    batch = await svc.revoke_batch(batch_id)
    return ApiResponse(data=ProductBatchOut(**_to_batch_out(batch)))


# ── Thu hồi 1 mã QR cụ thể ──────────────────────────────────────────
@router.post("/qrcodes/{qr_id}/revoke", response_model=ApiResponse[QRCodeOut])
async def revoke_qrcode(
    qr_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
    _=Depends(require_permission("qrcode.write")),
):
    svc = QRService(db, current_user.id)
    qr = await svc.revoke_qrcode(qr_id)
    return ApiResponse(data=QRCodeOut.model_validate(qr))
