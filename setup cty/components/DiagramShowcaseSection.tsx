"use client";

import { useState } from "react";
import { useReveal } from "./useReveal";

type DiagramItem = {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  imageSrc: string;
  pdfSrc?: string;
  pdfFileName?: string;
  highlights: string[];
  takeaways: string;
};

const DIAGRAMS: DiagramItem[] = [
  {
    id: "he-sinh-thai-1",
    category: "1. HỆ SINH THÁI — Master 11 Mô-đun",
    title: "Sơ Đồ Master Hệ Sinh Thái 11 Mô-đun Quản Trị Doanh Nghiệp Số Hóa",
    subtitle: "Liên thông 11 phân hệ nghiệp vụ từ Chiến lược KHKD đến CEO Dashboard",
    imageSrc: "/diagrams/tom_tat_he_sinh_thai_1.png",
    pdfSrc: "/docs/so_do_he_sinh_thai_v2.pdf",
    pdfFileName: "so do he sinh thai v2.pdf",
    highlights: [
      "Kiến trúc 4 lớp thống nhất: Lớp Kế hoạch - Tài chính (Mod 01-06) → Lớp Vận hành QLCV Core Hub (Mod 07) → Lớp Kinh doanh & Con người (Mod 08-11) → Lớp Nền tảng Dữ liệu Dùng chung",
      "Lấy PM QLCV (Mod 07) làm 'Bộ não điều hành trung tâm' kết nối dữ liệu KHKD, MA, Ngân sách, CRM, DMS, Lương 3P và CEO Dashboard",
      "Nền tảng Data Warehouse/Lake tập trung, tích hợp AI Copilot & 4 Trụ cột Bảo mật (SSO 2FA, Role-based ACL, Encrypted Audit Log)"
    ],
    takeaways: "Dành cho NĐT/KH: Chứng minh giải pháp quản trị số hóa 100% khép kín, loại bỏ hoàn toàn số liệu rời rạc giữa các phòng ban."
  },
  {
    id: "he-sinh-thai-2",
    category: "2. HỆ SINH THÁI — Luồng Vận Hành",
    title: "Sơ Đồ Tổng Quan Luồng Vận Hành Liên Thông Hệ Sinh Thái Số Hóa",
    subtitle: "Điểm gốc từ Kế hoạch Kinh doanh, Điểm hội tụ tại CEO Dashboard",
    imageSrc: "/diagrams/tom_tat_he_sinh_thai_2.png",
    pdfSrc: "/docs/so_do_he_sinh_thai.pdf",
    pdfFileName: "so do he sinh thai.pdf",
    highlights: [
      "Luồng dữ liệu liên thông Single Source of Truth: Một thông tin khách hàng hay đơn hàng bước vào ở CRM/DMS sẽ đồng hành xuyên suốt Báo giá → Đơn hàng → Xuất kho → Giao hàng → Báo cáo BI",
      "Chu trình cải tiến liên tục PDCA (Plan → Do → Check → Act) tự động đối chiếu số liệu Kế hoạch vs Thực tế (KH vs TH) để cảnh báo rủi ro thâm hụt tài chính",
      "Tối ưu hóa nguồn lực, tăng năng suất lao động toàn công ty và thúc đẩy tăng trưởng doanh thu bền vững"
    ],
    takeaways: "Dành cho NĐT/KH: Giúp Ban lãnh đạo đưa ra quyết định điều hành chính xác 100% dựa trên dữ liệu thật thay vì báo cáo cảm tính."
  },
  {
    id: "nexus-hr-toan-dien",
    category: "3. HR — Quản Trị Nhân Sự All-in-One",
    title: "Sơ Đồ Master NEXUS-HR — Hệ Thống Quản Trị Nhân Sự Toàn Diện",
    subtitle: "Quản lý vòng đời nhân sự 11 khối từ Tuyển dụng → Chấm công → Tính lương C&B → Đánh giá & Đào tạo",
    imageSrc: "/diagrams/so_do_nexus_hr_toan_dien.png",
    pdfSrc: "/docs/NEXUS-HR.pdf",
    pdfFileName: "NEXUS-HR.pdf",
    highlights: [
      "Quy trình Tuyển dụng 6 bước (Nhu cầu → Đăng tuyển → Sàng lọc → Phỏng vấn → Offer) & Quản lý Hồ sơ nhân viên, Hợp đồng, BHXH, Thuế TNCN",
      "Hệ thống Chấm công đa phương thức (Vân tay, Face ID, GPS Mobile App) tự động tổng hợp công, phép, OT để kết nối trực tiếp với Payroll tính lương",
      "Cổng thông tin tự phục vụ nhân viên (Employee Portal ESS) xem phiếu lương, đăng ký nghỉ phép online & Đánh giá hiệu suất KPI/OKR kèm Lộ trình thăng tiến IDP"
    ],
    takeaways: "Dành cho NĐT/KH: Tự động hóa 100% nghiệp vụ C&B, giảm thiểu sai sót tính lương và nâng cao tỷ lệ giữ chân nhân tài."
  },
  {
    id: "hr-3p",
    category: "4. HR — Lương 3P & Đòn Bẩy",
    title: "Sơ Đồ Lương 3P & Khung Đòn Bẩy Động Lực Nhân Sự",
    subtitle: "P1 Position – P2 Person – P3 Performance lấy dữ liệu thật",
    imageSrc: "/diagrams/so_do_3p.png",
    pdfSrc: "/docs/3P_so_do.pdf",
    pdfFileName: "3P_so do.pdf",
    highlights: [
      "P1 theo Giá trị vị trí, P2 theo Năng lực cá nhân, P3 theo Hiệu suất thật từ QLCV",
      "Loại bỏ hoàn toàn đánh giá cảm tính, trả lương công bằng 100%",
      "Chuỗi đòn bẩy: Trả lương đúng → Tạo động lực → Tăng năng suất"
    ],
    takeaways: "Dành cho NĐT/KH: Thu hút và giữ chân nhân tài bằng cơ chế minh bạch và công bằng."
  },
  {
    id: "nexus-analytics-mindmap",
    category: "5. ANALYTICS — Sơ Đồ Trí Tuệ",
    title: "Sơ Đồ Trí Tuệ NEXUS Analytics — Phân Tích Tài Chính & Định Giá (Chuẩn CFA & Big4)",
    subtitle: "Xếp hạng doanh nghiệp A+ đến D & Mô hình Định giá Fair Value chuyên nghiệp",
    imageSrc: "/diagrams/so_do_nexus_analytics_mindmap.png",
    pdfSrc: "/docs/pt-bctc.pdf",
    pdfFileName: "pt-bctc.pdf",
    highlights: [
      "Chuẩn hóa dữ liệu BCTC tự động theo Thông tư 200/2014/TT-BTC & Phân tích chuyên sâu Dupont (ROE = Lợi nhuận x Vòng quay TS x Đòn bẩy TC)",
      "Hệ thống Chấm điểm & Xếp hạng 5 bậc (A+ Xuất sắc, A Tốt, B Khá, C Trung bình, D Rủi ro cao) dựa trên 5 tiêu chí quản trị",
      "Định giá doanh nghiệp đa phương pháp: DCF (Chiết khấu dòng tiền), P/E, P/B, EV/EBITDA, NAV (Giá trị tài sản ròng) & Insight AI hỗ trợ ra quyết định"
    ],
    takeaways: "Dành cho NĐT/KH: Cung cấp bức tranh tài chính chuẩn Big4 & định giá giá trị thực doanh nghiệp cho các thương vụ M&A và gọi vốn."
  },
  {
    id: "dinh-gia-cfa-big4",
    category: "6. ANALYTICS — Định Giá 9 Khối",
    title: "Sơ Đồ Cấu Trúc Khối Phân Tích Tình Hình Tài Chính & Định Giá Doanh Nghiệp",
    subtitle: "Từ Thu thập Dữ liệu → Phân tích Dòng tiền CFO/CFI/CFF → Xếp hạng & Kết quả Giá trị Hợp lý",
    imageSrc: "/diagrams/so_do_dinh_gia_cfa_big4.png",
    pdfSrc: "/docs/pt-bctc.pdf",
    pdfFileName: "pt-bctc.pdf",
    highlights: [
      "Phân tích dòng tiền 3 trụ cột: Dòng tiền từ HĐKD (CFO), HĐĐT (CFI), HĐTC (CFF) & Đánh giá chất lượng lợi nhuận CFO/LNST",
      "Phân tích triển vọng ngành & DN (Mô hình 5 Forces Porter, Lợi thế bền vững Moat, Kịch bản Cơ sở / Tích cực / Tiêu cực)",
      "Báo cáo & Khuyến nghị tự động bằng AI (Claude & Gemini): Xuất Dashboard, báo cáo Word/PDF/Excel & Khuyến nghị Mua/Giữ/Tránh"
    ],
    takeaways: "Dành cho NĐT/KH: Giúp các quỹ đầu tư & chủ doanh nghiệp nhanh chóng xác định điểm mạnh, điểm yếu và khoảng giá trị giao dịch."
  },
  {
    id: "khkd-ma-toan-dien",
    category: "7. KHKD & MA — Sơ Đồ Toàn Diện",
    title: "Sơ Đồ Hệ Thống Lập Kế Hoạch & Phân Tích Quản Trị (MA) Toàn Diện",
    subtitle: "Lập kế hoạch chủ động – Thực thi kỷ luật – Phân tích sâu sắc – Ra quyết định chính xác",
    imageSrc: "/diagrams/so_do_khkd_ma_toan_dien.png",
    pdfSrc: "/docs/Lap_khkd-ma.pdf",
    pdfFileName: "Lap khkd-ma.pdf",
    highlights: [
      "Quản lý 7 loại kế hoạch chuẩn hóa: KHKD (Doanh thu), KHTC (Tài chính), KHĐT (Dòng tiền), KHNS (Nhân sự), KHSX (Sản xuất), KH Mua hàng & KH Dự án",
      "Quy trình Phân tích MA chuyên sâu: P&L Quản trị, Phân tích chi phí Cost Center, Điểm hòa vốn BEP, Chỉ số ROI/ROA/ROE & Root Cause Analysis",
      "Bảng So sánh Thực hiện vs Kế hoạch vs Cùng kỳ (TH vs KH vs CK) tự động tính chênh lệch % kèm Cảnh báo & Khuyến nghị hành động"
    ],
    takeaways: "Dành cho NĐT/KH: Bảo đảm mọi kế hoạch kinh doanh và dòng tiền đều được quản trị bằng số liệu khoa học thay vì ước lượng cảm tính."
  },
  {
    id: "khkd-ma-tu-dong",
    category: "8. KHKD & MA — Tự Động Kết Nối",
    title: "Sơ Đồ KHKD & Phân Tích MA — Tự Động Kết Nối Dữ Liệu Đầu Vào",
    subtitle: "Hợp nhất 8 nguồn dữ liệu → Xây dựng 3 kịch bản Ngân sách Base / Optimistic / Conservative",
    imageSrc: "/diagrams/so_do_khkd_ma_tu_dong.png",
    pdfSrc: "/docs/Lap_khkd-ma.pdf",
    pdfFileName: "Lap khkd-ma.pdf",
    highlights: [
      "Kết nối tự động 8 nguồn dữ liệu: CRM, DMS, Sản xuất, Mua hàng, Kho, Tài chính - Kế toán, Dự án & Số liệu thị trường",
      "Lập 3 kịch bản ngân sách linh hoạt (Base Case, Optimistic, Conservative) & Cân đối P&L doanh thu - chi phí - lợi nhuận trước khi duyệt",
      "Bảng theo dõi đạt KPI tháng & Radar tự động phát hiện Top 3 vấn đề cần hành động khẩn cấp"
    ],
    takeaways: "Dành cho NĐT/KH: Giúp doanh nghiệp chủ động ứng phó với biến động thị trường nhờ hệ thống kịch bản ngân sách dự phòng."
  },
  {
    id: "nexus-master-flow",
    category: "9. NEXUS — Master Flow Vận Hành",
    title: "Sơ Đồ Vận Hành Master NEXUS Enterprise OS & QuoteFlow OS",
    subtitle: "Từ Chiến lược đến Kết quả – Vận hành toàn diện – Dữ liệu liền mạch – Chu trình PDCA",
    imageSrc: "/diagrams/so_do_nexus_master_flow.png",
    pdfSrc: "/docs/so_do_he_sinh_thai_v2.pdf",
    pdfFileName: "so do he sinh thai v2.pdf",
    highlights: [
      "Vòng quay 6 khối liên thông: 1. Chiến lược → 2. Lập kế hoạch (KHDT, KHCP, KHLN) → 3. Lập Ngân sách Budget → 4. Thực thi → 5. Kết quả Báo cáo → 6. Chu trình PDCA",
      "Phân bổ ngân sách toàn diện 8 phòng ban: Kinh doanh, Marketing, Sản xuất, Mua hàng, Nhân sự, Tài chính - Kế toán, R&D, Pháp chế",
      "Tích hợp AI Copilot (Tạo báo cáo nhanh, Dự báo cảnh báo) & AI Sales Coach (Đào tạo kỹ năng chốt đơn & Xử lý phản đối)"
    ],
    takeaways: "Dành cho NĐT/KH: Mô hình master thể hiện toàn bộ sức mạnh kiến trúc quản trị doanh nghiệp số hóa toàn diện."
  },
  {
    id: "crm-bg-tom-tat",
    category: "10. CRM & Báo Giá — Tóm Tắt",
    title: "Sơ Đồ Tóm Tắt Phần Mềm CRM & Quản Lý Báo Giá",
    subtitle: "Quản lý khách hàng – Quy trình báo giá – Phê duyệt – Theo dõi – AI Copilot & AI Sales Coach",
    imageSrc: "/diagrams/so_do_crm_bg_tom_tat.png",
    pdfSrc: "/docs/crm-bg.pdf",
    pdfFileName: "crm-bg.pdf",
    highlights: [
      "Quy trình CRM 5 bước: Tiếp nhận KH → Quản lý thông tin → Quản lý cơ hội → Chăm sóc & tương tác → Chuyển sang báo giá",
      "Quy trình Báo giá 5 bước: Tạo báo giá → Quản lý phiên bản → Phê duyệt theo cấp → Gửi & Theo dõi → Chuyển đổi Hợp đồng",
      "Tích hợp AI Copilot (Dự báo doanh số) & AI Sales Coach (Mô phỏng tình huống & Đào tạo kỹ năng chốt đơn, xử lý phản đối)"
    ],
    takeaways: "Dành cho NĐT/KH: Chuẩn hóa quy trình báo giá, rút ngắn 70% thời gian tạo báo giá và đào tạo đội ngũ Sales tự động bằng AI."
  },
  {
    id: "cskh-van-hanh-bg",
    category: "11. CRM & Báo Giá — Vận Hành CSKH",
    title: "Sơ Đồ Vận Hành PM CSKH & Quản Lý Báo Giá (QuoteFlow OS)",
    subtitle: "Từ Khách hàng → Cơ hội bán hàng → Báo giá → Chốt sale → Doanh thu → Dashboard",
    imageSrc: "/diagrams/so_do_cskh_van_hanh_bg.png",
    pdfSrc: "/docs/crm-bg.pdf",
    pdfFileName: "crm-bg.pdf",
    highlights: [
      "Pipeline CSKH 7 bước: Lead mới → Nhu cầu → Đã liên hệ → Giải pháp tư vấn → Báo giá Proposal → Đàm phán → Thắng (WON) / Thua (LOST)",
      "Cơ chế Phê duyệt Báo giá tự động (QuoteFlow OS): Kiểm tra chiết khấu trong hạn mức (Duyệt tự động) vs Vượt hạn mức (Yêu cầu GĐ/CEO/CFO duyệt)",
      "Đơn hàng & Hợp đồng (PO, Tồn kho, Ký điện tử) → Thanh toán & Doanh thu (Lập lịch, Thu tiền, Ghi nhận) → Vòng lặp cải tiến liên tục"
    ],
    takeaways: "Dành cho NĐT/KH: Minh bạch mọi giao dịch, loại bỏ duyệt ngầm sai chiết khấu và theo dõi tỷ lệ chốt Win-rate real-time."
  },
  {
    id: "dms-to-chuc",
    category: "12. DMS — Tổ Chức Kênh Bán",
    title: "Sơ Đồ Tổ Chức Kênh Bán Hàng DMS Xuyên Suốt 5 Tầng Quản Lý",
    subtitle: "Từ GĐKD → RSM Miền → ASM Khu vực → Sales Supervisor → NV Sales → Đại lý / NPP",
    imageSrc: "/diagrams/so_do_to_chuc_dms.png",
    pdfSrc: "/docs/DMS-QT-BH.pdf",
    pdfFileName: "DMS -QT-BH.pdf",
    highlights: [
      "Phân cấp 5 tầng rõ ràng: GĐKD (Chiến lược) → RSM (Quản lý vùng) → ASM (Khu vực) → SS (Giám sát) → Sale (Đi tuyến) → Đại lý/NPP",
      "Trung tâm Kiểm soát Dữ liệu: Tồn kho (Kho tổng, NPP/ĐL), Đơn hàng In/Out, Check-in GPS điểm bán, Báo cáo KPI & Chính sách giá/chiết khấu",
      "Minh bạch dữ liệu toàn kênh: Giám sát thị trường real-time, theo dõi hiệu suất từng cấp & từng tuyến bán hàng"
    ],
    takeaways: "Dành cho NĐT/KH: Giúp doanh nghiệp mở rộng quy mô hàng nghìn đại lý mà vẫn kiểm soát chặt chẽ đội ngũ và dòng hàng."
  },
  {
    id: "dms-ban-hang",
    category: "13. DMS — Luồng Quản Lý Tổng Thể",
    title: "Tóm Tắt Hướng Dẫn – Luồng Quản Lý Kênh Phân Phối DMS",
    subtitle: "Kiểm soát Hàng hóa – Kênh bán hàng – Đội ngũ Sales – Giao hàng (POD) – Hiệu quả kinh doanh",
    imageSrc: "/diagrams/so_do_ban_hang_dms.png",
    pdfSrc: "/docs/DMS-QT-BH.pdf",
    pdfFileName: "DMS -QT-BH.pdf",
    highlights: [
      "Luồng 7 bước chuẩn hóa: Tạo nhu cầu → Duyệt đơn → Xuất hàng → Giao hàng → Nghiệm thu → Thanh toán → Báo cáo BI",
      "Quản lý tồn kho real-time 3 cấp (Kho tổng → Kho NPP/Đại lý → Điểm bán lẻ) kèm Cảnh báo hàng tồn thấp/hết hàng/chậm luân chuyển",
      "Giám sát NV Sales thị trường: Check-in GPS vị trí & thời gian, chụp ảnh thực địa trưng bày, báo cáo hoạt động & đánh giá hiệu suất"
    ],
    takeaways: "Dành cho NĐT/KH: Loại bỏ hoàn toàn rủi ro thất thoát hàng hóa, sai lệch công nợ hoặc NV Sales ảo báo cáo."
  },
  {
    id: "approve-master",
    category: "14. APPROVE — Giám Sát Ngân Sách",
    title: "Sơ Đồ Master APPROVE — Quản Lý Đề Xuất, Giám Sát Ngân Sách & Mua Hàng/Thanh Toán",
    subtitle: "Đảm bảo đúng ngân sách, đúng quy trình, đúng người, đúng thời điểm",
    imageSrc: "/diagrams/so_do_approve_master.png",
    pdfSrc: "/docs/Approve_Management_V2.pdf",
    pdfFileName: "Approve_Management_V2.pdf",
    highlights: [
      "Quản lý 6 loại đề xuất (Mua hàng, Chi phí, Thanh toán, Đầu tư, Tạm ứng...) & Quy trình 6 trạng thái từ Draft đến Phê duyệt/Hoàn tất",
      "Giám sát ngân sách real-time 4 chỉ số (Được cấp → Cam kết → Đã dùng → Khả dụng) & 3 Cấp cảnh báo (An toàn <90%, Cảnh báo 90-100%, Vượt >100%)",
      "Kiểm soát đối chiếu 3 chứng từ (PO Đơn mua - GR Nhận hàng - Invoice Hóa đơn), loại bỏ hoàn toàn thanh toán trùng, khống hoặc sai hạn mức"
    ],
    takeaways: "Dành cho NĐT/KH: Bảo đảm 100% dòng tiền chi ra đều đúng mục tiêu kế hoạch, minh bạch, giảm tối đa thất thoát & chi phí."
  },
  {
    id: "qlcv-toan-dien",
    category: "15. QLCV — Sơ Đồ Toàn Diện",
    title: "Sơ Đồ Hệ Thống Quản Lý Công Việc (QLCV) Toàn Diện",
    subtitle: "Bộ Não Điều Hành Doanh Nghiệp: Từ chiến lược đến thực thi xuyên suốt 8 phòng ban",
    imageSrc: "/diagrams/so_do_qlcv_toan_dien.png",
    pdfSrc: "/docs/Enterprise_Nervous_System.pdf",
    pdfFileName: "Enterprise_Nervous_System.pdf",
    highlights: [
      "Vòng đời công việc 8 bước: Mục tiêu → Kế hoạch → Giao việc → Thực hiện → Theo dõi → Đo kết quả → Phản hồi → Cải tiến",
      "Liên kết dữ liệu xuyên 8 phòng ban: Kinh doanh, Marketing, Sản xuất, Mua hàng, Kho, Tài chính, Nhân sự, IT",
      "Giám sát & Cảnh báo thời gian thực: Đúng tiến độ, Nguy cơ, Trễ hạn, Quá hạn tích hợp đa nền tảng (Web/Mobile/Zalo)"
    ],
    takeaways: "Dành cho NĐT/KH: Minh chứng tính toàn diện của Bộ Não QLCV — mọi công việc rõ ràng, mọi kết quả đo lường được."
  },
  {
    id: "qlcv-phan-ra-kpi",
    category: "16. QLCV — Phân Rã KPI",
    title: "Quy Trình CEO Giao KPI Đầu Tháng → Tự Động Phân Rã Xuống Các Cấp",
    subtitle: "Cơ chế Cascade Down từ mục tiêu chiến lược 20 Tỷ đến từng thẻ task nhân viên",
    imageSrc: "/diagrams/so_do_qlcv_phan_ra_kpi.png",
    pdfSrc: "/docs/qlcv.pdf",
    pdfFileName: "qlcv.pdf",
    highlights: [
      "Hệ thống tự động phân rã chỉ tiêu: CEO (20 tỷ) → GĐKD (12 tỷ) → TPKD (4 tỷ) → Team (2 tỷ) → Sale 01 (400tr)",
      "Theo dõi tiến độ KPI real-time & Top công việc quá hạn kèm Thẻ công việc chuẩn hóa",
      "Quy tắc Escalate 3 Mức Cảnh Báo: Mức 1 (<90%), Mức 2 (<70%), Mức 3 (Quá hạn -> Escalate trực tiếp lên GĐ & CEO)"
    ],
    takeaways: "Dành cho NĐT/KH: Đảm bảo mục tiêu chiến lược của CEO được thực thi chuẩn xác đến từng cá nhân mà không bị gãy đoạn."
  }
];

