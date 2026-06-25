"""Service xử lý logic cho Cổng thông tin Đại lý (Dealer Portal)."""
from __future__ import annotations

from uuid import UUID
from decimal import Decimal

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.dealer import Dealer
from app.models.product import Product
from app.models.order import Order
from app.models.dealer_ledger import DealerLedger
from app.core.exceptions import NotFoundError, AppError
from app.schemas.portal import PortalDealerProfile, PortalProduct, PortalOrderCreate
from app.schemas.order import OrderCreate, OrderItemIn
from app.services.order_service import OrderService
from app.services.dealer_service import DealerService


class PortalService:
    def __init__(self, db: AsyncSession, user_id: UUID):
        self.db = db
        self.user_id = user_id

    async def get_current_dealer(self) -> Dealer:
        """Lấy thông tin Dealer dựa trên user đang đăng nhập."""
        stmt = select(Dealer).where(Dealer.user_id == self.user_id)
        dealer = (await self.db.execute(stmt)).scalar_one_or_none()
        if not dealer:
            raise NotFoundError("dealer_not_found", "Tài khoản của bạn chưa được liên kết với bất kỳ Đại lý nào.")
        if dealer.status != "active":
            raise AppError("dealer_inactive", "Tài khoản Đại lý của bạn đang bị khóa hoặc chờ duyệt.", 403)
        return dealer

    async def get_profile(self) -> PortalDealerProfile:
        dealer = await self.get_current_dealer()
        
        # Tính toán balance (nợ hiện tại)
        debt_summary = await DealerService(self.db).get_debt_summary(dealer.id)
        
        return PortalDealerProfile(
            id=dealer.id,
            code=dealer.code,
            name=dealer.name,
            tier=dealer.tier,
            region=dealer.region,
            address=dealer.address,
            contact_name=dealer.contact_name,
            phone=dealer.phone,
            credit_limit=float(dealer.credit_limit),
            payment_term_days=dealer.payment_term_days,
            status=dealer.status,
            balance=debt_summary.balance
        )

    async def list_products(self) -> list[PortalProduct]:
        dealer = await self.get_current_dealer()
        
        # Lấy tất cả sản phẩm đang bán (status=active)
        stmt = select(Product).options(selectinload(Product.prices)).where(Product.status == "active")
        products = (await self.db.execute(stmt)).scalars().all()
        
        # TODO: Cần lấy thêm specific discounts cho dealer này từ bảng dealer_discounts
        # Tạm thời chỉ áp dụng base channel_price
        
        results = []
        for p in products:
            # base price (giá lẻ)
            base_price = p.reference_price or Decimal("0")
            
            # channel price dựa trên tier của đại lý
            tier_price_obj = next((pr for pr in p.prices if pr.channel == dealer.tier and pr.is_active), None)
            
            dealer_price = tier_price_obj.price if tier_price_obj else base_price
            
            results.append(PortalProduct(
                id=p.id,
                sku=p.sku,
                name=p.name,
                category_id=p.category_id,
                image_url=p.images[0].image_url if p.images else None,
                description=p.description,
                unit=p.unit,
                base_price=float(base_price),
                dealer_price=float(dealer_price),
                discount_percent=0.0,
                in_stock=True # Giả định, thực tế phải join với ProductInventory
            ))
            
        return results

    async def create_order(self, payload: PortalOrderCreate) -> Order:
        dealer = await self.get_current_dealer()
        
        order_items = []
        for item in payload.items:
            order_items.append(OrderItemIn(
                product_id=item.product_id,
                qty=item.quantity,
                discount_pct=0.0
            ))
            
        order_payload = OrderCreate(
            dealer_id=dealer.id,
            channel=dealer.tier,
            warehouse="main", # Mặc định xuất từ kho chính
            shipping_name=dealer.contact_name or dealer.name,
            shipping_phone=dealer.phone or "",
            shipping_address=payload.shipping_address or dealer.address or "",
            items=order_items,
            note=payload.note or "Đặt hàng từ Cổng Đại lý (B2B Portal)"
        )
        
        order_service = OrderService(self.db, self.user_id)
        # Tạo đơn
        order = await order_service.create_order(order_payload)
        
        # Đại lý đặt xong thì tự động Xác nhận đơn hàng (Trừ tồn kho dự trữ và Ghi nợ)
        from app.schemas.order import OrderStatusChange
        await order_service.change_status(order.id, OrderStatusChange(to_status="confirmed", note="Hệ thống tự xác nhận đơn B2B"))
        
        return order

    async def list_orders(self) -> list[Order]:
        dealer = await self.get_current_dealer()
        stmt = select(Order).where(Order.dealer_id == dealer.id).order_by(Order.created_at.desc())
        orders = (await self.db.execute(stmt)).scalars().all()
        return list(orders)

    async def list_ledger(self) -> list[DealerLedger]:
        dealer = await self.get_current_dealer()
        stmt = select(DealerLedger).where(DealerLedger.dealer_id == dealer.id).order_by(DealerLedger.created_at.desc())
        ledgers = (await self.db.execute(stmt)).scalars().all()
        return list(ledgers)
