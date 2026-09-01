# Web369 Backend — Nhật ký xây dựng & deploy

**Ngày thực hiện:** 30–31/08/2026 (cập nhật lần cuối: 31/08/2026, cuối ngày)
**Repo backend:** `github.com/hominhsoniib/web369-backend` (private)
**Backend live:** `web369-backend.vercel.app`
**Repo frontend:** `github.com/hominhsoniib/sam-ba-den-web-system` (dùng chung với web Sâm Bà Đen — Root Directory `Web-369-dao-tao`)
**Frontend live:** `369-daotao.vercel.app`

---

## 1. Bối cảnh

Bản demo `369-daotao.vercel.app` ban đầu (file `index.html` duy nhất) chạy hoàn toàn bằng **JS giả lập phía trình duyệt** — đăng nhập, phân quyền khóa học, sổ đăng ký thành viên đều là dữ liệu cứng trong code, ai mở DevTools cũng sửa được, không có backend thật. Giao diện còn có 1 thanh **"Demo Control"** (dropdown chọn trạng thái đăng nhập/vai trò/trạng thái thành viên) để mô phỏng các kịch bản phân quyền khi chưa có backend.

Mục tiêu ban đầu: viết backend thật thay cho toàn bộ phần giả lập, đặc biệt là **Tầng 2-3-4 trong mô hình bảo mật đã chốt** (Membership status → Role → Course Permission). Sau khi backend thật lên sóng và ổn định, dự án tiếp tục mở rộng thành hệ thống quản trị thành viên hoàn chỉnh (CRUD thật, phân quyền vai trò, cấp mật khẩu tạm) qua nhiều đợt làm việc trong cùng ngày.

---

## 2. Kiến trúc backend

Dùng lại đúng bộ công nghệ đã chứng minh ổn định ở dự án HKD trước đó — **FastAPI + Postgres (Neon) + JWT (cookie httponly) + Vercel** — để đồng bộ hạ tầng, dễ bảo trì.

**Bảng dữ liệu chính (`members`):**
id (`HTX369-xxxx`), tên, SĐT, mật khẩu (bcrypt), `must_change_password` (bool — bắt buộc đổi mật khẩu sau khi được cấp mật khẩu tạm), CCCD, ngày cấp, email, loại thành viên, **trạng thái** (Chính thức/Đang chờ xác nhận/Tạm ngừng/Đã chấm dứt...), **vai trò** (Thành viên/Tổ trưởng/Cán bộ quản lý/Ban điều hành), vốn góp, điểm năng lực, chứng chỉ, huy hiệu, ngày tham gia.

**Bảng `courses`:** gắn `min_role` cho từng khóa, server tự lọc theo vai trò người xem.

**API đầy đủ (tính tới cuối ngày 31/08):**

| Endpoint | Chức năng |
|---|---|
| `POST /api/register` | Nộp đơn tham gia HTX (công khai) — tạo hồ sơ, status = "Đang chờ xác nhận" |
| `POST /api/login` | Xác thực SĐT + mật khẩu (bcrypt), cấp cookie JWT |
| `POST /api/logout` | Xóa cookie phiên |
| `GET /api/me` | Lấy thông tin phiên hiện tại, gồm cả `must_change_password` |
| `POST /api/change-password` | Đổi mật khẩu (yêu cầu đúng mật khẩu cũ), tự tắt cờ `must_change_password` |
| `GET /api/courses` | Danh sách khóa học, khóa/mở theo vai trò thật ở server — mô tả chi tiết bị ẩn hoàn toàn nếu không đủ quyền |
| `POST /api/admin/approve-member` | Duyệt hồ sơ đang chờ (chỉ Ban điều hành/Cán bộ quản lý) — chuyển status sang Chính thức, sinh mật khẩu tạm 6 số |
| `POST /api/admin/reset-password` | **[Mới]** Cấp/cấp lại mật khẩu tạm cho bất kỳ thành viên nào **mà không đổi trạng thái hồ sơ** — dùng khi quên mật khẩu, hoặc cần cấp quyền đăng nhập tạm trước khi duyệt đầy đủ |
| `POST /api/admin/create-member` | **[Mới]** Admin tự thêm thành viên trực tiếp (không qua đơn đăng ký công khai), chọn sẵn trạng thái/vai trò/vốn góp |
| `POST /api/admin/update-member` | **[Mới]** Sửa toàn bộ thông tin hồ sơ thành viên (tên, SĐT, CCCD, email, loại, vai trò, vốn góp, trạng thái) |
| `POST /api/admin/delete-member` | **[Mới]** Xóa vĩnh viễn hồ sơ — có 2 lớp bảo vệ: không cho tự xóa chính mình, không cho xóa Ban điều hành cuối cùng còn lại |
| `GET /api/admin/members` | Sổ đăng ký thành viên đầy đủ (chỉ Ban điều hành/Cán bộ quản lý) |

