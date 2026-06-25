"""Seed dữ liệu nền: permissions, roles, tài khoản Super Admin.

Chạy: python -m app.seed
"""
import asyncio

from sqlalchemy import select

from app.core.database import AsyncSessionLocal, Base, engine
from app.core.security import hash_password
from app.models.blog import BlogCategory
from app.models.user import Permission, Role, User

# Danh mục permission nền (mở rộng dần theo module)
PERMISSIONS = [
    ("user.read", "Xem người dùng"),
    ("user.write", "Tạo/sửa người dùng"),
    ("post.read", "Xem bài viết"),
    ("post.write", "Tạo/sửa bài viết"),
    ("post.publish", "Xuất bản bài viết"),
    ("media.upload", "Tải media"),
    ("customer.read", "Xem khách hàng"),
    ("customer.write", "Tạo/sửa khách hàng"),
    ("product.read", "Xem sản phẩm"),
    ("product.write", "Tạo/sửa sản phẩm"),
    ("order.read", "Xem đơn hàng"),
    ("order.write", "Tạo/sửa đơn hàng"),
    ("dealer.read", "Xem đại lý"),
    ("dealer.write", "Tạo/sửa đại lý"),
    ("ledger.write", "Ghi sổ công nợ"),
    ("qrcode.read", "Xem mã QR & Lô hàng"),
    ("qrcode.write", "Quản lý mã QR & Lô hàng"),
    ("contact.view", "Xem thông tin liên hệ / đăng ký đại lý"),
    ("contact.edit", "Xử lý thông tin liên hệ / đăng ký đại lý"),
]

# Role → danh sách permission code
ROLES = {
    "super_admin": [p[0] for p in PERMISSIONS],
    "content_manager": [
        "post.read",
        "post.write",
        "post.publish",
        "media.upload",
        "product.read",
        "product.write",
    ],
    "editor": ["post.read", "post.write", "media.upload"],
    "sales": [
        "customer.read", "customer.write",
        "order.read", "order.write",
        "dealer.read",
        "product.read",
        "qrcode.read", "qrcode.write",
        "contact.view", "contact.edit",
    ],
    "accountant": ["order.read", "ledger.write", "dealer.read"],
}


SUPER_ADMIN_EMAIL = "admin@sambaden.vn"
SUPER_ADMIN_PASSWORD = "Admin@123456"


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # Permissions
        perm_map: dict[str, Permission] = {}
        for code, desc in PERMISSIONS:
            existing = (
                await db.execute(select(Permission).where(Permission.code == code))
            ).scalar_one_or_none()
            if existing is None:
                existing = Permission(code=code, description=desc)
                db.add(existing)
                await db.flush()
            perm_map[code] = existing

        # Roles
        role_map: dict[str, Role] = {}
        for name, codes in ROLES.items():
            role = (
                await db.execute(select(Role).where(Role.name == name))
            ).scalar_one_or_none()
            if role is None:
                role = Role(name=name, description=name)
                db.add(role)
            role.permissions = [perm_map[c] for c in codes]
            role_map[name] = role
        await db.flush()

        # Super admin user
        admin = (
            await db.execute(select(User).where(User.email == SUPER_ADMIN_EMAIL))
        ).scalar_one_or_none()
        if admin is None:
            admin = User(
                email=SUPER_ADMIN_EMAIL,
                password_hash=hash_password(SUPER_ADMIN_PASSWORD),
                full_name="Super Admin",
                roles=[role_map["super_admin"]],
            )
            db.add(admin)

        # Danh mục blog mẫu
        from sqlalchemy import select as _select
        for nm, sl, od in [("Kiến thức Sâm Bà Đen","kien-thuc-sam-ba-den",1),
                           ("Kỹ thuật trồng","ky-thuat-trong",2),
                           ("Tin tức","tin-tuc",3)]:
            ex = (
                await db.execute(
                    _select(BlogCategory).where(BlogCategory.slug == sl)
                )
            ).scalar_one_or_none()
            if ex is None:
                db.add(BlogCategory(name=nm, slug=sl, sort_order=od))

        await db.commit()
        print(f"[OK] Seed xong. Dang nhap: {SUPER_ADMIN_EMAIL} / {SUPER_ADMIN_PASSWORD}")


if __name__ == "__main__":
    asyncio.run(seed())
