# SƠ ĐỒ HƯỚNG DẪN SỬ DỤNG (HDSD)
# PHẦN MỀM QUẢN LÝ ĐỀ XUẤT – NGÂN SÁCH

*Tài liệu dành cho người dùng: CEO/CFO, Trưởng phòng ban, Nhân viên, Kế toán.*
*Không phải tài liệu kỹ thuật — chỉ hướng dẫn "làm gì, ở đâu, khi nào".*

---

## 1. Mục lục HDSD (dự kiến các chương)

```
Chương 1 — Đăng nhập & Tổng quan giao diện
Chương 2 — Xem ngân sách phòng ban (dành cho mọi vai trò)
Chương 3 — Tạo một Đề xuất mới
Chương 4 — Trường hợp Đề xuất TRONG ngân sách
Chương 5 — Trường hợp Đề xuất NGOÀI ngân sách (Thuyết minh)
Chương 6 — Phê duyệt Đề xuất (dành cho Trưởng phòng/CEO/CFO)
Chương 7 — Theo dõi trạng thái Đề xuất của tôi
Chương 8 — Cấp/Điều chỉnh Ngân sách (dành cho CEO/CFO)
Chương 9 — Xem báo cáo & lịch sử điều chỉnh ngân sách
Chương 10 — Câu hỏi thường gặp (FAQ)
```

---

## 2. Sơ đồ theo VAI TRÒ — ai làm gì trên phần mềm

```
┌─────────────────────────────────────────────────────────────┐
│                        NHÂN VIÊN                             │
│  • Xem ngân sách còn lại của phòng mình                      │
│  • Tạo đề xuất                                                │
│  • Điền thuyết minh nếu bị báo "ngoài ngân sách"              │
│  • Theo dõi trạng thái đề xuất đã gửi                         │
└─────────────────────────────────────────────────────────────┘
                            ↓ gửi đề xuất
┌─────────────────────────────────────────────────────────────┐
│                     TRƯỞNG PHÒNG BAN                          │
│  • Xem toàn bộ đề xuất của phòng mình                         │
│  • Phê duyệt / Từ chối đề xuất trong hạn mức của mình          │
│  • Xem ngân sách phòng: đã dùng / còn lại                     │
└─────────────────────────────────────────────────────────────┘
                            ↓ đề xuất vượt hạn mức / ngoài NS
┌─────────────────────────────────────────────────────────────┐
│                      CEO / CFO                                │
│  • Cấp ngân sách đầu kỳ cho từng phòng ban                    │
│  • Phê duyệt các đề xuất vượt hạn mức Trưởng phòng             │
│  • Phê duyệt các đề xuất NGOÀI ngân sách (có thuyết minh)      │
│  • Xem báo cáo tổng thể toàn công ty                          │
└─────────────────────────────────────────────────────────────┘
                            ↓ đề xuất đã duyệt
┌─────────────────────────────────────────────────────────────┐
│                       KẾ TOÁN                                 │
│  • Xem danh sách đề xuất đã duyệt → chi tiền                  │
│  • Ghi nhận đã chi thực tế                                    │
│  • Đối chiếu ngân sách đã cấp / đã dùng cuối kỳ                │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Sơ đồ QUY TRÌNH SỬ DỤNG — theo bước màn hình

### Bước A — Nhân viên tạo đề xuất

```
[Màn hình chính]
      ↓ bấm "Tạo đề xuất mới"
[Form đề xuất]
  - Chọn phòng ban / khoản mục
  - Nhập số tiền
  - Nhập lý do đề xuất
      ↓ bấm "Kiểm tra ngân sách"
[Hệ thống tự hiện]
  ✅ "Còn X đồng trong ngân sách — có thể gửi phê duyệt"
      hoặc
  ⚠️ "Vượt ngân sách Y đồng — cần thuyết minh trước khi gửi"
```

### Bước B — Nếu TRONG ngân sách (trường hợp thường gặp nhất)

```
[Form đề xuất — hiện dấu ✅]
      ↓ bấm "Gửi phê duyệt"
[Đề xuất chuyển tới Trưởng phòng]
      ↓ Trưởng phòng bấm "Duyệt" hoặc "Từ chối"
[Nhân viên nhận thông báo kết quả]
      ↓ nếu Duyệt
