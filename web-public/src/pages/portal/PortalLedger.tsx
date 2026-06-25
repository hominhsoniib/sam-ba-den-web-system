import { useEffect, useState } from "react";
import { portalApi } from "../../lib/portalApi";

export default function PortalLedger() {
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    portalApi.getLedgers()
      .then(res => setLedgers(res))
      .finally(() => setLoading(false));
  }, []);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handlePaymentSubmit = async () => {
    const amountVal = parseFloat(paymentAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      setErrorMsg("Vui lòng nhập số tiền hợp lệ lớn hơn 0.");
      return;
    }
    setPaymentLoading(true);
    setErrorMsg("");
    try {
      const paymentUrl = await portalApi.createPaymentUrl(amountVal);
      window.location.href = paymentUrl;
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error?.message || "Không thể kết nối đến VNPay. Vui lòng thử lại sau.");
      setPaymentLoading(false);
    }
  };

  if (loading) return <div>Đang tải sổ cái...</div>;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gray-50/50 flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Sổ cái & Giao dịch Công nợ</h2>
          <p className="text-sm text-gray-500 mt-1">Ghi chú: Nợ (Debit) là bạn mua hàng hoặc nợ tiền. Có (Credit) là bạn đã thanh toán hoặc được thưởng/giảm trừ.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowPaymentModal(true)}
            className="px-4 py-2 text-sm font-semibold text-white bg-amber-600 border border-amber-700 rounded-lg hover:bg-amber-700 transition-colors shadow-sm"
          >
            Thanh toán công nợ
          </button>
          <button 
            onClick={() => portalApi.exportLedger('excel')}
            className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
          >
            Xuất Excel
          </button>
          <button 
            onClick={() => portalApi.exportLedger('pdf')}
            className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
          >
            Xuất PDF
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
              <th className="p-4 font-medium">Thời gian</th>
              <th className="p-4 font-medium">Loại</th>
              <th className="p-4 font-medium text-right">Số tiền</th>
              <th className="p-4 font-medium">Nguồn/Tham chiếu</th>
              <th className="p-4 font-medium">Diễn giải</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {ledgers.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  Chưa có giao dịch nào phát sinh.
                </td>
              </tr>
            ) : (
              ledgers.map((l: any) => (
                <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-gray-600">
                    {new Date(l.created_at).toLocaleString('vi-VN')}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${l.entry_type === 'debit' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                      {l.entry_type === 'debit' ? 'GHI NỢ (-)' : 'GHI CÓ (+)'}
                    </span>
                  </td>
                  <td className={`p-4 font-bold text-right ${l.entry_type === 'debit' ? 'text-red-600' : 'text-green-600'}`}>
                    {formatMoney(l.amount)}
                  </td>
                  <td className="p-4 text-gray-600 uppercase text-xs font-mono">
                    {l.ref_type}
                  </td>
                  <td className="p-4 text-gray-800">
                    {l.note || "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-md w-full p-6 space-y-4 m-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Thanh toán công nợ qua VNPay</h3>
              <button 
                onClick={() => { setShowPaymentModal(false); setErrorMsg(""); }}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
              >
                &times;
              </button>
            </div>
            
            <p className="text-sm text-gray-500">
              Nhập số tiền bạn muốn thanh toán. Hệ thống sẽ chuyển hướng bạn đến cổng thanh toán VNPay Sandbox để thực hiện giao dịch an toàn.
            </p>
            
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
                {errorMsg}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">Số tiền (VND)</label>
              <input 
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Ví dụ: 5000000"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-lg font-bold text-gray-800"
              />
            </div>
            
            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => { setShowPaymentModal(false); setErrorMsg(""); }}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handlePaymentSubmit}
                disabled={paymentLoading || !paymentAmount}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors text-sm font-bold shadow-sm flex items-center justify-center disabled:opacity-50"
              >
                {paymentLoading ? "Đang kết nối VNPay..." : "Thanh toán"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
