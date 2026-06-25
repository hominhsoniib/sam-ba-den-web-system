# Sâm Bà Đen — Admin CMS (Frontend mẫu)

Giao diện quản trị nội bộ: **Đăng nhập + Bảng điều khiển**, React + Vite + TypeScript,
gọi trực tiếp vào backend FastAPI (`sambaden-backend-core`).

## Tính năng đã có
- **Đăng nhập** thật qua `POST /auth/login` → lưu JWT (access + refresh).
- **Tự refresh token**: interceptor axios bắt 401, gọi `/auth/refresh` một lần, thử lại request.
- **Bảng điều khiển** đọc dữ liệu thật từ `GET /auth/me`: tên, số quyền, lần đăng nhập cuối,
  trạng thái kết nối API (`/public/ping`), bảng module theo **RBAC** (ẩn/hiện theo quyền).
- **Bảo vệ route**: chưa đăng nhập → chuyển `/login`.
- **Responsive** mobile-first, focus bàn phím, tôn trọng `prefers-reduced-motion`.
- Thiết kế theo design system Sâm Bà Đen (xanh dược liệu + vàng đất).

## Cấu trúc
```
src/
├── lib/        api.ts (axios + auto-refresh), tokenStore.ts, types.ts
├── store/      auth.ts (Zustand: login, loadMe, logout, can)
├── pages/      Login.tsx, Dashboard.tsx, Placeholder.tsx
├── components/ AppLayout.tsx (sidebar + topbar + guard)
└── styles/     tokens.css, components.css, login.css, shell.css
```

## Chạy
```bash
# 1) Chạy backend trước (thư mục backend): docker compose up  → http://localhost:8000
# 2) Frontend:
cp .env.example .env       # VITE_API_BASE_URL=http://localhost:8000/api/v1
npm install
npm run dev                # http://localhost:5173
```
Đăng nhập demo: `admin@sambaden.vn` / `Admin@123456` (đã điền sẵn trong form).

## Ráp module tiếp theo
Thay `Placeholder` bằng trang thật: tạo `pages/<Module>.tsx`, gọi API qua `api` client,
gate quyền bằng `useAuth().can("permission.code")`. Nền auth/RBAC/layout dùng lại nguyên.
