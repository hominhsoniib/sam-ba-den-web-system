import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.dealer import Dealer
from app.models.product import Product

pytestmark = pytest.mark.asyncio

async def _login(client, email, password):
    r = await client.post(
        "/api/v1/auth/login", json={"email": email, "password": password}
    )
    return r.json()["data"]

async def test_dealer_portal_flow(client: AsyncClient, db_session: AsyncSession):
    # 1. Login as a dealer (Use the email set up in conftest if any, or create one).
    # Wait, we don't know the password. Let's just create a mock user and dealer!
    from app.core.security import hash_password
    from app.models.user import User
    import uuid
    
    uid = uuid.uuid4()
    test_user = User(
        id=uid, email=f"dealer_test_{uid}@sambaden.vn", password_hash=hash_password("Dealer@123456"),
        full_name="Dealer Test User"
    )
    db_session.add(test_user)
    
    test_dealer = Dealer(
        id=uuid.uuid4(),
        code=f"D-TEST-{uid}",
        name="Test Dealer Company",
        tier="tier_1",
        region="Test Region",
        credit_limit=50000000,
        payment_term_days=30,
        user_id=uid,
        status="active"
    )
    db_session.add(test_dealer)
    
    # Seed Product Category, Product, ProductPrice, and ProductInventory for testing
    from app.models.product import ProductCategory, ProductPrice, ProductInventory
    test_category = ProductCategory(
        id=uuid.uuid4(),
        name="Category Test",
        slug=f"cat-test-{uid}"
    )
    db_session.add(test_category)
    
    test_product = Product(
        id=uuid.uuid4(),
        name="Product Test B2B",
        slug=f"product-test-{uid}",
        sku=f"SKU-TEST-{uid}",
        category_id=test_category.id,
        reference_price=150000.0,
        unit="chai",
        status="active"
    )
    db_session.add(test_product)
    
    test_price = ProductPrice(
        id=uuid.uuid4(),
        product_id=test_product.id,
        channel="tier_1",
        price=120000.0,
        is_active=True
    )
    db_session.add(test_price)
    
    test_inventory = ProductInventory(
        id=uuid.uuid4(),
        product_id=test_product.id,
        warehouse="main",
        qty_on_hand=1000,
        qty_reserved=0
    )
    db_session.add(test_inventory)
    
    await db_session.commit()
    
    dealer_tokens = await _login(client, test_user.email, "Dealer@123456")
    dealer_h = {"Authorization": f"Bearer {dealer_tokens['access_token']}"}
    
    # 2. Get Profile
    r = await client.get("/api/v1/portal/me", headers=dealer_h)
    assert r.status_code == 200
    profile = r.json()["data"]
    assert profile["code"] == test_dealer.code
    assert profile["tier"] == "tier_1"
    
    # 3. List Products
    r = await client.get("/api/v1/portal/products", headers=dealer_h)
    assert r.status_code == 200
    products = r.json()["data"]
    assert len(products) > 0
    
    target_product = products[0]
    
    # 4. Create Order
    order_payload = {
        "items": [
            {"product_id": target_product["id"], "quantity": 10}
        ],
        "shipping_address": "123 Dealer St",
        "note": "Urgent order"
    }
    r = await client.post("/api/v1/portal/orders", json=order_payload, headers=dealer_h)
    assert r.status_code == 200
    order = r.json()["data"]
    assert order["status"] == "confirmed" # Portal orders should auto-confirm
    assert order["dealer_id"] == str(test_dealer.id)
    assert len(order["items"]) == 1
    
    # 5. List Orders
    r = await client.get("/api/v1/portal/orders", headers=dealer_h)
    assert r.status_code == 200
    orders = r.json()["data"]
    assert len(orders) >= 1
    assert orders[0]["id"] == order["id"]
    
    # 6. List Ledger
    r = await client.get("/api/v1/portal/ledger", headers=dealer_h)
    assert r.status_code == 200
    ledgers = r.json()["data"]
    assert len(ledgers) >= 1 # Auto-confirmed order should create a debit ledger entry
    assert ledgers[0]["entry_type"] == "debit"
    
    # 7. Test VNPay Payment URL generation
    pay_payload = {"amount": 2500000.0}
    r = await client.post("/api/v1/portal/payments/vnpay_url", json=pay_payload, headers=dealer_h)
    assert r.status_code == 200
    pay_data = r.json()["data"]
    payment_url = pay_data["payment_url"]
    assert "vnp_TmnCode=SBD2026" in payment_url
    assert "vnp_TxnRef=" in payment_url
    
    # Parse URL to simulate VNPay callback
    import urllib.parse
    parsed_url = urllib.parse.urlparse(payment_url)
    query_params = urllib.parse.parse_qs(parsed_url.query)
    
    # Construct return query params
    # Simulate a successful payment on VNPay (vnp_ResponseCode = "00")
    # For verification to succeed in the test, we need to sign the response params
    from app.services.vnpay_service import VNPayService
    from app.core.config import settings
    import hmac
    import hashlib
    
    callback_params = {
        "vnp_TmnCode": query_params["vnp_TmnCode"][0],
        "vnp_Amount": query_params["vnp_Amount"][0],
        "vnp_Command": query_params["vnp_Command"][0],
        "vnp_CreateDate": query_params["vnp_CreateDate"][0],
        "vnp_CurrCode": query_params["vnp_CurrCode"][0],
        "vnp_IpAddr": query_params["vnp_IpAddr"][0],
        "vnp_Locale": query_params["vnp_Locale"][0],
        "vnp_OrderInfo": query_params["vnp_OrderInfo"][0],
        "vnp_OrderType": query_params["vnp_OrderType"][0],
        "vnp_ReturnUrl": query_params["vnp_ReturnUrl"][0],
        "vnp_TxnRef": query_params["vnp_TxnRef"][0],
        "vnp_Version": query_params["vnp_Version"][0],
        "vnp_ResponseCode": "00",
        "vnp_TransactionNo": "12345678"
    }
    
    # Re-calculate hash with the extra ResponseCode and TransactionNo
    sorted_params = sorted(callback_params.items())
    query_parts = [f"{urllib.parse.quote(str(k), safe='')}={urllib.parse.quote(str(v), safe='')}" for k, v in sorted_params]
    sign_data = "&".join(query_parts)
    
    secure_hash = hmac.new(
        settings.vnpay_hash_secret.encode("utf-8"),
        sign_data.encode("utf-8"),
        hashlib.sha512
    ).hexdigest()
    
    callback_params["vnp_SecureHash"] = secure_hash
    
    # Call callback endpoint
    r = await client.get("/api/v1/portal/payments/vnpay_return", params=callback_params, headers=dealer_h)
    assert r.status_code == 200
    verify_data = r.json()["data"]
    assert verify_data["status"] == "success"
    assert verify_data["amount"] == 2500000.0
    
    # 8. Check ledger again - should have a credit entry
    r = await client.get("/api/v1/portal/ledger", headers=dealer_h)
    assert r.status_code == 200
    new_ledgers = r.json()["data"]
    assert len(new_ledgers) == len(ledgers) + 1
    # Find the credit payment entry
    credit_entry = next((l for l in new_ledgers if l["entry_type"] == "credit"), None)
    assert credit_entry is not None
    assert credit_entry["amount"] == 2500000.0
    assert "VNPay" in credit_entry["note"]

