"""Service xử lý logic nghiệp vụ Quản lý Đại lý (M5)."""
from __future__ import annotations

from uuid import UUID, uuid4
from datetime import datetime, timezone
from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.dealer import Dealer
from app.models.dealer_discount import DealerDiscount
from app.models.dealer_ledger import DealerLedger
from app.models.contact import ContactSubmission
from app.models.user import User, Role
from app.core.security import hash_password
from app.schemas.dealer import (
    DealerCreate, DealerUpdate, DealerApprove,
    DealerDiscountCreate, DealerLedgerCreate, DealerDebtSummary
)
from app.core.exceptions import AppError, ConflictError, NotFoundError

class DealerService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ─────────────────────────────────────────────────────────────────────
    # Dealer Methods
    # ─────────────────────────────────────────────────────────────────────

    async def list_dealers(
        self, region: str | None = None, status: str | None = None, page: int = 1, page_size: int = 20
    ) -> tuple[list[Dealer], int]:
        q = select(Dealer)
        if region:
            q = q.where(Dealer.region == region)
        if status:
            q = q.where(Dealer.status == status)
        q = q.order_by(Dealer.created_at.desc())

        # Total count
        total_q = select(func.count()).select_from(q.subquery())
        total = (await self.db.execute(total_q)).scalar_one()

        # Paginate
        q = q.offset((page - 1) * page_size).limit(page_size)
        rows = (await self.db.execute(q)).scalars().all()
        return list(rows), total

    async def get_dealer(self, dealer_id: UUID) -> Dealer | None:
        return await self.db.get(Dealer, dealer_id)

    async def get_dealer_by_code(self, code: str) -> Dealer | None:
        stmt = select(Dealer).where(Dealer.code == code)
        return (await self.db.execute(stmt)).scalar_one_or_none()

    async def create_dealer(self, data: DealerCreate) -> Dealer:
        # Check code uniqueness
        if await self.get_dealer_by_code(data.code):
            raise ConflictError("dealer_code_exists", "Mã đại lý đã tồn tại")

        obj = Dealer(
            id=uuid4(),
            code=data.code,
            name=data.name,
            tier=data.tier,
            region=data.region,
            address=data.address,
            contact_name=data.contact_name,
            phone=data.phone,
            lat=data.lat,
            lng=data.lng,
            credit_limit=data.credit_limit,
            payment_term_days=data.payment_term_days,
            user_id=data.user_id,
            status="active"
        )
        self.db.add(obj)
        await self.db.commit()
        await self.db.refresh(obj)
        return obj

    async def update_dealer(self, dealer_id: UUID, data: DealerUpdate) -> Dealer:
        obj = await self.get_dealer(dealer_id)
        if not obj:
            raise NotFoundError("dealer_not_found", "Đại lý không tồn tại")

        update_data = data.model_dump(exclude_unset=True)
        if "code" in update_data and update_data["code"] != obj.code:
            if await self.get_dealer_by_code(update_data["code"]):
                raise ConflictError("dealer_code_exists", "Mã đại lý đã tồn tại")

        for key, val in update_data.items():
            setattr(obj, key, val)

        await self.db.commit()
        await self.db.refresh(obj)
        return obj

    # ─────────────────────────────────────────────────────────────────────
    # Approve Registration (Dealer Registration -> Official Dealer)
    # ─────────────────────────────────────────────────────────────────────

    async def approve_dealer_registration(
        self, contact_id: UUID, payload: DealerApprove, actor_id: UUID
    ) -> Dealer:
        # 1. Fetch ContactSubmission
        contact = await self.db.get(ContactSubmission, contact_id)
        if not contact or contact.source != "dealer":
            raise NotFoundError("registration_not_found", "Không tìm thấy đơn đăng ký đại lý")

        if contact.status == "closed":
            raise ConflictError("already_approved", "Đơn đăng ký này đã được xử lý")

        # 2. Check if code already exists
        if await self.get_dealer_by_code(payload.code):
            raise ConflictError("dealer_code_exists", "Mã đại lý đã tồn tại")

        # 3. Create portal user if email is present
        user_id = None
        if contact.email:
            existing_user = (await self.db.execute(
                select(User).where(User.email == contact.email)
            )).scalar_one_or_none()

            if not existing_user:
                # Find or create role 'dealer'
                role_dealer = (await self.db.execute(
                    select(Role).where(Role.name == "dealer")
                )).scalar_one_or_none()
                if not role_dealer:
                    role_dealer = Role(id=uuid4(), name="dealer", description="Tài khoản đại lý B2B")
                    self.db.add(role_dealer)
                    await self.db.flush()

                new_user = User(
                    id=uuid4(),
                    email=contact.email,
                    password_hash=hash_password("Dealer@123456"), # default password
                    full_name=contact.full_name,
                    is_active=True,
                    roles=[role_dealer]
                )
                self.db.add(new_user)
                await self.db.flush()
                user_id = new_user.id
            else:
                user_id = existing_user.id

        # 4. Create Dealer
        dealer = Dealer(
            id=uuid4(),
            code=payload.code,
            name=contact.full_name,
            tier=payload.tier,
            region=payload.region,
            address=contact.area or "",
            contact_name=contact.full_name,
            phone=contact.phone,
            credit_limit=payload.credit_limit,
            payment_term_days=payload.payment_term_days,
            user_id=user_id,
            status="active"
        )
        self.db.add(dealer)

        # 5. Update Contact Submission
        contact.status = "closed"
        contact.admin_note = f"Đã duyệt thành đại lý {payload.code} bởi admin."
        contact.replied_at = datetime.now(timezone.utc)

        await self.db.commit()
        await self.db.refresh(dealer)
        return dealer

    # ─────────────────────────────────────────────────────────────────────
    # Ledger / Debt Methods
    # ─────────────────────────────────────────────────────────────────────

    async def get_debt_summary(self, dealer_id: UUID) -> DealerDebtSummary:
        dealer = await self.get_dealer(dealer_id)
        if not dealer:
            raise NotFoundError("dealer_not_found", "Đại lý không tồn tại")

        # Sum debit
        debit_stmt = select(func.sum(DealerLedger.amount)).where(
            DealerLedger.dealer_id == dealer_id,
            DealerLedger.entry_type == "debit"
        )
        total_debit = (await self.db.execute(debit_stmt)).scalar() or 0.0

        # Sum credit
        credit_stmt = select(func.sum(DealerLedger.amount)).where(
            DealerLedger.dealer_id == dealer_id,
            DealerLedger.entry_type == "credit"
        )
        total_credit = (await self.db.execute(credit_stmt)).scalar() or 0.0

        balance = float(total_debit) - float(total_credit)
        available_credit = float(dealer.credit_limit) - balance
        if available_credit < 0:
            available_credit = 0.0

        return DealerDebtSummary(
            total_debit=float(total_debit),
            total_credit=float(total_credit),
            balance=balance,
            credit_limit=float(dealer.credit_limit),
            available_credit=available_credit
        )

    async def record_ledger_entry(
        self, dealer_id: UUID, data: DealerLedgerCreate, creator_id: UUID
    ) -> DealerLedger:
        dealer = await self.get_dealer(dealer_id)
        if not dealer:
            raise NotFoundError("dealer_not_found", "Đại lý không tồn tại")

        obj = DealerLedger(
            id=uuid4(),
            dealer_id=dealer_id,
            entry_type=data.entry_type,
            amount=data.amount,
            ref_type=data.ref_type,
            ref_id=data.ref_id,
            note=data.note,
            created_by=creator_id
        )
        self.db.add(obj)
        await self.db.commit()
        await self.db.refresh(obj)
        return obj

    async def list_ledger_entries(self, dealer_id: UUID) -> list[DealerLedger]:
        stmt = select(DealerLedger).where(DealerLedger.dealer_id == dealer_id).order_by(DealerLedger.created_at.desc())
        rows = (await self.db.execute(stmt)).scalars().all()
        return list(rows)

    # ─────────────────────────────────────────────────────────────────────
    # Discount Methods
    # ─────────────────────────────────────────────────────────────────────

    async def list_discounts(self, dealer_id: UUID | None = None) -> list[DealerDiscount]:
        stmt = select(DealerDiscount)
        if dealer_id:
            stmt = stmt.where(DealerDiscount.dealer_id == dealer_id)
        stmt = stmt.order_by(DealerDiscount.created_at.desc())
        rows = (await self.db.execute(stmt)).scalars().all()
        return list(rows)

    async def create_discount(self, data: DealerDiscountCreate) -> DealerDiscount:
        obj = DealerDiscount(
            id=uuid4(),
            dealer_id=data.dealer_id,
            tier=data.tier,
            product_id=data.product_id,
            category_id=data.category_id,
            discount_percent=data.discount_percent,
            start_at=data.start_at,
            end_at=data.end_at,
            is_active=data.is_active
        )
        self.db.add(obj)
        await self.db.commit()
        await self.db.refresh(obj)
        return obj

    async def resolve_best_discount(
        self, dealer_id: UUID, product_id: UUID, category_id: UUID
    ) -> float:
        dealer = await self.get_dealer(dealer_id)
        if not dealer:
            raise NotFoundError("dealer_not_found", "Đại lý không tồn tại")

        now = datetime.now(timezone.utc)
        
        # Query active discounts
        stmt = select(DealerDiscount).where(
            DealerDiscount.is_active == True,
            DealerDiscount.start_at <= now,
            (DealerDiscount.end_at == None) | (DealerDiscount.end_at >= now)
        )
        all_active = (await self.db.execute(stmt)).scalars().all()

        max_discount = 0.0
        for rule in all_active:
            # Check dealer scope
            dealer_match = False
            if rule.dealer_id is None and rule.tier is None:
                # Applies to all dealers
                dealer_match = True
            elif rule.dealer_id == dealer_id:
                dealer_match = True
            elif rule.tier == dealer.tier:
                dealer_match = True

            # Check product scope
            product_match = False
            if rule.product_id is None and rule.category_id is None:
                # Applies to all products
                product_match = True
            elif rule.product_id == product_id:
                product_match = True
            elif rule.category_id == category_id:
                product_match = True

            if dealer_match and product_match:
                if rule.discount_percent > max_discount:
                    max_discount = float(rule.discount_percent)

        return max_discount