Mật khẩu tạm (từ Duyệt hoặc Cấp MK tạm) luôn set `must_change_password = true`; lần đăng nhập kế tiếp, frontend tự động bật modal bắt buộc đổi mật khẩu trước khi cho vào Cổng thành viên.

**Cơ chế khởi tạo (bootstrap):** DB mới hoàn toàn trống sẽ tự động tạo 1 tài khoản **Ban điều hành mặc định** (SĐT/mật khẩu đặt qua biến môi trường `BOOTSTRAP_ADMIN_PHONE`/`BOOTSTRAP_ADMIN_PASSWORD`, mặc định `0900000000`/`admin123` nếu không đặt) — nếu không có bước này, không ai duyệt được thành viên đầu tiên (lỗi "con gà quả trứng").

---

## 3. Nối frontend với backend thật

Sửa `index.html` để gọi API thật thay JS giả lập:
- Đăng nhập/đăng ký/đổi mật khẩu/đăng xuất → gọi đúng API, không còn tìm trong mảng JS cứng
- Khóa học Tổ trưởng/Cán bộ quản lý → khóa thật ở server (`GET /api/courses`), không phải so sánh `state.user.role` phía client
- Sổ đăng ký thành viên → nạp thật từ `GET /api/admin/members`

**Cơ chế dự phòng khi API lỗi:** nếu không gọi được backend (mất mạng, lỗi quyền...), trang **không được để trống** — hiện dữ liệu mẫu (`defaultMemberList`) kèm **banner đỏ cảnh báo rõ** "ĐANG XEM DỮ LIỆU DEMO — KHÔNG PHẢI THẬT", và các thao tác Duyệt/Sửa/Xóa/Đăng ký trong tình huống lỗi thật sẽ báo đúng lỗi, **không giả vờ thành công**.

**Gỡ bỏ thanh "Demo Control":** sau khi backend thật hoạt động ổn định, thanh mô phỏng đăng nhập/vai trò/trạng thái (vốn chỉ đổi state JS, không gọi API thật) bị gỡ hoàn toàn khỏi giao diện — cùng với mọi nút "Mô phỏng..." còn sót (kể cả 2 nút mô phỏng bypass ngay trên lớp khóa học bảo mật thật), thay bằng nút đăng nhập/liên hệ thật.

---

## 4. Các sự cố gặp phải trong quá trình xây dựng ban đầu (30-31/08, đợt 1)

