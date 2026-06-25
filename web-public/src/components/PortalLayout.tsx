import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { portalApi, type PortalDealerProfile } from "../lib/portalApi";

export default function PortalLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<PortalDealerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("portal_access_token");
    if (!token) {
      if (location.pathname !== "/portal/login") {
        navigate("/portal/login");
      }
      setLoading(false);
      return;
    }

    portalApi.getProfile()
      .then(res => {
        setProfile(res);
      })
      .catch(err => {
        console.error("Portal auth error:", err);
        localStorage.removeItem("portal_access_token");
        navigate("/portal/login");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigate, location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("portal_access_token");
    navigate("/portal/login");
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Đang tải cấu hình Cổng Đại lý...</div>;
  }

  // Nếu đang ở trang login, không hiển thị header/sidebar
  if (location.pathname === "/portal/login") {
    return <Outlet />;
  }

  if (!profile) return null;

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-green-900 text-white flex flex-col">
        <div className="p-6">
          <h2 className="text-xl font-bold tracking-tight text-yellow-500">Sâm Bà Đen</h2>
          <p className="text-sm font-medium opacity-80 uppercase mt-1">B2B Dealer Portal</p>
        </div>
        
        <div className="px-6 mb-6">
          <div className="bg-green-800/50 rounded p-4 text-sm border border-green-700">
            <p className="text-gray-300">Đại lý:</p>
            <p className="font-bold text-white truncate" title={profile.name}>{profile.name}</p>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded border border-yellow-500/30">
                {profile.tier.toUpperCase()}
              </span>
              <span className="text-xs text-gray-300">{profile.code}</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <Link to="/portal" className={`block px-4 py-2 rounded transition-colors ${location.pathname === '/portal' ? 'bg-green-800 font-medium' : 'hover:bg-green-800/50 text-gray-300 hover:text-white'}`}>
            Bảng điều khiển
          </Link>
          <Link to="/portal/products" className={`block px-4 py-2 rounded transition-colors ${location.pathname.startsWith('/portal/products') ? 'bg-green-800 font-medium' : 'hover:bg-green-800/50 text-gray-300 hover:text-white'}`}>
            Đặt hàng B2B
          </Link>
          <Link to="/portal/orders" className={`block px-4 py-2 rounded transition-colors ${location.pathname.startsWith('/portal/orders') ? 'bg-green-800 font-medium' : 'hover:bg-green-800/50 text-gray-300 hover:text-white'}`}>
            Lịch sử Đơn hàng
          </Link>
          <Link to="/portal/ledger" className={`block px-4 py-2 rounded transition-colors ${location.pathname.startsWith('/portal/ledger') ? 'bg-green-800 font-medium' : 'hover:bg-green-800/50 text-gray-300 hover:text-white'}`}>
            Công nợ & Thanh toán
          </Link>
        </nav>

        <div className="p-4 mt-auto">
          <button 
            onClick={handleLogout}
            className="w-full py-2 px-4 bg-red-600/20 text-red-400 hover:bg-red-600/40 hover:text-white rounded transition-colors text-sm font-medium"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8 justify-between shrink-0 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-800">
            {location.pathname === '/portal' && "Bảng điều khiển"}
            {location.pathname.startsWith('/portal/products') && "Danh mục Sản phẩm Sỉ"}
            {location.pathname.startsWith('/portal/orders') && "Quản lý Đơn hàng"}
            {location.pathname.startsWith('/portal/ledger') && "Sổ cái Công nợ"}
          </h1>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-right">
              <p className="text-gray-500">Số dư nợ hiện tại</p>
              <p className={`font-bold text-lg ${profile.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(profile.balance)}
              </p>
            </div>
          </div>
        </header>

        <div className="p-8 flex-1 overflow-auto bg-gray-50/50">
          <Outlet context={{ profile }} />
        </div>
      </main>
    </div>
  );
}
