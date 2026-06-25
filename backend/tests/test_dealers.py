"""Test các luồng nghiệp vụ Quản lý Đại lý (Duyệt, chiết khấu, sổ cái công nợ)."""
import pytest
from datetime import datetime, timezone, timedelta
import uuid

from app.models.contact import ContactSubmission
from app.models.product import ProductCategory, Product

async def _login(client, email, password):
    r = await client.post(
        "/api/v1/auth/login", json={"email": email, "password": password}
    )
    return r.json()["data"]

@pytest.mark.asyncio
async def test_dealer_lifecycle(client, db_session):
    tokens = await _login(client, "admin@sambaden.vn", "Admin@123456")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    # 0. Prep: Create a product and a category in DB
    cat = ProductCategory(id=uuid.uuid4(), name="Test Cat", slug="test-cat")
    db_session.add(cat)
    await db_session.flush()
    
    prod = Product(
        id=uuid.uuid4(),
        name="Test Product",
        slug="test-product",
        category_id=cat.id,
        reference_price=100000.0,
        status="active"
    )
    db_session.add(prod)
    await db_session.flush()

    # 1. Create a Dealer Registration Submission (from ContactSubmission)
    reg = ContactSubmission(
        id=uuid.uuid4(),
        full_name="Đại lý Nguyễn Văn A",
        phone="0911555666",
        email="dlnguyenvana@gmail.com",
        source="dealer",
        area="Hồ Chí Minh",
        status="new"
    )
    db_session.add(reg)
    await db_session.commit()

    # 2. Approve Registration
    r = await client.post(
        f"/api/v1/admin/dealers/{reg.id}/approve",
        headers=headers,
        json={
            "code": "DL_NVA_01",
            "tier": "tier_1",
            "region": "Miền Nam",
            "credit_limit": 50000000.0,
            "payment_term_days": 30
        }
    )
    assert r.status_code == 200
    dealer = r.json()["data"]
    assert dealer["id"]
    assert dealer["code"] == "DL_NVA_01"
    assert dealer["status"] == "active"
    assert dealer["user_id"] is not None # Portal user was created

    # 3. List Dealers
    r = await client.get("/api/v1/admin/dealers", headers=headers)
    assert r.status_code == 200
    assert len(r.json()["data"]) >= 1

    # 4. Create a Discount Rule
    r = await client.post(
        f"/api/v1/admin/dealers/{dealer['id']}/discounts",
        headers=headers,
        json={
            "product_id": str(prod.id),
            "discount_percent": 15.5,
            "start_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat(),
            "end_at": (datetime.now(timezone.utc) + timedelta(days=5)).isoformat(),
            "is_active": True
        }
    )
    assert r.status_code == 200
    discount = r.json()["data"]
    assert discount["id"]
    assert discount["discount_percent"] == 15.5

    # 5. Record a debit entry (e.g. from an order) via direct ledger service/repo or endpoint
    # Wait, the endpoint POST /admin/dealers/{id}/ledger/payment enforces type="credit" (payment).
    # But for testing, we can write a debit entry using the service directly or checking if we can write a custom debit.
    # In the router, POST /admin/dealers/{id}/ledger/payment writes credit.
    # Let's test paying money first.
    r = await client.post(
        f"/api/v1/admin/dealers/{dealer['id']}/ledger/payment",
        headers=headers,
        json={
            "amount": 10000000.0,
            "ref_type": "payment",
            "note": "Đại lý chuyển khoản thanh toán đợt 1"
        }
    )
    assert r.status_code == 200
    ledger_entry = r.json()["data"]
    assert ledger_entry["id"]
    assert ledger_entry["entry_type"] == "credit"
    assert ledger_entry["amount"] == 10000000.0

    # 6. Retrieve ledger entries
    r = await client.get(f"/api/v1/admin/dealers/{dealer['id']}/ledger/entries", headers=headers)
    assert r.status_code == 200
    entries = r.json()["data"]
    assert len(entries) == 1
    assert entries[0]["id"] == ledger_entry["id"]

    # 7. Get debt summary
    r = await client.get(f"/api/v1/admin/dealers/{dealer['id']}/ledger", headers=headers)
    assert r.status_code == 200
    summary = r.json()["data"]
    assert summary["total_credit"] == 10000000.0
    assert summary["total_debit"] == 0.0
    assert summary["balance"] == -10000000.0 # credit without debit gives negative balance
    assert summary["credit_limit"] == 50000000.0
