import { useState } from "react";
import { Link } from "react-router-dom";

import Seo from "../components/Seo";
import { contact } from "../lib/api";

const SITE = import.meta.env.VITE_SITE_URL ?? "http://localhost:4174";

type FormState = "idle" | "loading" | "success" | "error";

const REGIONS = [
  {
    name: "Miền Nam",
    dealers: [
      { name: "Đại lý Tây Ninh 1", area: "TP. Tây Ninh", phone: "0909 xxx 001", tier: "Cấp 1" },
      { name: "Đại lý Bình Dương", area: "Thủ Dầu Một", phone: "0909 xxx 002", tier: "Cấp 1" },
      { name: "Đại lý Sài Gòn Trung tâm", area: "Quận 1, TP.HCM", phone: "0909 xxx 003", tier: "Cấp 1" },
      { name: "Đại lý Đồng Nai", area: "Biên Hòa", phone: "0909 xxx 004", tier: "Cấp 2" },
      { name: "Đại lý Long An", area: "Tân An", phone: "0909 xxx 005", tier: "Cấp 2" },
    ],
  },
  {
    name: "Miền Trung",
    dealers: [
      { name: "Đại lý Đà Nẵng", area: "Hải Châu, Đà Nẵng", phone: "0909 xxx 010", tier: "Cấp 1" },
      { name: "Đại lý Khánh Hòa", area: "Nha Trang", phone: "0909 xxx 011", tier: "Cấp 2" },
    ],
  },
  {
    name: "Miền Bắc",
    dealers: [
      { name: "Đại lý Hà Nội", area: "Hoàn Kiếm, Hà Nội", phone: "0909 xxx 020", tier: "Cấp 1" },
      { name: "Đại lý Hải Phòng", area: "Lê Chân, Hải Phòng", phone: "0909 xxx 021", tier: "Cấp 2" },
    ],
  },
];

const BENEFITS = [
  { icon: "💰", title: "Chiết khấu hấp dẫn", desc: "Hưởng chính sách giá tốt nhất theo cấp đại lý, cộng thưởng theo doanh số." },
  { icon: "📦", title: "Hỗ trợ kho & vận chuyển", desc: "Giao hàng tận nơi, hỗ trợ quản lý tồn kho, đổi trả linh hoạt." },
  { icon: "📢", title: "Marketing đồng hành", desc: "Cung cấp POSM, tư liệu truyền thông, hỗ trợ chạy quảng cáo khu vực." },
  { icon: "🎓", title: "Đào tạo sản phẩm", desc: "Được đào tạo kiến thức dược liệu, kỹ năng bán hàng và chăm sóc khách." },
];

