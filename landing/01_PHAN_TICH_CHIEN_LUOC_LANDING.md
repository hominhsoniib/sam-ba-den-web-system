# SÂM BÀ ĐEN — PHÂN TÍCH & CHIẾN LƯỢC LANDING PAGE
> Phiên bản 1.0 · Người thực hiện: AI Builder (BA · UX · SEO · Frontend · CRO)
> Nguồn dữ liệu: đọc trực tiếp từ thư mục dự án `D:\Cowork_Ai\Web_Landipage`

---

## 0. CÁC FILE ĐÃ DÙNG LÀM NGUỒN DỮ LIỆU

| File | Vai trò nội dung |
| :--- | :--- |
| `MÔ TA WEB/web-sam-ba-den-farm.md` | Blueprint enterprise 16 module, business domain, DB, security → lấy USP & cấu trúc website (Module 1) |
| `MÔ TA WEB/Sam_Ba_Den_Kien_Truc_M4-M7.md` | Kiến trúc CRM/Đại lý/Sản phẩm/Đơn hàng → lấy 2 phân khúc khách (B2C lẻ / B2B đại lý), pricing, lead flow |
| `files/Huong_Dan_Van_Hanh_Website.md` | Hiện trạng vận hành → xác nhận đang chạy localhost, chưa deploy |
| `admin-cms/src/styles/tokens.css` | Design system thật (màu, font, radius, shadow) → tái dùng nguyên cho landing |
| `admin-cms/` (React+Vite+TS) + `backend/` (FastAPI) | Hiện trạng codebase → xác định landing là phần còn thiếu (Module 1 public) |
| `Sâm_Bà_Đen_Enterprise_Blueprint.pdf`, `…V2_Enterprise_Platform.pdf`, `Ebook Thiết kế landing page với AI.pdf` | Tài liệu nền (trùng nội dung .md) |

> **Lưu ý trung thực dữ liệu:** trong thư mục **không có** tên sản phẩm cụ thể, bảng giá, hay ảnh sản phẩm thật (chỉ có `favicon.svg`). Theo lựa chọn của anh ("lấy từ tài liệu là đủ"), phần Sản phẩm dùng **khung danh mục chờ CMS** + định vị thương hiệu từ tài liệu — **không bịa giá/SKU**.

---

## 1. PROJECT ANALYSIS

### 1.1 Hiện trạng codebase
- **Đã có:** Admin CMS nội bộ (đăng nhập JWT + dashboard RBAC, React 18 + Vite + TS) và Backend FastAPI (auth, user, RBAC, PostgreSQL/Redis qua Docker).
- **Chưa có:** Website công khai / Landing Page (Module 1 "Website doanh nghiệp" mới ở mức tài liệu). **Đây chính là khoảng trống landing page này lấp.**

### 1.2 Tự động nhận diện (auto-detect)
| Hạng mục | Kết luận |
| :--- | :--- |
| Loại website | Landing Page thương hiệu + dẫn chuyển đổi (lead-gen + bán hàng) cho doanh nghiệp nông sản dược liệu |
| Ngành nghề | Sâm dược liệu / Thực phẩm bảo vệ sức khỏe (TPCN) — vùng trồng Núi Bà Đen, Tây Ninh |
| Đối tượng KH | (B2C) Người 30–60t quan tâm sức khỏe, quà biếu; (B2B) Đại lý phân phối khu vực |
| Mục tiêu chuyển đổi | (1) Mua/đặt hàng lẻ · (2) Đăng ký đại lý · (3) Để lại liên hệ tư vấn (lead vào CRM M4) |
| Thông điệp chính | **Sâm thật — Trồng thật — Truy xuất thật.** Minh bạch nguồn gốc bằng QR + chứng nhận VietGAP/GlobalGAP/Organic |

### 1.3 Lợi thế cạnh tranh rút từ tài liệu (dùng làm trục bán hàng)
1. **Truy xuất nguồn gốc QR** (Module 11): quét mã → xem lô trồng, nhật ký chăm sóc, ngày thu hoạch, chứng nhận. → *Niềm tin*.
2. **Chứng nhận** (Module 12): VietGAP, GlobalGAP, Organic, ISO, HACCP. → *Bằng chứng chất lượng*.
3. **Vùng trồng thật** (Module 8–10, 14): lô trồng, nhật ký canh tác, bản đồ Google Maps. → *Câu chuyện thương hiệu*.
4. **Chuỗi giá trị khép kín** từ trồng → sản xuất → phân phối. → *Quy mô & uy tín doanh nghiệp*.

---

