/**
 * OrderCreate.tsx – Tạo đơn hàng mới (M7)
 * Chọn khách/đại lý → chọn sản phẩm → xem tổng tiền → tạo đơn
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderApi, fmtVnd, CHANNELS, WAREHOUSES, type OrderItemIn } from "../lib/orderApi";
import { productApi } from "../lib/productApi";
import { dealerApi } from "../lib/dealerApi";
import { crmApi } from "../lib/crmApi";

// ── Item row ──────────────────────────────────────────────────────
interface CartItem extends OrderItemIn {
  product_name: string;
  sku?: string;
  max_stock: number;
  auto_price: number;
}

export default function OrderCreate() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  // Buyer
  const [buyerType, setBuyerType] = useState<"customer" | "dealer">("customer");
  const [customerId, setCustomerId] = useState("");
  const [dealerId, setDealerId] = useState("");
  const [channel, setChannel] = useState("retail");
  const [warehouse, setWarehouse] = useState("main");

  // Cart
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState("");

  // Totals
  const [shippingFee, setShippingFee] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [note, setNote] = useState("");

  // Shipping
  const [shippingName, setShippingName] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingProvince, setShippingProvince] = useState("");

  const [err, setErr] = useState("");

  // Load data
  const { data: products = [] } = useQuery({
    queryKey: ["products", "active"],
    queryFn: () => productApi.list("active"),
  });

  const { data: dealerResult } = useQuery({
    queryKey: ["dealers", "active"],
    queryFn: () => dealerApi.list({ status: "active" }),
  });
  const dealers = dealerResult?.items ?? [];

  const { data: customerResult } = useQuery({
    queryKey: ["customers-list"],
    queryFn: () => crmApi.listCustomers(),
  });
  const customers = customerResult?.items ?? [];

  // Auto-fill channel khi chọn dealer
  useEffect(() => {
    if (buyerType === "dealer" && dealerId) {
      const dealer = dealers.find((d) => d.id === dealerId);
      if (dealer) {
        setChannel(dealer.tier === "tier_1" ? "tier_1" : "tier_2");
      }
    } else if (buyerType === "customer") {
      setChannel("retail");
    }
  }, [dealerId, buyerType, dealers]);

  // Lọc sản phẩm
  const filteredProducts = products.filter((p) => {
    if (!productSearch) return true;
    const q = productSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
  });

  // Thêm sản phẩm vào giỏ
  function addToCart(productId: string) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const existing = cartItems.find((i) => i.product_id === productId);
    if (existing) {
      setCartItems((prev) =>
        prev.map((i) =>
          i.product_id === productId ? { ...i, qty: i.qty + 1 } : i
        )
      );
      return;
    }

    // Lấy giá theo channel
    const autoPrice = Number(product.reference_price) || 0;

    setCartItems((prev) => [
      ...prev,
      {
        product_id: productId,
        product_name: product.name,
        sku: product.sku ?? undefined,
        qty: 1,
        unit_price: autoPrice,
        discount_pct: 0,
        auto_price: autoPrice,
        max_stock: product.total_stock,
      },
    ]);
  }

  function updateQty(productId: string, qty: number) {
    if (qty <= 0) {
      setCartItems((prev) => prev.filter((i) => i.product_id !== productId));
      return;
    }
    setCartItems((prev) =>
      prev.map((i) => (i.product_id === productId ? { ...i, qty } : i))
    );
  }

  function updatePrice(productId: string, price: number) {
    setCartItems((prev) =>
      prev.map((i) =>
        i.product_id === productId ? { ...i, unit_price: price } : i
      )
    );
  }

  function updateDiscount(productId: string, pct: number) {
    setCartItems((prev) =>
      prev.map((i) =>
        i.product_id === productId ? { ...i, discount_pct: pct } : i
      )
    );
  }

  // Tính tổng
  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.unit_price ?? item.auto_price;
    const pct = item.discount_pct ?? 0;
    return sum + price * item.qty * (1 - pct / 100);
  }, 0);
  const total = Math.max(0, subtotal + shippingFee - discountAmount);

  // Submit
  const createMut = useMutation({
    mutationFn: () =>
      orderApi.create({
        customer_id: buyerType === "customer" && customerId ? customerId : undefined,
        dealer_id: buyerType === "dealer" && dealerId ? dealerId : undefined,
        channel,
        warehouse,
        shipping_name: shippingName || undefined,
        shipping_phone: shippingPhone || undefined,
        shipping_address: shippingAddress || undefined,
        shipping_province: shippingProvince || undefined,
        shipping_fee: shippingFee,
        discount_amount: discountAmount,
        note: note || undefined,
        items: cartItems.map((i) => ({
          product_id: i.product_id,
          qty: i.qty,
          unit_price: i.unit_price,
          discount_pct: i.discount_pct,
        })),
      }),
    onSuccess: (_order) => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      navigate("/orders");
    },

    onError: (e: any) => {
      setErr(e?.response?.data?.error?.message ?? "Có lỗi khi tạo đơn hàng");
    },
  });

  const canSubmit =
    cartItems.length > 0 && (customerId || dealerId) && !createMut.isPending;

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tạo đơn hàng mới</h1>
          <p className="page-subtitle">Đơn sẽ ở trạng thái Nháp cho đến khi xác nhận</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => navigate("/orders")}>
            ← Danh sách
          </button>
          <button
            className="btn btn-primary"
            onClick={() => createMut.mutate()}
            disabled={!canSubmit}
            id="submit-order-btn"
          >
            {createMut.isPending ? "Đang tạo..." : "Tạo đơn hàng"}
          </button>
        </div>
      </div>

      {err && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{err}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20 }}>
        {/* Left: Buyer + Products */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Buyer */}
          <div className="form-card">
            <h3 className="section-title">Thông tin khách hàng</h3>
            <div className="form-grid-2">
              <div className="form-row">
                <label className="form-label">Loại khách</label>
                <select
                  className="form-control"
                  value={buyerType}
                  onChange={(e) => setBuyerType(e.target.value as "customer" | "dealer")}
                  id="buyer-type"
                >
                  <option value="customer">Khách lẻ (B2C)</option>
                  <option value="dealer">Đại lý (B2B)</option>
                </select>
              </div>

              {buyerType === "customer" ? (
                <div className="form-row">
                  <label className="form-label">Khách hàng</label>
                  <select
                    className="form-control"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    id="customer-select"
                  >
                    <option value="">-- Chọn khách hàng --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name} - {c.phone}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="form-row">
                  <label className="form-label">Đại lý</label>
                  <select
                    className="form-control"
                    value={dealerId}
                    onChange={(e) => setDealerId(e.target.value)}
                    id="dealer-select"
                  >
                    <option value="">-- Chọn đại lý --</option>
                    {dealers.map((d) => (
                      <option key={d.id} value={d.id}>
                        [{d.code}] {d.name} - {d.tier}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-row">
                <label className="form-label">Kênh bán</label>
                <select
                  className="form-control"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  id="channel-select"
                >
                  {CHANNELS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <label className="form-label">Kho xuất hàng</label>
                <select
                  className="form-control"
                  value={warehouse}
                  onChange={(e) => setWarehouse(e.target.value)}
                  id="warehouse-select"
                >
                  {WAREHOUSES.map((w) => (
                    <option key={w} value={w}>{w === "main" ? "Kho chính" : w.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Shipping */}
          <div className="form-card">
            <h3 className="section-title">Địa chỉ giao hàng (tuỳ chọn)</h3>
            <div className="form-grid-2">
              <div className="form-row">
                <label className="form-label">Người nhận</label>
                <input type="text" className="form-control" value={shippingName}
                  onChange={(e) => setShippingName(e.target.value)} placeholder="Tên người nhận..." id="ship-name" />
              </div>
              <div className="form-row">
                <label className="form-label">Số điện thoại</label>
                <input type="tel" className="form-control" value={shippingPhone}
                  onChange={(e) => setShippingPhone(e.target.value)} placeholder="0xxxxxxxxx" id="ship-phone" />
              </div>
              <div className="form-row">
                <label className="form-label">Địa chỉ</label>
                <input type="text" className="form-control" value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)} placeholder="Số nhà, đường, phường/xã..." id="ship-address" />
              </div>
              <div className="form-row">
                <label className="form-label">Tỉnh / Thành phố</label>
                <input type="text" className="form-control" value={shippingProvince}
                  onChange={(e) => setShippingProvince(e.target.value)} placeholder="Hà Nội, TP.HCM,..." id="ship-province" />
              </div>
            </div>
            <div className="form-row" style={{ marginTop: 12 }}>
              <label className="form-label">Ghi chú đơn hàng</label>
              <textarea className="form-control" rows={2} value={note}
                onChange={(e) => setNote(e.target.value)} placeholder="Yêu cầu đặc biệt, lưu ý giao hàng..." id="order-note" />
            </div>
          </div>

          {/* Product picker */}
          <div className="form-card">
            <h3 className="section-title">Thêm sản phẩm</h3>
            <div style={{ marginBottom: 12 }}>
              <input
                type="search"
                className="form-control"
                placeholder="🔍 Tìm sản phẩm theo tên hoặc SKU..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                id="product-search"
              />
            </div>
            <div style={{ maxHeight: 280, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 8 }}>
              {filteredProducts.slice(0, 30).map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderBottom: "1px solid var(--border)",
                    cursor: "pointer",
                    transition: "background .1s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                  onClick={() => addToCart(p.id)}
                  id={`add-product-${p.id}`}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {p.sku ?? "—"} · Tồn: {p.total_stock}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600 }}>
                      {fmtVnd(p.reference_price)}
                    </div>
                    <button className="btn btn-secondary" style={{ fontSize: 12, padding: "3px 10px" }}>
                      + Thêm
                    </button>
                  </div>
                </div>
              ))}
              {filteredProducts.length === 0 && (
                <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)" }}>
                  Không tìm thấy sản phẩm
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Cart summary */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="form-card" style={{ position: "sticky", top: 20 }}>
            <h3 className="section-title">
              Giỏ hàng ({cartItems.length} sản phẩm)
            </h3>

            {cartItems.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "24px 0" }}>
                Chưa có sản phẩm nào
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {cartItems.map((item) => (
                  <div
                    key={item.product_id}
                    style={{
                      padding: 12,
                      background: "var(--surface-2)",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>
                      {item.product_name}
                    </div>
                    {item.sku && (
                      <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace", marginBottom: 8 }}>
                        {item.sku}
                      </div>
                    )}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div className="form-row">
                        <label className="form-label">Đơn giá</label>
                        <input
                          type="number"
                          className="form-control"
                          value={item.unit_price ?? item.auto_price}
                          onChange={(e) => updatePrice(item.product_id, Number(e.target.value))}
                          min={0}
                          id={`price-${item.product_id}`}
                        />
                      </div>
                      <div className="form-row">
                        <label className="form-label">Số lượng</label>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            className="btn-icon"
                            onClick={() => updateQty(item.product_id, item.qty - 1)}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            className="form-control"
                            value={item.qty}
                            onChange={(e) => updateQty(item.product_id, Number(e.target.value))}
                            min={1}
                            style={{ textAlign: "center" }}
                            id={`qty-${item.product_id}`}
                          />
                          <button
                            className="btn-icon"
                            onClick={() => updateQty(item.product_id, item.qty + 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="form-row">
                        <label className="form-label">CK (%)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={item.discount_pct}
                          onChange={(e) => updateDiscount(item.product_id, Number(e.target.value))}
                          min={0}
                          max={100}
                          id={`discount-${item.product_id}`}
                        />
                      </div>
                      <div className="form-row">
                        <label className="form-label">Thành tiền</label>
                        <div style={{ fontWeight: 700, paddingTop: 10, color: "var(--accent)" }}>
                          {fmtVnd(
                            (item.unit_price ?? item.auto_price) *
                              item.qty *
                              (1 - (item.discount_pct ?? 0) / 100)
                          )}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                      {item.max_stock > 0 && item.qty > item.max_stock && (
                        <span style={{ fontSize: 12, color: "var(--danger)", marginRight: "auto" }}>
                          ⚠️ Vượt tồn kho ({item.max_stock})
                        </span>
                      )}
                      <button
                        className="btn btn-ghost"
                        style={{ fontSize: 12 }}
                        onClick={() => setCartItems((prev) => prev.filter((i) => i.product_id !== item.product_id))}
                      >
                        Xoá
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Totals */}
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
              <div className="form-row" style={{ marginBottom: 10 }}>
                <label className="form-label">Phí vận chuyển (₫)</label>
                <input
                  type="number"
                  className="form-control"
                  value={shippingFee}
                  onChange={(e) => setShippingFee(Number(e.target.value))}
                  min={0}
                  id="shipping-fee"
                />
              </div>
              <div className="form-row" style={{ marginBottom: 14 }}>
                <label className="form-label">Giảm giá đơn hàng (₫)</label>
                <input
                  type="number"
                  className="form-control"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  min={0}
                  id="discount-amount"
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Tạm tính</span>
                  <span>{fmtVnd(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>Giảm giá</span>
                    <span style={{ color: "var(--success)" }}>- {fmtVnd(discountAmount)}</span>
                  </div>
                )}
                {shippingFee > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>Phí ship</span>
                    <span>{fmtVnd(shippingFee)}</span>
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: 700,
                    fontSize: 18,
                    paddingTop: 8,
                    borderTop: "2px solid var(--border)",
                    marginTop: 4,
                    color: "var(--accent)",
                  }}
                >
                  <span>Tổng cộng</span>
                  <span>{fmtVnd(total)}</span>
                </div>
              </div>

              <button
                className="btn btn-primary"
                style={{ width: "100%", marginTop: 16 }}
                onClick={() => createMut.mutate()}
                disabled={!canSubmit}
                id="create-order-submit"
              >
                {createMut.isPending ? "Đang tạo..." : "✓ Tạo đơn hàng"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
