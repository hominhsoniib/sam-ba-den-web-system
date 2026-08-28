# NEXUS Enterprise — Landing (Next.js + Tailwind)

Tách từ bản HTML tĩnh `nexus-enterprise-ecosystem.html` thành component
Next.js App Router + Tailwind, giữ nguyên toàn bộ hệ thiết kế blueprint/schematic
(màu, typography, mô-típ sơ đồ mạch).

## Cấu trúc

```
app/
  layout.tsx        # load font IBM Plex Sans/Mono qua next/font, set metadata
  globals.css        # Tailwind directives + reveal-on-scroll keyframes
  page.tsx           # ghép toàn bộ section theo đúng thứ tự
components/
  Logo.tsx            # wrapper cho 4 file SVG logo (mark/full × light/dark)
  Header.tsx           # nav sticky + menu mobile
  Hero.tsx              # sơ đồ mạch signature (SVG động, vòng tín hiệu pulsing)
  EcosystemGrid.tsx      # 9 module + lõi QLCV, dữ liệu tách thành mảng MODULES[]
  OperatingLoop.tsx        # vòng quản trị 8 bước
  DataCases.tsx              # 4 case dữ liệu & AI
  RolesLadder.tsx              # thang cấp bậc CEO → Nhân viên
  Benefits.tsx                  # 8 giá trị, nền blueprint
  CTA.tsx                        # khối đăng ký tư vấn
  Footer.tsx                      # dùng Logo variant="full" onDark
  useReveal.ts                     # hook IntersectionObserver dùng chung
public/
  nexus-mark.svg           # icon logo, nền sáng
  nexus-mark-dark.svg       # icon logo, nền tối (viền paper thay vì blueprint)
  nexus-logo-full.svg        # icon + wordmark "NEXUS" + "ENTERPRISE OS", nền sáng
  nexus-logo-full-dark.svg    # bản dùng trên nền blueprint (hero, footer)
tailwind.config.ts    # toàn bộ token: blueprint / cyan / amber / paper / ink...
```

## Tích hợp vào codebase hiện có

1. **Đã có sẵn Next.js App Router + Tailwind** — chỉ cần copy:
   - toàn bộ `components/*`
   - toàn bộ `public/nexus-*.svg`
   - merge nội dung `tailwind.config.ts` (phần `theme.extend`) vào config hiện tại
     — đặt tên khác nếu bạn đã có `colors.blueprint` v.v. để tránh đè
   - merge `app/globals.css` (phần `.reveal` + `::selection`) vào file CSS gốc
   - copy khối `IBM_Plex_Sans` / `IBM_Plex_Mono` trong `app/layout.tsx` vào
     layout hiện có, rồi gắn `${plexSans.variable} ${plexMono.variable}` lên `<html>`

2. **Dự án trống / khởi tạo mới:**
   ```bash
   npx create-next-app@latest nexus-enterprise --typescript --tailwind --app
   # rồi copy đè app/, components/, public/, tailwind.config.ts vào đúng vị trí
   npm install
   npm run dev
   ```

## Logo — dùng ở đâu

- `<Logo variant="full" />` — header, footer trên nền sáng
- `<Logo variant="full" onDark />` — trên nền `bg-blueprint` (hero, footer, CTA)
- `<Logo variant="mark" />` — favicon, avatar, app icon, nơi không đủ chỗ cho wordmark

Text trong SVG dùng `font-family="IBM Plex Sans/Mono"` — cần đảm bảo 2 font này
được load ở trang chứa SVG (đã có sẵn qua `next/font` trong `layout.tsx`). Nếu
dùng logo trong ngữ cảnh không load được font (favicon, file xuất PDF, app
mobile native), nên convert text thành outline trong Figma/Illustrator trước.

## Data-driven, không hard-code lặp

`EcosystemGrid`, `OperatingLoop`, `DataCases`, `RolesLadder`, `Benefits` đều
lấy nội dung từ một mảng object đầu file component — sửa nội dung module,
thêm/bớt bước trong vòng quản trị, hay đổi số liệu benefit chỉ cần sửa mảng,
không đụng vào JSX.

## Còn thiếu để lên production

- Thay `mailto:contact@nexus-enterprise.vn` bằng form thật hoặc route liên hệ
- Thêm `favicon.ico` / `apple-touch-icon.png` xuất từ `nexus-mark.svg`
- Kiểm tra lại toàn bộ copy tiếng Việt trước khi public (đây là bản dịch từ
  file HTML gốc anh cung cấp, giữ nguyên nội dung nghiệp vụ)
