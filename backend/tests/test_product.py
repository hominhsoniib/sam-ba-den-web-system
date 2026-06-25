"""Test M6 Sản phẩm: CRUD, public detail + JSON-LD Product, sitemap."""
import pytest


async def _auth(client):
    r = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@sambaden.vn", "password": "Admin@123456"},
    )
    return {"Authorization": f"Bearer {r.json()['data']['access_token']}"}


@pytest.mark.asyncio
async def test_product_full_flow(client):
    h = await _auth(client)

    # 1. Danh mục
    rc = await client.post(
        "/api/v1/admin/products/categories",
        headers=h,
        json={"name": "Sâm tươi"},
    )
    assert rc.status_code == 200
    cat = rc.json()["data"]
    assert cat["slug"] == "sam-tuoi"

    # 2. Tạo sản phẩm với giá + ảnh
    rp = await client.post(
        "/api/v1/admin/products",
        headers=h,
        json={
            "name": "Sâm Bà Đen tươi loại 1",
            "category_id": cat["id"],
            "sku": "SBD-T1",
            "short_desc": "Củ sâm tươi chọn lọc",
            "description": "<p>Mô tả chi tiết sản phẩm.</p>",
            "reference_price": 1250000,
            "unit": "kg",
            "disclaimer": "Sản phẩm này không phải là thuốc.",
            "images": [
                {"image_url": "https://cdn/sam1.jpg", "is_primary": True},
                {"image_url": "https://cdn/sam2.jpg"},
            ],
        },
    )
    assert rp.status_code == 200
    prod = rp.json()["data"]
    assert prod["slug"] == "sam-ba-den-tuoi-loai-1"
    assert prod["primary_image"] == "https://cdn/sam1.jpg"
    assert len(prod["images"]) == 2
    pid = prod["id"]

    # 3. Public list thấy sản phẩm active
    rl = await client.get("/api/v1/public/products")
    assert rl.status_code == 200
    assert any(x["slug"] == prod["slug"] for x in rl.json()["data"])

    # 4. Public detail có SEO + JSON-LD Product với offers
    rd = await client.get(f"/api/v1/public/products/{prod['slug']}")
    assert rd.status_code == 200
    d = rd.json()["data"]
    assert d["seo"]["canonical_url"].endswith(f"/san-pham/{prod['slug']}")
    assert d["disclaimer"]
    ld = d["json_ld"][0]
    assert ld["@type"] == "Product"
    assert ld["offers"]["price"] == "1250000.00"
    assert ld["offers"]["priceCurrency"] == "VND"

    # 5. Cập nhật giá
    ru = await client.put(
        f"/api/v1/admin/products/{pid}",
        headers=h,
        json={"reference_price": 1390000},
    )
    assert ru.status_code == 200
    assert float(ru.json()["data"]["reference_price"]) == 1390000.0

    # 6. Ẩn sản phẩm -> public không thấy
    await client.put(
        f"/api/v1/admin/products/{pid}", headers=h, json={"status": "hidden"}
    )
    rd2 = await client.get(f"/api/v1/public/products/{prod['slug']}")
    assert rd2.status_code == 404

    # 7. Sitemap (kích hoạt active lại trước)
    await client.put(
        f"/api/v1/admin/products/{pid}", headers=h, json={"status": "active"}
    )
    rsm = await client.get("/sitemap.xml")
    assert "/san-pham/" in rsm.text
    assert prod["slug"] in rsm.text


@pytest.mark.asyncio
async def test_product_requires_permission(client):
    # editor không có product.write
    r = await client.post(
        "/api/v1/auth/login",
        json={"email": "editor@sambaden.vn", "password": "Editor@123"},
    )
    h = {"Authorization": f"Bearer {r.json()['data']['access_token']}"}
    rc = await client.post(
        "/api/v1/admin/products/categories", headers=h, json={"name": "X"}
    )
    assert rc.status_code == 403
