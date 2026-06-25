import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { errorMessage } from "../lib/api";
import { useAuth } from "../store/auth";

export default function Login() {
  const navigate = useNavigate();
  const login = useAuth((s) => s.login);

  const [email, setEmail] = useState("admin@sambaden.vn");
  const [password, setPassword] = useState("Admin@123456");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate("/", { replace: true });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      {/* Cột trái — câu chuyện thương hiệu (signature) */}
      <aside className="login-brand" aria-hidden="true">
        <div className="login-brand-inner">
          <span className="login-mark">Sâm&nbsp;Bà&nbsp;Đen</span>
          <h2>Báu vật dược liệu<br />từ Núi Thiêng Nam Bộ</h2>
          <p>
            Hệ quản trị nội bộ — vận hành chuỗi giá trị từ vùng trồng đến
            tay khách hàng.
          </p>
          <div className="login-ridge" />
        </div>
      </aside>

      {/* Cột phải — form */}
      <main className="login-form-col">
        <div className="login-form">
          <h1>Đăng nhập</h1>
          <p className="login-sub">Dành cho nhân sự được cấp quyền truy cập.</p>

          {error && (
            <div className="alert alert-err" role="alert">
              {error}
            </div>
          )}

          <div className="field">
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="input"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="password">
              Mật khẩu
            </label>
            <input
              id="password"
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>

          <button
            className="btn btn-primary login-submit"
            onClick={submit}
            disabled={busy}
          >
            {busy ? <span className="spin" /> : "Đăng nhập"}
          </button>

          <p className="login-hint">
            Tài khoản demo đã điền sẵn — bấm Đăng nhập để vào.
          </p>
        </div>
      </main>
    </div>
  );
}
