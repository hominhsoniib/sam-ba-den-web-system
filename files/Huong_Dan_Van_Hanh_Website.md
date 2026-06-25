# HƯỚNG DẪN VẬN HÀNH — Website Sâm Bà Đen
## Cách chạy Backend (FastAPI) và Frontend (React) trên máy của bạn

> Tài liệu dành cho người mới: làm theo từng bước, không cần kinh nghiệm lập trình.
> Hai phần cần chạy: **Backend** (máy chủ xử lý dữ liệu) và **Frontend** (giao diện đăng nhập + bảng điều khiển).

---

## PHẦN A — CHUẨN BỊ MÁY (chỉ làm 1 lần)

Bạn cần cài 2 phần mềm: **Docker Desktop** và **Node.js**.

### A.1. Cài Docker Desktop (để chạy Backend)

Docker giúp chạy máy chủ + cơ sở dữ liệu chỉ bằng một lệnh, không phải cài thủ công PostgreSQL/Redis.

| Hệ điều hành | Tải tại |
| :--- | :--- |
| Windows | https://www.docker.com/products/docker-desktop (chọn Windows) |
| macOS | https://www.docker.com/products/docker-desktop (chọn Mac — đúng loại chip Intel/Apple Silicon) |

Sau khi cài:
1. Mở **Docker Desktop**, đợi đến khi góc dưới hiện trạng thái **"Engine running"** (màu xanh).
2. Kiểm tra: mở **Terminal** (macOS) hoặc **PowerShell** (Windows), gõ:
   ```bash
   docker --version
   ```
   Nếu hiện ra dòng kiểu `Docker version 27.x.x` là thành công.

> **Windows lưu ý:** nếu Docker báo cần "WSL 2", bấm theo hướng dẫn của Docker để cài WSL2 (Docker tự hướng dẫn), khởi động lại máy rồi mở lại Docker Desktop.

### A.2. Cài Node.js (để chạy Frontend)

1. Vào https://nodejs.org → tải bản **LTS** (khuyến nghị, ví dụ 20.x).
2. Cài như phần mềm thông thường (bấm Next liên tục).
3. Kiểm tra: mở Terminal/PowerShell, gõ:
   ```bash
   node --version
   ```
   Hiện `v20.x.x` (hoặc cao hơn) là đạt.

---

## PHẦN B — GIẢI NÉN MÃ NGUỒN

1. Giải nén 2 file đã nhận:
   - `sambaden-backend-core.zip` → ra thư mục **backend**
   - `sambaden-admin-cms.zip` → ra thư mục **admin-cms**
2. Đặt cả hai vào cùng một nơi dễ tìm, ví dụ:
   ```
   D:\sambaden\backend
   D:\sambaden\admin-cms
   ```
   (macOS ví dụ: `~/sambaden/backend` và `~/sambaden/admin-cms`)

---

## PHẦN C — CHẠY BACKEND (máy chủ)

> Mở **một** cửa sổ Terminal/PowerShell cho riêng Backend. Để nguyên cửa sổ này chạy suốt.

### C.1. Di chuyển vào thư mục backend
Gõ `cd ` (có dấu cách) rồi kéo-thả thư mục **backend** vào cửa sổ, Enter. Ví dụ:
```bash
cd D:\sambaden\backend
```

### C.2. Tạo file cấu hình
- **Windows (PowerShell):**
  ```powershell
  copy .env.example .env
  ```
- **macOS/Linux:**
  ```bash
  cp .env.example .env
  ```

### C.3. Khởi động (Docker tự cài Postgres + Redis + API)
```bash
docker compose up --build
```
- Lần đầu sẽ tải về và mất vài phút. Đợi đến khi thấy dòng:
  ```
  Application startup complete.
  Uvicorn running on http://0.0.0.0:8000
  ```
- Khi thấy dòng `Seed xong. Đăng nhập: admin@sambaden.vn / Admin@123456` nghĩa là dữ liệu mẫu đã tạo.

### C.4. Kiểm tra Backend đang sống
Mở trình duyệt vào: **http://localhost:8000/docs**
→ Hiện trang tài liệu API (Swagger) màu trắng là Backend đã chạy đúng.

> **Để dừng Backend:** quay lại cửa sổ này, bấm `Ctrl + C`.
> **Chạy lại lần sau:** chỉ cần `docker compose up` (không cần `--build`).

---

## PHẦN D — CHẠY FRONTEND (giao diện)

> Mở **cửa sổ Terminal/PowerShell THỨ HAI** (giữ nguyên cửa sổ Backend ở Phần C).

### D.1. Vào thư mục admin-cms
```bash
cd D:\sambaden\admin-cms
```

### D.2. Tạo file cấu hình
- **Windows:** `copy .env.example .env`
- **macOS/Linux:** `cp .env.example .env`

### D.3. Cài thư viện giao diện (chỉ lần đầu)
```bash
npm install
```
Đợi vài phút cho tải xong.

### D.4. Chạy giao diện
```bash
npm run dev
```
Thấy dòng:
```
➜  Local:   http://localhost:5173/
```
→ Mở trình duyệt vào **http://localhost:5173**

