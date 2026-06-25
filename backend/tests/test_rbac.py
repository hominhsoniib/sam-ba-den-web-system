import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import Permission, User, Role

pytestmark = pytest.mark.asyncio

async def _login(client, email, password):
    r = await client.post(
        "/api/v1/auth/login", json={"email": email, "password": password}
    )
    return r.json()["data"]

async def test_rbac_flow(client: AsyncClient, db_session: AsyncSession):
    tokens = await _login(client, "admin@sambaden.vn", "Admin@123456")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    # 1. Check list permissions
    r = await client.get("/api/v1/admin/permissions", headers=headers)
    assert r.status_code == 200
    perms = r.json()["data"]
    assert len(perms) > 0
    
    # Grab the first permission ID to assign to a role
    perm_id = perms[0]["id"]
    
    # 2. Create a Role
    role_payload = {
        "name": "Test Role",
        "description": "Role cho test",
        "permission_ids": [perm_id]
    }
    r = await client.post("/api/v1/admin/roles", json=role_payload, headers=headers)
    assert r.status_code == 200
    created_role = r.json()["data"]
    assert created_role["name"] == "Test Role"
    assert len(created_role["permissions"]) == 1
    assert created_role["permissions"][0]["id"] == perm_id
    role_id = created_role["id"]
    
    # 3. Update the Role (change description)
    update_payload = {
        "name": "Test Role Updated",
        "description": "Updated",
        "permission_ids": [] # Remove all perms
    }
    r = await client.put(f"/api/v1/admin/roles/{role_id}", json=update_payload, headers=headers)
    assert r.status_code == 200
    updated_role = r.json()["data"]
    assert updated_role["name"] == "Test Role Updated"
    assert len(updated_role["permissions"]) == 0
    
    import uuid
    # 4. Get a user
    r = await client.get("/api/v1/admin/users", headers=headers)
    users = r.json()["data"]
    target_user_id = users[0]["id"]
    
    # 5. Assign Role to User
    r = await client.put(f"/api/v1/admin/users/{target_user_id}/roles", json={"role_ids": [role_id]}, headers=headers)
    assert r.status_code == 200
    
    # Verify in DB
    user_db = await db_session.execute(select(User).where(User.id == uuid.UUID(target_user_id)))
    user = user_db.scalar_one()
    
    # 6. Delete Role
    r = await client.delete(f"/api/v1/admin/roles/{role_id}", headers=headers)
    assert r.status_code == 200
    
    # Verify Role is deleted
    r = await client.get("/api/v1/admin/roles", headers=headers)
    roles = r.json()["data"]
    assert not any(role["id"] == role_id for role in roles)