export default function Dealers() {
  const [state, setState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    area: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading");
    setErrorMsg("");
    try {
      await contact.submitDealer({
        full_name: form.full_name,
        phone: form.phone,
        email: form.email || undefined,
        area: form.area,
        message: form.message || undefined,
      });
      setState("success");
    } catch (err: unknown) {
      setState("error");
      setErrorMsg(
        err instanceof Error ? err.message : "Có lỗi xảy ra, vui lòng thử lại."
      );
    }
  };

  return (
    <>
      <Seo
        seo={{
          title: "Hệ thống Đại lý — Bà Đen Farm | Sâm Bố Chính Tây Ninh",
          description:
            "Tìm đại lý Bà Đen Farm gần bạn hoặc đăng ký trở thành đối tác phân phối Sâm Bố Chính từ Núi Bà Đen.",
          canonical_url: SITE + "/dai-ly",
          robots: "index,follow",
        }}
      />

      {/* Hero */}
      <section className="dealers-hero">
        <div className="container dealers-hero-inner">
          <nav className="breadcrumb breadcrumb-light">
            <Link to="/">Trang chủ</Link> <span>/</span> <span>Đại lý</span>
          </nav>
          <span className="hero-eyebrow">Mạng lưới phân phối</span>
          <h1>Hệ thống Đại lý<br />Bà Đen Farm</h1>
          <p className="about-hero-sub">
            Đại lý trải dài cả nước — mang Sâm Bố Chính hữu cơ đến gần hơn
            với mọi gia đình Việt.
          </p>
        </div>
      </section>

      {/* Danh sách đại lý theo vùng */}
      <section className="container section">
        <div className="section-head">
          <h2>Tìm đại lý gần bạn</h2>
        </div>
        {REGIONS.map((region) => (
          <div key={region.name} className="dealer-region">
            <h3 className="dealer-region-name">{region.name}</h3>
            <div className="dealer-cards">
              {region.dealers.map((d) => (
                <div key={d.name} className="dealer-card">
                  <div className="dealer-card-head">
                    <span className="dealer-card-name">{d.name}</span>
                    <span className={`dealer-tier dealer-tier-${d.tier === "Cấp 1" ? "1" : "2"}`}>
                      {d.tier}
                    </span>
                  </div>
                  <div className="dealer-card-info">
                    <span>📍 {d.area}</span>
                    <span>📞 {d.phone}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Đăng ký đại lý */}
      <section className="dealer-register-section">
        <div className="container section">
          <div className="dealer-register-grid">
            <div className="dealer-register-info">
              <span className="section-label">Trở thành đối tác</span>
              <h2>Đăng ký Đại lý Bà Đen Farm</h2>
              <p>
                Gia nhập mạng lưới phân phối Sâm Bố Chính hữu cơ — cùng xây dựng
                thương hiệu dược liệu Việt và tạo sinh kế bền vững.
              </p>
              <div className="dealer-benefits">
                {BENEFITS.map((b) => (
                  <div key={b.title} className="dealer-benefit">
                    <span className="dealer-benefit-icon">{b.icon}</span>
                    <div>
                      <strong>{b.title}</strong>
                      <p>{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {state === "success" ? (
              <div className="contact-success card">
                <div className="contact-success-icon">✅</div>
                <h3>Đăng ký thành công!</h3>
                <p>
                  Chúng tôi đã nhận được đơn đăng ký đại lý của bạn. Đội kinh
                  doanh sẽ liên hệ trong vòng <strong>1-2 ngày làm việc</strong>.
                </p>
                <p className="contact-success-hotline">
                  Cần trao đổi ngay?{" "}
                  <a href="tel:+84919257757">Gọi 0919.257.757</a>
                </p>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setState("idle");
                    setForm({ full_name: "", phone: "", email: "", area: "", message: "" });
                  }}
                >
                  Gửi đăng ký khác
                </button>
              </div>
            ) : (
              <form className="dealer-form card" onSubmit={handleSubmit}>
                <h3>Đăng ký ngay</h3>

                {state === "error" && (
                  <div className="contact-alert-error">{errorMsg}</div>
                )}

                <div className="form-group">
                  <label htmlFor="dealer-name">Họ và tên *</label>
                  <input
                    id="dealer-name"
                    name="full_name"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={form.full_name}
                    onChange={handleChange}
                    required
                    disabled={state === "loading"}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="dealer-phone">Số điện thoại *</label>
                  <input
                    id="dealer-phone"
                    name="phone"
                    type="tel"
                    placeholder="0919 xxx xxx"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    disabled={state === "loading"}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="dealer-email">Email</label>
                  <input
                    id="dealer-email"
                    name="email"
                    type="email"
                    placeholder="email@example.com"
                    value={form.email}
                    onChange={handleChange}
                    disabled={state === "loading"}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="dealer-area">Khu vực kinh doanh *</label>
                  <input
                    id="dealer-area"
                    name="area"
                    type="text"
                    placeholder="Quận/Huyện, Tỉnh/TP"
                    value={form.area}
                    onChange={handleChange}
                    required
                    disabled={state === "loading"}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="dealer-note">Ghi chú</label>
                  <textarea
                    id="dealer-note"
                    name="message"
                    rows={3}
                    placeholder="Kinh nghiệm, kênh bán hàng hiện tại…"
                    value={form.message}
                    onChange={handleChange}
                    disabled={state === "loading"}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                  disabled={state === "loading"}
                >
                  {state === "loading" ? "Đang gửi…" : "Gửi đăng ký"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

