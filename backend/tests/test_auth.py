"""Test luồng đăng nhập, /me, và RBAC trên tạo user."""
import pytest


async def _login(client, email, password):
    r = await client.post(
        "/api/v1/auth/login", json={"email": email, "password": password}
    )
    return r


@pytest.mark.asyncio
async def test_health(client):
    r = await client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_login_success(client):
    r = await _login(client, "admin@sambaden.vn", "Admin@123456")
    assert r.status_code == 200
    body = r.json()
    assert body["data"]["access_token"]
    assert body["data"]["refresh_token"]
    assert body["error"] is None


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    r = await _login(client, "admin@sambaden.vn", "sai_mat_khau")
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "invalid_credentials"


@pytest.mark.asyncio
async def test_me_returns_permissions(client):
    tokens = (await _login(client, "admin@sambaden.vn", "Admin@123456")).json()["data"]
    r = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    assert r.status_code == 200
    perms = r.json()["data"]["permissions"]
    assert "user.write" in perms


@pytest.mark.asyncio
async def test_rbac_super_admin_can_create_user(client):
    tokens = (await _login(client, "admin@sambaden.vn", "Admin@123456")).json()["data"]
    r = await client.post(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
        json={
            "email": "newsale@sambaden.vn",
            "password": "Sale@12345",
            "full_name": "Nhân viên Sales",
            "role_names": ["editor"],
        },
    )
    assert r.status_code == 200
    assert r.json()["data"]["email"] == "newsale@sambaden.vn"


@pytest.mark.asyncio
async def test_rbac_editor_forbidden_to_create_user(client):
    tokens = (await _login(client, "editor@sambaden.vn", "Editor@123")).json()["data"]
    r = await client.post(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
        json={
            "email": "x@sambaden.vn",
            "password": "Xxxx@12345",
            "full_name": "X",
            "role_names": [],
        },
    )
    assert r.status_code == 403
    assert r.json()["error"]["code"] == "forbidden"


@pytest.mark.asyncio
async def test_me_requires_auth(client):
    r = await client.get("/api/v1/auth/me")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token(client):
    tokens = (await _login(client, "admin@sambaden.vn", "Admin@123456")).json()["data"]
    r = await client.post(
        "/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]}
    )
    assert r.status_code == 200
    assert r.json()["data"]["access_token"]