[Kế toán thấy đề xuất trong danh sách "Đã duyệt — chờ chi"]
```

### Bước C — Nếu NGOÀI ngân sách (trường hợp phát sinh)

```
[Form đề xuất — hiện dấu ⚠️]
      ↓ bấm "Điền thuyết minh"
[Form Thuyết minh — 8 mục]
  1. Vấn đề phát sinh là gì?
  2. Vì sao kế hoạch đầu năm không dự kiến việc này?
  3. Vì sao bắt buộc phải chi khoản này?
  4. Nếu KHÔNG chi thì ảnh hưởng gì?
  5. Số tiền cần thêm là bao nhiêu?
  6. Đề nghị lấy từ nguồn ngân sách nào?
  7. Hiệu quả mong đợi khi chi khoản này?
  8. Có cách nào tiết giảm/thay thế không? (không bắt buộc)
      ↓ bấm "Gửi thuyết minh"
[Đề xuất chuyển thẳng lên CEO/CFO]
      ↓ CEO/CFO xem thuyết minh, bấm "Duyệt bổ sung ngân sách" hoặc "Từ chối"
[Nếu Duyệt]
  → Ngân sách phòng ban được cộng thêm tự động
  → Đề xuất quay lại luồng phê duyệt bình thường (Bước B)
```

### Bước D — CEO/CFO cấp ngân sách đầu kỳ

```
[Màn hình "Ngân sách"]
      ↓ bấm "Cấp ngân sách mới"
[Chọn kỳ: Quý/Năm]
[Chọn phòng ban]
[Nhập số tiền cấp theo từng khoản mục]
      ↓ bấm "Lưu"
[Trưởng phòng phòng đó thấy ngay ngân sách mới khi đăng nhập]
```

---

## 4. Sơ đồ MÀN HÌNH CHÍNH (bố cục dự kiến, chưa phải thiết kế cuối)

```
┌───────────────────────────────────────────────────────────┐
│  [Logo]     Đề xuất – Ngân sách        [Tên user ▾]        │
├───────────────────────────────────────────────────────────┤
│  📊 Ngân sách phòng tôi                                     │
│      Đã cấp: 500tr   Đã dùng: 200tr   Còn lại: 300tr        │
│                                                               │
│  📄 Đề xuất của tôi                     [+ Tạo đề xuất mới]  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Mã ĐX │ Nội dung        │ Số tiền │ Trạng thái        │  │
│  │ DX-01 │ Thuê agency...  │ 300tr   │ ✅ Đã duyệt        │  │
│  │ DX-02 │ Sự kiện ra mắt  │ 1 tỷ    │ ⚠️ Chờ thuyết minh │  │
│  │ DX-03 │ In POSM         │ 50tr    │ 🕒 Chờ duyệt       │  │
│  └─────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────┘
```

---

## 5. Bảng trạng thái đề xuất — giải nghĩa cho người dùng

| Ký hiệu | Trạng thái | Ý nghĩa với người dùng |
|---|---|---|
| 📝 | Nháp | Chưa gửi, còn sửa được |
| 🕒 | Chờ duyệt | Đã gửi, đang chờ cấp có thẩm quyền |
| ⚠️ | Chờ thuyết minh | Vượt ngân sách, cần điền 8 mục trước khi gửi tiếp |
| 🔒 | Chờ duyệt bổ sung | Đã điền thuyết minh, đang chờ CEO/CFO |
| ✅ | Đã duyệt | Có thể chi, kế toán sẽ xử lý |
| 💵 | Đã chi | Kế toán đã ghi nhận chi thực tế |
| ❌ | Từ chối | Không được thực hiện |

---

## 6. Ghi chú cho người viết nội dung chi tiết từng chương

Mỗi chương ở Mục 1 khi viết đầy đủ nên có cấu trúc thống nhất:
- Ảnh chụp màn hình thực tế (chưa có ở bước sơ đồ này)
- Các bước thao tác đánh số 1-2-3
- Lưu ý/cảnh báo thường gặp (ví dụ: "không thấy nút Duyệt" → do không đúng hạn mức thẩm quyền)
- 1 câu hỏi FAQ liên quan đặt cuối chương

**Việc cần anh xác nhận trước khi viết HDSD chi tiết từng chương:** phần mềm đã có giao diện thật (để chụp màn hình) hay đang ở giai đoạn thiết kế — nếu chưa có UI, HDSD này nên dùng làm **bản đặc tả giao diện cho đội thiết kế**, viết chi tiết xong mới quay lại làm HDSD thật cho người dùng.
