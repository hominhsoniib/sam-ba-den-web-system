"use client";

import { useState } from "react";
import { useReveal } from "./useReveal";

type Module = {
  code: string;
  layer: string;
  title: string;
  output: string;
  desc: string;
  items: string[];
};

const MODULES: Module[] = [
  // Layer 1: Kế Hoạch - Tài Chính (Mod 1 - Mod 6)
  {
    code: "MÔ-ĐUN 01",
    layer: "Kế Hoạch & Tài Chính",
    title: "Lập Kế Hoạch Kinh Doanh",
    output: "Kế hoạch được duyệt",
    desc: "Kế hoạch kinh doanh, doanh thu, sản phẩm, marketing, nhân sự và chỉ tiêu KPI/OKR.",
    items: ["Kế hoạch doanh thu & chi phí", "Kế hoạch nhân sự & hoạt động", "Kế hoạch tài chính kỳ", "Chỉ tiêu KPI/OKR mục tiêu"],
  },
  {
    code: "MÔ-ĐUN 02",
    layer: "Kế Hoạch & Tài Chính",
    title: "Review & Phân Tích Insight",
    output: "Insight & Khuyến nghị",
    desc: "Phân tích thị trường, đối thủ, đánh giá rủi ro & cơ hội với sự hỗ trợ của AI.",
    items: ["Phân tích SWOT / PESTEL", "Đánh giá rủi ro & cơ hội", "AI phân tích insight", "Khuyến nghị điều chỉnh"],
  },
  {
    code: "MÔ-ĐUN 03",
    layer: "Kế Hoạch & Tài Chính",
    title: "Quản Trị Kế Hoạch (PM MA)",
    output: "KHTC & KH Dòng tiền",
    desc: "Theo dõi thực hiện KPI/OKR, ngân sách, dự án và cảnh báo lệch kế hoạch.",
    items: ["Báo cáo P&L Quản trị", "Theo dõi tiến độ KPI/OKR", "Cảnh báo lệch kế hoạch", "Điều chỉnh kế hoạch kỳ"],
  },
  {
    code: "MÔ-ĐUN 04",
    layer: "Kế Hoạch & Tài Chính",
    title: "Quản Trị Dòng Tiền (PM MA)",
    output: "Dòng tiền tối ưu",
    desc: "Kế hoạch dòng tiền thu – chi, dự báo dòng tiền, quản lý công nợ và cảnh báo thiếu hụt.",
    items: ["Dự báo thu – chi real-time", "Quản lý hạn mức công nợ", "Cảnh báo thâm hụt dòng tiền", "Tối ưu hóa vốn lưu động"],
  },
  {
    code: "MÔ-ĐUN 05",
    layer: "Kế Hoạch & Tài Chính",
    title: "Quản Trị Ngân Sách (PM MA)",
    output: "Ngân sách hiệu quả",
    desc: "Lập, phân bổ, theo dõi ngân sách; so sánh kế hoạch vs thực tế và phân tích nguyên nhân.",
    items: ["Phân bổ ngân sách phòng ban", "So sánh Kế hoạch vs Thực tế", "Phân tích nguyên nhân lệch", "Kiểm soát chi phí sản xuất"],
  },
  {
    code: "MÔ-ĐUN 06",
    layer: "Kế Hoạch & Tài Chính",
    title: "Giám Sát & Phê Duyệt (Approve)",
    output: "Minh bạch & Tuân thủ",
    desc: "Phê duyệt online, giám sát quy trình mua hàng, thanh toán và kiểm soát ngân sách.",
    items: ["Quản lý đề xuất online", "Kiểm soát quy trình mua hàng", "Kiểm soát lệnh thanh toán", "Cảnh báo vượt ngân sách"],
  },

  // Layer 2: Kinh Doanh & Con Người (Mod 8 - Mod 11)
  {
    code: "MÔ-ĐUN 08",
    layer: "Kinh Doanh & Con Người",
    title: "CRM & Quản Lý Báo Giá",
    output: "Tăng tỷ lệ chốt sale",
    desc: "Quản lý dữ liệu khách hàng, pipeline bán hàng, chăm sóc, báo giá và hợp đồng.",
    items: ["Master Data Khách hàng", "Pipeline cơ hội bán hàng", "Báo giá & Phê duyệt tự động", "Tự động hóa chăm sóc khách"],
  },
  {
    code: "MÔ-ĐUN 09",
    layer: "Kinh Doanh & Con Người",
    title: "DMS — Kênh Phân Phối",
    output: "Mở rộng thị trường",
    desc: "Điều hành mạng lưới nhà phân phối, đại lý, tuyến bán hàng sales route, tồn kho và công nợ.",
    items: ["Quản lý Nhà phân phối/Đại lý", "Tuyến bán hàng Sales Route", "Đơn hàng, công nợ, tồn kho", "Chương trình khuyến mãi"],
  },
  {
    code: "MÔ-ĐUN 10",
    layer: "Kinh Doanh & Con Người",
    title: "Lương 3P — Đòn Bẩy Con Người",
    output: "Nhân sự gắn kết & Năng suất",
    desc: "P1 (Position), P2 (Person), P3 (Performance lấy dữ liệu hiệu suất thật từ QLCV).",
    items: ["P1 — Giá trị vị trí công việc", "P2 — Năng lực cá nhân", "P3 — Hiệu suất thật từ QLCV", "Đòn bẩy tạo động lực thu nhập"],
  },
  {
    code: "MÔ-ĐUN 11",
    layer: "Kinh Doanh & Con Người",
    title: "Báo Cáo & BI Dashboard",
    output: "Quyết định nhanh & chính xác",
    desc: "Dashboard điều hành CEO tổng hợp dữ liệu real-time từ cả 10 mô-đun trong hệ sinh thái.",
    items: ["CEO Dashboard điều hành", "BI Báo cáo Tài chính & MA", "Phân tích Bán hàng & Thị trường", "Radar Cảnh báo & Quyết định"],
  },
];

