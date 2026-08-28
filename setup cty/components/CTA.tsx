"use client";

import { useReveal } from "./useReveal";

export function CTA() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <section id="lien-he" className="py-24">
      <div className="mx-auto max-w-[1200px] px-8">
        <div
          ref={ref}
          className="reveal relative overflow-hidden bg-blueprint px-6 py-16 text-center text-paper sm:px-12"
        >
          <div className="pointer-events-none absolute inset-0 bg-blueprint-grid bg-grid-sm" aria-hidden />
          <div className="relative">
            <h2 className="mx-auto mb-4 max-w-[760px] text-3xl font-bold text-paper md:text-4xl">
              Biến doanh nghiệp thành một hệ thống có thể nhìn thấy, đo lường
              và điều hành.
            </h2>
            <p className="mx-auto mb-8 max-w-[640px] font-mono text-sm text-paper/70">
              CHIẾN LƯỢC → KẾ HOẠCH → NGÂN SÁCH → THỰC THI → DỮ LIỆU → PHÂN
              TÍCH → QUYẾT ĐỊNH → CẢI TIẾN
            </p>
            <a
              href="mailto:contact@nexus-enterprise.vn"
              className="inline-block rounded-sm bg-cyan px-7 py-3.5 text-sm font-bold text-blueprint-deep transition-colors hover:bg-[#8FF0EA]"
            >
              Đăng ký tư vấn hệ sinh thái
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
