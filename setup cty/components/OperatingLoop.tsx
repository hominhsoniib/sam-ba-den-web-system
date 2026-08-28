"use client";

import { useState } from "react";
import { useReveal } from "./useReveal";

const PDCA_STEPS = [
  {
    step: "PLAN (Kế hoạch)",
    mod: "Mô-đun 01",
    desc: "Đặt kế hoạch kinh doanh, mục tiêu doanh thu, chi phí và hạn mức ngân sách cho kỳ kế tiếp.",
  },
  {
    step: "DO (Thực thi)",
    mod: "Mô-đun 07, 08, 09",
    desc: "PM QLCV cùng CRM & DMS điều hành thực thi công việc daily, bán hàng và triển khai tuyến thị trường.",
  },
  {
    step: "CHECK (Kiểm tra)",
    mod: "Mô-đun 02-05 & 11",
    desc: "PM MA & BI Dashboard tự động đối chiếu kết quả thực tế với kế hoạch, phát ra cảnh báo lệch chỉ tiêu.",
  },
  {
    step: "ACT (Cải tiến)",
    mod: "Mô-đun 06 (Approve)",
    desc: "Điều chỉnh hạn mức ngân sách, cải tiến quy trình SOP; kế hoạch kỳ sau được cập nhật từ bài học thực tế.",
  },
];

const PHASES = [
  {
    phase: "GIAI ĐOẠN 1",
    title: "Nền Tảng Dữ Liệu & Kế Hoạch Gốc",
    modules: "Data Warehouse/Lake + Phân quyền SSO + Mod 01 (Lập KHKD)",
    desc: "Xây dựng hạ tầng dữ liệu tập trung, phân quyền bảo mật 4 lớp và lập kế hoạch kinh doanh mục tiêu ban đầu.",
  },
  {
    phase: "GIAI ĐOẠN 2",
    title: "Vận Hành Lõi & Thị Trường",
    modules: "Mod 07 (PM QLCV) + Mod 08 (CRM) + Mod 09 (DMS)",
    desc: "Đưa PM QLCV vào làm bộ não trung tâm điều phối công việc, kết nối ngay với CRM và DMS để có dữ liệu bán hàng real-time.",
  },
  {
    phase: "GIAI ĐOẠN 3",
    title: "Vòng Phân Tích & Kiểm Soát Ngân Sách",
    modules: "Mod 02 - Mod 06 (PM MA & PM Approve)",
    desc: "Kích hoạt mô-đun Review, Quản trị dòng tiền, Kiểm soát ngân sách và Phê duyệt online để khép kín chuỗi tài chính.",
  },
  {
    phase: "GIAI ĐOẠN 4",
    title: "Đòn Bẩy Con Người & BI Tổng Hợp",
    modules: "Mod 10 (Lương 3P từ QLCV) + Mod 11 (CEO Dashboard)",
    desc: "Áp dụng Lương 3P dựa trên dữ liệu hiệu suất thật từ QLCV, hội tụ toàn bộ chỉ số lên CEO Dashboard điều hành.",
  },
];

export function OperatingLoop() {
  const ref = useReveal<HTMLDivElement>();
  const [viewMode, setViewMode] = useState<"pdca" | "roadmap">("pdca");

  return (
    <section id="van-hanh" className="bg-paper-dim py-24">
      <div className="mx-auto mb-14 max-w-[800px] px-8 text-center">
        <span className="mb-4 inline-flex items-center justify-center gap-2.5 font-mono text-xs uppercase tracking-widest text-cyan-dim before:h-px before:w-[22px] before:bg-amber">
          Chu Trình PDCA & Lộ Trình Triển Khai
        </span>
        <h2 className="mb-4 text-3xl font-bold text-blueprint md:text-4xl">
          Vòng Lặp Cải Tiến Liên Tục & 4 Giai Đoạn Triển Khai
        </h2>
        <p className="text-ink-soft">
          Hệ sinh thái không dừng lại ở việc vận hành, mà liên tục tự cải tiến theo chu trình Plan – Do – Check – Act, giúp doanh nghiệp tăng trưởng bền vững trên dữ liệu thật.
        </p>

        {/* Toggle Mode */}
        <div className="mt-8 flex justify-center gap-3">
          <button
            onClick={() => setViewMode("pdca")}
            className={`rounded-full px-6 py-2.5 text-xs font-bold transition-all ${
              viewMode === "pdca"
                ? "bg-blueprint text-paper shadow-sm"
                : "bg-white text-ink-soft hover:bg-blueprint/10"
            }`}
          >
            Vòng lặp Cải tiến PDCA
          </button>
          <button
            onClick={() => setViewMode("roadmap")}
            className={`rounded-full px-6 py-2.5 text-xs font-bold transition-all ${
              viewMode === "roadmap"
                ? "bg-blueprint text-paper shadow-sm"
                : "bg-white text-ink-soft hover:bg-blueprint/10"
            }`}
          >
            Lộ trình Triển khai 4 Giai đoạn
          </button>
        </div>
      </div>

      <div ref={ref} className="reveal mx-auto max-w-[1200px] px-8">
        {viewMode === "pdca" ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PDCA_STEPS.map((s, idx) => (
              <div key={s.step} className="relative rounded border border-line bg-white p-7 shadow-sm transition-all hover:border-amber hover:shadow-md">
                <div className="mb-4 flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blueprint font-mono text-xs font-bold text-cyan">
                    0{idx + 1}
                  </span>
                  <span className="font-mono text-[0.7rem] text-amber">{s.mod}</span>
                </div>
                <h3 className="mb-2 text-lg font-bold text-blueprint">{s.step}</h3>
                <p className="text-xs text-ink-soft leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PHASES.map((p) => (
              <div key={p.phase} className="relative rounded border border-cyan/30 bg-blueprint p-7 text-paper shadow-md transition-all hover:border-cyan">
                <span className="mb-2 block font-mono text-xs font-bold text-amber">{p.phase}</span>
                <h3 className="mb-2 text-lg font-bold text-cyan">{p.title}</h3>
                <span className="mb-3 block font-mono text-[0.7rem] text-paper/60">{p.modules}</span>
                <p className="text-xs text-paper/80 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Banner */}
        <div className="mt-12 rounded bg-white p-8 border border-line text-center">
          <h4 className="mb-2 text-lg font-bold text-blueprint">
            Nguyên Tắc Dữ Liệu Thống Nhất (Single Source of Truth)
          </h4>
          <p className="mx-auto max-w-[760px] text-xs text-ink-soft leading-relaxed">
            Một thông tin khách hàng hoặc đơn hàng bước vào ở đầu chuỗi (Marketing/CRM) sẽ được cùng một bộ dữ liệu đồng hành xuyên suốt hành trình — Báo giá, Đơn hàng, Xuất kho, Giao hàng, Thanh toán và Báo cáo BI — loại bỏ hoàn toàn việc nhập lại dữ liệu thủ công giữa các phòng ban.
          </p>
        </div>
      </div>
    </section>
  );
}
