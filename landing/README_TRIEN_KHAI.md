# Landing Page Sâm Bà Đen — Hướng dẫn triển khai

## Nội dung thư mục `landing/`
| File | Mô tả |
| :--- | :--- |
| `index.html` | Landing Page production-ready (1 file, Tailwind CDN, không cần build) |
| `01_PHAN_TICH_CHIEN_LUOC_LANDING.md` | Tài liệu phân tích, sitemap, content, SEO, UI/UX, CRO |
| `README_TRIEN_KHAI.md` | File này |

## Xem ngay trên máy
Mở thẳng `index.html` bằng trình duyệt — không cần cài gì. (Cần Internet để tải Tailwind + Google Fonts.)

## Deploy nhanh (chọn 1)
- **Netlify / Vercel:** kéo-thả thư mục `landing/` vào dashboard, hoặc `vercel deploy`.
- **Hosting thường (cPanel):** upload `index.html` vào thư mục `public_html/`.
- **GitHub Pages:** push file, bật Pages ở nhánh `main`.

## Việc cần làm trước khi chạy thật (checklist)
- [ ] Thay **ảnh thật**: tất cả chỗ đánh dấu `[CHỖ THAY ẢNH THẬT]` (hero, giới thiệu, sản phẩm, vùng trồng). Ảnh sản phẩm 4:3, hero 1200×900, og-image 1200×630.
- [ ] Thay **giá & tên sản phẩm thật** trong section `#san-pham` (đang để "cập nhật").
- [ ] Sửa **thông tin liên hệ**: hotline `0900 000 000`, email `contact@sambaden.vn`, link Zalo/Facebook/Messenger.
- [ ] Điền **GA4** (`G-XXXXXXX`) và/hoặc **GTM** (`GTM-XXXXXXX`) — đang comment sẵn trong `<head>`.
- [ ] Nhúng **Google Maps** thật vào section Vùng trồng.
- [ ] Đổi domain trong các thẻ `canonical` / Open Graph / JSON-LD (`https://sambaden.vn/`).
- [x] **Form đã nối sẵn** về API CRM: `POST /public/leads` (Backend FastAPI Module 4). Chỉ cần sửa hằng `API_BASE` trong `<script>` cuối trang cho đúng domain API thật.
- [ ] **CORS:** thêm domain landing vào `cors_origins` của backend (`backend/.env` / `app/core/config.py`) để trình duyệt cho phép gọi API. Khi mở landing bằng `file://`, Origin là `null` → nên chạy landing qua local server (vd `npx serve`) hoặc deploy để test form.
- [ ] Tạo `sitemap.xml` + `robots.txt` khi lên domain thật.

## Backend — lát cắt "Thu Lead" đã bổ sung (Module 4 CRM)
| Thành phần | Đường dẫn |
| :--- | :--- |
| Gửi lead (công khai, không auth) | `POST /api/v1/public/leads` |
| Danh sách lead (cần quyền `lead.read`) | `GET /api/v1/admin/leads?status=&need=&page=&page_size=` |
| Chi tiết lead | `GET /api/v1/admin/leads/{id}` |
| Cập nhật trạng thái/ghi chú (`lead.write`) | `PATCH /api/v1/admin/leads/{id}` |
| Trang quản trị | Admin CMS → **Khách tiềm năng** (`/leads`) |

> Sau khi kéo code mới: chạy lại `python -m app.seed` (thêm quyền `lead.read`/`lead.write` cho role `sales` + tạo bảng `leads`).

## Module Sản phẩm (M6) + Blog public — đã bổ sung
**Sản phẩm:** section "Sản phẩm" trên `index.html` **tự nạp dữ liệu thật** từ `GET /public/products?page_size=6` (nếu API tắt → giữ card placeholder tĩnh). Quản trị trong Admin CMS → **Sản phẩm** (`/products`, quyền `product.read`/`product.write`).

| Endpoint | Mô tả |
| :--- | :--- |
| `GET /api/v1/public/products` | Sản phẩm đang hiển thị (lọc `category`, `featured`) |
| `GET /api/v1/public/products/{slug}` | Chi tiết sản phẩm |
| `GET /api/v1/public/product-categories` | Danh mục sản phẩm |
| `GET/POST/PATCH /api/v1/admin/products` | CRUD (RBAC) |

**Trang Blog public (mới):**
- `blog.html` — danh sách bài viết đã xuất bản, lọc theo danh mục (đọc `GET /public/posts` + `/public/post-categories`).
- `bai-viet.html?slug=...` — chi tiết bài, tự set Meta Title/Description/Canonical + JSON-LD `Article` theo dữ liệu bài.
- Đã thêm link **Blog** trên menu `index.html`.

> Cả 3 trang dùng chung hằng `API_BASE` — nhớ đổi sang domain API thật khi deploy và bật CORS cho domain landing.
> Lưu ý SEO: trang blog render phía client (JS). Để SEO/crawler tối ưu nhất, Phase 2 nên chuyển sang **Next.js (SSR/SSG)** — các trang HTML này phục vụ tốt cho người dùng + chia sẻ mạng xã hội qua meta tĩnh mặc định.

> Seed bổ sung: 5 danh mục sản phẩm (Sâm tươi, Sâm khô, Mật ong sâm, Trà sâm, Quà tặng) + quyền `product.read`/`product.write` (role `content_manager`).

## Đã tích hợp sẵn
- SEO: meta title/description/keywords, canonical, Open Graph, Twitter Card, JSON-LD (Organization + FAQPage).
- Tuân thủ TPCN: disclaimer "không phải là thuốc" ở footer; copy dùng "hỗ trợ", không tuyên bố chữa bệnh.
- Responsive mobile-first; `prefers-reduced-motion`; focus bàn phím; nút chạm ≥44px.
- Floating Zalo / Messenger / Gọi / Lên đầu trang.
- Design system khớp `admin-cms` (xanh dược liệu + vàng đất, Be Vietnam Pro + Inter).

## Bước tiếp theo (Phase 2)
Chuyển sang **Next.js + Tailwind + Framer Motion** (đúng tech stack), tách component, nối API CRM, thêm các trang con: Sản phẩm, Vùng trồng, Truy xuất QR, Blog SEO. Báo khi anh muốn bắt đầu.
