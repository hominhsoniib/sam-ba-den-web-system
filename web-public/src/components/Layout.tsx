import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";

const FB_URL = "https://www.facebook.com/people/S%C3%A2m-B%E1%BB%91-Ch%C3%ADnh-B%C3%A0-%C4%90en-Farm/100076325312382/";

const NAV_LINKS = [
  { to: "/", label: "Trang chủ", end: true },
  { to: "/gioi-thieu", label: "Giới thiệu" },
  { to: "/san-pham", label: "Sản phẩm" },
  { to: "/vung-trong", label: "Vùng trồng" },
  { to: "/dai-ly", label: "Đại lý" },
  { to: "/blog", label: "Blog" },
  { to: "http://localhost:8000/landing/index.html", label: "Landing Page", external: true },
  { to: "/lien-he", label: "Liên hệ" },
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="site-header">
        <div className="container site-header-inner">
          <Link to="/" className="site-logo" onClick={() => setMobileOpen(false)}>
            <img src="/images/logo.jpg" alt="Bà Đen Farm" style={{ height: "40px", width: "40px", objectFit: "cover", borderRadius: "8px" }} />
            <span className="site-logo-name">Bà Đen Farm</span>
          </Link>

          {/* Desktop nav */}
          <nav className="site-nav">
            {NAV_LINKS.map((n) => {
              if (n.external) {
                return (
                  <a
                    key={n.to}
                    href={n.to}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="site-nav-link"
                  >
                    {n.label}
                  </a>
                );
              }
              return (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.end}
                  className={({ isActive }) =>
                    isActive ? "site-nav-link active" : "site-nav-link"
                  }
                >
                  {n.label}
                </NavLink>
              );
            })}
          </nav>

          <Link to="/lien-he" className="btn btn-primary site-cta">
            Tư vấn
          </Link>

          {/* Hamburger */}
          <button
            className={`hamburger ${mobileOpen ? "hamburger-open" : ""}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
            aria-expanded={mobileOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        {/* Mobile nav overlay */}
        {mobileOpen && (
          <div className="mobile-nav-overlay" onClick={() => setMobileOpen(false)}>
            <nav
              className="mobile-nav"
              onClick={(e) => e.stopPropagation()}
            >
              {NAV_LINKS.map((n) => {
                if (n.external) {
                  return (
                    <a
                      key={n.to}
                      href={n.to}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mobile-nav-link"
                      onClick={() => setMobileOpen(false)}
                    >
                      {n.label}
                    </a>
                  );
                }
                return (
                  <NavLink
                    key={n.to}
                    to={n.to}
                    end={n.end}
                    className={({ isActive }) =>
                      "mobile-nav-link" + (isActive ? " active" : "")
                    }
                    onClick={() => setMobileOpen(false)}
                  >
                    {n.label}
                  </NavLink>
                );
              })}
              <div className="mobile-nav-extra">
                <Link to="/tuyen-dung" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
                  Tuyển dụng
                </Link>
                <Link to="/faq" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
                  FAQ
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <div className="footer-brand" style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <img src="/images/logo.jpg" alt="Bà Đen Farm" style={{ height: "36px", width: "36px", objectFit: "cover", borderRadius: "6px" }} />
              <span className="site-logo-name" style={{ color: "#fff", fontSize: "20px" }}>Bà Đen Farm</span>
            </div>
            <p className="footer-tagline">
              Sâm Bố Chính từ Núi Bà Đen, Tây Ninh — hữu cơ, an toàn,
              OCOP 4 sao.
            </p>
            <div className="footer-social">
              <a href={FB_URL} target="_blank" rel="noopener" aria-label="Facebook">FB</a>
              <a href="https://zalo.me/0919257757" target="_blank" rel="noopener" aria-label="Zalo">Zalo</a>
            </div>
          </div>
          <div>
            <h4>Khám phá</h4>
            <Link to="/gioi-thieu">Giới thiệu</Link>
            <Link to="/san-pham">Sản phẩm</Link>
            <Link to="/blog">Blog kiến thức</Link>
            <Link to="/vung-trong">Vùng trồng</Link>
          </div>
          <div>
            <h4>Hỗ trợ</h4>
            <Link to="/dai-ly">Hệ thống đại lý</Link>
            <Link to="/tuyen-dung">Tuyển dụng</Link>
            <Link to="/faq">Câu hỏi thường gặp</Link>
            <Link to="/lien-he">Liên hệ</Link>
          </div>
          <div>
            <h4>Liên hệ</h4>
            <p>Lộ 12A, Khu phố Tân Trung,<br />Phường Bình Minh, TP. Tây Ninh</p>
            <p>
              <a href="tel:+84919257757">0919.257.757</a>
            </p>
            <p>
              <a href="tel:+84981557957">0981.557.957</a>
            </p>
          </div>
        </div>
        <div className="container footer-bottom">
          <p>
            © {new Date().getFullYear()} Công ty Cổ phần Bà Đen Farm. Sản phẩm này không phải là
            thuốc và không có tác dụng thay thế thuốc chữa bệnh.
          </p>
        </div>
      </footer>
    </>
  );
}
