"""Router Analytics & Dashboard (M9).

Cung cấp các endpoint thống kê cho Dashboard:
  /admin/analytics/overview        – KPI tổng hợp tháng này vs tháng trước
  /admin/analytics/orders-trend    – Xu hướng đơn hàng 30 ngày gần nhất
  /admin/analytics/orders-by-status – Phân bổ đơn theo trạng thái (pie)
  /admin/analytics/orders-by-channel – Phân bổ doanh thu theo kênh bán
  /admin/analytics/top-products    – Top 5 sản phẩm bán chạy
  /admin/analytics/dealer-summary  – Tóm tắt đại lý: tổng công nợ, lô mới nhất
  /admin/analytics/recent-orders   – 10 đơn hàng mới nhất
"""
from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user, require_permission
from app.models.customer import Customer
from app.models.dealer import Dealer
from app.models.dealer_ledger import DealerLedger
from app.models.lead import Lead
from app.models.order import Order, OrderItem
from app.models.product import Product, ProductInventory
from app.models.qrcode import ProductBatch, QRCode

router = APIRouter(prefix="/admin/analytics", tags=["admin:analytics"])


def _this_month_range():
    today = date.today()
    first = today.replace(day=1)
    return first, today


def _last_month_range():
    today = date.today()
    first_this = today.replace(day=1)
    last_last = first_this - timedelta(days=1)
    first_last = last_last.replace(day=1)
    return first_last, last_last


# ── KPI tổng quan ───────────────────────────────────────────────────
@router.get("/overview")
async def get_overview(
    db: AsyncSession = Depends(get_db),
    _cur=Depends(get_current_user),
    _p=Depends(require_permission("order.read")),
):
    start_this, end_this = _this_month_range()
    start_last, end_last = _last_month_range()

    async def revenue(start: date, end: date):
        r = await db.execute(
            select(func.coalesce(func.sum(Order.total_amount), 0)).where(
                Order.status.in_(["completed", "shipping", "confirmed"]),
                func.date(Order.created_at) >= start,
                func.date(Order.created_at) <= end,
            )
        )
        return float(r.scalar())

    async def order_count(start: date, end: date):
        r = await db.execute(
            select(func.count()).select_from(Order).where(
                func.date(Order.created_at) >= start,
                func.date(Order.created_at) <= end,
            )
        )
        return r.scalar() or 0

    # Run queries
    rev_this = await revenue(start_this, end_this)
    rev_last = await revenue(start_last, end_last)
    ord_this = await order_count(start_this, end_this)
    ord_last = await order_count(start_last, end_last)

    # Customer counts
    r_cust = await db.execute(select(func.count()).select_from(Customer))
    total_customers = r_cust.scalar() or 0

    r_lead = await db.execute(
        select(func.count()).select_from(Lead).where(Lead.status == "new")
    )
    new_leads = r_lead.scalar() or 0

    # Dealer counts
    r_dlr = await db.execute(
        select(func.count()).select_from(Dealer).where(Dealer.status == "active")
    )
    active_dealers = r_dlr.scalar() or 0

    # Low stock products
    r_low = await db.execute(
        select(func.count()).select_from(ProductInventory).where(
            ProductInventory.qty_on_hand - ProductInventory.qty_reserved
            <= ProductInventory.low_stock_threshold
        )
    )
    low_stock = r_low.scalar() or 0

    # QR batches active
    r_qr = await db.execute(
        select(func.count()).select_from(ProductBatch).where(
            ProductBatch.status == "active"
        )
    )
    active_batches = r_qr.scalar() or 0

    def pct_change(now: float, prev: float) -> float | None:
        if prev == 0:
            return None
        return round((now - prev) / prev * 100, 1)

    return {
        "data": {
            "revenue": {
                "this_month": rev_this,
                "last_month": rev_last,
                "change_pct": pct_change(rev_this, rev_last),
            },
            "orders": {
                "this_month": ord_this,
                "last_month": ord_last,
                "change_pct": pct_change(ord_this, ord_last),
            },
            "customers": {"total": total_customers, "new_leads": new_leads},
            "dealers": {"active": active_dealers},
            "inventory": {"low_stock_count": low_stock},
            "qrcode": {"active_batches": active_batches},
        }
    }


