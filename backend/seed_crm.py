import asyncio
import uuid
from sqlalchemy import select, delete
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.customer import Customer
from app.models.lead import Lead
from app.models.opportunity import Opportunity
from app.models.interaction import Interaction

async def main():
    async with AsyncSessionLocal() as db:
        # Get Super Admin
        admin = (await db.execute(select(User).where(User.email == "admin@sambaden.vn"))).scalar_one_or_none()
        if not admin:
            print("Please run app.seed first!")
            return
        
        # Clean existing CRM data
        await db.execute(delete(Interaction))
        await db.execute(delete(Opportunity))
        await db.execute(delete(Lead))
        await db.execute(delete(Customer))
        await db.flush()
        
        # Create Customers
        c1 = Customer(
            id=uuid.uuid4(),
            full_name="Nguyễn Văn A",
            phone="0911222333",
            email="nguyenvana@gmail.com",
            address="123 Đường Ba Tơ, P.7, Q.8, TP.HCM",
            source="web",
            owner_id=admin.id,
            tags="VIP, Quan tâm sâm củ",
            note="Khách quen mua sâm tươi, thích củ to nhiều rễ"
        )
        c2 = Customer(
            id=uuid.uuid4(),
            full_name="Trần Thị B",
            phone="0988777666",
            email="tranthib@yahoo.com",
            address="456 CMT8, Phường 4, Tây Ninh",
            source="contact_form",
            owner_id=admin.id,
            tags="Đại lý tiềm năng",
            note="Muốn làm đại lý cấp 2 ở Tây Ninh"
        )
        db.add_all([c1, c2])
        await db.flush()
        
        # Create Leads
        l1 = Lead(
            id=uuid.uuid4(),
            full_name="Phạm Minh Hoàng",
            phone="0909123456",
            email="pmhoang@gmail.com",
            source="contact_form",
            status="new",
            owner_id=admin.id
        )
        l2 = Lead(
            id=uuid.uuid4(),
            full_name="Lê Hoàng Nam",
            phone="0977111222",
            email="lhnam@gmail.com",
            source="dealer_register",
            status="contacted",
            owner_id=admin.id
        )
        l3 = Lead(
            id=uuid.uuid4(),
            full_name="Trần Văn Cường",
            phone="0933444555",
            email="tvcuong@gmail.com",
            source="manual",
            status="qualified",
            owner_id=admin.id
        )
        db.add_all([l1, l2, l3])
        await db.flush()
        
        # Create Opportunities for Customers
        o1 = Opportunity(
            id=uuid.uuid4(),
            customer_id=c1.id,
            title="Đơn sâm tươi ngâm rượu tết",
            stage="qualified",
            est_value=1200000.0,
            owner_id=admin.id
        )
        o2 = Opportunity(
            id=uuid.uuid4(),
            customer_id=c2.id,
            title="Hợp đồng đại lý sâm Bố Chính Tây Ninh",
            stage="proposal",
            est_value=15000000.0,
            owner_id=admin.id
        )
        db.add_all([o1, o2])
        await db.flush()
        
        # Create Interactions
        i1 = Interaction(
            id=uuid.uuid4(),
            entity_type="customer",
            entity_id=c1.id,
            type="call",
            content="Gọi điện tư vấn sâm củ loại 1, khách thích củ trên 1 năm tuổi.",
            channel="0911222333",
            created_by=admin.id
        )
        i2 = Interaction(
            id=uuid.uuid4(),
            entity_type="customer",
            entity_id=c1.id,
            type="note",
            content="Khách hẹn tuần sau đặt cọc 500k trước để chọn củ đẹp.",
            created_by=admin.id
        )
        i3 = Interaction(
            id=uuid.uuid4(),
            entity_type="customer",
            entity_id=c2.id,
            type="sms",
            content="Gửi tin nhắn bảng chiết khấu đại lý cấp 2 qua Zalo.",
            channel="0988777666",
            created_by=admin.id
        )
        i4 = Interaction(
            id=uuid.uuid4(),
            entity_type="lead",
            entity_id=l2.id,
            type="call",
            content="Gọi giới thiệu sâm Bà Đen, khách nói đang bận, hẹn gọi lại sau.",
            channel="0977111222",
            created_by=admin.id
        )
        db.add_all([i1, i2, i3, i4])
        await db.flush()
        
        await db.commit()
        print("Success: CRM mock data seeded successfully!")

if __name__ == '__main__':
    asyncio.run(main())
