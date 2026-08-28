"use client";

import { useReveal } from "./useReveal";

const SATELLITES = [
  { x: 40, y: 40, w: 100, label: "KẾ HOẠCH" },
  { x: 320, y: 40, w: 100, label: "TÀI CHÍNH" },
  { x: 0, y: 170, w: 90, label: "CRM" },
  { x: 370, y: 170, w: 90, label: "DMS" },
  { x: 40, y: 300, w: 100, label: "NHÂN SỰ" },
  { x: 320, y: 300, w: 100, label: "DỮ LIỆU · AI" },
];

export function Hero() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <section id="top" className="relative overflow-hidden bg-blueprint py-28 text-paper">
      {/* blueprint grid backdrop */}
      <div
        className="pointer-events-none absolute inset-0 bg-blueprint-grid bg-grid"
        style={{
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 20%, black 40%, transparent 90%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 70% at 50% 20%, black 40%, transparent 90%)",
        }}
      />

      <div className="relative mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-14 px-8 md:grid-cols-[1.05fr_0.95fr]">
        <div>
          <span className="mb-6 inline-flex items-center gap-2 border border-cyan-dim px-3.5 py-1.5 font-mono text-xs uppercase tracking-widest text-cyan">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan" />
            Hệ quản trị doanh nghiệp số
          </span>

          <h1 className="mb-5 text-[2.3rem] font-bold leading-[1.14] text-paper md:text-5xl lg:text-[3.5rem]">
            Một hệ sinh thái.
            <br />
            Một nguồn dữ liệu.
            <br />
            <span className="text-cyan">Một hệ điều hành doanh nghiệp.</span>
          </h1>

          <p className="mb-9 max-w-[540px] text-lg text-paper/70">
            Từ chiến lược và kế hoạch kinh doanh đến ngân sách, dòng tiền, vận
            hành, khách hàng, nhân sự, dữ liệu và AI — tất cả kết nối thành
            một vòng quản trị khép kín, không còn số liệu rời rạc giữa các
            phòng ban.
          </p>

          <div className="flex flex-wrap gap-3.5">
            <a
              href="#he-sinh-thai"
              className="rounded-sm bg-cyan px-6 py-3.5 text-sm font-bold text-blueprint-deep transition-colors hover:bg-[#8FF0EA]"
            >
              Khám phá hệ sinh thái
            </a>
            <a
              href="#van-hanh"
              className="rounded-sm border border-paper/35 px-6 py-3.5 text-sm font-bold text-paper transition-colors hover:bg-paper/10"
            >
              Xem vòng quản trị
            </a>
          </div>
        </div>

        {/* schematic panel — signature element */}
        <div
          ref={ref}
          className="reveal relative border border-cyan/30 bg-blueprint-deep/60 p-6"
        >
          <span className="pointer-events-none absolute -left-px -top-px h-3.5 w-3.5 border-l-[1.5px] border-t-[1.5px] border-cyan" />
          <span className="pointer-events-none absolute -bottom-px -right-px h-3.5 w-3.5 border-b-[1.5px] border-r-[1.5px] border-cyan" />

          <div className="mb-5 flex items-center justify-between font-mono text-xs tracking-wider text-cyan">
            <span>SYS.OVERVIEW</span>
            <span>REV 2026.08</span>
          </div>

          <svg viewBox="0 0 460 380" className="h-auto w-full">
            <g stroke="rgba(110,231,212,0.14)" strokeWidth={1} fill="none">
              <path d="M90 60 H230 V150" />
              <path d="M370 60 H230 V150" />
              <path d="M90 320 H230 V210" />
              <path d="M370 320 H230 V210" />
              <path d="M40 190 H140" />
              <path d="M320 190 H420" />
            </g>

            {SATELLITES.map((s) => (
              <g key={s.label} fontFamily="IBM Plex Mono" fontSize={10.5} fill="#F6F8FB">
                <rect x={s.x} y={s.y} width={s.w} height={40} fill="none" stroke="#3E93A0" />
                <text x={s.x + s.w / 2} y={s.y + 24} textAnchor="middle">
                  {s.label}
                </text>
              </g>
            ))}

            <rect x={165} y={150} width={130} height={60} fill="#0A1F3D" stroke="#6EE7E0" strokeWidth={1.5} />
            <text x={230} y={176} textAnchor="middle" fontFamily="IBM Plex Mono" fontSize={11} fill="#6EE7E0" fontWeight={600}>
              QLCV
            </text>
            <text x={230} y={192} textAnchor="middle" fontFamily="IBM Plex Mono" fontSize={8.5} fill="rgba(246,248,251,0.55)">
              BỘ NÃO ĐIỀU HÀNH
            </text>
            <circle cx={230} cy={180} r={46} fill="none" stroke="#6EE7E0" strokeOpacity={0.35}>
              <animate attributeName="r" values="40;54;40" dur="4s" repeatCount="indefinite" />
              <animate attributeName="stroke-opacity" values="0.4;0.05;0.4" dur="4s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>
      </div>
    </section>
  );
}
