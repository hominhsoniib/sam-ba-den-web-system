import { useEffect, useState } from "react";
import { portalApi } from "../../lib/portalApi";

export default function PortalOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalApi.getOrders()
      .then(res => setOrders(res))
      .finally(() => setLoading(false));
  }, []);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const statusMap: Record<string, { label: string, color: string }> = {
    draft: { label: "Bản nháp", color: "bg-gray-100 text-gray-800" },
    confirmed: { label: "Đã xác nhận", color: "bg-blue-100 text-blue-800" },
    shipping: { label: "Đang giao", color: "bg-yellow-100 text-yellow-800" },
    completed: { label: "Hoàn thành", color: "bg-green-100 text-green-800" },
    cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-800" },
  };

  if (loading) return <div>Đang tải lịch sử đơn hàng...</div>;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
        <h2 className="text-xl font-bold text-gray-800">Lịch sử Đơn hàng</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => portalApi.exportOrders('excel')}
            className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
          >
            Xuất Excel
          </button>
          <button 
            onClick={() => portalApi.exportOrders('pdf')}
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
              <th className="p-4 font-medium">Mã đơn</th>
              <th className="p-4 font-medium">Ngày đặt</th>
              <th className="p-4 font-medium">Trạng thái</th>
              <th className="p-4 font-medium">Địa chỉ giao</th>
              <th className="p-4 font-medium text-right">Tổng tiền</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  Bạn chưa có đơn hàng nào.
                </td>
              </tr>
            ) : (
              orders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium text-green-700">{order.order_no}</td>
                  <td className="p-4 text-gray-600">
                    {new Date(order.created_at).toLocaleDateString('vi-VN', {
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusMap[order.status]?.color || "bg-gray-100 text-gray-800"}`}>
                      {statusMap[order.status]?.label || order.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600 max-w-xs truncate" title={order.shipping_address}>
                    {order.shipping_address || "Mặc định"}
                  </td>
                  <td className="p-4 font-bold text-gray-800 text-right">
                    {formatMoney(order.total_amount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