## 2. CUSTOMER INSIGHT (Pain → Fear → Dream → USP)

| Lớp | Khách lẻ B2C | Đại lý B2B |
| :--- | :--- | :--- |
| **Pain** | Sợ mua sâm giả, sâm trộn, không rõ nguồn gốc | Khó tìm nguồn hàng chuẩn, giá ổn định, có chiết khấu rõ ràng |
| **Fear** | Tiền mất tật mang, biếu quà mà hàng kém uy tín | Ôm hàng khó bán, công nợ rối, không hỗ trợ marketing |
| **Dream** | Mua được sâm thật, minh bạch, an tâm dùng & biếu | Có nhà cung cấp uy tín, biên lợi nhuận tốt, đồng hành lâu dài |
| **USP** | "Quét QR thấy tận gốc từng củ sâm" | "Chính sách đại lý minh bạch: chiết khấu theo cấp, công nợ sổ cái rõ ràng" |

---

## 3. SITEMAP

### 3.1 Sơ đồ tổng thể website (Module 1) — để định hướng mở rộng
```
Trang chủ (/)
├── Giới thiệu (/gioi-thieu)
├── Sản phẩm (/san-pham)
│   └── Chi tiết sản phẩm (/san-pham/:slug)
├── Vùng trồng (/vung-trong)
├── Truy xuất nguồn gốc (/truy-xuat/:qr)
├── Đại lý phân phối (/dai-ly)        → form đăng ký đại lý (B2B)
├── Blog SEO (/blog, /blog/:slug)
├── Tuyển dụng (/tuyen-dung)
├── Liên hệ (/lien-he)
└── FAQ (/faq)
```

### 3.2 Phạm vi Landing Page (one-page, dẫn về các trang trên)
`Hero → Thanh tín nhiệm → Giới thiệu → Lợi ích → Truy xuất QR → Sản phẩm → Vùng trồng → Chứng nhận → Feedback → Đại lý CTA → FAQ → Form liên hệ → Footer`

---

## 4. WIREFRAME (mobile-first, thứ tự cuộn)

```
┌──────────────────────────────┐
│ HEADER sticky: logo · menu · [Đặt hàng] │
├──────────────────────────────┤
│ HERO: H1 thông điệp + 2 CTA + ảnh vùng trồng │
│ "Sâm thật · Trồng thật · Truy xuất thật"     │
├──────────────────────────────┤
│ TRUST BAR: VietGAP · GlobalGAP · Organic · QR │
├──────────────────────────────┤
│ GIỚI THIỆU: câu chuyện + số liệu (ha, lô, năm) │
├──────────────────────────────┤
│ LỢI ÍCH: 4 thẻ (Minh bạch/Chuẩn hóa/An toàn/Đồng hành) │
├──────────────────────────────┤
│ TRUY XUẤT QR: 3 bước quét → xem nguồn gốc      │
├──────────────────────────────┤
│ SẢN PHẨM: lưới thẻ danh mục (chờ CMS)          │
├──────────────────────────────┤
│ VÙNG TRỒNG: ảnh + map + nhật ký canh tác       │
├──────────────────────────────┤
│ CHỨNG NHẬN: dải logo chứng nhận                │
├──────────────────────────────┤
│ FEEDBACK: 3 thẻ khách hàng                     │
├──────────────────────────────┤
│ ĐẠI LÝ CTA: banner mời hợp tác B2B             │
├──────────────────────────────┤
│ FAQ: accordion 6 câu                           │
├──────────────────────────────┤
│ FORM: tên · sđt · nhu cầu → lead CRM           │
├──────────────────────────────┤
│ FOOTER: liên hệ · map · social · disclaimer TPCN │
└──────────────────────────────┘
  Floating: Zalo · Messenger · Gọi · ↑Top
```

---

## 5. CONTENT STRATEGY

- **Tông giọng:** tin cậy, mộc mạc, "nông dân công nghệ" — không nói quá, không hứa chữa bệnh (tuân thủ quảng cáo TPCN).
- **Trục thông điệp:** mỗi section trả lời 1 câu hỏi nghi ngờ của khách → giảm rủi ro cảm nhận.
- **Compliance TPCN (bắt buộc):** dùng "hỗ trợ", "giúp"; **không** dùng "chữa", "điều trị", "khỏi bệnh". Footer ghi rõ: *"Thực phẩm này không phải là thuốc và không có tác dụng thay thế thuốc chữa bệnh."*
- **Sản phẩm:** hiển thị **khung danh mục** (Sâm tươi, Sâm khô/lát, Mật ong sâm, Trà sâm, Quà tặng) với nhãn *"Cập nhật qua CMS"* — chừa chỗ ảnh & giá thật, không bịa số.

