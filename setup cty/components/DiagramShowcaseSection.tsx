"use client";

import { useState } from "react";
import { useReveal } from "./useReveal";

type DiagramItem = {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  imageSrc: string;
  highlights: string[];
  takeaways: string;
};

const DIAGRAMS: DiagramItem[] = [
  {
    id: "qlcv-toan-dien",
    category: "1. QLCV — Sơ Đồ Toàn Diện",
    title: "Sơ Đồ Hệ Thống Quản Lý Công Việc (QLCV) Toàn Diện",
    subtitle: "Bộ Não Điều Hành Doanh Nghiệp: Từ chiến lược đến thực thi xuyên suốt 8 phòng ban",
    imageSrc: "/diagrams/so_do_qlcv_toan_dien.png",
    highlights: [
      "Vòng đời công việc 8 bước: Mục tiêu → Kế hoạch → Giao việc → Thực hiện → Theo dõi → Đo kết quả → Phản hồi → Cải tiến",
      "Liên kết dữ liệu xuyên 8 phòng ban: Kinh doanh, Marketing, Sản xuất, Mua hàng, Kho, Tài chính, Nhân sự, IT",
      "Giám sát & Cảnh báo thời gian thực: Đúng tiến độ, Nguy cơ, Trễ hạn, Quá hạn tích hợp đa nền tảng (Web/Mobile/Zalo)"
    ],
    takeaways: "Dành cho NĐT/KH: Minh chứng tính toàn diện của Bộ Não QLCV — mọi công việc rõ ràng, mọi kết quả đo lường được."
  },
  {
    id: "qlcv-phan-ra-kpi",
    category: "2. QLCV — Phân Rã KPI",
    title: "Quy Trình CEO Giao KPI Đầu Tháng → Tự Động Phân Rã Xuống Các Cấp",
    subtitle: "Cơ chế Cascade Down từ mục tiêu chiến lược 20 Tỷ đến từng thẻ task nhân viên",
    imageSrc: "/diagrams/so_do_qlcv_phan_ra_kpi.png",
    highlights: [
      "Hệ thống tự động phân rã chỉ tiêu: CEO (20 tỷ) → GĐKD (12 tỷ) → TPKD (4 tỷ) → Team (2 tỷ) → Sale 01 (400tr)",
      "Theo dõi tiến độ KPI real-time & Top công việc quá hạn kèm Thẻ công việc chuẩn hóa",
      "Quy tắc Escalate 3 Mức Cảnh Báo: Mức 1 (<90%), Mức 2 (<70%), Mức 3 (Quá hạn -> Escalate trực tiếp lên GĐ & CEO)"
    ],
    takeaways: "Dành cho NĐT/KH: Đảm bảo mục tiêu chiến lược của CEO được thực thi chuẩn xác đến từng cá nhân mà không bị gãy đoạn."
  },
  {
    id: "ecosystem",
    category: "3. Tổng Quan Hệ Sinh Thái",
    title: "Sơ Đồ Tổng Quan Hệ Sinh Thái Số Hóa Doanh Nghiệp",
    subtitle: "Liên thông 11 Mô-đun từ Kế hoạch gốc đến CEO Dashboard",
    imageSrc: "/diagrams/tom_tat_he_sinh_thai.png",
    highlights: [
      "Điểm gốc từ Chiến lược & Kế hoạch, điểm hội tụ tại CEO Dashboard",
      "Nền tảng Data Lake, AI Copilot & Phân quyền SSO bảo mật 4 lớp",
      "PM QLCV đóng vai trò 'Bộ não điều hành' liên kết tất cả mô-đun"
    ],
    takeaways: "Dành cho NĐT/KH: Chứng minh tính nhất quán dữ liệu, loại bỏ hoàn toàn số liệu rời rạc giữa các phòng ban."
  },
  {
    id: "dashboard",
    category: "4. Dashboard & BI",
    title: "Sơ Đồ Dashboard Điều Hành & Phân Tích Báo Cáo Tài Chính",
    subtitle: "Hội tụ chỉ số real-time cho CEO & Ban Lãnh Đạo",
    imageSrc: "/diagrams/so_do_dashboard.png",
    highlights: [
      "Tổng hợp số liệu P&L Quản trị, Dòng tiền thu-chi, Doanh số & KPI",
      "Radar cảnh báo rủi ro thâm hụt tài chính & lệch kế hoạch sớm",
      "Hỗ trợ ra quyết định điều hành nhanh chóng và chính xác 100%"
    ],
    takeaways: "Dành cho NĐT/KH: Giúp CEO kiểm soát toàn bộ doanh nghiệp trong 1 màn hình đơn giản."
  },
  {
    id: "khkd-ma",
    category: "5. Tài Chính & Kế Hoạch",
    title: "Sơ Đồ Lập Kế Hoạch Kinh Doanh & Quản Trị Tài Chính MA",
    subtitle: "Chu trình Plan – Analyze – Control chuẩn tài chính hiện đại",
    imageSrc: "/diagrams/so_do_khkd.png",
    highlights: [
      "Biến mục tiêu chiến lược thành kế hoạch doanh thu, chi phí & nhân sự",
      "Phân bổ hạn mức ngân sách phòng ban và theo dõi P&L real-time",
      "So sánh Kế hoạch vs Thực tế (KH · TH) để kịp thời điều chỉnh"
    ],
    takeaways: "Dành cho NĐT/KH: Đảm bảo dòng tiền luôn lành mạnh và chi phí không bị vượt hạn mức."
  },
  {
    id: "crm-dms",
    category: "6. CRM & DMS Phân Phối",
    title: "Sơ Đồ CRM Bán Hàng & DMS Điều Hành Kênh Phân Phối",
    subtitle: "Tối ưu chuỗi bán hàng từ Khách hàng đến Đại lý",
    imageSrc: "/diagrams/so_do_crm_bg.png",
    highlights: [
      "Quản lý Pipeline cơ hội, báo giá - phê duyệt tự động & hợp đồng",
      "Quản lý mạng lưới Nhà phân phối, tuyến bán hàng Sales Route & công nợ",
      "Tăng tỷ lệ chốt sale & mở rộng quy mô thị trường nhanh chóng"
    ],
    takeaways: "Dành cho NĐT/KH: Tăng trưởng doanh số bán hàng bền vững trên toàn bộ hệ thống đại lý."
  },
  {
    id: "hr-3p",
    category: "7. Con Người & Lương 3P",
    title: "Sơ Đồ Lương 3P & Khung Đòn Bẩy Động Lực Nhân Sự",
    subtitle: "P1 Position – P2 Person – P3 Performance lấy dữ liệu thật",
    imageSrc: "/diagrams/so_do_3p.png",
    highlights: [
      "P1 theo Giá trị vị trí, P2 theo Năng lực, P3 theo Hiệu suất thật QLCV",
      "Loại bỏ hoàn toàn đánh giá cảm tính, trả lương công bằng 100%",
      "Chuỗi đòn bẩy: Trả lương đúng → Tạo động lực → Tăng năng suất"
    ],
    takeaways: "Dành cho NĐT/KH: Thu hút và giữ chân nhân tài bằng cơ chế minh bạch và công bằng."
  }
];