| Sự cố | Nguyên nhân | Cách sửa |
|---|---|---|
| `passlib`/`bcrypt` lỗi tương thích | Bug đã biết giữa `passlib 1.7.4` và `bcrypt >=4.x` | Bỏ `passlib`, dùng thẳng thư viện `bcrypt` |
| Seed khóa học không chạy trong test | Gắn seed vào sự kiện `startup` của ASGI, không đáng tin cậy | Chuyển seed chạy ngay lúc import module |
| CORS chặn cookie khi frontend/backend khác domain | `allow_origins=["*"]` không hợp lệ khi `allow_credentials=True` | Đổi sang `allow_origin_regex=".*"` để Starlette phản chiếu đúng Origin |
| Mã thành viên đầu tiên ra số lẻ (`HTX369-0083`) | Logic sinh ID kế thừa offset `+82` từ dữ liệu demo cũ | Đổi công thức sinh ID về `count + 1` |
| `git init`/`git add` chạy nhầm thư mục | `cd` vào đường dẫn sai, PowerShell không dừng khi `cd` lỗi | Xoá `.git` tạo nhầm, tìm đúng thư mục bằng `Get-ChildItem`, làm lại |
| `Custom Prefix` khi nối Neon báo lỗi ký tự không hợp lệ | Tự động điền tên có dấu gạch ngang (`web369-db`) | Sửa tay thành `DATABASE` |
| Nối Neon báo trùng biến `DATABASE_URL` | Biến rỗng đã được thêm sẵn lúc tạo project trên Vercel | Xoá biến rỗng ở Environment Variables trước, nối lại |
| Build frontend lỗi liên tục 5 lần (`pattern "main.py"... doesn't match any Serverless Functions`) | 4 file backend bị giải nén nhầm thẳng vào gốc thư mục frontend | Xoá 4 file rác đó khỏi gốc frontend, giữ nguyên thư mục con `web369-backend/` |
| Trang hiện dữ liệu demo cũ dù đã sửa code | Build liên tục lỗi nên Vercel vẫn phục vụ bản deploy cũ | Sau khi sửa lỗi build, deploy mới thành công |

---

## 5. Các lỗi nền tảng phát hiện khi thử nghiệm luồng đăng nhập thật (đợt 2)

Sau khi backend "chạy được", việc thử nghiệm đăng nhập thật đầu-cuối (không qua Demo Control) mới phát hiện 2 lỗi nghiêm trọng vốn đã tồn tại từ đầu nhưng chưa từng lộ ra:

| Lỗi | Triệu chứng | Nguyên nhân gốc | Cách sửa |
|---|---|---|---|
| **Kết nối Postgres chết giữa chừng** | `500 Internal Server Error`, log: `psycopg2.OperationalError: SSL connection has been closed unexpectedly` — thường xảy ra sau một khoảng "cold start" | SQLAlchemy engine không có `pool_pre_ping`; Neon tự đóng kết nối rảnh, nhưng warm serverless instance của Vercel vẫn giữ connection cũ (đã chết) trong pool | Thêm `pool_pre_ping=True` (tự kiểm tra & mở lại kết nối chết) và `pool_recycle=280` vào `create_engine()` trong `database.py` |
| **Cookie đăng nhập bị chặn cross-site** | `/api/login` trả `200 OK` thành công, nhưng `/api/me` ngay sau đó luôn trả `401` — đăng nhập xong bị đẩy về lại trang công khai | Cookie phiên được set `samesite="lax"`; vì frontend (`369-daotao.vercel.app`) và backend (`web369-backend.vercel.app`) là 2 domain khác nhau, trình duyệt **không gửi cookie `Lax` trên request `fetch()` cross-site** | Đổi `samesite="lax"` → `samesite="none"` (đã có sẵn `secure=True`); đồng bộ thuộc tính này ở cả `set_cookie` (login) và `delete_cookie` (logout) |

---

## 6. Các lỗi giao diện phát hiện sau khi có dữ liệu thật (đợt 2-3)

