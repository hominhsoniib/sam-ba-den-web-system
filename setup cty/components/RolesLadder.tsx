"use client";

import { useReveal } from "./useReveal";

const ROLES = [
  {
    level: "LV.01",
    title: "CEO / Tổng Giám Đốc",
    view: "CEO Dashboard & Radar BI",
    focus: "Mục tiêu chiến lược, P&L toàn cty, dự báo dòng tiền, cảnh báo rủi ro & phê duyệt ngân sách tổng.",
  },
  {
    level: "LV.02",
    title: "Giám Đốc Chức Năng (CFO, CMO, COO)",
    view: "Dashboard Chuyên môn",
    focus: "Kế hoạch khối, ngân sách phân bổ, tiến độ KPI phòng ban & điều phối dòng tiền chi tiết.",
  },
  {
    level: "LV.03",
    title: "Trưởng Phòng / Bộ Phận",
    view: "Giao việc & BPM Workflow",
    focus: "Giao việc daily, giám sát tiến độ dự án, kiểm soát SOP quy trình & đánh giá hiệu suất nhân viên.",
  },
  {
    level: "LV.04",
    title: "Tổ Trưởng / Supervisor",
    view: "Quản lý nhóm & Tuyến bán",
    focus: "Theo dõi task nhóm, giám sát sales route DMS, nhắc nhở deadline & kiểm soát nguyên vật liệu.",
  },
  {
    level: "LV.05",
    title: "Nhân Viên Thực Thi",
    view: "App Cá nhân QLCV / CRM",
    focus: "Thực hiện task công việc, cập nhật tiến độ, báo giá khách hàng & theo dõi điểm KPI Lương 3P cá nhân.",
  },
];

export function RolesLadder() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <section className="bg-paper-dim py-24">
      <div className="mx-auto mb-14 max-w-[800px] px-8 text-center">
        <span className="mb-4 inline-flex items-center justify-center gap-2.5 font-mono text-xs uppercase tracking-widest text-cyan-dim before:h-px before:w-[22px] before:bg-amber">
          Phân Quyền & Đòn Bẩy Con Người
        </span>
        <h2 className="mb-4 text-3xl font-bold text-blueprint md:text-4xl">
          Phân Cấp Quản Trị 5 Tầng & Lương 3P Gắn Liền Dữ Liệu Thật
        </h2>
        <p className="text-ink-soft">
          Điểm mấu chốt để Lương 3P vận hành hiệu quả là P3 (Performance) lấy dữ liệu hiệu suất thật từ PM QLCV, tạo nên chuỗi đòn bẩy: Trả lương công bằng → Tạo động lực → Tăng năng suất → Tăng trưởng doanh thu.
        </p>
      </div>

      <div ref={ref} className="reveal mx-auto max-w-[1200px] px-8">
        
        {/* 3P Framework Banner */}
        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded border border-line bg-white p-6 shadow-sm">
            <span className="font-mono text-xs font-bold text-amber">P1 — POSITION</span>
            <h4 className="mb-2 text-base font-bold text-blueprint">Giá Trị Vị Trí Công Việc</h4>
            <p className="text-xs text-ink-soft">Đánh giá và trả lương dựa trên tầm quan trọng & giá trị của vị trí đối với tổ chức.</p>
          </div>
          <div className="rounded border border-line bg-white p-6 shadow-sm">
            <span className="font-mono text-xs font-bold text-amber">P2 — PERSON</span>
            <h4 className="mb-2 text-base font-bold text-blueprint">Năng Lực Cá Nhân</h4>
            <p className="text-xs text-ink-soft">Trả lương dựa trên kiến thức, kỹ năng, kinh nghiệm và năng lực thực tế của nhân sự.</p>
          </div>
          <div className="rounded border border-cyan/40 bg-blueprint p-6 text-paper shadow-md">
            <span className="font-mono text-xs font-bold text-cyan">P3 — PERFORMANCE</span>
            <h4 className="mb-2 text-base font-bold text-paper">Kết Quả Thật Từ QLCV</h4>
            <p className="text-xs text-paper/80">Lấy dữ liệu hoàn thành công việc real-time từ PM QLCV, loại bỏ đánh giá cảm tính.</p>
          </div>
        </div>

        {/* 5 Organizational Levels */}
        <div className="space-y-4">
          {ROLES.map((r) => (
            <div key={r.level} className="flex flex-col gap-4 rounded border border-line bg-white p-6 shadow-sm transition-all hover:border-cyan hover:shadow-md md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4 md:w-1/3">
                <span className="rounded bg-blueprint px-3 py-1.5 font-mono text-xs font-bold text-cyan">
                  {r.level}
                </span>
                <div>
                  <h4 className="text-base font-bold text-blueprint">{r.title}</h4>
                  <span className="font-mono text-[0.75rem] text-amber">{r.view}</span>
                </div>
              </div>
              <p className="text-xs text-ink-soft md:w-2/3">{r.focus}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
