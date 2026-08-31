# Web369 Backend — Nhật ký xây dựng & deploy

**Ngày thực hiện:** 30-31/08/2026
**Repo backend:** `github.com/hominhsoniib/web369-backend` (private)
**Backend live:** `web369-backend.vercel.app`
**Repo frontend:** `github.com/hominhsoniib/sam-ba-den-web-system` (dùng chung với web Sâm Bà Đen — Root Directory `Web-369-dao-tao`)
**Frontend live:** `369-daotao.vercel.app`

---

## 1. Bối cảnh

Bản demo `369-daotao.vercel.app` ban đầu (file `index.html` duy nhất) chạy hoàn toàn bằng **JS giả lập phía trình duyệt** — đăng nhập, phân quyền khóa học, sổ đăng ký thành viên đều là dữ liệu cứng trong code, ai mở DevTools cũng sửa được, không có backend thật.

Mục tiêu: viết backend thật thay cho toàn bộ phần giả lập, đặc biệt là **Tầng 2-3-4 trong mô hình bảo mật đã chốt** (Membership status → Role → Course Permission).

---

## 2. Kiến trúc backend

Dùng lại đúng bộ công nghệ đã chứng minh ổn định ở dự án HKD trước đó — **FastAPI + Postgres (Neon) + JWT (cookie httponly) + Vercel** — để đồng bộ hạ tầng, dễ bảo trì.

**Bảng dữ liệu chính:**
- `members` — id (`HTX369-xxxx`), tên, SĐT, mật khẩu (bcrypt), CCCD, loại thành viên, **trạng thái** (Chính thức/Đang chờ xác nhận/Tạm ngừng/Đã chấm dứt...), **vai trò** (Thành viên/Tổ trưởng/Cán bộ quản lý/Ban điều hành), vốn góp, điểm năng lực, chứng chỉ, huy hiệu
- `courses` — gắn `min_role` cho từng khóa, server tự lọc theo vai trò người xem

**API chính:**

| Endpoint | Chức năng |
|---|---|
| `POST /api/register` | Nộp đơn tham gia HTX — tạo hồ sơ, status = "Đang chờ xác nhận" |
| `POST /api/login` | Xác thực SĐT + mật khẩu (bcrypt), cấp cookie JWT |
| `GET /api/me` | Lấy thông tin phiên hiện tại |
| `POST /api/change-password` | Đổi mật khẩu (yêu cầu đúng mật khẩu cũ) |
| `GET /api/courses` | Danh sách khóa học, **khóa/mở theo vai trò thật ở server** — mô tả chi tiết bị ẩn hoàn toàn nếu không đủ quyền |
| `POST /api/admin/approve-member` | Duyệt hồ sơ (chỉ Ban điều hành/Cán bộ quản lý), sinh mật khẩu tạm 6 số, hiện 1 lần duy nhất |
| `GET /api/admin/members` | Sổ đăng ký thành viên đầy đủ (chỉ Ban điều hành/Cán bộ quản lý) |

**Cơ chế khởi tạo (bootstrap):** DB mới hoàn toàn trống sẽ tự động tạo 1 tài khoản **Ban điều hành mặc định** (SĐT/mật khẩu đặt qua biến môi trường `BOOTSTRAP_ADMIN_PHONE`/`BOOTSTRAP_ADMIN_PASSWORD`, mặc định `0900000000`/`admin123` nếu không đặt) — nếu không có bước này, không ai duyệt được thành viên đầu tiên (lỗi "con gà quả trứng").

---

## 3. Nối frontend với backend thật

Sửa `index.html` để gọi API thật thay JS giả lập:
- Đăng nhập/đăng ký/đổi mật khẩu/đăng xuất → gọi đúng API, không còn tìm trong mảng JS cứng
- Khóa học Tổ trưởng/Cán bộ quản lý → khóa thật ở server (`GET /api/courses`), không phải so sánh `state.user.role` phía client
- Sổ đăng ký thành viên → nạp thật từ `GET /api/admin/members`, có nút **"✅ Duyệt"** gọi API thật

**Cơ chế dự phòng khi API lỗi:** nếu không gọi được backend (mất mạng, lỗi quyền...), trang **không được để trống** — hiện dữ liệu mẫu (`defaultMemberList`) kèm **banner đỏ cảnh báo rõ** "ĐANG XEM DỮ LIỆU DEMO — KHÔNG PHẢI THẬT", và các thao tác Duyệt/Đăng ký trong tình huống lỗi thật sẽ báo đúng lỗi, **không giả vờ thành công**.

