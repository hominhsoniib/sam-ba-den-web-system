"""Test M8 QR Code & Traceability: Batch creation, QR verification flow, revocation."""
import pytest


async def _auth(client):
    r = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@sambaden.vn", "password": "Admin@123456"},
    )
    return {"Authorization": f"Bearer {r.json()['data']['access_token']}"}


@pytest.mark.asyncio
async def test_qrcode_traceability_flow(client):
    h = await _auth(client)

    # 1. Đầu tiên cần có một sản phẩm để tạo lô hàng
    # Lấy danh mục hiện tại hoặc tạo mới
    rc = await client.post(
        "/api/v1/admin/products/categories",
        headers=h,
        json={"name": "Sâm Chế Biến"},
    )
    cat_id = rc.json()["data"]["id"]

    rp = await client.post(
        "/api/v1/admin/products",
        headers=h,
        json={
            "name": "Trà Sâm Túi Lọc",
            "category_id": cat_id,
            "sku": "TRA-SBD-TL",
            "reference_price": 250000,
            "unit": "hộp"
        },
    )
    product_id = rp.json()["data"]["id"]

    # 2. Tạo một Lô hàng (ProductBatch) gồm 5 sản phẩm/tem QR
    rb = await client.post(
        "/api/v1/admin/qrcode/batches",
        headers=h,
        json={
            "product_id": product_id,
            "batch_no": "TEST-BAT-001",
            "quantity": 5,
            "manufacture_date": "2026-06-01",
            "expiry_date": "2028-06-01",
            "supplier_name": "Nông trại Tây Ninh",
            "origin_region": "Tây Ninh",
            "notes": "Hấp chín, sấy chân không và đóng gói khép kín."
        }
    )
    assert rb.status_code == 200
    batch = rb.json()["data"]
    assert batch["batch_no"] == "TEST-BAT-001"
    assert batch["qr_count"] == 5
    batch_id = batch["id"]

    # 3. Xem danh sách mã QR của lô hàng vừa tạo
    rq = await client.get(
        f"/api/v1/admin/qrcode/batches/{batch_id}/qrcodes",
        headers=h
    )
    assert rq.status_code == 200
    qrs = rq.json()["data"]
    assert len(qrs) == 5
    assert qrs[0]["label"] == "Hộp #001"
    
    first_qr = qrs[0]
    token = first_qr["token"]
    qr_id = first_qr["id"]

    # 4. Quét/Xác thực mã QR lần 1 qua API công khai (Public)
    rv1 = await client.get(
        f"/api/v1/public/qrcode/verify/{token}"
    )
    assert rv1.status_code == 200
    verify_res1 = rv1.json()["data"]
    assert verify_res1["authentic"] is True
    assert verify_res1["scan_count"] == 1
    assert "lần đầu tiên" in verify_res1["message"]
    assert verify_res1["batch"]["batch_no"] == "TEST-BAT-001"
    assert verify_res1["batch"]["product_name"] == "Trà Sâm Túi Lọc"

    # 5. Quét/Xác thực lần 2 qua API công khai -> Phải báo cảnh báo quét nhiều lần
    rv2 = await client.get(
        f"/api/v1/public/qrcode/verify/{token}"
    )
    assert rv2.status_code == 200
    verify_res2 = rv2.json()["data"]
    assert verify_res2["authentic"] is True
    assert verify_res2["scan_count"] == 2
    assert verify_res2["warning"] is not None
    assert "đã được quét 1 lần" in verify_res2["warning"]

    # 6. Thu hồi 1 mã QR đơn vị (Hộp #001)
    rr1 = await client.post(
        f"/api/v1/admin/qrcode/qrcodes/{qr_id}/revoke",
        headers=h
    )
    assert rr1.status_code == 200
    assert rr1.json()["data"]["status"] == "revoked"

    # 7. Quét/Xác thực lại mã QR vừa thu hồi -> Phải báo không chính hãng / thu hồi
    rv3 = await client.get(
        f"/api/v1/public/qrcode/verify/{token}"
    )
    assert rv3.status_code == 200
    verify_res3 = rv3.json()["data"]
    assert verify_res3["authentic"] is False
    assert verify_res3["status"] == "revoked"
    assert "bị HỦY/THU HỒI" in verify_res3["message"]

    # 8. Quét mã QR không tồn tại
    rv_fake = await client.get(
        "/api/v1/public/qrcode/verify/some-fake-token-uuid-123"
    )
    assert rv_fake.status_code == 200
    assert rv_fake.json()["data"]["authentic"] is False
    assert rv_fake.json()["data"]["status"] == "not_found"
