import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { portalApi } from "../../lib/portalApi";

export default function PortalLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await portalApi.login(email, password);
      localStorage.setItem("portal_access_token", data.access_token);
      navigate("/portal");
    } catch (err: any) {
      setError(err.response?.data?.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại email/mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-green-900 p-8 text-center text-white">
          <h1 className="text-2xl font-bold text-yellow-500 mb-2">Sâm Bà Đen</h1>
          <p className="text-sm opacity-90 uppercase tracking-widest">Dealer Portal</p>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-100">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email / Tài khoản</label>
              <input
                type="email"
                required
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-600 focus:border-green-600 outline-none transition-shadow"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
              <input
                type="password"
                required
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-600 focus:border-green-600 outline-none transition-shadow"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-medium py-2.5 rounded transition-colors disabled:opacity-70 flex justify-center"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : "Đăng nhập hệ thống"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
