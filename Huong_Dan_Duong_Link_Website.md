# DANH SÁCH ĐƯỜNG DẪN TRUY CẬP HỆ THỐNG SÂM BÀ ĐEN

Bản đồ liên kết các Website và Cổng thông tin phục vụ phát triển cục bộ (Local Development).

---

## 1. Danh sách đường dẫn nhanh

### 🌐 [Landing Page Giới Thiệu & Thu Thập Lead](http://localhost:8000/landing/index.html)
- **Đường dẫn**: [http://localhost:8000/landing/index.html](http://localhost:8000/landing/index.html)
- **Chức năng**: Giới thiệu sâm dược liệu đạt chuẩn VietGAP/GlobalGAP, vùng trồng Tây Ninh, nạp sản phẩm/bài viết động và tiếp nhận form đăng ký đại lý/tư vấn.
- **Tài khoản**: Điền thông tin tùy ý để gửi lead kiểm thử.

### 🛒 [Website B2C & Portal Đại Lý B2B](http://localhost:5174)
- **Đường dẫn Trang chủ (B2C)**: [http://localhost:5174](http://localhost:5174)
- **Đường dẫn Cổng Đại Lý**: [http://localhost:5174/portal/login](http://localhost:5174/portal/login)
- **Chức năng**: Cổng thông tin dành cho các đại lý để đặt hàng với chiết khấu theo cấp đại lý, theo dõi hóa đơn công nợ và thanh toán trực tuyến qua VNPay.
- **Tài khoản Đại lý test**: 
  - **Email**: `dealer@sambaden.vn`
  - **Mật khẩu**: `Dealer@123456`

### ⚙️ [Hệ Thống Quản Trị Nội Bộ (Admin CMS)](http://localhost:5175)
- **Đường dẫn**: [http://localhost:5175](http://localhost:5175)
- **Chức năng**: Hệ thống quản trị nội bộ dành cho BDG, Admin, nhân viên Sales, kế toán và biên tập viên nội dung để duyệt lead, xem khách hàng, duyệt đơn hàng và sản phẩm.
- **Tài khoản Admin**: 
  - **Email**: `admin@sambaden.vn`
  - **Mật khẩu**: `Admin@123456`

### 📖 [Tài Liệu API Backend (Swagger UI)](http://localhost:8000/docs)
- **Đường dẫn**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Chức năng**: Swagger API doc cho nhà phát triển để theo dõi và kiểm thử tích hợp các cổng kết nối API.

---

## 2. Hướng dẫn các bước phối hợp kiểm thử liên thông (End-to-End)

1. **Bước 1: Khách hàng đăng ký trên Landing Page**
   - Truy cập [Landing Page](http://localhost:8000/landing/index.html).
   - Điền form liên hệ chọn nhu cầu "Đăng ký làm đại lý" và viết lời nhắn. Bấm **Gửi thông tin**.
   
2. **Bước 2: Phê duyệt thông tin tại Admin CMS**
   - Truy cập [Admin CMS](http://localhost:5175) và đăng nhập bằng tài khoản Admin.
   - Vào menu **Quản lý Lead** để xác nhận thông tin lead mới gửi về (với nhãn nguồn đẹp mắt từ Landing Page).
   - Bấm **Chuyển đổi thành khách hàng** (convert lead) để nâng cấp thành khách hàng/đại lý chính thức.

3. **Bước 3: Đại lý thực hiện đặt hàng trên Portal**
   - Truy cập [Cổng đại lý B2B](http://localhost:5174/portal/login) và đăng nhập bằng tài khoản đại lý test.
   - Tiến hành chọn mua sản phẩm sâm, tạo đơn hàng và thanh toán trực tuyến qua cổng VNPay giả lập.

4. **Bước 4: Xử lý đơn hàng tại Admin CMS**
   - Vào mục **Đơn hàng** trên [Admin CMS](http://localhost:5175) để tiến hành duyệt đơn hàng, xác nhận xuất kho và xem công nợ ghi sổ tự động tại menu **Đại lý B2B**.