| Lỗi | Triệu chứng | Nguyên nhân | Cách sửa |
|---|---|---|---|
| Menu công khai đè lên menu thành viên | Sau khi đăng nhập, nửa bên trái header (Giới thiệu HTX, Lợi ích thành viên...) vẫn hiện & chặn click, dù JS đã cố ẩn nó | Class Tailwind `lg:flex` (theo breakpoint) luôn thắng class `hidden` do JS gắn thêm, ở màn hình ≥1024px — bug chỉ lộ khi DevTools đóng (đủ rộng màn hình); các lần test trước đó vô tình mở DevTools nên màn hình bị thu hẹp dưới breakpoint, che giấu lỗi | Chuyển sang gán trực tiếp `element.style.display` bằng JS thay vì toggle class — inline style luôn thắng class CSS thường |
| Hồ sơ 360° hiện dữ liệu demo giả | CCCD, Email của tài khoản Ban điều hành mặc định (vốn chưa từng điền các trường này) hiện ra đúng y hệt dữ liệu demo "Nguyễn Văn An" | Code có fallback hard-code (`state.user.email \|\| 'nguyenvanan@gmail.com'`) khi trường thật là `null` | Đổi toàn bộ fallback sang "Chưa cập nhật"; đồng thời phát hiện thêm "Ngày tham gia" chưa từng được JS cập nhật (luôn hiện cứng `15/01/2025`) — nối vào dữ liệu thật |
| Khối Huy hiệu/Chứng chỉ là mockup tĩnh | Nội dung giống hệt nhau cho mọi tài khoản, không đọc từ DB | DB chỉ lưu *số đếm* huy hiệu/chứng chỉ, chưa có bảng lưu nội dung/tên/mã cụ thể — đây là tính năng chưa xây, không phải lỗi | Gắn nhãn rõ **"Bản xem trước — sắp ra mắt"** lên cả 2 khối để không gây hiểu lầm; việc xây hệ thống thật (theo dõi tiến độ học, quy tắc trao huy hiệu) để làm dự án riêng sau |
| Thành viên thường xem được Sổ Đăng Ký (lỗ hổng phân quyền) | Bất kỳ ai đăng nhập (kể cả vai trò "Thành viên" thường) đều thấy trọn vẹn bảng quản trị thành viên (PII người khác + nút Duyệt/Sửa/Xóa/Reset MK) trong tab "Giao dịch HTX" | Khối HTML không được bọc điều kiện theo vai trò — chỉ có 1 dòng banner trang trí, không thực sự ẩn | Bọc toàn bộ khối trong `<div id="admin-member-registry-block" class="hidden">`, chỉ gỡ ẩn + gọi API khi `state.user.role` là Ban điều hành/Cán bộ quản lý |
| Trang trống hoàn toàn sau khi thao tác | Nhiều lần trang chủ/Cổng thành viên hiện trống trơn dưới header | **Không phải lỗi code** trong hầu hết trường hợp — do cache trình duyệt cũ (`Ctrl+Shift+R` luôn khắc phục được) | Xác lập quy trình chẩn đoán chuẩn: hard refresh trước, nếu còn lỗi mới xem Console/Network |

---

## 7. Tính năng bổ sung — Quản lý thành viên hoàn chỉnh (đợt 3)

Chuyển toàn bộ chức năng quản lý Sổ Đăng Ký Thành Viên từ demo/UI-only sang **thao tác thật, lưu Postgres**:

- **Cấp/Reset mật khẩu tạm** (`🔑`) — tách riêng khỏi "Duyệt", không đổi trạng thái hồ sơ; ép buộc đổi mật khẩu ở lần đăng nhập kế tiếp (`must_change_password`)
- **Sửa hồ sơ** (`✏️`) — full CRUD update, kiểm tra trùng SĐT trước khi lưu
- **Xóa hồ sơ** (`🗑️`) — có 2 lớp bảo vệ an toàn (không tự xóa chính mình, không xóa Ban điều hành cuối cùng)
- **Thêm thành viên mới** (`＋`) — admin tạo trực tiếp, không qua đơn đăng ký công khai; ID do server tự cấp (bỏ logic đoán ID sai ở client)
- **Trường "Vai Trò"** — thêm dropdown chọn 1 trong 4 cấp có sẵn (Thành viên / Tổ trưởng / Cán bộ quản lý / Ban điều hành) vào cả form Thêm và Sửa, có validate ở backend; bảng hiển thị thêm cột Vai Trò với màu phân biệt theo cấp

---

## 8. Tính năng bổ sung — Điều hướng & trải nghiệm (đợt 3)

