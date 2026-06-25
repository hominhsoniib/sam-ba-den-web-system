"""Test các luồng nghiệp vụ CRM (Khách hàng, Lead, Cơ hội, Tương tác)."""
import pytest

async def _login(client, email, password):
    r = await client.post(
        "/api/v1/auth/login", json={"email": email, "password": password}
    )
    return r.json()["data"]

@pytest.mark.asyncio
async def test_crm_leads_lifecycle(client):
    tokens = await _login(client, "admin@sambaden.vn", "Admin@123456")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    # 1. Create a Lead
    r = await client.post(
        "/api/v1/admin/crm/leads",
        headers=headers,
        json={
            "full_name": "Nguyen Khach Hang",
            "phone": "0988111222",
            "email": "khachhang@example.com",
            "source": "contact_form",
            "status": "new"
        }
    )
    assert r.status_code == 200
    lead = r.json()["data"]
    assert lead["id"]
    assert lead["full_name"] == "Nguyen Khach Hang"

    # 2. List Leads
    r = await client.get("/api/v1/admin/crm/leads", headers=headers)
    assert r.status_code == 200
    assert len(r.json()["data"]) >= 1

    # 3. Create Interaction on Lead
    r = await client.post(
        "/api/v1/admin/crm/interactions",
        headers=headers,
        json={
            "entity_type": "lead",
            "entity_id": lead["id"],
            "type": "call",
            "content": "Goi dien tu van san pham sam tuoi, khach quan tam.",
            "channel": "0988111222"
        }
    )
    assert r.status_code == 200
    interaction = r.json()["data"]
    assert interaction["id"]

    # 4. Convert Lead to Customer
    r = await client.post(
        f"/api/v1/admin/crm/leads/{lead['id']}/convert",
        headers=headers
    )
    assert r.status_code == 200
    res = r.json()["data"]
    assert res["customer_id"]
    assert res["opportunity_id"]

    # 5. List Customers
    r = await client.get("/api/v1/admin/crm/customers", headers=headers)
    assert r.status_code == 200
    customers = r.json()["data"]
    assert any(c["id"] == res["customer_id"] for c in customers)

    # 6. Retrieve Customer Journey (Timeline)
    r = await client.get(
        f"/api/v1/admin/crm/customers/{res['customer_id']}/journey",
        headers=headers
    )
    assert r.status_code == 200
    journey = r.json()["data"]
    assert journey["customer"]["id"] == res["customer_id"]
    assert len(journey["opportunities"]) >= 1
    # Note: Interaction with entity_type='customer' (system generated) should be present
    assert len(journey["interactions"]) >= 1
