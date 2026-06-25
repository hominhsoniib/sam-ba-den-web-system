"""Repository thao tác DB cho ContactSubmission."""
from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.contact import ContactSubmission
from app.schemas.contact import ContactCreate, DealerCreate, ContactStatusUpdate


class ContactRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    # ── Public ─────────────────────────────────────────────────────────

    async def create_contact(
        self,
        data: ContactCreate,
        ip: str | None = None,
        user_agent: str | None = None,
    ) -> ContactSubmission:
        obj = ContactSubmission(
            full_name=data.full_name,
            phone=data.phone,
            email=data.email,
            source="contact",
            subject=data.subject,
            message=data.message,
            ip_address=ip,
            user_agent=user_agent,
        )
        self.db.add(obj)
        await self.db.commit()
        await self.db.refresh(obj)
        return obj

    async def create_dealer(
        self,
        data: DealerCreate,
        ip: str | None = None,
        user_agent: str | None = None,
    ) -> ContactSubmission:
        obj = ContactSubmission(
            full_name=data.full_name,
            phone=data.phone,
            email=data.email,
            source="dealer",
            area=data.area,
            message=data.message,
            ip_address=ip,
            user_agent=user_agent,
        )
        self.db.add(obj)
        await self.db.commit()
        await self.db.refresh(obj)
        return obj

    # ── Admin ──────────────────────────────────────────────────────────

    async def list_all(
        self,
        source: str | None = None,
        status: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[ContactSubmission], int]:
        q = select(ContactSubmission)
        if source:
            q = q.where(ContactSubmission.source == source)
        if status:
            q = q.where(ContactSubmission.status == status)
        q = q.order_by(ContactSubmission.created_at.desc())

        total_q = select(func.count()).select_from(q.subquery())
        total = (await self.db.execute(total_q)).scalar_one()

        q = q.offset((page - 1) * page_size).limit(page_size)
        rows = (await self.db.execute(q)).scalars().all()
        return list(rows), total

    async def get_by_id(self, contact_id: UUID) -> ContactSubmission | None:
        return await self.db.get(ContactSubmission, contact_id)

    async def update_status(
        self, contact_id: UUID, data: ContactStatusUpdate
    ) -> ContactSubmission | None:
        obj = await self.get_by_id(contact_id)
        if not obj:
            return None
        obj.status = data.status
        if data.admin_note is not None:
            obj.admin_note = data.admin_note
        if data.status == "replied" and obj.replied_at is None:
            obj.replied_at = datetime.now(timezone.utc)
        await self.db.commit()
        await self.db.refresh(obj)
        return obj
