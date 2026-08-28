"use client";

import { useReveal } from "./useReveal";

const DATA_GROUPS = [
  "Dữ liệu Khách hàng",
  "Dữ liệu Sản phẩm",
  "Dữ liệu Tài chính & P&L",
  "Dữ liệu Nhân sự & Lương 3P",
  "Dữ liệu Đối tác & Nhà cung cấp",
  "Dữ liệu Kho & Hàng hóa",
  "Dữ liệu Vận hành & QLCV",
];

const AI_CAPABILITIES = [
  {
    title: "1. Phân Tích Chuyên Sâu",
    desc: "Phân tích biến động doanh thu, chi phí, biên lợi nhuận và hiệu suất làm việc từng bộ phận.",
  },
  {
    title: "2. Dự Báo & Mô Hình Hóa",
    desc: "Dự báo dòng tiền thu - chi, nhu cầu hàng tồn kho và kịch bản doanh thu kỳ tới.",
  },
  {
    title: "3. Cảnh Báo Thông Minh",
    desc: "Cảnh báo lệch kế hoạch, nguy cơ thâm hụt dòng tiền, quá hạn thanh toán và trễ tiến độ dự án.",
  },
  {
    title: "4. Đề Xuất & Khuyến Nghị",
    desc: "Gợi ý điều chỉnh định biên nhân sự, đề xuất hạn mức chiết khấu và tối ưu quy trình SOP.",
  },
];

const SECURITY_PILLARS = [
  { label: "SSO & 2FA", desc: "Xác thực một lần kèm mã 2 lớp bảo mật tài khoản" },
  { label: "Role-Based ACL", desc: "Phân quyền chặt chẽ theo chức danh & phòng ban" },
  { label: "Mã Hóa & Sao Lưu", desc: "Mã hóa dữ liệu lưu trữ & tự động backup định kỳ" },
  { label: "Audit Log System", desc: "Nhật ký hệ thống ghi lại 100% thao tác truy cập" },
];

export function DataCases() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <section id="du-lieu" className="py-24 bg-white">
      <div className="mx-auto mb-14 max-w-[800px] px-8 text-center">
        <span className="mb-4 inline-flex items-center justify-center gap-2.5 font-mono text-xs uppercase tracking-widest text-cyan-dim before:h-px before:w-[22px] before:bg-amber">
          Nền tảng Dùng Chung
        </span>
        <h2 className="mb-4 text-3xl font-bold text-blueprint md:text-4xl">
          Nguồn Dữ Liệu Tập Trung, Trí Tuệ Nhân Tạo & Bảo Mật 4 Lớp
        </h2>
        <p className="text-ink-soft">
          Lớp hạ tầng vững chắc đứng sau toàn bộ 11 mô-đun, đảm bảo mọi phần mềm nói cùng một ngôn ngữ dữ liệu thay vì quản lý dữ liệu phân tán.
        </p>
      </div>

      <div ref={ref} className="reveal mx-auto max-w-[1200px] px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
          {/* Data Lake & Warehouse */}
          <div className="rounded border border-line bg-paper-dim p-8 shadow-sm">
            <span className="mb-2 block font-mono text-xs font-bold text-amber">3.1 HỢP NHẤT DỮ LIỆU</span>
            <h3 className="mb-3 text-xl font-bold text-blueprint">Data Warehouse / Lake</h3>
            <p className="mb-6 text-xs text-ink-soft leading-relaxed">
              7 nhóm dữ liệu gốc được hợp nhất tập trung, tạo điều kiện tiên quyết cho các mô-đun phân tích MA, AI và BI Dashboard hoạt động chính xác.
            </p>
            <div className="space-y-2 border-t border-line/60 pt-4">
              {DATA_GROUPS.map((g) => (
                <div key={g} className="flex items-center gap-2 text-xs text-blueprint font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber" />
                  <span>{g}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI & Analytics */}
          <div className="rounded border border-cyan/30 bg-blueprint p-8 text-paper shadow-md">
            <span className="mb-2 block font-mono text-xs font-bold text-cyan">3.2 AI & ANALYTICS</span>
            <h3 className="mb-3 text-xl font-bold text-paper">AI Copilot Hỗ Trợ Ra Quyết Định</h3>
            <p className="mb-6 text-xs text-paper/75 leading-relaxed">
              AI phục vụ 4 nhu cầu xuyên suốt hệ sinh thái, đóng vai trò trợ lý khai thác dữ liệu sẵn có để tư vấn cho lãnh đạo.
            </p>
            <div className="space-y-4 border-t border-cyan/20 pt-4">
              {AI_CAPABILITIES.map((c) => (
                <div key={c.title}>
                  <h4 className="text-xs font-bold text-cyan">{c.title}</h4>
                  <p className="text-[0.78rem] text-paper/70 leading-snug">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Security & Roles */}
          <div className="rounded border border-line bg-paper-dim p-8 shadow-sm">
            <span className="mb-2 block font-mono text-xs font-bold text-amber">3.3 BẢO MẬT & PHÂN QUYỀN</span>
            <h3 className="mb-3 text-xl font-bold text-blueprint">4 Trụ Cột An Toàn Thông Tin</h3>
            <p className="mb-6 text-xs text-ink-soft leading-relaxed">
              Đảm bảo giám sát tự động không cần nhân sự audit một cách đáng tin cậy và tuân thủ tuyệt đối an toàn dữ liệu doanh nghiệp.
            </p>
            <div className="space-y-4 border-t border-line/60 pt-4">
              {SECURITY_PILLARS.map((p) => (
                <div key={p.label} className="rounded bg-white p-3 border border-line">
                  <div className="font-mono text-xs font-bold text-blueprint">{p.label}</div>
                  <div className="text-[0.76rem] text-ink-soft">{p.desc}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