const CORE_FUNCTIONS = [
  { title: "Quản lý Công việc", desc: "Giao việc, deadline, tiến độ, KPI/OKR cá nhân & nhóm" },
  { title: "Quản lý Tài nguyên", desc: "Nhân sự, thiết bị máy móc, nguyên vật liệu, ngân sách" },
  { title: "Quản lý Tri thức", desc: "Thư viện SOP, tài liệu quy trình, best practices, kinh nghiệm" },
  { title: "Quản lý Quy trình (BPM)", desc: "Chuẩn hóa, số hóa quy trình & tự động hóa workflow" },
  { title: "Giám sát Tự động", desc: "Cảnh báo real-time & nhắc việc tự động không cần audit thủ công" },
];

export function EcosystemGrid() {
  const ref = useReveal<HTMLDivElement>();
  const [activeTab, setActiveTab] = useState<string>("all");

  const filteredModules = activeTab === "all" 
    ? MODULES 
    : MODULES.filter(m => activeTab === "finance" ? m.layer === "Kế Hoạch & Tài Chính" : m.layer === "Kinh Doanh & Con Người");

  return (
    <section id="he-sinh-thai" className="bg-white py-24">
      <div className="mx-auto mb-14 max-w-[800px] px-8 text-center">
        <span className="mb-4 inline-flex items-center justify-center gap-2.5 font-mono text-xs uppercase tracking-widest text-cyan-dim before:h-px before:w-[22px] before:bg-amber">
          Kiến trúc tổng thể 11 Mô-đun
        </span>
        <h2 className="mb-4 text-3xl font-bold text-blueprint md:text-4xl">
          Hệ Sinh Thái Số Hóa Doanh Nghiệp Toàn Diện
        </h2>
        <p className="text-ink-soft">
          11 mô-đun chuyên sâu không hoạt động rời rạc. Toàn bộ được liên thông trên một nguồn dữ liệu thống nhất, lấy PM QLCV làm bộ não vận hành trung tâm.
        </p>

        {/* Filter Buttons */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => setActiveTab("all")}
            className={`rounded-full px-5 py-2 text-xs font-bold transition-all ${
              activeTab === "all"
                ? "bg-blueprint text-paper shadow-sm"
                : "bg-paper-dim text-ink-soft hover:bg-blueprint/10 hover:text-blueprint"
            }`}
          >
            Tất cả 11 Mô-đun
          </button>
          <button
            onClick={() => setActiveTab("finance")}
            className={`rounded-full px-5 py-2 text-xs font-bold transition-all ${
              activeTab === "finance"
                ? "bg-blueprint text-paper shadow-sm"
                : "bg-paper-dim text-ink-soft hover:bg-blueprint/10 hover:text-blueprint"
            }`}
          >
            Lớp Kế Hoạch – Tài Chính (Mod 01-06)
          </button>
          <button
            onClick={() => setActiveTab("business")}
            className={`rounded-full px-5 py-2 text-xs font-bold transition-all ${
              activeTab === "business"
                ? "bg-blueprint text-paper shadow-sm"
                : "bg-paper-dim text-ink-soft hover:bg-blueprint/10 hover:text-blueprint"
            }`}
          >
            Lớp Kinh Doanh & Con Người (Mod 08-11)
          </button>
        </div>
      </div>

      <div ref={ref} className="reveal mx-auto max-w-[1200px] px-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

          {/* Render Financial Layer Modules (1-3 if All) */}
          {filteredModules.slice(0, 3).map((m) => (
            <div key={m.code} className="group relative rounded-sm border border-line bg-white p-7 transition-all hover:-translate-y-1 hover:border-amber/40 hover:shadow-panel">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-mono text-xs font-bold tracking-wide text-amber">{m.code}</span>
                <span className="rounded bg-cyan-dim/10 px-2.5 py-1 font-mono text-[0.7rem] font-medium text-cyan-dim">
                  Đầu ra: {m.output}
                </span>
              </div>
              <h3 className="mb-2 text-lg font-bold text-blueprint group-hover:text-amber">{m.title}</h3>
              <p className="mb-4 text-xs text-ink-soft leading-relaxed">{m.desc}</p>
              <ul className="space-y-2 border-t border-line/60 pt-4">
                {m.items.map((it) => (
                  <li key={it} className="relative pl-4 text-xs text-ink-soft before:absolute before:left-0 before:top-[7px] before:h-1.5 before:w-1.5 before:rounded-full before:bg-cyan">
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Render Remaining Finance Modules (4-6 if All) */}
          {filteredModules.slice(3, 6).map((m) => (
            <div key={m.code} className="group relative rounded-sm border border-line bg-white p-7 transition-all hover:-translate-y-1 hover:border-amber/40 hover:shadow-panel">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-mono text-xs font-bold tracking-wide text-amber">{m.code}</span>
                <span className="rounded bg-cyan-dim/10 px-2.5 py-1 font-mono text-[0.7rem] font-medium text-cyan-dim">
                  Đầu ra: {m.output}
                </span>
              </div>
              <h3 className="mb-2 text-lg font-bold text-blueprint group-hover:text-amber">{m.title}</h3>
              <p className="mb-4 text-xs text-ink-soft leading-relaxed">{m.desc}</p>
              <ul className="space-y-2 border-t border-line/60 pt-4">
                {m.items.map((it) => (
                  <li key={it} className="relative pl-4 text-xs text-ink-soft before:absolute before:left-0 before:top-[7px] before:h-1.5 before:w-1.5 before:rounded-full before:bg-cyan">
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* CENTRAL CORE HUB: MÔ-ĐUN 07 — PM QLCV (FULL WIDTH BANNER) */}
          <div className="relative col-span-1 overflow-hidden rounded-md border border-cyan/40 bg-blueprint p-9 text-paper shadow-panel md:col-span-3">
            <div
              className="pointer-events-none absolute inset-0 bg-blueprint-grid bg-grid-sm"
              aria-hidden
            />
            <div className="relative z-10">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 rounded bg-cyan/15 px-3 py-1 font-mono text-xs font-bold text-cyan border border-cyan/30">
                  <span className="h-2 w-2 rounded-full bg-cyan animate-pulse" />
                  MÔ-ĐUN 07 — CORE HUB
                </span>
                <span className="font-mono text-xs text-paper/60">Bộ Não Vận Hành Doanh Nghiệp</span>
              </div>

              <h3 className="mb-3 text-2xl font-bold text-paper md:text-3xl">
                PM QLCV — Trung Tâm Điều Phối & Giám Sát Tự Động Real-time
              </h3>
              <p className="mb-7 max-w-[820px] text-sm text-paper/80 leading-relaxed">
                QLCV tiếp nhận chỉ tiêu từ lớp Kế hoạch – Tài chính (Mod 1-6) để biến thành công việc thực thi daily, đồng thời truyền dữ liệu thực hiện thực tế về CRM, DMS, Lương 3P (Mod 8-10) và đẩy số liệu hội tụ lên CEO Dashboard (Mod 11).
              </p>

              {/* 5 Core Functions Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {CORE_FUNCTIONS.map((f, idx) => (
                  <div key={f.title} className="rounded border border-cyan/25 bg-blueprint-deep/80 p-4 backdrop-blur-sm">
                    <span className="mb-2 block font-mono text-[0.7rem] text-amber">0{idx + 1}. LÕI VẬN HÀNH</span>
                    <h4 className="mb-1 text-sm font-bold text-cyan">{f.title}</h4>
                    <p className="text-[0.78rem] text-paper/70 leading-snug">{f.desc}</p>
                  </div>
                ))}
              </div>

              {/* Auxiliary Functions Footer */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-cyan/20 pt-4 font-mono text-xs text-paper/70">
                <div className="flex items-center gap-4">
                  <span className="text-amber">Chức năng bổ trợ:</span>
                  <span>1. Truyền thông & Văn hóa DN</span>
                  <span>2. Đào tạo & E-Learning nội bộ</span>
                </div>
                <span className="text-cyan">"Bộ nhớ số" lưu giữ tri thức không phụ thuộc cá nhân</span>
              </div>
            </div>
          </div>

          {/* Render Business & People Modules (Mod 8 - Mod 11) */}
          {filteredModules.slice(6).map((m) => (
            <div key={m.code} className="group relative rounded-sm border border-line bg-white p-7 transition-all hover:-translate-y-1 hover:border-amber/40 hover:shadow-panel">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-mono text-xs font-bold tracking-wide text-amber">{m.code}</span>
                <span className="rounded bg-cyan-dim/10 px-2.5 py-1 font-mono text-[0.7rem] font-medium text-cyan-dim">
                  Đầu ra: {m.output}
                </span>
              </div>
              <h3 className="mb-2 text-lg font-bold text-blueprint group-hover:text-amber">{m.title}</h3>
              <p className="mb-4 text-xs text-ink-soft leading-relaxed">{m.desc}</p>
              <ul className="space-y-2 border-t border-line/60 pt-4">
                {m.items.map((it) => (
                  <li key={it} className="relative pl-4 text-xs text-ink-soft before:absolute before:left-0 before:top-[7px] before:h-1.5 before:w-1.5 before:rounded-full before:bg-cyan">
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
}
