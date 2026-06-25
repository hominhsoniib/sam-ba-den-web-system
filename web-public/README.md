# Sâm Bà Đen — Web Public (Website công khai)

Website bán hàng/thương hiệu hướng khách hàng, React + Vite + TypeScript.
Tiêu thụ API blog từ backend (M3): hiển thị trang chủ, danh sách blog, chi tiết bài viết **chuẩn SEO**.

## Tính năng
- **Trang chủ**: hero thương hiệu núi thiêng, thanh tin cậy, 3 bài blog mới nhất (từ API).
- **Blog**: danh sách bài đã xuất bản, lọc theo danh mục (`?danh-muc=`).
- **Chi tiết bài**: render nội dung + **SEO meta + Open Graph + JSON-LD** (Article + Breadcrumb) inject vào `<head>` qua react-helmet-async; breadcrumb, tags, **disclaimer TPCN**, bài liên quan.
- Responsive mobile-first, tôn trọng `prefers-reduced-motion`.

## Chạy
```bash
# Cần backend chạy ở :8000 (đã publish vài bài)
cp .env.example .env     # VITE_API_BASE_URL, VITE_SITE_URL
npm install
npm run dev              # http://localhost:5174  (hoặc cổng Vite cấp)
```

## SEO
- Mỗi trang có `<title>`, `meta description`, `canonical`, `og:*` riêng.
- Trang chi tiết nhúng JSON-LD `Article` + `BreadcrumbList` (lấy sẵn từ API).
- Sitemap & robots do **backend** phục vụ tại `/(sitemap.xml|robots.txt)`.

> Lưu ý SSR: bản này render phía client (CSR). Để bot thấy HTML đầy đủ ngay từ
> response đầu (tối ưu tuyệt đối), bước sau có thể chuyển sang SSR/SSG (vite-ssr
> hoặc Next.js) — kiến trúc component SEO đã tách sẵn nên di chuyển dễ.

## Cấu trúc
```
src/
├── lib/api.ts          axios + types + helper
├── components/         Seo.tsx (helmet), Layout.tsx (header/footer)
├── pages/              Home, BlogList, PostDetail
└── styles/             tokens.css, site.css
```