# ── Xu hướng đơn hàng theo ngày (30 ngày) ───────────────────────────
@router.get("/orders-trend")
async def orders_trend(
    db: AsyncSession = Depends(get_db),
    _cur=Depends(get_current_user),
    _p=Depends(require_permission("order.read")),
):
    today = date.today()
    start = today - timedelta(days=29)

    rows = await db.execute(
        select(
            func.date(Order.created_at).label("day"),
            func.count().label("count"),
            func.coalesce(func.sum(Order.total_amount), 0).label("revenue"),
        ).where(
            func.date(Order.created_at) >= start,
        ).group_by(
            func.date(Order.created_at)
        ).order_by(
            func.date(Order.created_at)
        )
    )
    raw = rows.all()

    # Fill missing days with 0
    data = {}
    for i in range(30):
        d = (start + timedelta(days=i)).isoformat()
        data[d] = {"date": d, "count": 0, "revenue": 0.0}
    for row in raw:
        d = str(row.day)
        data[d] = {"date": d, "count": row.count, "revenue": float(row.revenue)}

    return {"data": list(data.values())}


# ── Phân bổ theo trạng thái đơn hàng ────────────────────────────────
@router.get("/orders-by-status")
async def orders_by_status(
    db: AsyncSession = Depends(get_db),
    _cur=Depends(get_current_user),
    _p=Depends(require_permission("order.read")),
):
    rows = await db.execute(
        select(
            Order.status,
            func.count().label("count"),
        ).group_by(Order.status).order_by(func.count().desc())
    )
    return {
        "data": [{"status": r.status, "count": r.count} for r in rows.all()]
    }


# ── Phân bổ doanh thu theo kênh bán ─────────────────────────────────
@router.get("/orders-by-channel")
async def orders_by_channel(
    db: AsyncSession = Depends(get_db),
    _cur=Depends(get_current_user),
    _p=Depends(require_permission("order.read")),
):
    rows = await db.execute(
        select(
            Order.channel,
            func.count().label("order_count"),
            func.coalesce(func.sum(Order.total_amount), 0).label("revenue"),
        ).where(
            Order.status.in_(["completed", "shipping", "confirmed"])
        ).group_by(Order.channel).order_by(func.sum(Order.total_amount).desc())
    )
    return {
        "data": [
            {
                "channel": r.channel,
                "order_count": r.order_count,
                "revenue": float(r.revenue),
            }
            for r in rows.all()
        ]
    }


# ── Top sản phẩm bán chạy ───────────────────────────────────────────
@router.get("/top-products")
async def top_products(
    db: AsyncSession = Depends(get_db),
    _cur=Depends(get_current_user),
    _p=Depends(require_permission("order.read")),
):
    rows = await db.execute(
        select(
            OrderItem.product_name,
            OrderItem.sku,
            func.sum(OrderItem.qty).label("total_qty"),
            func.sum(OrderItem.line_total).label("total_revenue"),
        ).join(Order, Order.id == OrderItem.order_id)
        .where(Order.status.in_(["completed", "shipping", "confirmed"]))
        .group_by(OrderItem.product_name, OrderItem.sku)
        .order_by(func.sum(OrderItem.line_total).desc())
        .limit(5)
    )
    return {
        "data": [
            {
                "product_name": r.product_name,
                "sku": r.sku,
                "total_qty": int(r.total_qty),
                "total_revenue": float(r.total_revenue),
            }
            for r in rows.all()
        ]
    }


# ── Tóm tắt công nợ đại lý ──────────────────────────────────────────
@router.get("/dealer-summary")
async def dealer_summary(
    db: AsyncSession = Depends(get_db),
    _cur=Depends(get_current_user),
    _p=Depends(require_permission("dealer.read")),
):
    # Tổng công nợ chưa thanh toán của tất cả đại lý
    rows = await db.execute(
        select(
            Dealer.id,
            Dealer.company_name,
            Dealer.tier,
            func.coalesce(func.sum(DealerLedger.amount), 0).label("balance"),
        ).outerjoin(DealerLedger, DealerLedger.dealer_id == Dealer.id)
        .where(Dealer.status == "active")
        .group_by(Dealer.id, Dealer.company_name, Dealer.tier)
        .order_by(func.sum(DealerLedger.amount).desc())
        .limit(10)
    )
    return {
        "data": [
            {
                "dealer_id": str(r.id),
                "company_name": r.company_name,
                "tier": r.tier,
                "balance": float(r.balance),
            }
            for r in rows.all()
        ]
    }


# ── 10 đơn hàng mới nhất ────────────────────────────────────────────
@router.get("/recent-orders")
async def recent_orders(
    db: AsyncSession = Depends(get_db),
    _cur=Depends(get_current_user),
    _p=Depends(require_permission("order.read")),
):
    rows = await db.execute(
        select(
            Order.id,
            Order.order_no,
            Order.status,
            Order.channel,
            Order.total_amount,
            Order.created_at,
        ).order_by(Order.created_at.desc()).limit(10)
    )
    return {
        "data": [
            {
                "id": str(r.id),
                "order_no": r.order_no,
                "status": r.status,
                "channel": r.channel,
                "total_amount": float(r.total_amount),
                "created_at": r.created_at.isoformat(),
            }
            for r in rows.all()
        ]
    }
