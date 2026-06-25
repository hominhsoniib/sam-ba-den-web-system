import { Link } from "react-router-dom";

import Seo from "../components/Seo";

const SITE = import.meta.env.VITE_SITE_URL ?? "http://localhost:4174";

const PERKS = [
  { icon: "🌿", title: "Môi trường xanh", desc: "Làm việc gần gũi thiên nhiên, vùng trồng tại Núi Bà Đen" },
  { icon: "📈", title: "Phát triển", desc: "Cơ hội học hỏi, thăng tiến trong ngành dược liệu" },
  { icon: "🤝", title: "Đồng đội", desc: "Đội ngũ trẻ, năng động, gắn kết" },
  { icon: "🎯", title: "Sứ mệnh", desc: "Góp phần đưa dược liệu Việt đến mọi nhà" },
];

const OPENINGS = [
  {
    title: "Quản lý Vùng trồng",
    dept: "Nông nghiệp",
    location: "Tây Ninh",
    type: "Toàn thời gian",
    desc: "Giám sát quy trình canh tác, quản lý đội nông nghiệp, đảm bảo chất lượng vùng trồng.",
  },
  {
    title: "Nhân viên Kinh doanh",
    dept: "Kinh doanh",
    location: "TP.HCM / Tây Ninh",
    type: "Toàn thời gian",
    desc: "Phát triển kênh phân phối, chăm sóc đại lý, mở rộng thị trường tại các tỉnh miền Nam.",
  },
  {
    title: "Chuyên viên Marketing",
    dept: "Marketing",
    location: "TP.HCM",
    type: "Toàn thời gian",
    desc: "Xây dựng chiến lược truyền thông, quản lý fanpage, sáng tạo nội dung về dược liệu.",
  },
  {
    title: "Kỹ thuật viên Chế biến",
    dept: "Sản xuất",
    location: "Tây Ninh",
    type: "Toàn thời gian",
    desc: "Vận hành dây chuyền chế biến sâm, kiểm soát chất lượng sản phẩm.",
  },
  {
    title: "Thực tập sinh Nội dung",
    dept: "Marketing",
    location: "Linh hoạt",
    type: "Bán thời gian",
    desc: "Hỗ trợ viết bài blog, chụp ảnh sản phẩm, quay video vùng trồng.",
  },
];

export default function Careers() {
  return (
    <>
      <Seo
        seo={{
          title: "Tuyển dụng — Sâm Bà Đen | Gia nhập đội ngũ",
          description:
            "Tuyển dụng tại Sâm Bà Đen: cơ hội làm việc trong ngành dược liệu, phát triển nông nghiệp bền vững.",
          canonical_url: SITE + "/tuyen-dung",
          robots: "index,follow",
        }}
      />

      {/* Hero */}
      <section className="careers-hero">
        <div className="container careers-hero-inner">
          <nav className="breadcrumb breadcrumb-light">
            <Link to="/">Trang chủ</Link> <span>/</span> <span>Tuyển dụng</span>
          </nav>
          <span className="hero-eyebrow">Gia nhập đội ngũ</span>
          <h1>Cùng xây dựng<br />thương hiệu sâm Việt</h1>
          <p className="about-hero-sub">
            Chúng tôi đang tìm kiếm những người đồng hành — yêu thiên nhiên,
            đam mê dược liệu và muốn tạo ra giá trị bền vững.
          </p>
        </div>
      </section>

      {/* Văn hoá công ty */}
      <section className="container section">
        <div className="careers-culture-head">
          <span className="section-label">Văn hóa</span>
          <h2>Tại sao chọn Sâm Bà Đen?</h2>
        </div>
        <div className="careers-perks-grid">
          {PERKS.map((p) => (
            <div key={p.title} className="careers-perk-card">
              <span className="careers-perk-icon">{p.icon}</span>
              <h3>{p.title}</h3>
              <p>{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Vị trí tuyển dụng */}
      <section className="careers-openings-section">
        <div className="container section">
          <div className="section-head">
            <h2>Vị trí đang tuyển</h2>
            <span className="section-link">{OPENINGS.length} vị trí</span>
          </div>
          <div className="careers-list">
            {OPENINGS.map((o) => (
              <div key={o.title} className="careers-job-card card">
                <div className="careers-job-head">
                  <div>
                    <h3>{o.title}</h3>
                    <div className="careers-job-tags">
                      <span className="careers-job-tag">{o.dept}</span>
                      <span className="careers-job-tag">{o.location}</span>
                      <span className="careers-job-tag">{o.type}</span>
                    </div>
                  </div>
                  <a
                    href={`mailto:badenfarm2020@gmail.com?subject=Ứng tuyển: ${o.title}`}
                    className="btn btn-primary careers-apply-btn"
                  >
                    Ứng tuyển
                  </a>
                </div>
                <p className="careers-job-desc">{o.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="about-cta-section">
        <div className="container about-cta-inner">
          <h2>Không tìm thấy vị trí phù hợp?</h2>
          <p>
            Gửi CV của bạn — chúng tôi luôn mở cửa cho những tài năng phù hợp
            với sứ mệnh.
          </p>
          <div className="about-cta-btns">
            <a href="mailto:badenfarm2020@gmail.com" className="btn btn-primary">
              Gửi CV qua Email
            </a>
            <Link to="/lien-he" className="btn btn-outline">
              Liên hệ trực tiếp
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
