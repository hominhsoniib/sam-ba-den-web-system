import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { portalApi } from "../../lib/portalApi";

export default function PortalPaymentCallback() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // Chuyển searchParams thành object key-value
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    portalApi.verifyPayment(params)
      .then((res) => {
        setResult(res);
      })
      .catch((err) => {
        console.error("Xác minh thanh toán thất bại:", err);
        setErrorMsg(err.response?.data?.error?.message || "Không thể xác thực giao dịch thanh toán.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [searchParams]);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] py-12 space-y-4">
        <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium animate-pulse">Đang xác thực giao dịch từ VNPay...</p>
      </div>
    );
  }

  if (errorMsg || (result && result.status !== "success")) {
    const displayError = errorMsg || result?.message || "Thanh toán không thành công hoặc đã bị hủy.";
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl border border-red-100 shadow-lg overflow-hidden my-8 p-8 text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-800">Thanh toán không thành công</h2>
          <p className="text-sm text-gray-500">{displayError}</p>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg space-y-2 text-left text-sm text-gray-600 border border-gray-100">
          {result?.txn_ref && (
            <div className="flex justify-between">
              <span>Mã giao dịch:</span>
              <span className="font-mono font-semibold">{result.txn_ref}</span>
            </div>
          )}
          {result?.amount > 0 && (
            <div className="flex justify-between">
              <span>Số tiền:</span>
              <span className="font-bold text-gray-800">{formatMoney(result.amount)}</span>
            </div>
          )}
        </div>

        <div className="pt-2">
          <Link
            to="/portal/ledger"
            className="block w-full py-3 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            Quay lại trang Sổ cái
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl border border-green-100 shadow-lg overflow-hidden my-8 p-8 text-center space-y-6">
      <div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-500 animate-bounce">
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-800">Thanh toán thành công!</h2>
        <p className="text-sm text-gray-500">Giao dịch đã được xác thực an toàn qua VNPay.</p>
      </div>

      <div className="p-4 bg-green-50/50 rounded-lg space-y-2 text-left text-sm text-gray-700 border border-green-100">
        <div className="flex justify-between">
          <span>Số tiền thanh toán:</span>
          <span className="font-bold text-green-700 text-lg">{formatMoney(result.amount)}</span>
        </div>
        <div className="flex justify-between border-t border-green-100/50 pt-2">
          <span>Mã tham chiếu:</span>
          <span className="font-mono font-semibold">{result.txn_ref}</span>
        </div>
        <div className="flex justify-between">
          <span>Trạng thái:</span>
          <span className="text-xs uppercase bg-green-100 text-green-800 px-2 py-0.5 rounded font-bold">Ghi có sổ cái</span>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Khoản thanh toán này đã được cộng vào số dư Có (Credit) trong sổ cái đại lý để giảm trừ tổng dư nợ hiện tại của bạn.
      </p>

      <div className="pt-2">
        <Link
          to="/portal/ledger"
          className="block w-full py-3 bg-green-700 hover:bg-green-800 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
        >
          Xem Sổ cái công nợ
        </Link>
      </div>
    </div>
  );
}