---

## 4. Các sự cố gặp phải khi deploy (và cách đã sửa)

| Sự cố | Nguyên nhân | Cách sửa |
|---|---|---|
| `passlib`/`bcrypt` lỗi tương thích | Bug đã biết giữa `passlib 1.7.4` và `bcrypt >=4.x` | Bỏ `passlib`, dùng thẳng thư viện `bcrypt` |
| Seed khóa học không chạy trong test | Gắn seed vào sự kiện `startup` của ASGI, không đáng tin cậy | Chuyển seed chạy ngay lúc import module (giống cách `Base.metadata.create_all` đã làm ở HKD) |
| CORS chặn cookie khi frontend/backend khác domain | `allow_origins=["*"]` không hợp lệ khi `allow_credentials=True` | Đổi sang `allow_origin_regex=".*"` để Starlette phản chiếu đúng Origin |
| Mã thành viên đầu tiên ra số lẻ (`HTX369-0083`) | Logic sinh ID kế thừa offset `+82` từ dữ liệu demo cũ, không còn hợp lý khi có tài khoản bootstrap ở `0001` | Đổi công thức sinh ID về `count + 1` |
| `git init`/`git add` chạy nhầm thư mục (`C:\Users\...`) | `cd` vào đường dẫn sai (thư mục Bước 1 tạo không đúng chỗ) do gõ nhầm path, PowerShell không dừng khi `cd` lỗi | Xoá `.git` tạo nhầm, tìm đúng thư mục bằng `Get-ChildItem`, làm lại |
| `Custom Prefix` khi nối Neon báo lỗi ký tự không hợp lệ | Tự động điền tên có dấu gạch ngang (`web369-db`) | Sửa tay thành `DATABASE` |
| Nối Neon báo trùng biến `DATABASE_URL` | Biến rỗng đã được thêm sẵn lúc tạo project trên Vercel | Xoá biến rỗng ở Environment Variables trước, nối lại |
| **Build frontend lỗi liên tục 5 lần** (`Error: pattern "main.py" ... doesn't match any Serverless Functions`) | 4 file backend (`main.py`, `vercel.json`, `requirements.txt`, `.python-version`) bị giải nén nhầm thẳng vào gốc thư mục frontend `Web-369-dao-tao` từ một thao tác trước đó, khiến Vercel hiểu nhầm đây là dự án Python có function | Xoá 4 file rác đó khỏi gốc frontend, giữ nguyên thư mục con `web369-backend/` |
| Trang hiện dữ liệu demo cũ dù đã sửa code | Build liên tục lỗi (do sự cố trên) nên Vercel vẫn phục vụ bản deploy cũ từ trước, không phải do cache trình duyệt | Sau khi sửa lỗi build, deploy mới thành công, dữ liệu thật hiện đúng |

---

## 5. Trạng thái hiện tại

- Backend chạy ổn định tại `web369-backend.vercel.app`, đã test qua nhiều kịch bản (đăng ký → duyệt → đăng nhập → đổi mật khẩu → phân quyền khóa học theo vai trò → chặn theo trạng thái thành viên)
- Frontend `369-daotao.vercel.app` đã nối đúng API thật, không còn phụ thuộc JS giả lập cho các luồng cốt lõi
- Tài khoản Ban điều hành đầu tiên (`0903724242`) đã đổi mật khẩu khỏi giá trị mặc định
- Đã thử nghiệm thật: thêm 2 thành viên mới qua form Đơn đăng ký, xác nhận lưu bền vững trên Postgres

## 6. Việc còn để ngỏ

- Nút Sửa/Xóa thành viên tùy ý, sổ giao dịch HKD hiển thị trong Cổng thành viên, hệ thống ticket hỗ trợ — **vẫn là demo/UI-only**, chưa nối API thật (ngoài phạm vi yêu cầu ban đầu, có thể làm sau nếu cần)
- JWT là stateless — đăng xuất chỉ xóa cookie phía client, không thu hồi được token đã cấp phía server nếu cần thiết lập lại bảo mật khẩn cấp
- Repo frontend đang **dùng chung với web Sâm Bà Đen** (`sam-ba-den-web-system`, phân biệt bằng Root Directory `Web-369-dao-tao` trên Vercel) — cần thận trọng khi thao tác Git trong thư mục này để tránh ảnh hưởng chéo giữa 2 dự án
