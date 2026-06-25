"""Fixtures test: SQLite in-memory, seed permissions/roles, client."""
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.database import Base, get_db
from app.core.security import hash_password
from app.main import app
from app.models.user import Permission, Role, User


@pytest_asyncio.fixture
async def db_session():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    Session = async_sessionmaker(engine, expire_on_commit=False)
    async with Session() as session:
        # seed: permissions + roles + users
        perm_w = Permission(code="user.write", description="Tạo user")
        perm_r = Permission(code="user.read", description="Xem user")
        post_read = Permission(code="post.read", description="Xem bài")
        post_write = Permission(code="post.write", description="Sửa bài")
        post_publish = Permission(code="post.publish", description="Xuất bản")
        prod_read = Permission(code="product.read", description="Xem SP")
        prod_write = Permission(code="product.write", description="Sửa SP")
        cust_read = Permission(code="customer.read", description="Xem khách hàng")
        cust_write = Permission(code="customer.write", description="Sửa khách hàng")
        dlr_read = Permission(code="dealer.read", description="Xem đại lý")
        dlr_write = Permission(code="dealer.write", description="Sửa đại lý")
        qr_read = Permission(code="qrcode.read", description="Xem mã QR")
        qr_write = Permission(code="qrcode.write", description="Sửa mã QR")
        role = Role(
            name="super_admin",
            permissions=[
                perm_w,
                perm_r,
                post_read,
                post_write,
                post_publish,
                prod_read,
                prod_write,
                cust_read,
                cust_write,
                dlr_read,
                dlr_write,
                qr_read,
                qr_write,
            ],
        )
        admin = User(
            email="admin@sambaden.vn",
            password_hash=hash_password("Admin@123456"),
            full_name="Super Admin",
            roles=[role],
        )
        # editor: có post.read + post.write nhưng KHÔNG có post.publish
        editor_role = Role(
            name="editor", permissions=[perm_r, post_read, post_write]
        )
        editor = User(
            email="editor@sambaden.vn",
            password_hash=hash_password("Editor@123"),
            full_name="Editor",
            roles=[editor_role],
        )
        session.add_all([admin, editor])
        await session.commit()
        yield session
    await engine.dispose()


@pytest_asyncio.fixture
async def client(db_session):
    async def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()
