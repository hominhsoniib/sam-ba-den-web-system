import { useState } from "react";
import { Link } from "react-router-dom";

import Seo from "../components/Seo";
import { contact } from "../lib/api";

const SITE = import.meta.env.VITE_SITE_URL ?? "http://localhost:4174";
const FB_URL = "https://www.facebook.com/people/S%C3%A2m-B%E1%BB%91-Ch%C3%ADnh-B%C3%A0-%C4%90en-Farm/100076325312382/";

type FormState = "idle" | "loading" | "success" | "error";

export default function Contact() {
  const [state, setState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading");
    setErrorMsg("");
    try {
      await contact.submit({
        full_name: form.full_name,
        phone: form.phone,
        email: form.email || undefined,
        subject: form.subject || undefined,
        message: form.message,
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
          title: "Liên hệ — Bà Đen Farm | Tư vấn Sâm Bố Chính Tây Ninh",
          description:
            "Liên hệ Bà Đen Farm: Hotline 0919.257.757 | 0981.557.957. Địa chỉ: Lộ 12A, Khu phố Tân Trung, Phường Bình Minh, TP. Tây Ninh.",
          canonical_url: SITE + "/lien-he",
          robots: "index,follow",
        }}
      />

      {/* Hero */}
      <section className="contact-hero">
        <div className="container contact-hero-inner">
          <nav className="breadcrumb breadcrumb-light">
            <Link to="/">Trang chủ</Link> <span>/</span> <span>Liên hệ</span>
          </nav>
          <span className="hero-eyebrow">Liên hệ</span>
          <h1>Chúng tôi luôn<br />sẵn sàng lắng nghe</h1>
          <p className="about-hero-sub">
            Tư vấn sản phẩm, đặt hàng, hợp tác phân phối — hãy để lại thông tin,
            đội ngũ sẽ phản hồi trong 24 giờ.
          </p>
        </div>
      </section>

      <section className="container section">
        <div className="contact-grid">
          {/* Form */}
          {state === "success" ? (
            <div className="contact-success card">
              <div className="contact-success-icon">✅</div>
              <h2>Gửi thành công!</h2>
              <p>
                Chúng tôi đã nhận được thông tin của bạn và sẽ liên hệ lại qua
                số điện thoại hoặc email trong vòng <strong>24 giờ</strong>.
              </p>
              <p className="contact-success-hotline">
                Cần hỗ trợ ngay?{" "}
                <a href="tel:+84919257757">Gọi 0919.257.757</a>
              </p>
              <button
                className="btn btn-outline"
                onClick={() => {
                  setState("idle");
                  setForm({ full_name: "", phone: "", email: "", subject: "", message: "" });
                }}
              >
                Gửi liên hệ khác
              </button>
            </div>
          ) : (
            <form className="contact-form card" onSubmit={handleSubmit}>
              <h2>Gửi thông tin</h2>
              <p className="contact-form-sub">
                Điền thông tin bên dưới — chúng tôi sẽ phản hồi qua điện thoại
                hoặc email.
              </p>

              {state === "error" && (
                <div className="contact-alert-error">{errorMsg}</div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="contact-name">Họ và tên *</label>
                  <input
                    id="contact-name"
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
                  <label htmlFor="contact-phone">Số điện thoại *</label>
                  <input
                    id="contact-phone"
                    name="phone"
                    type="tel"
                    placeholder="0919 xxx xxx"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    disabled={state === "loading"}
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="contact-email">Email</label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  placeholder="email@example.com"
                  value={form.email}
                  onChange={handleChange}
                  disabled={state === "loading"}
                />
              </div>
              <div className="form-group">
                <label htmlFor="contact-subject">Chủ đề</label>
                <select
                  id="contact-subject"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  disabled={state === "loading"}
                >
                  <option value="">Chọn chủ đề</option>
                  <option>Tư vấn sản phẩm</option>
                  <option>Đặt hàng</option>
                  <option>Hợp tác / Đại lý</option>
                  <option>Tham quan vùng trồng</option>
                  <option>Khác</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="contact-message">Nội dung *</label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={5}
                  placeholder="Nội dung bạn muốn gửi đến chúng tôi…"
                  value={form.message}
                  onChange={handleChange}
                  required
                  disabled={state === "loading"}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%" }}
                disabled={state === "loading"}
              >
                {state === "loading" ? "Đang gửi…" : "Gửi liên hệ"}
              </button>
            </form>
          )}

          {/* Thông tin liên hệ */}
          <div className="contact-info">
            <div className="contact-info-card card">
              <h3>Thông tin liên hệ</h3>
              <div className="contact-info-items">
                <div className="contact-info-item">
                  <span className="contact-info-icon">📍</span>
                  <div>
                    <strong>Trụ sở</strong>
                    <p>Lộ 12A, Khu phố Tân Trung,<br />Phường Bình Minh, TP. Tây Ninh,<br />Tỉnh Tây Ninh</p>
                  </div>
                </div>
                <div className="contact-info-item">
                  <span className="contact-info-icon">📞</span>
                  <div>
                    <strong>Điện thoại</strong>
                    <p>
                      <a href="tel:+84919257757">0919.257.757</a><br />
                      <a href="tel:+84981557957">0981.557.957</a><br />
                      <a href="tel:+84967070790">0967.070.790</a>
                      <br />
                      <span className="contact-info-note">Thứ 2 – Thứ 7, 8:00 – 17:30</span>
                    </p>
                  </div>
                </div>
                <div className="contact-info-item">
                  <span className="contact-info-icon">✉️</span>
                  <div>
                    <strong>Email</strong>
                    <p>
                      <a href="mailto:badenfarm2020@gmail.com">badenfarm2020@gmail.com</a>
                    </p>
                  </div>
                </div>
                <div className="contact-info-item">
                  <span className="contact-info-icon">🌐</span>
                  <div>
                    <strong>Mạng xã hội</strong>
                    <p className="contact-social">
                      <a href={FB_URL} target="_blank" rel="noopener">Facebook</a>
                      <a href="https://zalo.me/0919257757" target="_blank" rel="noopener">Zalo</a>
                      <a href="https://badenfarm.com.vn" target="_blank" rel="noopener">Website</a>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="contact-map-card card">
              <h3>Vị trí trên bản đồ</h3>
              <div className="contact-map-placeholder">
                <span className="farm-map-pin">📍</span>
                <p>Lộ 12A, Khu phố Tân Trung, Phường Bình Minh, TP. Tây Ninh</p>
                <a
                  href="https://maps.google.com/?q=L%E1%BB%99+12A+T%C3%A2n+Trung+B%C3%ACnh+Minh+T%C3%A2y+Ninh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                  style={{ marginTop: 12 }}
                >
                  Mở Google Maps →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