export function DiagramShowcaseSection() {
  const ref = useReveal<HTMLDivElement>();
  const [activeId, setActiveId] = useState<string>("he-sinh-thai-1");
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const activeDiagram = DIAGRAMS.find(d => d.id === activeId) || DIAGRAMS[0];

  return (
    <section id="thu-vien-so-do" className="bg-blueprint border-t border-cyan/20 py-24 text-paper relative overflow-hidden">
      {/* Background blueprint grid */}
      <div
        className="pointer-events-none absolute inset-0 bg-blueprint-grid bg-grid opacity-40"
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1200px] px-8">
        
        {/* Section Header */}
        <div className="mx-auto mb-14 max-w-[840px] text-center">
          <span className="mb-4 inline-flex items-center gap-2 border border-cyan/40 px-3.5 py-1.5 font-mono text-xs uppercase tracking-widest text-cyan">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-pulse" />
            Hệ Sinh Thái 11 Mô-Đun Quản Trị Doanh Nghiệp Số Hóa + Thư Viện Thuyết Minh KH/NĐT
          </span>
          <h2 className="mb-4 text-3xl font-bold text-paper md:text-4xl">
            Sơ Đồ Master Hệ Sinh Thái Quản Trị Doanh Nghiệp Số Hóa
          </h2>
          <p className="text-paper/75 text-base">
            Trực quan hóa 2 sơ đồ Master Hệ Sinh Thái 11 Mô-đun (Kiến trúc 4 Lớp & Luồng Vận Hành Liên Thông từ Kế Hoạch Kinh Doanh đến CEO Dashboard) dành cho Khách hàng & Nhà đầu tư.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="mb-10 flex flex-wrap justify-center gap-2.5">
          {DIAGRAMS.map((d) => (
            <button
              key={d.id}
              onClick={() => setActiveId(d.id)}
              className={`rounded-sm px-4 py-2.5 font-mono text-xs transition-all ${
                activeId === d.id
                  ? "bg-cyan text-blueprint-deep font-bold shadow-md scale-105"
                  : "border border-cyan/30 bg-blueprint-deep/80 text-paper/80 hover:border-cyan hover:text-cyan"
              }`}
            >
              {d.category}
            </button>
          ))}
        </div>

        {/* Main Diagram Viewer Frame */}
        <div ref={ref} className="reveal grid grid-cols-1 gap-8 rounded-md border border-cyan/40 bg-blueprint-deep/90 p-8 shadow-panel lg:grid-cols-[1.3fr_0.7fr]">
          
          {/* Left: Interactive Diagram Image Frame */}
          <div className="relative group overflow-hidden rounded border border-cyan/30 bg-white p-2 flex flex-col justify-center items-center">
            <img
              src={activeDiagram.imageSrc}
              alt={activeDiagram.title}
              className="max-h-[520px] w-auto object-contain rounded transition-transform duration-500 group-hover:scale-105 cursor-pointer"
              onClick={() => setLightboxImg(activeDiagram.imageSrc)}
            />
            <div className="mt-3 flex flex-wrap gap-2 w-full justify-center">
              <button
                onClick={() => setLightboxImg(activeDiagram.imageSrc)}
                className="inline-flex items-center gap-1.5 rounded bg-blueprint border border-cyan px-3.5 py-2 font-mono text-xs font-bold text-cyan transition-all hover:bg-cyan hover:text-blueprint-deep"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                Phóng To Sơ Đồ
              </button>
              {activeDiagram.pdfSrc && (
                <a
                  href={activeDiagram.pdfSrc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded bg-amber/20 border border-amber/70 px-3.5 py-2 font-mono text-xs font-bold text-amber hover:bg-amber hover:text-blueprint-deep transition-all"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  📄 Mở File PDF Gốc ({activeDiagram.pdfFileName})
                </a>
              )}
            </div>
          </div>

          {/* Right: Detailed Explanations & Investor Takeaways */}
          <div className="flex flex-col justify-between space-y-4">
            <div>
              <span className="mb-2 block font-mono text-xs text-amber font-bold uppercase tracking-wider">
                {activeDiagram.category}
              </span>
              <h3 className="mb-2 text-2xl font-bold text-cyan">{activeDiagram.title}</h3>
              <p className="mb-5 font-mono text-xs text-paper/60 leading-normal">{activeDiagram.subtitle}</p>

              <h4 className="mb-3 font-mono text-xs text-paper/90 uppercase font-bold tracking-wide">
                Điểm Nổi Bật Vận Hành & Quản Trị:
              </h4>
              <ul className="mb-5 space-y-2.5">
                {activeDiagram.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-paper/85 leading-relaxed">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan shrink-0" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              {/* Investor Takeaway Card */}
              <div className="rounded border border-amber/40 bg-amber/10 p-4">
                <span className="mb-1 block font-mono text-[0.7rem] font-bold text-amber uppercase">
                  Góc Nhìn Khách Hàng / Nhà Đầu Tư (KH & NĐT):
                </span>
                <p className="text-xs text-paper/90 font-medium italic leading-relaxed">
                  "{activeDiagram.takeaways}"
                </p>
              </div>

              {/* Attached PDF Card */}
              {activeDiagram.pdfSrc && (
                <div className="rounded border border-cyan/40 bg-cyan/10 p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="rounded bg-red-600/20 p-2 text-red-400 border border-red-500/30 shrink-0">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <span className="block font-mono text-[0.68rem] font-bold text-cyan uppercase tracking-wider">File PDF Thuyết Minh Kèm Theo:</span>
                      <span className="block text-xs font-semibold text-paper truncate">{activeDiagram.pdfFileName}</span>
                    </div>
                  </div>
                  <a
                    href={activeDiagram.pdfSrc}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-1.5 rounded bg-cyan px-3 py-1.5 font-mono text-xs font-bold text-blueprint-deep hover:bg-cyan-bright transition-all shadow-sm"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                    Mở PDF
                  </a>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Lightbox Modal Popup */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-blueprint-deep/95 backdrop-blur-md p-4"
          onClick={() => setLightboxImg(null)}
        >
          <div className="relative max-w-[98vw] max-h-[98vh] overflow-auto bg-white p-4 rounded-md shadow-2xl border border-cyan" onClick={e => e.stopPropagation()}>
            <div className="mb-3 flex justify-between items-center border-b pb-2 gap-4">
              <span className="font-mono text-sm font-bold text-blueprint truncate">{activeDiagram.title}</span>
              <div className="flex items-center gap-2 shrink-0">
                {activeDiagram.pdfSrc && (
                  <a
                    href={activeDiagram.pdfSrc}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded bg-amber px-3 py-1 font-mono text-xs font-bold text-blueprint-deep hover:bg-amber-bright transition-all"
                  >
                    📄 Xem File PDF ({activeDiagram.pdfFileName})
                  </a>
                )}
                <button
                  onClick={() => setLightboxImg(null)}
                  className="rounded bg-red-600 px-3 py-1 font-mono text-xs font-bold text-white hover:bg-red-700 transition-all"
                >
                  [ĐÓNG ✖]
                </button>
              </div>
            </div>
            <img src={lightboxImg} alt="Sơ đồ phóng to" className="max-w-full max-h-[82vh] object-contain mx-auto" />
          </div>
        </div>
      )}

    </section>
  );
}