- **Xem trang giới thiệu công khai khi đang đăng nhập:** trước đây đăng nhập xong là "khóa" hẳn vào Cổng thành viên, muốn xem lại trang công khai phải đăng xuất — trải nghiệm không tối ưu. Đã tách logic hiển thị menu khỏi trạng thái đăng nhập, gắn theo **tab đang xem**: thêm nút "🏠 Giới thiệu" trong menu thành viên, cho phép xem trang công khai mà vẫn giữ nguyên phiên đăng nhập (avatar, nút Đăng xuất không đổi).

---

## 9. Sự cố vận hành Git đáng chú ý (đợt 3)

Dự án có 2 file cùng tên `main.py` ở 2 vị trí khác nhau và vai trò khác hẳn nhau:
- `web369-backend/main.py` — **shim** ngắn, chỉ trỏ Vercel tới code thật
- `web369-backend/backend/app/main.py` — code app **FastAPI thật**, chứa toàn bộ route

Việc copy đè thủ công nhiều lần trong ngày dẫn tới **2 sự cố hoán đổi nhầm nội dung** giữa 2 file này (crash hoàn toàn, `ImportError`/`circular import`), phải dùng `Get-Content`/`Select-String` để xác minh nội dung từng file trước khi push, tránh đoán mò qua log Git. Bài học rút ra: khi 2 file trùng tên có vai trò khác nhau, nên đặt tên file tải xuống khác biệt rõ ràng (vd `BACKEND_APP_main.py`) để giảm rủi ro nhầm lẫn khi thao tác thủ công trên Windows.

---

## 10. Trạng thái hiện tại (cuối ngày 31/08)

- Backend chạy ổn định tại `web369-backend.vercel.app`, đã test đầu-cuối nhiều kịch bản: đăng ký → duyệt → đăng nhập → đổi mật khẩu → phân quyền khóa học theo vai trò → chặn theo trạng thái thành viên → cấp mật khẩu tạm → CRUD thành viên đầy đủ
- Frontend `369-daotao.vercel.app` đã nối 100% API thật cho toàn bộ luồng quản lý thành viên, không còn phần nào là demo (ngoại trừ khối Huy hiệu/Chứng chỉ đã được gắn nhãn rõ ràng là bản xem trước)
- Tài khoản Ban điều hành đầu tiên (`0903724242`) đã đổi mật khẩu khỏi giá trị mặc định
- Phân quyền frontend + backend đã khớp nhau: thành viên thường không còn thấy được giao diện/dữ liệu quản trị

## 11. Việc còn để ngỏ

- **Hệ thống Huy hiệu/Chứng chỉ thật** — cần thiết kế schema DB mới (tên, mã, ngày cấp, quy tắc trao) và logic theo dõi tiến độ học/quiz thật (hiện `submitLessonQuiz()` chỉ cộng điểm tạm trên trình duyệt, chưa lưu server) — phạm vi khá lớn, để làm dự án riêng khi cần
- **Sổ giao dịch HKD, hệ thống ticket hỗ trợ** — vẫn là demo/UI-only, chưa nối API thật
- **JWT là stateless** — đăng xuất chỉ xóa cookie phía client, không thu hồi được token đã cấp phía server nếu cần thiết lập lại bảo mật khẩn cấp
- **Tailwind qua CDN script-tag** (`cdn.tailwindcss.com`) — cảnh báo "should not be used in production" trên Console; chưa ảnh hưởng chức năng, nhưng nên build CSS thật khi có thời gian dọn dẹp production
- Repo frontend đang **dùng chung với web Sâm Bà Đen** (`sam-ba-den-web-system`, phân biệt bằng Root Directory `Web-369-dao-tao` trên Vercel) — cần thận trọng khi thao tác Git trong thư mục này để tránh ảnh hưởng chéo giữa 2 dự án
- Backend có 2 file cùng tên `main.py` ở 2 vị trí khác nhau (xem mục 9) — luôn xác minh nội dung bằng `Get-Content`/`Select-String` trước khi push để tránh lặp lại sự cố hoán đổi
