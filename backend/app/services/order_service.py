"""Logic nghiệp vụ Đơn hàng (M7).

Điểm nổi bật (transactional integrity):
1. Tạo đơn (draft):   Chỉ validate, chưa khoá tồn kho.
2. Xác nhận (confirmed):
   - Khoá hàng: qty_reserved += qty  (SELECT FOR UPDATE giả lập qua flush)
   - Ghi nợ đại lý: DealerLedger(entry_type='debit', ref_type='order')
3. Giao hàng (shipping): Không thay đổi kho (hàng vẫn còn trong reserved).
4. Hoàn thành (completed): Xuất kho thực sự: qty_on_hand -= qty, reserved -= qty
5. Huỷ (cancelled):   Giải phóng reserved nếu trước đó đã confirmed/shipping.
                       Ghi có đại lý (reversal).
6. Trả hàng (returned): Nhập lại kho: qty_on_hand += qty, ghi có đại lý.
"""
from __future__ import annotations

import re
from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.models.dealer_ledger import DealerLedger
from app.models.order import Order, OrderItem, OrderStatusLog
from app.models.product import Product, ProductInventory
from app.schemas.order import (
    ALLOWED_TRANSITIONS,
    OrderCreate,
    OrderStatusChange,
    OrderUpdate,
)


# ── Helpers ─────────────────────────────────────────────────────
async def _next_order_no(db: AsyncSession) -> str:
    """Tạo mã đơn hàng: ORD-YYYYMMDD-NNNN (tự tăng trong ngày)."""
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    prefix = f"ORD-{today}-"
    result = await db.execute(
        select(func.count()).where(Order.order_no.like(f"{prefix}%"))
    )
    count = result.scalar_one() + 1
    return f"{prefix}{count:04d}"


async def _get_product(db: AsyncSession, pid: UUID) -> Product:
    row = await db.get(Product, pid)
    if row is None:
        raise NotFoundError("product_not_found", f"Sản phẩm {pid} không tồn tại")
    return row


async def _get_inv(db: AsyncSession, pid: UUID, warehouse: str) -> ProductInventory:
    """Lấy bản ghi tồn kho (tạo mới nếu chưa có)."""
    result = await db.execute(
        select(ProductInventory).where(
            ProductInventory.product_id == pid,
            ProductInventory.warehouse == warehouse,
        )
    )
    inv = result.scalar_one_or_none()
    if inv is None:
        inv = ProductInventory(
            product_id=pid, warehouse=warehouse,
            qty_on_hand=0, qty_reserved=0, low_stock_threshold=10,
        )
        db.add(inv)
        await db.flush()
    return inv


def _resolve_price(product: Product, channel: str, dealer_discount: float = 0) -> Decimal:
    """Lấy giá sản phẩm theo kênh bán, áp dụng chiết khấu đại lý."""
    channel_price = next(
        (pr.price for pr in product.prices if pr.channel == channel and pr.is_active),
        None,
    )
    if channel_price is None:
        # Fallback về giá bán lẻ
        channel_price = product.reference_price or Decimal("0")

    price = Decimal(str(channel_price))
    if dealer_discount > 0:
        price = price * (1 - Decimal(str(dealer_discount)) / 100)
    return price.quantize(Decimal("1"))


