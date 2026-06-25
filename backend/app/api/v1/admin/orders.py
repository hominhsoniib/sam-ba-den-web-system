"""Router quản trị Đơn hàng (M7)."""
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user, require_permission
from app.schemas.common import ApiResponse
from app.schemas.order import (
    ALLOWED_TRANSITIONS,
    OrderCreate,
    OrderDetail,
    OrderListItem,
    OrderStatusChange,
    OrderUpdate,
)
from app.services.order_service import OrderService, buyer_name

router = APIRouter(prefix="/admin/orders", tags=["admin:orders"])


def _to_list_item(o) -> dict:
    return {
        "id": o.id,
        "order_no": o.order_no,
        "status": o.status,
        "channel": o.channel,
        "customer_id": o.customer_id,
        "dealer_id": o.dealer_id,
        "buyer_name": buyer_name(o),
        "subtotal": o.subtotal,
        "discount_amount": o.discount_amount,
        "shipping_fee": o.shipping_fee,
        "total_amount": o.total_amount,
        "warehouse": o.warehouse,
        "created_at": o.created_at,
        "updated_at": o.updated_at,
    }


def _to_detail(o) -> dict:
    base = _to_list_item(o)
    return {
        **base,
        "shipping_name": o.shipping_name,
        "shipping_phone": o.shipping_phone,
        "shipping_address": o.shipping_address,
        "shipping_province": o.shipping_province,
        "note": o.note,
        "cancel_reason": o.cancel_reason,
        "items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "product_name": item.product_name,
                "sku": item.sku,
                "unit_price": item.unit_price,
                "qty": item.qty,
                "discount_pct": item.discount_pct,
                "line_total": item.line_total,
            }
            for item in o.items
        ],
        "status_logs": [
            {
                "id": log.id,
                "from_status": log.from_status,
                "to_status": log.to_status,
                "note": log.note,
                "changed_by": log.changed_by,
                "created_at": log.created_at,
            }
            for log in o.status_logs
        ],
    }


# ── Danh sách đơn hàng ────────────────────────────────────────────
@router.get("", response_model=ApiResponse[list[OrderListItem]])
async def list_orders(
    status: str | None = Query(None),
    dealer_id: UUID | None = Query(None),
    customer_id: UUID | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
    _=Depends(require_permission("order.read")),
):
    svc = OrderService(db, current_user.id)
    orders, total = await svc.list_orders(status, dealer_id, customer_id, page, page_size)
    return ApiResponse(
        data=[OrderListItem(**_to_list_item(o)) for o in orders],
        meta={"total": total, "page": page, "page_size": page_size},
    )


# ── Xuất danh sách đơn hàng (Export) ────────────────────────────────
@router.get("/export")
async def export_admin_orders(
    format: str = Query("excel", regex="^(excel|pdf)$"),
    status: str | None = Query(None),
    dealer_id: UUID | None = Query(None),
    customer_id: UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
    _=Depends(require_permission("order.read")),
):
    from app.services.export_service import ExportService
    from fastapi.responses import StreamingResponse
    
    svc = OrderService(db, current_user.id)
    # Lấy tối đa 1000 đơn để xuất
    orders, _ = await svc.list_orders(status, dealer_id, customer_id, page=1, page_size=1000)
    
    # Chuyển đổi qua Pydantic schema OrderDetail 
    order_details = [OrderDetail.model_validate(_to_detail(o)) for o in orders]
    
    if format == "excel":
        file_stream = ExportService.export_orders_to_excel(order_details)
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        filename = "Danh_sach_don_hang.xlsx"
    else:
        file_stream = ExportService.export_orders_to_pdf(order_details)
        media_type = "application/pdf"
        filename = "Danh_sach_don_hang.pdf"
        
    return StreamingResponse(
        file_stream, 
        media_type=media_type, 
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ── Chi tiết đơn hàng ─────────────────────────────────────────────
@router.get("/{order_id}", response_model=ApiResponse[OrderDetail])
async def get_order(
    order_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
    _=Depends(require_permission("order.read")),
):
    svc = OrderService(db, current_user.id)
    order = await svc.get_order(order_id)
    return ApiResponse(data=OrderDetail(**_to_detail(order)))


# ── Tạo đơn hàng ──────────────────────────────────────────────────
@router.post("", response_model=ApiResponse[OrderDetail])
async def create_order(
    payload: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
    _=Depends(require_permission("order.write")),
):
    svc = OrderService(db, current_user.id)
    order = await svc.create_order(payload)
    return ApiResponse(data=OrderDetail(**_to_detail(order)))


# ── Cập nhật thông tin giao hàng (draft only) ─────────────────────
@router.put("/{order_id}", response_model=ApiResponse[OrderDetail])
async def update_order(
    order_id: UUID,
    payload: OrderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
    _=Depends(require_permission("order.write")),
):
    svc = OrderService(db, current_user.id)
    order = await svc.update_order(order_id, payload)
    return ApiResponse(data=OrderDetail(**_to_detail(order)))


# ── Đổi trạng thái đơn hàng ──────────────────────────────────────
@router.post("/{order_id}/status", response_model=ApiResponse[OrderDetail])
async def change_status(
    order_id: UUID,
    payload: OrderStatusChange,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
    _=Depends(require_permission("order.write")),
):
    svc = OrderService(db, current_user.id)
    order = await svc.change_status(order_id, payload)
    return ApiResponse(data=OrderDetail(**_to_detail(order)))


# ── Meta: các trạng thái cho phép ────────────────────────────────
@router.get("/meta/transitions", response_model=ApiResponse[dict])
async def get_transitions(_=Depends(require_permission("order.read"))):
    """Trả về bản đồ chuyển trạng thái cho frontend."""
    return ApiResponse(data=ALLOWED_TRANSITIONS)
