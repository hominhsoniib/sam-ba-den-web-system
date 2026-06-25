# Sâm Bà Đen — Backend API (FastAPI)

Backend core: cấu trúc clean architecture + PostgreSQL + Auth JWT + RBAC.
Đây là **nền tảng** cho mọi module M1–M7 (Blog/CMS, CRM, Đại lý, Sản phẩm, Đơn hàng).

## Kiến trúc phân lớp

```
Router (api/v1)  →  Service (logic)  →  Repository (truy vấn DB)  →  Model (SQLAlchemy)
                         ↑ Schema (Pydantic DTO)        ↑ core (config, security, db, exceptions)
```

- **Router**: nhận request, gắn RBAC, trả `ApiResponse`.
- **Service**: logic nghiệp vụ, transaction.
- **Repository**: tách truy vấn DB khỏi service.
- **core/security.py**: hash argon2, JWT access/refresh, `get_current_user`, `require_permission`.

## Chạy nhanh bằng Docker (khuyến nghị)

```bash
cp .env.example .env          # đổi JWT_SECRET trước khi production
docker compose up --build
```

- API: http://localhost:8000
- Swagger: http://localhost:8000/docs
- Health: http://localhost:8000/health

Container `api` tự chạy `python -m app.seed` để tạo permissions, roles và tài khoản:

```
Email:    admin@sambaden.vn
Password: Admin@123456
```

## Chạy local (không Docker)

```bash
pip install -e ".[dev]"
# cần PostgreSQL + Redis đang chạy, sửa .env cho đúng
python -m app.seed
uvicorn app.main:app --reload
```

## Thử nhanh

```bash
# Đăng nhập
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sambaden.vn","password":"Admin@123456"}'

# Lấy thông tin user (thay <TOKEN>)
curl http://localhost:8000/api/v1/auth/me -H "Authorization: Bearer <TOKEN>"
```

## Test

```bash
pytest -q          # dùng SQLite in-memory, không cần Postgres
```

## Migration (Alembic)

```bash
alembic revision --autogenerate -m "init auth rbac"
alembic upgrade head
```

## RBAC

- `User` → nhiều `Role` → nhiều `Permission` (code dạng `resource.action`).
- Gắn quyền vào endpoint: `dependencies=[Depends(require_permission("user.write"))]`.
- Roles seed sẵn: `super_admin`, `content_manager`, `editor`, `sales`, `accountant`.

## Bước tiếp theo (ráp module)

Mỗi module mới chỉ cần thêm: `models/<x>.py` → `schemas/<x>.py` → `repositories/` → `services/` → `api/v1/admin/<x>.py`, rồi `include_router` trong `main.py`. Nền auth/RBAC/response/exception đã dùng lại được ngay.
