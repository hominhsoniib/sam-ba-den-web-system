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
    id: "ecosystem",
    category: "Tổng Quan Hệ Thống",
    title: "Sơ Đồ Tổng Quan Hệ Sinh Thái Số Hóa Doanh Nghiệp",
    subtitle: "Liên thông 11 Mô-đun từ Chiến lược đến CEO Dashboard",
    imageSrc: "/diagrams/tom_tat_he_sinh_thai.png",
    highlights: [
      "Điểm gốc từ Chiến lược & Kế hoạch, điểm hội tụ tại CEO Dashboard",
      "Nền tảng Data Lake, AI Copilot & Phân quyền SSO bảo mật 4 lớp",
      "PM QLCV đóng vai trò 'Bộ não điều hành' liên kết tất cả mô-đun"
    ],
    takeaways: "Dành cho NĐT/KH: Chứng minh tính nhất quán dữ liệu, không có điểm gãy hay phần mềm rời rạc."
  },
  {
    id: "qlcv",
    category: "Bộ Não Điều Hành",
    title: "Sơ Đồ PM QLCV — Bộ Não Điều Hành & Giám Sát Tự Động",
    subtitle: "5 Chức năng lõi & 2 Chức năng bổ trợ truyền thông văn hóa",
    imageSrc: "/diagrams/so_do_qlcv.png",
    highlights: [
      "Quản lý Công việc (KPI/OKR), Tài nguyên, Tri thức (SOP) & BPM Quy trình",
      "Giám sát tự động real-time, nhắc việc tự động không cần audit thủ công",
      "Tích hợp Truyền thông văn hóa & Đào tạo E-Learning giữ chân nhân tài"
    ],
    takeaways: "Dành cho NĐT/KH: Minh chứng cho khả năng tự động hóa giám sát và lưu giữ tri thức doanh nghiệp."
  },
  {
    id: "dashboard",
    category: "Dashboard & BI",
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
    category: "Tài Chính & Kế Hoạch",
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
    category: "Kinh Doanh & Phân Phối",
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
    category: "Con Người & Lương 3P",
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
  const [activeId, setActiveId] = useState<string>("ecosystem");
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
            Thư Viện Sơ Đồ Thuyết Minh KH & NĐT
          </span>
          <h2 className="mb-4 text-3xl font-bold text-paper md:text-4xl">
            Sơ Đồ Kiến Trúc & Quy Trình Thuyết Minh Chuyên Nghiệp
          </h2>
          <p className="text-paper/75 text-base">
            Tổng hợp sơ đồ trực quan hóa chi tiết từng phân hệ trong hệ sinh thái NEXUS Enterprise OS. Dành cho Ban lãnh đạo thuyết minh mô hình quản trị với Khách hàng & Nhà đầu tư.
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
                  ? "bg-cyan text-blueprint-deep font-bold shadow-md"
                  : "border border-cyan/30 bg-blueprint-deep/80 text-paper/80 hover:border-cyan hover:text-cyan"
              }`}
            >
              {d.category}
            </button>
          ))}
        </div>

        {/* Main Diagram Viewer Frame */}
        <div ref={ref} className="reveal grid grid-cols-1 gap-8 rounded-md border border-cyan/40 bg-blueprint-deep/90 p-8 shadow-panel lg:grid-cols-[1.2fr_0.8fr]">
          
          {/* Left: Interactive Diagram Image Frame */}
          <div className="relative group overflow-hidden rounded border border-cyan/30 bg-white/5 p-4 flex flex-col justify-center items-center">
            <img
              src={activeDiagram.imageSrc}
              alt={activeDiagram.title}
              className="max-h-[460px] w-auto object-contain rounded transition-transform duration-500 group-hover:scale-105 cursor-pointer"
              onClick={() => setLightboxImg(activeDiagram.imageSrc)}
            />
            <button
              onClick={() => setLightboxImg(activeDiagram.imageSrc)}
              className="mt-4 inline-flex items-center gap-2 rounded bg-cyan/20 border border-cyan/40 px-4 py-2 font-mono text-xs font-bold text-cyan transition-all hover:bg-cyan hover:text-blueprint-deep"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              Click để phóng to sơ đồ sắc nét (Full Resolution)
            </button>
          </div>

          {/* Right: Detailed Explanations & Investor Takeaways */}
          <div className="flex flex-col justify-between">
            <div>
              <span className="mb-2 block font-mono text-xs text-amber font-bold uppercase tracking-wider">
                {activeDiagram.category}
              </span>
              <h3 className="mb-2 text-2xl font-bold text-cyan">{activeDiagram.title}</h3>
              <p className="mb-6 font-mono text-xs text-paper/60">{activeDiagram.subtitle}</p>

              <h4 className="mb-3 font-mono text-xs text-paper/90 uppercase font-bold tracking-wide">
                Điểm Nổi Bật Vận Hành:
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-blueprint-deep/90 backdrop-blur-md p-6"
          onClick={() => setLightboxImg(null)}
        >
          <div className="relative max-w-[95vw] max-h-[95vh] overflow-auto bg-white p-4 rounded-md shadow-2xl border border-cyan" onClick={e => e.stopPropagation()}>
            <div className="mb-2 flex justify-between items-center border-b pb-2">
              <span className="font-mono text-xs font-bold text-blueprint">{activeDiagram.title}</span>
              <button
                onClick={() => setLightboxImg(null)}
                className="font-mono text-sm font-bold text-ink-soft hover:text-red-500 px-2 py-1"
              >
                [ĐÓNG ✖]
              </button>
            </div>
            <img src={lightboxImg} alt="Sơ đồ phóng to" className="max-w-full max-h-[82vh] object-contain mx-auto" />
          </div>
        </div>
      )}

    </section>
  );
}
