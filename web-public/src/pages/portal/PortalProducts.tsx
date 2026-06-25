import { useEffect, useState } from "react";
import { portalApi, type PortalProduct } from "../../lib/portalApi";

export default function PortalProducts() {
  const [products, setProducts] = useState<PortalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<{product_id: string, qty: number, price: number, name: string}[]>([]);
  const [ordering, setOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    portalApi.getProducts()
      .then(res => setProducts(res))
      .finally(() => setLoading(false));
  }, []);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handleAddToCart = (product: PortalProduct) => {
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        return prev.map(i => i.product_id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { product_id: product.id, qty: 1, price: product.dealer_price, name: product.name }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.product_id === id) {
        const newQty = Math.max(0, i.qty + delta);
        return { ...i, qty: newQty };
      }
      return i;
    }).filter(i => i.qty > 0));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.qty * item.price), 0);

  const submitOrder = async () => {
    if (cart.length === 0) return;
    setOrdering(true);
    try {
      const items = cart.map(i => ({ product_id: i.product_id, quantity: i.qty }));
      await portalApi.createOrder(items);
      setOrderSuccess(true);
      setCart([]);
      setTimeout(() => setOrderSuccess(false), 5000);
    } catch (err) {
      alert("Lỗi khi đặt hàng, vui lòng thử lại.");
    } finally {
      setOrdering(false);
    }
  };

  if (loading) return <div>Đang tải danh sách sản phẩm...</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Product List */}
      <div className="flex-1">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Sản phẩm Bán sỉ</h2>
        {orderSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            <p className="font-medium">Đặt hàng thành công! Đơn hàng đã được tự động xác nhận và ghi vào công nợ.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {products.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
              <div className="h-48 bg-gray-100 flex items-center justify-center p-4">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="max-h-full object-contain" />
                ) : (
                  <span className="text-gray-400">Chưa có hình</span>
                )}
              </div>
              <div className="p-4 flex flex-col flex-1">
                <p className="text-xs text-gray-500 mb-1">SKU: {p.sku}</p>
                <h3 className="font-bold text-gray-800 text-lg mb-2 line-clamp-2">{p.name}</h3>
                
                <div className="mt-auto pt-4 border-t border-gray-100 flex items-end justify-between">
                  <div>
                    {p.dealer_price < p.base_price && (
                      <p className="text-xs text-gray-400 line-through mb-0.5">{formatMoney(p.base_price)}</p>
                    )}
                    <p className="font-bold text-green-700 text-lg">{formatMoney(p.dealer_price)} <span className="text-sm font-normal text-gray-500">/{p.unit}</span></p>
                  </div>
                  <button 
                    onClick={() => handleAddToCart(p)}
                    className="p-2 bg-green-50 text-green-700 hover:bg-green-600 hover:text-white rounded transition-colors"
                    title="Thêm vào giỏ"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-full lg:w-80 shrink-0">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm sticky top-6">
          <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              Đơn hàng tạm tính
            </h3>
          </div>
          
          <div className="p-4 max-h-96 overflow-auto">
            {cart.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">Chưa có sản phẩm nào</p>
            ) : (
              <ul className="space-y-4">
                {cart.map(item => (
                  <li key={item.product_id} className="flex flex-col gap-2">
                    <p className="text-sm font-medium text-gray-800 line-clamp-2">{item.name}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-gray-300 rounded overflow-hidden">
                        <button onClick={() => updateQty(item.product_id, -1)} className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-600">-</button>
                        <span className="px-3 py-0.5 text-sm font-medium min-w-[2rem] text-center">{item.qty}</span>
                        <button onClick={() => updateQty(item.product_id, 1)} className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-600">+</button>
                      </div>
                      <p className="text-sm font-bold text-gray-700">{formatMoney(item.price * item.qty)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {cart.length > 0 && (
            <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-600">Tổng cộng:</span>
                <span className="text-lg font-bold text-red-600">{formatMoney(cartTotal)}</span>
              </div>
              <button 
                onClick={submitOrder}
                disabled={ordering}
                className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-400 text-green-900 font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                {ordering ? "Đang xử lý..." : "Xác nhận & Ghi nợ"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
