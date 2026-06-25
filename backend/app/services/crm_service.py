"""Service xử lý logic nghiệp vụ CRM & Lead Management."""
from __future__ import annotations

from uuid import UUID, uuid4
from datetime import datetime, timezone
from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.customer import Customer
from app.models.lead import Lead
from app.models.opportunity import Opportunity
from app.models.interaction import Interaction
from app.schemas.crm import (
    LeadCreate, LeadUpdate, CustomerCreate, CustomerUpdate,
    InteractionCreate, OpportunityCreate, LeadConvertResult,
    CustomerJourneyOut, CustomerOut, InteractionOut, OpportunityOut
)
from app.core.exceptions import AppError

class CrmService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ─────────────────────────────────────────────────────────────────────
    # Lead Methods
    # ─────────────────────────────────────────────────────────────────────

    async def list_leads(
        self, status: str | None = None, owner_id: UUID | None = None, page: int = 1, page_size: int = 20
    ) -> tuple[list[Lead], int]:
        q = select(Lead)
        if status:
            q = q.where(Lead.status == status)
        if owner_id:
            q = q.where(Lead.owner_id == owner_id)
        
        q = q.order_by(Lead.created_at.desc())
        
        # Total count
        total_q = select(func.count()).select_from(q.subquery())
        total = (await self.db.execute(total_q)).scalar_one()
        
        # Paginate
        q = q.offset((page - 1) * page_size).limit(page_size)
        rows = (await self.db.execute(q)).scalars().all()
        return list(rows), total

    async def get_lead(self, lead_id: UUID) -> Lead | None:
        return await self.db.get(Lead, lead_id)

    async def create_lead(self, data: LeadCreate) -> Lead:
        obj = Lead(
            id=uuid4(),
            full_name=data.full_name,
            phone=data.phone,
            email=data.email,
            source=data.source,
            source_ref_id=data.source_ref_id,
            status=data.status,
            owner_id=data.owner_id,
            customer_id=data.customer_id
        )
        self.db.add(obj)
        await self.db.commit()
        await self.db.refresh(obj)
        return obj

    async def update_lead(self, lead_id: UUID, data: LeadUpdate) -> Lead:
        obj = await self.get_lead(lead_id)
        if not obj:
            raise AppError(status_code=404, error_code="lead_not_found", message="Lead không tồn tại")
            
        update_data = data.model_dump(exclude_unset=True)
        for key, val in update_data.items():
            setattr(obj, key, val)
            
        await self.db.commit()
        await self.db.refresh(obj)
        return obj

    # ─────────────────────────────────────────────────────────────────────
    # Customer Methods
    # ─────────────────────────────────────────────────────────────────────

    async def list_customers(
        self, owner_id: UUID | None = None, page: int = 1, page_size: int = 20
    ) -> tuple[list[Customer], int]:
        q = select(Customer)
        if owner_id:
            q = q.where(Customer.owner_id == owner_id)
        q = q.order_by(Customer.created_at.desc())
        
        total_q = select(func.count()).select_from(q.subquery())
        total = (await self.db.execute(total_q)).scalar_one()
        
        q = q.offset((page - 1) * page_size).limit(page_size)
        rows = (await self.db.execute(q)).scalars().all()
        return list(rows), total

    async def get_customer(self, customer_id: UUID) -> Customer | None:
        return await self.db.get(Customer, customer_id)

    async def create_customer(self, data: CustomerCreate) -> Customer:
        obj = Customer(
            id=uuid4(),
            full_name=data.full_name,
            phone=data.phone,
            email=data.email,
            address=data.address,
            source=data.source,
            owner_id=data.owner_id,
            tags=data.tags,
            note=data.note
        )
        self.db.add(obj)
        await self.db.commit()
        await self.db.refresh(obj)
        return obj

    async def update_customer(self, customer_id: UUID, data: CustomerUpdate) -> Customer:
        obj = await self.get_customer(customer_id)
        if not obj:
            raise AppError(status_code=404, error_code="customer_not_found", message="Khách hàng không tồn tại")
            
        update_data = data.model_dump(exclude_unset=True)
        for key, val in update_data.items():
            setattr(obj, key, val)
            
        await self.db.commit()
        await self.db.refresh(obj)
        return obj

    # ─────────────────────────────────────────────────────────────────────
    # Convert Lead to Customer & Opportunity
    # ─────────────────────────────────────────────────────────────────────

    async def convert_lead(self, lead_id: UUID, actor_id: UUID) -> LeadConvertResult:
        lead = await self.get_lead(lead_id)
        if not lead:
            raise AppError(status_code=404, error_code="lead_not_found", message="Lead không tồn tại")
            
        if lead.status == "converted":
            raise AppError(status_code=400, error_code="lead_already_converted", message="Lead đã được chuyển đổi")
            
        # Check if customer with this phone already exists
        existing_cust = (await self.db.execute(
            select(Customer).where(Customer.phone == lead.phone)
        )).scalar_one_or_none()
        
        if existing_cust:
            customer = existing_cust
        else:
            # Create Customer
            customer = Customer(
                id=uuid4(),
                full_name=lead.full_name,
                phone=lead.phone,
                email=lead.email,
                source=lead.source,
                owner_id=lead.owner_id or actor_id
            )
            self.db.add(customer)
            await self.db.flush()
            
        # Create Opportunity
        opp = Opportunity(
            id=uuid4(),
            customer_id=customer.id,
            title=f"Cơ hội sâm cho {customer.full_name}",
            stage="new",
            owner_id=customer.owner_id or actor_id
        )
        self.db.add(opp)
        await self.db.flush()
        
        # Update Lead
        lead.status = "converted"
        lead.customer_id = customer.id
        
        # Record System Interaction
        interaction = Interaction(
            id=uuid4(),
            entity_type="customer",
            entity_id=customer.id,
            type="note",
            content=f"Chuyển đổi từ Lead. Cơ hội: {opp.title}",
            created_by=actor_id
        )
        self.db.add(interaction)
        
        await self.db.commit()
        return LeadConvertResult(customer_id=customer.id, opportunity_id=opp.id)

    # ─────────────────────────────────────────────────────────────────────
    # Interaction Methods
    # ─────────────────────────────────────────────────────────────────────

    async def create_interaction(self, data: InteractionCreate, creator_id: UUID) -> Interaction:
        obj = Interaction(
            id=uuid4(),
            entity_type=data.entity_type,
            entity_id=data.entity_id,
            type=data.type,
            content=data.content,
            channel=data.channel,
            created_by=creator_id
        )
        self.db.add(obj)
        await self.db.commit()
        await self.db.refresh(obj)
        return obj

    async def list_interactions(self, entity_type: str, entity_id: UUID) -> list[Interaction]:
        q = select(Interaction).where(
            Interaction.entity_type == entity_type,
            Interaction.entity_id == entity_id
        ).order_by(Interaction.created_at.desc())
        return list((await self.db.execute(q)).scalars().all())

    # ─────────────────────────────────────────────────────────────────────
    # Opportunity Methods
    # ─────────────────────────────────────────────────────────────────────

    async def list_opportunities(self, customer_id: UUID | None = None) -> list[Opportunity]:
        q = select(Opportunity)
        if customer_id:
            q = q.where(Opportunity.customer_id == customer_id)
        q = q.order_by(Opportunity.created_at.desc())
        return list((await self.db.execute(q)).scalars().all())

    async def get_opportunity(self, opp_id: UUID) -> Opportunity | None:
        return await self.db.get(Opportunity, opp_id)

    async def create_opportunity(self, data: OpportunityCreate) -> Opportunity:
        obj = Opportunity(
            id=uuid4(),
            customer_id=data.customer_id,
            title=data.title,
            stage=data.stage,
            est_value=data.est_value,
            owner_id=data.owner_id,
            expected_close_date=data.expected_close_date
        )
        self.db.add(obj)
        await self.db.commit()
        await self.db.refresh(obj)
        return obj

    async def update_opportunity(self, opp_id: UUID, data: OpportunityUpdate) -> Opportunity:
        obj = await self.get_opportunity(opp_id)
        if not obj:
            raise AppError(status_code=404, error_code="opportunity_not_found", message="Cơ hội không tồn tại")
            
        update_data = data.model_dump(exclude_unset=True)
        for key, val in update_data.items():
            setattr(obj, key, val)
            
        await self.db.commit()
        await self.db.refresh(obj)
        return obj

    # ─────────────────────────────────────────────────────────────────────
    # Customer 360 Journey
    # ─────────────────────────────────────────────────────────────────────

    async def get_customer_journey(self, customer_id: UUID) -> CustomerJourneyOut:
        customer = await self.get_customer(customer_id)
        if not customer:
            raise AppError(status_code=404, error_code="customer_not_found", message="Khách hàng không tồn tại")
            
        # Get all interactions (with customer or opportunities)
        interactions = await self.list_interactions("customer", customer_id)
        
        # Get opportunities
        opps = await self.list_opportunities(customer_id)
        for opp in opps:
            opp_interactions = await self.list_interactions("opportunity", opp.id)
            interactions.extend(opp_interactions)
            
        # Sort interactions chronologically desc
        interactions.sort(key=lambda x: x.created_at, reverse=True)
        
        return CustomerJourneyOut(
            customer=CustomerOut.model_validate(customer),
            interactions=[InteractionOut.model_validate(i) for i in interactions],
            opportunities=[OpportunityOut.model_validate(o) for o in opps]
        )