---

## 6. SEO RECOMMENDATIONS

| Hạng mục | Đề xuất |
| :--- | :--- |
| **Meta Title** | `Sâm Bà Đen — Sâm Dược Liệu Chuẩn VietGAP, Truy Xuất QR \| Vùng Trồng Tây Ninh` (≤60 ký tự ưu tiên từ khóa đầu) |
| **Meta Description** | `Sâm Bà Đen trồng chuẩn VietGAP/GlobalGAP tại Tây Ninh. Quét QR truy xuất tận gốc từng củ sâm. Đặt hàng & đăng ký đại lý phân phối.` (≤155 ký tự) |
| **Từ khóa chính** | sâm bà đen, sâm tây ninh, sâm dược liệu, truy xuất nguồn gốc sâm, đại lý sâm, sâm vietgap |
| **Từ khóa phụ** | mua sâm chính hãng, sâm núi bà đen, công dụng sâm, quà biếu sâm, sâm hữu cơ |
| **Slug** | tiếng Việt không dấu, ngắn: `/san-pham`, `/vung-trong`, `/dai-ly` |
| **Canonical** | `<link rel="canonical">` mỗi trang |
| **Open Graph + Twitter Card** | tiêu đề, mô tả, ảnh 1200×630 |
| **Schema Markup (JSON-LD)** | `Organization` + `LocalBusiness` + `Product` (khi có giá) + `FAQPage` + `BreadcrumbList` |
| **Kỹ thuật** | `sitemap.xml`, `robots.txt`, heading 1×H1 + H2 theo section, alt ảnh mô tả, lazy-load, preconnect fonts |
| **Core Web Vitals** | ảnh `loading="lazy"` + `width/height`, font `display=swap`, CSS critical inline, hạn chế JS chặn render |

---

## 7. UI/UX RECOMMENDATIONS

- **Design system tái dùng từ `tokens.css`:** xanh dược liệu (`#1b5e20`/`#2e7d32`), vàng đất (`#c9a227`), nền ngà ấm (`#faf8f2`), font **Be Vietnam Pro** (display) + **Inter** (body), radius 12px.
- **Mobile-first**, breakpoint tablet 768px / desktop 1024px; CTA luôn trong tầm ngón cái trên mobile.
- **Khả năng tiếp cận:** tương phản ≥ AA, `:focus-visible` rõ, tôn trọng `prefers-reduced-motion`, nút ≥44px.
- **Micro-interaction:** scroll-reveal nhẹ, hover nâng thẻ — tắt khi giảm chuyển động.
- **Tích hợp sẵn:** Zalo, Messenger, nút gọi, Google Analytics (GA4) + Google Tag Manager (chỗ chờ ID), form liên hệ POST về `/api/v1` (lead → CRM).

---

## 8. CRO (Conversion Rate Optimization)

| Đòn bẩy | Áp dụng trên landing |
| :--- | :--- |
| Giảm rủi ro cảm nhận | Trust bar + chứng nhận + QR ngay nửa trên màn hình |
| CTA kép | "Đặt hàng" (B2C nóng) song song "Đăng ký đại lý" (B2B) |
| Bằng chứng xã hội | Feedback khách + số liệu vùng trồng |
| Ma sát thấp | Form chỉ 3 trường (tên, SĐT, nhu cầu) |
| Khẩn cấp/giá trị | Banner đại lý "chính sách chiết khấu minh bạch" |
| A/B test gợi ý | (a) Headline "Sâm thật…" vs "Quét QR thấy tận gốc"; (b) CTA màu xanh vs vàng; (c) form trên hero vs cuối trang |

---

## 9. KẾ HOẠCH TRIỂN KHAI (PHASE)

| Phase | Hạng mục | Trạng thái |
| :--- | :--- | :--- |
| **P1** | Landing HTML đơn (chạy ngay, deploy Vercel/Netlify/hosting) | ✅ Bàn giao kèm đây |
| **P2** | Chuyển sang Next.js + Tailwind + Framer Motion (đúng stack) sau khi chốt nội dung | ⏳ Chờ duyệt P1 |
| **P3** | Nối form → API CRM (FastAPI M4), gắn ảnh/giá thật từ CMS | ⏳ |
| **P4** | Trang con (Sản phẩm, Vùng trồng, Truy xuất QR, Blog SEO) + sitemap/robots | ⏳ |

---
*Hết tài liệu. File kèm theo: `index.html` (landing production-ready) + `README_TRIEN_KHAI.md`.*