---

## PHẦN E — ĐĂNG NHẬP & SỬ DỤNG

1. Trang đăng nhập hiện ra (nền xanh, thương hiệu Sâm Bà Đen bên trái).
2. Tài khoản đã điền sẵn:
   ```
   Email:    admin@sambaden.vn
   Mật khẩu: Admin@123456
   ```
3. Bấm **Đăng nhập** → vào **Bảng điều khiển**.

Bảng điều khiển hiển thị: lời chào theo tên, số quyền được cấp, trạng thái **"Đã kết nối"** API, và danh sách khu vực truy cập theo phân quyền.

> Nếu đăng nhập được và thấy "Đã kết nối" → **Backend và Frontend đã chạy thông suốt với nhau.**

---

## PHẦN F — TÓM TẮT LỆNH (lần chạy sau)

Mỗi lần muốn mở website, làm 2 cửa sổ:

**Cửa sổ 1 — Backend:**
```bash
cd <thư mục>/backend
docker compose up
```

**Cửa sổ 2 — Frontend:**
```bash
cd <thư mục>/admin-cms
npm run dev
```
Rồi mở http://localhost:5173

---

## PHẦN G — XỬ LÝ LỖI THƯỜNG GẶP

| Hiện tượng | Nguyên nhân | Cách xử lý |
| :--- | :--- | :--- |
| Giao diện báo *"Không kết nối được máy chủ"* | Backend chưa chạy | Kiểm tra cửa sổ Backend còn chạy không; mở http://localhost:8000/docs để xác nhận |
| `docker: command not found` | Chưa cài Docker hoặc chưa mở Docker Desktop | Mở Docker Desktop, đợi "Engine running", thử lại |
| `port 8000 already in use` | Cổng 8000 đang bị chiếm | Đóng ứng dụng đang dùng cổng 8000, hoặc tắt tiến trình cũ rồi chạy lại |
| `port 5173 already in use` | Đã mở Frontend ở cửa sổ khác | Đóng cửa sổ Frontend cũ rồi chạy lại; hoặc Vite tự đề nghị cổng khác — bấm `y` |
| `npm: command not found` | Chưa cài Node.js | Cài Node.js (Phần A.2), mở lại Terminal |
| Đăng nhập báo *"Email hoặc mật khẩu không đúng"* | Gõ sai | Dùng đúng `admin@sambaden.vn` / `Admin@123456` |
| Docker tải rất chậm/lỗi mạng | Mạng chặn | Thử mạng khác; hoặc đợi và chạy lại `docker compose up --build` |
| Trang trắng, không hiện gì | Frontend chưa build xong | Đợi dòng `Local: http://localhost:5173`, tải lại trang |
| Windows: chữ tiếng Việt trong terminal bị lỗi | Mã ký tự terminal | Không ảnh hưởng chạy; bỏ qua |

---

## PHẦN H — CÂU HỎI THƯỜNG GẶP

**1. Phải mở mấy cửa sổ Terminal?**
Hai: một cho Backend (Phần C), một cho Frontend (Phần D). Giữ cả hai mở khi dùng.

**2. Tắt máy rồi mở lại có mất dữ liệu không?**
Không. Dữ liệu lưu trong Docker (ổ `pgdata`). Lần sau chạy `docker compose up` là có lại.

**3. Đổi mật khẩu admin được không?**
Được — nhưng ở giai đoạn này tài khoản tạo tự động khi khởi động. Việc đổi mật khẩu/ thêm người dùng sẽ làm qua màn hình "Quản trị người dùng" khi module đó được hoàn thiện.

**4. Đây đã là bản chính thức để đưa lên mạng chưa?**
Chưa. Đây là bản chạy thử trên máy (localhost). Để đưa lên Internet cho người khác truy cập cần bước **triển khai (deploy)** lên máy chủ/dịch vụ đám mây — sẽ có hướng dẫn riêng khi anh sẵn sàng.

**5. Backend và Frontend khác nhau thế nào?**
- **Backend** = bộ não: lưu dữ liệu, xử lý đăng nhập, phân quyền (cổng 8000).
- **Frontend** = bộ mặt: trang web bạn nhìn và bấm (cổng 5173).
Frontend gọi sang Backend để lấy/ghi dữ liệu.

---

## PHẦN I — CHECKLIST NHANH

- [ ] Đã cài Docker Desktop, đang "Engine running"
- [ ] Đã cài Node.js (`node --version` ra số)
- [ ] Đã giải nén backend + admin-cms
- [ ] Backend: `cp .env.example .env` → `docker compose up --build`
- [ ] Mở được http://localhost:8000/docs
- [ ] Frontend: `cp .env.example .env` → `npm install` → `npm run dev`
- [ ] Mở được http://localhost:5173
- [ ] Đăng nhập `admin@sambaden.vn` / `Admin@123456`
- [ ] Thấy "Đã kết nối" trên Bảng điều khiển ✅

*Hoàn tất hướng dẫn vận hành. Nếu kẹt ở bước nào, chụp màn hình dòng lỗi để được hỗ trợ nhanh.*
