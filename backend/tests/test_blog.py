"""Test M3 Blog SEO: slugify, CRUD, workflow trạng thái, public detail + SEO."""
import pytest

from app.utils.slugify import slugify


# ---------- Unit: slugify ----------
def test_slugify_vietnamese():
    assert slugify("Sâm Bà Đen — Báu vật!") == "sam-ba-den-bau-vat"
    assert slugify("Kỹ thuật trồng sâm") == "ky-thuat-trong-sam"
    assert slugify("  Hello   World  ") == "hello-world"


async def _login(client, email, password):
    r = await client.post(
        "/api/v1/auth/login", json={"email": email, "password": password}
    )
    return r.json()["data"]["access_token"]


async def _auth(client, email="admin@sambaden.vn", password="Admin@123456"):
    tok = await _login(client, email, password)
    return {"Authorization": f"Bearer {tok}"}


@pytest.mark.asyncio
async def test_full_blog_flow(client):
    h = await _auth(client)

    # 1. Tạo danh mục
    rc = await client.post(
        "/api/v1/admin/blog/categories",
        headers=h,
        json={"name": "Kiến thức Sâm Bà Đen"},
    )
    assert rc.status_code == 200
    cat = rc.json()["data"]
    assert cat["slug"] == "kien-thuc-sam-ba-den"

    # 2. Tạo bài viết (mặc định draft)
    rp = await client.post(
        "/api/v1/admin/blog/posts",
        headers=h,
        json={
            "title": "Sâm Bà Đen — Báu vật Núi Thiêng",
            "content": "<p>Nội dung bài viết về sâm.</p>",
            "excerpt": "Giới thiệu sâm Bà Đen",
            "category_id": cat["id"],
            "tag_names": ["sâm", "Tây Ninh"],
            "seo_description": "Tìm hiểu về sâm Bà Đen",
            "disclaimer": "Sản phẩm này không phải là thuốc.",
        },
    )
    assert rp.status_code == 200
    post = rp.json()["data"]
    assert post["status"] == "draft"
    assert post["slug"] == "sam-ba-den-bau-vat-nui-thieng"
    assert len(post["tags"]) == 2
    post_id = post["id"]

    # 3. Public CHƯA thấy bài draft
    r404 = await client.get(f"/api/v1/public/posts/{post['slug']}")
    assert r404.status_code == 404

    # 4. Workflow: submit -> review
    rs = await client.patch(
        f"/api/v1/admin/blog/posts/{post_id}/status",
        headers=h,
        json={"action": "submit"},
    )
    assert rs.json()["data"]["status"] == "review"

    # 5. approve -> published (admin có post.publish)
    ra = await client.patch(
        f"/api/v1/admin/blog/posts/{post_id}/status",
        headers=h,
        json={"action": "approve"},
    )
    assert ra.json()["data"]["status"] == "published"
    assert ra.json()["data"]["published_at"] is not None

    # 6. Public THẤY bài + có SEO + JSON-LD
    rpub = await client.get(f"/api/v1/public/posts/{post['slug']}")
    assert rpub.status_code == 200
    d = rpub.json()["data"]
    assert d["seo"]["title"] == "Sâm Bà Đen — Báu vật Núi Thiêng"
    assert d["seo"]["canonical_url"].endswith(f"/blog/{post['slug']}")
    assert d["disclaimer"]  # tuân thủ TPCN
    # JSON-LD có Article + BreadcrumbList
    types = {x["@type"] for x in d["json_ld"]}
    assert "Article" in types and "BreadcrumbList" in types

    # 7. Sitemap chứa slug
    rsm = await client.get("/sitemap.xml")
    assert rsm.status_code == 200
    assert post["slug"] in rsm.text

    # 8. robots.txt
    rr = await client.get("/robots.txt")
    assert "Sitemap:" in rr.text


@pytest.mark.asyncio
async def test_invalid_transition_rejected(client):
    h = await _auth(client)
    cat = (
        await client.post(
            "/api/v1/admin/blog/categories", headers=h, json={"name": "Tin tức"}
        )
    ).json()["data"]
    post = (
        await client.post(
            "/api/v1/admin/blog/posts",
            headers=h,
            json={
                "title": "Bài test",
                "content": "<p>x</p>",
                "category_id": cat["id"],
            },
        )
    ).json()["data"]
    # archive khi đang draft -> không hợp lệ
    r = await client.patch(
        f"/api/v1/admin/blog/posts/{post['id']}/status",
        headers=h,
        json={"action": "archive"},
    )
    assert r.status_code == 409
    assert r.json()["error"]["code"] == "invalid_transition"


@pytest.mark.asyncio
async def test_editor_cannot_publish(client):
    # editor có post.write nhưng KHÔNG có post.publish
    hadmin = await _auth(client)
    cat = (
        await client.post(
            "/api/v1/admin/blog/categories", headers=hadmin, json={"name": "KT"}
        )
    ).json()["data"]
    heditor = await _auth(client, "editor@sambaden.vn", "Editor@123")
    post = (
        await client.post(
            "/api/v1/admin/blog/posts",
            headers=heditor,
            json={"title": "Bài của editor", "content": "<p>x</p>", "category_id": cat["id"]},
        )
    ).json()["data"]
    # submit được (post.write)
    await client.patch(
        f"/api/v1/admin/blog/posts/{post['id']}/status",
        headers=heditor,
        json={"action": "submit"},
    )
    # nhưng approve thì bị chặn (thiếu post.publish)
    r = await client.patch(
        f"/api/v1/admin/blog/posts/{post['id']}/status",
        headers=heditor,
        json={"action": "approve"},
    )
    assert r.status_code == 403
