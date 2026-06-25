import { useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { tokenStore } from "../lib/tokenStore";
import { useAuth } from "../store/auth";

// Module điều hướng — gắn với permission để ẩn/hiện đúng quyền.
const NAV = [
  { to: "/", label: "Tổng quan", perm: null, end: true },
  { to: "/leads", label: "Quản lý Lead", perm: "customer.read" },
  { to: "/customers", label: "Khách hàng", perm: "customer.read" },
  { to: "/dealers", label: "Đại lý B2B", perm: "dealer.read" },
  { to: "/posts", label: "Bài viết", perm: "post.read" },
  { to: "/products-catalog", label: "Sản phẩm", perm: "product.read" },
  { to: "/orders", label: "Đơn hàng", perm: "order.read" },
  { to: "/qrcode", label: "Truy xuất nguồn gốc (QR)", perm: "qrcode.read" },
  { to: "/users", label: "Người dùng", perm: "user.read" },
  { to: "http://localhost:8000/landing/index.html", label: "Xem Landing Page 🌐", perm: null, external: true },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const { user, loading, loadMe, logout, can } = useAuth();

  useEffect(() => {
    if (!user) {
      if (!tokenStore.access()) {
        navigate("/login", { replace: true });
        return;
      }
      void loadMe();
    }
  }, [user, loadMe, navigate]);

  if (loading || !user) {
    return <div className="screen-center">Đang tải…</div>;
  }

  const initials = user.full_name
    .split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-logo">SBĐ</span>
          <span className="sidebar-name">Sâm Bà Đen</span>
        </div>
        <nav className="sidebar-nav">
          {NAV.filter((n) => !n.perm || can(n.perm)).map((n) => {
            if (n.external) {
              return (
                <a
                  key={n.to}
                  href={n.to}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nav-item"
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
                  "nav-item" + (isActive ? " nav-item-active" : "")
                }
              >
                {n.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="sidebar-foot">Hệ quản trị nội bộ · v0.1</div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-title">Bảng điều khiển</div>
          <div className="topbar-user">
            <div className="avatar">{initials}</div>
            <div className="topbar-user-meta">
              <strong>{user.full_name}</strong>
              <span>{user.email}</span>
            </div>
            <button
              className="btn btn-ghost"
              onClick={() => {
                logout();
                navigate("/login", { replace: true });
              }}
            >
              Đăng xuất
            </button>
          </div>
        </header>

        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