# ── Service ──────────────────────────────────────────────────────
class OrderService:
    def __init__(self, db: AsyncSession, current_user_id: UUID):
        self.db = db
        self.uid = current_user_id

    # ── Tạo đơn hàng (draft) ─────────────────────────────────────
    async def create_order(self, payload: OrderCreate) -> Order:
        if not payload.customer_id and not payload.dealer_id:
            raise ValidationError(
                "missing_buyer", "Đơn hàng phải có customer_id hoặc dealer_id"
            )
        if len(payload.items) == 0:
            raise ValidationError("empty_order", "Đơn hàng phải có ít nhất 1 sản phẩm")

        order_no = await _next_order_no(self.db)
        subtotal = Decimal("0")
        order_items: list[OrderItem] = []

        for item_in in payload.items:
            product = await _get_product(self.db, item_in.product_id)

            # Xác định giá: payload override → channel price → reference_price
            if item_in.unit_price is not None:
                unit_price = item_in.unit_price
            else:
                unit_price = _resolve_price(product, payload.channel)

            discount_pct = item_in.discount_pct
            line_total = unit_price * item_in.qty * (1 - discount_pct / 100)
            line_total = line_total.quantize(Decimal("1"))
            subtotal += line_total

            order_items.append(
                OrderItem(
                    product_id=item_in.product_id,
                    product_name=product.name,
                    sku=product.sku,
                    unit_price=unit_price,
                    qty=item_in.qty,
                    discount_pct=discount_pct,
                    line_total=line_total,
                )
            )

        total = subtotal + payload.shipping_fee - payload.discount_amount
        total = max(Decimal("0"), total)

        order = Order(
            order_no=order_no,
            customer_id=payload.customer_id,
            dealer_id=payload.dealer_id,
            channel=payload.channel,
            status="draft",
            warehouse=payload.warehouse,
            shipping_name=payload.shipping_name,
            shipping_phone=payload.shipping_phone,
            shipping_address=payload.shipping_address,
            shipping_province=payload.shipping_province,
            subtotal=subtotal,
            discount_amount=payload.discount_amount,
            shipping_fee=payload.shipping_fee,
            total_amount=total,
            note=payload.note,
            created_by=self.uid,
            items=order_items,
        )

        # Log trạng thái khởi tạo
        order.status_logs = [
            OrderStatusLog(
                from_status=None,
                to_status="draft",
                note="Tạo đơn hàng mới",
                changed_by=self.uid,
            )
        ]

        self.db.add(order)
        await self.db.commit()
        await self.db.refresh(order)
        return order

    # ── Đổi trạng thái ───────────────────────────────────────────
    async def change_status(self, order_id: UUID, payload: OrderStatusChange) -> Order:
        order = await self._get_order(order_id)
        new_status = payload.to_status

        # Validate transition
        allowed = ALLOWED_TRANSITIONS.get(order.status, [])
        if new_status not in allowed:
            raise ConflictError(
                "invalid_transition",
                f"Không thể chuyển từ '{order.status}' → '{new_status}'. "
                f"Cho phép: {allowed}",
            )

        # ── confirmed: khoá tồn kho + ghi nợ ────────────────────
        if new_status == "confirmed":
            await self._on_confirm(order)

        # ── completed: xuất kho thực sự ─────────────────────────
        elif new_status == "completed":
            await self._on_complete(order)

        # ── cancelled: giải phóng + reversal ────────────────────
        elif new_status == "cancelled":
            order.cancel_reason = payload.note
            await self._on_cancel(order)

        # ── returned: nhập lại kho + ghi có ─────────────────────
        elif new_status == "returned":
            await self._on_return(order)

        # Log
        log = OrderStatusLog(
            order_id=order.id,
            from_status=order.status,
            to_status=new_status,
            note=payload.note,
            changed_by=self.uid,
        )
        self.db.add(log)
        order.status = new_status
        await self.db.commit()
        return await self._get_order(order_id)

    async def _on_confirm(self, order: Order) -> None:
        """Xác nhận: khoá qty_reserved + ghi nợ đại lý."""
        for item in order.items:
            inv = await _get_inv(self.db, item.product_id, order.warehouse)
            available = inv.qty_on_hand - inv.qty_reserved
            if available < item.qty:
                raise ValidationError(
                    "insufficient_stock",
                    f"Tồn kho không đủ: '{item.product_name}' "
                    f"(cần {item.qty}, khả dụng {available})",
                )
            inv.qty_reserved += item.qty

        # Ghi nợ đại lý nếu là đơn B2B
        if order.dealer_id:
            ledger = DealerLedger(
                dealer_id=order.dealer_id,
                entry_type="debit",
                amount=order.total_amount,
                ref_type="order",
                ref_id=order.id,
                note=f"Đơn hàng {order.order_no}",
                created_by=self.uid,
            )
            self.db.add(ledger)

        await self.db.flush()

    async def _on_complete(self, order: Order) -> None:
        """Hoàn thành: xuất kho (on_hand -= qty, reserved -= qty)."""
        for item in order.items:
            inv = await _get_inv(self.db, item.product_id, order.warehouse)
            inv.qty_on_hand = max(0, inv.qty_on_hand - item.qty)
            inv.qty_reserved = max(0, inv.qty_reserved - item.qty)
        await self.db.flush()

    async def _on_cancel(self, order: Order) -> None:
        """Huỷ: giải phóng reserved (nếu đã confirmed/shipping) + reversal đại lý."""
        was_locked = order.status in ("confirmed", "shipping")
        if was_locked:
            for item in order.items:
                inv = await _get_inv(self.db, item.product_id, order.warehouse)
                inv.qty_reserved = max(0, inv.qty_reserved - item.qty)

            # Reversal đại lý
            if order.dealer_id:
                ledger = DealerLedger(
                    dealer_id=order.dealer_id,
                    entry_type="credit",
                    amount=order.total_amount,
                    ref_type="order",
                    ref_id=order.id,
                    note=f"Huỷ đơn {order.order_no}",
                    created_by=self.uid,
                )
                self.db.add(ledger)
        await self.db.flush()

    async def _on_return(self, order: Order) -> None:
        """Trả hàng: nhập lại kho + ghi có đại lý."""
        for item in order.items:
            inv = await _get_inv(self.db, item.product_id, order.warehouse)
            inv.qty_on_hand += item.qty

        if order.dealer_id:
            ledger = DealerLedger(
                dealer_id=order.dealer_id,
                entry_type="credit",
                amount=order.total_amount,
                ref_type="return",
                ref_id=order.id,
                note=f"Trả hàng đơn {order.order_no}",
                created_by=self.uid,
            )
            self.db.add(ledger)
        await self.db.flush()

    # ── Cập nhật đơn (chỉ khi draft) ─────────────────────────────
    async def update_order(self, order_id: UUID, payload: OrderUpdate) -> Order:
        order = await self._get_order(order_id)
        if order.status != "draft":
            raise ConflictError(
                "order_not_editable",
                f"Chỉ có thể chỉnh sửa đơn hàng ở trạng thái draft (hiện: {order.status})",
            )
        data = payload.model_dump(exclude_unset=True)
        # Tính lại total nếu có thay đổi phí
        for k, v in data.items():
            setattr(order, k, v)
        order.total_amount = (
            order.subtotal
            + Decimal(str(order.shipping_fee))
            - Decimal(str(order.discount_amount))
        )
        await self.db.commit()
        return await self._get_order(order_id)

    # ── Danh sách ─────────────────────────────────────────────────
    async def list_orders(
        self,
        status: str | None = None,
        dealer_id: UUID | None = None,
        customer_id: UUID | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Order], int]:
        q = select(Order)
        if status:
            q = q.where(Order.status == status)
        if dealer_id:
            q = q.where(Order.dealer_id == dealer_id)
        if customer_id:
            q = q.where(Order.customer_id == customer_id)
        q = q.order_by(Order.created_at.desc())

        count_q = select(func.count()).select_from(q.subquery())
        total = (await self.db.execute(count_q)).scalar_one()
        rows = (
            await self.db.execute(q.offset((page - 1) * page_size).limit(page_size))
        ).scalars().all()
        return list(rows), total

    # ── Chi tiết ─────────────────────────────────────────────────
    async def get_order(self, order_id: UUID) -> Order:
        return await self._get_order(order_id)

    async def _get_order(self, order_id: UUID) -> Order:
        result = await self.db.execute(
            select(Order).where(Order.id == order_id)
        )
        order = result.scalar_one_or_none()
        if order is None:
            raise NotFoundError("order_not_found", "Đơn hàng không tồn tại")
        return order


# ── Helper to build buyer_name ────────────────────────────────────
def buyer_name(order: Order) -> str | None:
    if order.customer:
        return order.customer.full_name
    if order.dealer:
        return order.dealer.name
    return None
