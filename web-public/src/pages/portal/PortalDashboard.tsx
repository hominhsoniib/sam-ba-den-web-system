import { useOutletContext, Link } from "react-router-dom";
import type { PortalDealerProfile } from "../../lib/portalApi";

export default function PortalDashboard() {
  const { profile } = useOutletContext<{ profile: PortalDealerProfile }>();

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const availableCredit = profile.credit_limit - profile.balance;
  const creditUsagePercent = profile.credit_limit > 0 
    ? Math.min(100, Math.max(0, (profile.balance / profile.credit_limit) * 100)) 
    : 0;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Xin chào, {profile.contact_name || profile.name}!</h2>
        <p className="text-gray-500">Chào mừng bạn trở lại Hệ thống B2B của Sâm Bà Đen.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Nợ hiện tại */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Dư nợ hiện tại</h3>
            <span className="p-2 bg-red-50 text-red-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </span>
          </div>
          <p className={`text-2xl font-bold ${profile.balance > 0 ? 'text-red-600' : 'text-gray-800'}`}>
            {formatMoney(profile.balance)}
          </p>
          <Link to="/portal/ledger" className="mt-auto pt-4 text-sm text-green-600 hover:text-green-700 font-medium flex items-center">
            Xem sao kê <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
          </Link>
        </div>

        {/* Card 2: Hạn mức khả dụng */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Hạn mức Khả dụng</h3>
            <span className="p-2 bg-green-50 text-green-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {formatMoney(availableCredit)}
          </p>
          <div className="mt-4 w-full bg-gray-200 rounded-full h-1.5 mb-1">
            <div className={`h-1.5 rounded-full ${creditUsagePercent > 80 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${creditUsagePercent}%` }}></div>
          </div>
          <p className="text-xs text-gray-500 text-right mt-1">Tổng hạn mức: {formatMoney(profile.credit_limit)}</p>
        </div>

        {/* Card 3: Quick Action */}
        <div className="bg-gradient-to-br from-green-800 to-green-900 p-6 rounded-xl shadow-sm text-white flex flex-col justify-center items-center text-center">
          <h3 className="text-lg font-bold mb-2">Cần đặt hàng mới?</h3>
          <p className="text-sm text-green-100 mb-6">Truy cập danh mục sản phẩm sỉ dành riêng cho {profile.tier.toUpperCase()}</p>
          <Link to="/portal/products" className="bg-yellow-500 hover:bg-yellow-400 text-green-900 font-bold py-2 px-6 rounded-lg transition-colors">
            Đến trang Đặt hàng
          </Link>
        </div>
      </div>
    </div>
  );
}
