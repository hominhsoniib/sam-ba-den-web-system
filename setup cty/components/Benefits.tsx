"use client";

import { useReveal } from "./useReveal";

const BENEFITS = [
  { n: "01", title: "Rõ mục tiêu", desc: "Mục tiêu từ CEO được chuyển thành KPI và công việc cụ thể." },
  { n: "02", title: "Điều hành nhanh", desc: "Quản lý nhìn thấy tiến độ, vấn đề và cảnh báo sớm." },
  { n: "03", title: "Kiểm soát nguồn lực", desc: "Kế hoạch, ngân sách, dòng tiền và phê duyệt được kết nối." },
  { n: "04", title: "Phối hợp xuyên phòng ban", desc: "Giảm đứt gãy thông tin giữa Kinh doanh, Marketing, SX, Mua hàng, TCKT, NS-HC..." },
  { n: "05", title: "Bảo toàn tri thức", desc: "Tài nguyên, SOP, dữ liệu và kinh nghiệm được lưu giữ trong hệ thống." },
  { n: "06", title: "Tăng hiệu suất", desc: "Lương 3P gắn vị trí, năng lực và hiệu quả thực tế." },
  { n: "07", title: "Kiểm soát minh bạch", desc: "Phân quyền, nhật ký, phê duyệt và dữ liệu có dấu vết." },
  { n: "08", title: "Tăng trưởng bền vững", desc: "Ra quyết định dựa trên dữ liệu và cải tiến liên tục." },
];

export function Benefits() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <section id="gia-tri" className="relative overflow-hidden bg-blueprint py-24 text-paper">
      <div
        className="pointer-events-none absolute inset-0 bg-blueprint-grid bg-grid"
        style={{
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 85%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 85%)",
        }}
      />

      <div className="relative mx-auto max-w-[1200px] px-8">
        <div className="mb-14 mx-auto max-w-[680px] text-center">
          <span className="mb-4 inline-flex items-center justify-center gap-2.5 font-mono text-xs uppercase tracking-widest text-cyan before:h-px before:w-[22px] before:bg-amber">
            Giá trị mang lại
          </span>
          <h2 className="mb-4 text-3xl font-bold text-paper md:text-4xl">
            Doanh nghiệp vận hành minh bạch, chủ động và có khả năng đo lường
          </h2>
          <p className="text-paper/70">
            Mục tiêu của số hóa không phải là có nhiều phần mềm hơn, mà là tạo
            ra một hệ thống quản trị tốt hơn.
          </p>
        </div>

        <div ref={ref} className="reveal grid grid-cols-1 gap-px border border-cyan/20 bg-cyan/20 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b) => (
            <div key={b.n} className="bg-blueprint p-7">
              <span className="mb-3.5 block font-mono text-[0.7rem] text-amber">{b.n}</span>
              <b className="mb-2 block text-base text-paper">{b.title}</b>
              <p className="text-[0.86rem] text-paper/65">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