export function DiagramShowcaseSection() {
  const ref = useReveal<HTMLDivElement>();
  const [activeId, setActiveId] = useState<string>("qlcv-toan-dien");
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
            2 Sơ Đồ Bộ Não QLCV & Thư Viện Thuyết Minh KH/NĐT
          </span>
          <h2 className="mb-4 text-3xl font-bold text-paper md:text-4xl">
            Sơ Đồ QLCV — Bộ Não Điều Hành Doanh Nghiệp
          </h2>
          <p className="text-paper/75 text-base">
            Mô hình hóa chi tiết 2 sơ đồ cốt lõi của Bộ Não QLCV (Sơ đồ Toàn diện & Quy trình Phân rã KPI tự động) cùng toàn bộ thư viện sơ đồ kiến trúc dành cho Khách hàng & Nhà đầu tư.
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
            <button
              onClick={() => setLightboxImg(activeDiagram.imageSrc)}
              className="mt-3 inline-flex items-center gap-2 rounded bg-blueprint border border-cyan px-4 py-2 font-mono text-xs font-bold text-cyan transition-all hover:bg-cyan hover:text-blueprint-deep"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              Click để mở Sơ đồ Siêu Nét (Full HD Resolution)
            </button>
          </div>

          {/* Right: Detailed Explanations & Investor Takeaways */}
          <div className="flex flex-col justify-between">
            <div>
              <span className="mb-2 block font-mono text-xs text-amber font-bold uppercase tracking-wider">
                {activeDiagram.category}
              </span>
              <h3 className="mb-2 text-2xl font-bold text-cyan">{activeDiagram.title}</h3>
              <p className="mb-6 font-mono text-xs text-paper/60 leading-normal">{activeDiagram.subtitle}</p>

              <h4 className="mb-3 font-mono text-xs text-paper/90 uppercase font-bold tracking-wide">
                Điểm Nổi Bật Vận Hành & Thực Thi:
              </h4>
              <ul className="mb-6 space-y-3">
                {activeDiagram.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-paper/85 leading-relaxed">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan shrink-0" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Investor Takeaway Card */}
            <div className="rounded border border-amber/40 bg-amber/10 p-4">
              <span className="mb-1 block font-mono text-[0.7rem] font-bold text-amber uppercase">
                Góc Nhìn Khách Hàng / Nhà Đầu Tư (KH & NĐT):
              </span>
              <p className="text-xs text-paper/90 font-medium italic leading-relaxed">
                "{activeDiagram.takeaways}"
              </p>
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
            <div className="mb-3 flex justify-between items-center border-b pb-2">
              <span className="font-mono text-sm font-bold text-blueprint">{activeDiagram.title}</span>
              <button
                onClick={() => setLightboxImg(null)}
                className="rounded bg-red-600 px-3 py-1 font-mono text-xs font-bold text-white hover:bg-red-700"
              >
                [ĐÓNG XEM SƠ ĐỒ ✖]
              </button>
            </div>
            <img src={lightboxImg} alt="Sơ đồ phóng to" className="max-w-full max-h-[85vh] object-contain mx-auto" />
          </div>
        </div>
      )}

    </section>
  );
}
