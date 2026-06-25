import { Link } from "react-router-dom";

import Seo from "../components/Seo";

const SITE = import.meta.env.VITE_SITE_URL ?? "http://localhost:4174";

const PROCESS_STEPS = [
  { step: "01", title: "Chọn giống", desc: "Tuyển chọn giống sâm bản địa thuần chủng từ vùng Núi Bà Đen, đảm bảo nguồn gen quý." },
  { step: "02", title: "Ươm trồng", desc: "Ươm trong nhà lưới, chăm sóc thủ công — không dùng thuốc kích thích hay hóa chất." },
  { step: "03", title: "Canh tác", desc: "Trồng trên đất tự nhiên, tưới tiêu hợp lý, bón phân hữu cơ. Nhật ký canh tác ghi chép từng ngày." },
  { step: "04", title: "Thu hoạch", desc: "Thu hoạch đúng tuổi sâm (12-18 tháng), đảm bảo dược tính cao nhất." },
  { step: "05", title: "Chế biến", desc: "Chế biến tại xưởng đạt chuẩn an toàn thực phẩm. Mỗi lô sản phẩm được kiểm tra chất lượng." },
  { step: "06", title: "Truy xuất", desc: "Mỗi sản phẩm gắn QR Code truy xuất nguồn gốc — từ vùng trồng đến tay người dùng." },
];

const CERTIFICATIONS = [
  { name: "OCOP 4 sao", desc: "Chương trình mỗi xã một sản phẩm — Tây Ninh công nhận", color: "var(--gold-600)" },
  { name: "VietGAP", desc: "Thực hành nông nghiệp tốt Việt Nam", color: "var(--green-600)" },
  { name: "GlobalGAP", desc: "Tiêu chuẩn nông nghiệp tốt toàn cầu", color: "#16a34a" },
  { name: "ISO 22000", desc: "Hệ thống quản lý an toàn thực phẩm quốc tế", color: "#2563eb" },
  { name: "An toàn thực phẩm", desc: "Đạt tiêu chuẩn theo quy định Bộ Y tế", color: "var(--green-700)" },
  { name: "CN Nông thôn Tiêu biểu", desc: "Sản phẩm công nghiệp nông thôn tiêu biểu cấp tỉnh", color: "#7c3aed" },
];

export default function FarmArea() {
  return (
    <>
      <Seo
        seo={{
          title: "Vùng trồng Sâm Bà Đen — Núi Bà Đen, Tây Ninh",
          description:
            "Khám phá vùng trồng sâm bản địa tại Núi Bà Đen, Tây Ninh: quy trình canh tác tự nhiên, chứng nhận OCOP, VietGAP.",
          canonical_url: SITE + "/vung-trong",
          robots: "index,follow",
        }}
      />

      {/* Hero */}
      <section className="farm-hero" style={{
        backgroundImage: 'linear-gradient(180deg, rgba(12,46,18,0.72) 0%, rgba(12,46,18,0.88) 100%), url("http://localhost:8000/files/images/vuon_sam_1.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        <div className="container farm-hero-inner">
          <nav className="breadcrumb breadcrumb-light">
            <Link to="/">Trang chủ</Link> <span>/</span> <span>Vùng trồng</span>
          </nav>
          <span className="hero-eyebrow">Nguồn gốc · Chất lượng</span>
          <h1>Vùng trồng<br /><em>Núi Bà Đen</em></h1>
          <p className="about-hero-sub">
            10+ hecta canh tác hữu cơ tại chân Núi Bà Đen — liên kết 4 huyện
            Tây Ninh, năng suất 5-7 tấn sâm tươi/hecta.
          </p>
        </div>
      </section>

      {/* Giới thiệu vùng trồng */}
      <section className="container section">
        <div className="farm-intro-grid">
          <div className="farm-intro-visual" style={{ position: "relative", overflow: "hidden", borderRadius: "12px", minHeight: "300px" }}>
            <img src="http://localhost:8000/files/images/vuon_sam_2.jpg" alt="Vùng trồng Sâm Bà Đen" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
            <div className="farm-map-placeholder" style={{
              position: "absolute",
              inset: 0,
              background: "rgba(12,46,18,0.65)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(2px)",
              border: "none",
              color: "#fff"
            }}>
              <span className="farm-map-pin" style={{ fontSize: "40px" }}>📍</span>
              <div className="farm-map-label" style={{ color: "#fff" }}>
                <strong style={{ color: "#fff" }}>Núi Bà Đen</strong>
                <span style={{ color: "rgba(255,255,255,0.85)" }}>Tây Ninh, Việt Nam</span>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px" }}>11°22′N 106°06′E</span>
              </div>
            </div>
          </div>
          <div className="farm-intro-text">
            <span className="section-label">Vị trí</span>
            <h2>Tại sao Núi Bà Đen?</h2>
            <p>
              Tại sườn Đông Núi Bà Đen (986m), vùng trồng của Bà Đen Farm hưởng
              khí hậu mát mẻ quảnh năm, độ ẩm cao, đất giàu dinh dưỡng — điều
              kiện lý tưởng để Sâm Bố Chính tích lũy dược tính tối đa.
            </p>
            <p>
              Vùng trồng liên kết với nông dân 4 huyện: Gò Dầu, Dương Minh
              Châu, Châu Thành và Tân Biên — tạo sinh kế bền vững cho cộng
              đồng nông nghiệp địa phương.
            </p>
            <div className="farm-stats-row">
              <div className="farm-stat">
                <strong>986m</strong>
                <span>Độ cao</span>
              </div>
              <div className="farm-stat">
                <strong>10+ ha</strong>
                <span>Diện tích</span>
              </div>
              <div className="farm-stat">
                <strong>5-7 tấn</strong>
                <span>Năng suất/ha</span>
              </div>
              <div className="farm-stat">
                <strong>15.2 mg/g</strong>
                <span>Saponin tổng</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quy trình canh tác */}
      <section className="farm-process-section">
        <div className="container section">
          <div className="farm-process-head">
            <span className="section-label">Quy trình</span>
            <h2>Từ giống đến sản phẩm</h2>
            <p className="farm-process-sub">
              6 bước nghiêm ngặt — 8 đến 18 tháng canh tác hữu cơ
            </p>
          </div>
          <div className="farm-process-grid">
            {PROCESS_STEPS.map((s) => (
              <div key={s.step} className="farm-step-card">
                <span className="farm-step-num">{s.step}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chứng nhận */}
      <section className="container section">
        <div className="farm-cert-head">
          <span className="section-label">Chứng nhận</span>
          <h2>Tiêu chuẩn & Chứng nhận</h2>
        </div>
        <div className="farm-cert-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
          {CERTIFICATIONS.map((c) => (
            <div key={c.name} className="farm-cert-card">
              <div className="farm-cert-badge" style={{ background: c.color }}>
                ✓
              </div>
              <h3>{c.name}</h3>
              <p>{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="about-cta-section">
        <div className="container about-cta-inner">
          <h2>Muốn tham quan vùng trồng?</h2>
          <p>Liên hệ để đặt lịch tham quan trực tiếp vùng trồng tại Tây Ninh.</p>
          <div className="about-cta-btns">
            <Link to="/lien-he" className="btn btn-primary">
              Liên hệ ngay
            </Link>
            <Link to="/san-pham" className="btn btn-outline">
              Xem sản phẩm
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
