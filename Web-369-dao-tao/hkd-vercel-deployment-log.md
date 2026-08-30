# HKD Backend — Nhật ký deploy lên Vercel

**Ngày thực hiện:** 30/08/2026
**Repo:** `github.com/hominhsoniib/hkd-backend` (private)
**Bản demo public:** `hkd-backend.vercel.app`
**Production thật (không đụng tới):** `hkd.badenfarm.com.vn` (VPS, độc lập hoàn toàn với bản demo)

---

## 1. Bối cảnh

Source code local của app **Kế toán Hộ Kinh Doanh** (Python/FastAPI, single-tenant, đóng gói `.exe` cho desktop) nằm tại:

```
D:\App_Claude_Antigravity\Ho_KD
```

Đây là **bản rewrite Python** của hệ thống HKD gốc (Google Apps Script + Sheets), khác với bản web multi-tenant đang chạy thật tại `hkd.badenfarm.com.vn` trên VPS.

Mục tiêu: backup source lên GitHub, sau đó dựng bản demo công khai trên Vercel.

---

## 2. Backup lên GitHub

- Repo: `hominhsoniib/hkd-backend` (Private)
- Đã loại trừ khỏi git: file `.db` (SQLite, dữ liệu thật), `.exe`, thư mục `build/` (rác PyInstaller), `tmp/` (cache runtime), file export `.xlsx` đã sinh ra, file khóa tạm Office (`~$...`)
- Giữ lại: `.env.example` (file mẫu, không chứa secret thật)

---

## 3. Vấn đề kiến trúc phải giải quyết để chạy trên Vercel

Vercel là nền tảng **serverless** — filesystem chỉ đọc (trừ `/tmp`, và `/tmp` bị xoá sạch mỗi lần "cold start"). App gốc được viết cho môi trường chạy liên tục (desktop/VPS), nên gặp 4 điểm không tương thích:

| Vấn đề gốc | Cách đã sửa |
|---|---|
| Database SQLite (file `.db` ghi trực tiếp ổ đĩa) | Chuyển sang **Postgres** qua **Neon** (tích hợp Vercel Marketplace) |
| Phiên đăng nhập lưu trong RAM (dict Python) — mất khi đổi container serverless | Chuyển sang **JWT** (đã có sẵn hàm trong `security.py`, chỉ chưa được dùng) |
| Route `GET /` tự cấp quyền "owner" cho bất kỳ ai vào — không có xác thực | Thêm **cổng đăng nhập thật** (`/login`, `/logout`) dùng cookie phiên |
| Entrypoint nằm 2 cấp thư mục sâu (`backend/app/main.py`), Vercel chỉ tự nhận diện 1 cấp | Thêm file `main.py` "trung chuyển" ở root, `vercel.json` trỏ đúng |
| Thư mục `static/` ghi file export ra ổ đĩa thường | Đổi sang ghi vào `/tmp/static` khi chạy trên Vercel |

---

## 4. Các thay đổi code (tất cả đã test bằng script mô phỏng trước khi giao)

**File mới ở repo root:**
- `main.py` — shim import `backend/app/main.py`, để Vercel tự nhận diện FastAPI app
- `vercel.json` — cấu hình function, `includeFiles` đảm bảo đóng gói đủ `backend/`, `Ketoan_hkd/`, `JS.html`, file Excel seed
- `.python-version` — khoá Python 3.12
- `requirements.txt` (bản copy ở root, thêm `psycopg2-binary`)

**File sửa trong `backend/`:**
- `app/core/config.py` — tự chuyển `postgres://` → `postgresql://` (SQLAlchemy 1.4+ yêu cầu)
- `app/services/auth.py` — session chuyển từ RAM sang JWT
- `app/main.py` — bỏ auto-login; thêm `/login`, `/logout`, `/change-pin`; sửa `static_dir` cho Vercel

**File sửa trong `Ketoan_hkd/`:**
- `00_Index.html` — thêm link "Đổi PIN" và "Đăng xuất" trên thanh trên cùng

---

## 5. Hạ tầng Vercel

- **Database:** Neon Postgres (gói Free, 0.5GB), tên `hkd-db`, nối qua biến `DATABASE_URL` (tự động, không cần copy tay)
- **Biến môi trường đã đặt:** `DATABASE_URL` (tự động từ Neon), `SECRET_KEY` (chuỗi ngẫu nhiên tự tạo — **giữ riêng, không chia sẻ**)
- **Dữ liệu demo:** seed tự động từ `TT152_KeToan_HoKinhDoanh_SeedData_2026.xlsx` (dữ liệu mẫu, không phải khách hàng thật)

---

## 6. Đăng nhập bản demo

- URL: `hkd-backend.vercel.app`
- Username: `owner` (vai trò owner) hoặc `ketoan` (vai trò accountant)
- PIN mặc định khi seed: `1234` — **nên đổi ngay** qua trang `/change-pin` sau lần đăng nhập đầu

Xem lại danh sách user thật bất cứ lúc nào qua Neon → project `hkd-db` → **Query**:
```sql
SELECT "Username", "Tên", "Vai trò" FROM users;
```

---

## 7. Việc còn để ngỏ / lưu ý cho sau này

- `/tmp` bị xoá mỗi lần cold start → file Excel export tạm **không tồn tại lâu dài** trên bản demo. Nếu cần lưu file export vĩnh viễn, phải chuyển sang cloud storage (S3, Vercel Blob...) — chưa làm, không cấp thiết cho mục đích demo.
- JWT là stateless nên **logout không thu hồi được token đã cấp phía server** (chỉ xoá cookie phía client) — chấp nhận được cho quy mô hiện tại; nếu cần thu hồi thật sự phải thêm blacklist token.
- Repo backup này (`hkd-backend`) và production thật trên VPS (`hkd.badenfarm.com.vn`) là **hai hệ thống độc lập, không đồng bộ tự động** — sửa ở bên này không ảnh hưởng bên kia và ngược lại.
