/**
 * ProductEditor.tsx – Tạo/Chỉnh sửa sản phẩm (M6)
 * Tabs: Thông tin | Bảng giá | Kho hàng | SEO
 */
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  productApi,
  fmtVnd,
  PRICE_CHANNELS,
  WAREHOUSES,
  type ProductPriceIn,
  type ProductInventoryIn,
  type ProductImageIn,
} from "../lib/productApi";

type Tab = "info" | "prices" | "inventory" | "seo";

// ── Image manager ────────────────────────────────────────────────
function ImageManager({
  images,
  onChange,
}: {
  images: ProductImageIn[];
  onChange: (imgs: ProductImageIn[]) => void;
}) {
  const [url, setUrl] = useState("");

  function addImage() {
    if (!url.trim()) return;
    const isPrimary = images.length === 0;
    onChange([...images, { image_url: url.trim(), is_primary: isPrimary, sort_order: images.length }]);
    setUrl("");
  }

  function setPrimary(idx: number) {
    onChange(images.map((img, i) => ({ ...img, is_primary: i === idx })));
  }

  function remove(idx: number) {
    const next = images.filter((_, i) => i !== idx);
    // Đảm bảo ảnh đầu là primary nếu không có primary
    if (next.length > 0 && !next.some((i) => i.is_primary)) {
      next[0].is_primary = true;
    }
    onChange(next);
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          type="url"
          className="form-control"
          placeholder="Nhập URL ảnh..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addImage()}
          id="img-url-input"
        />
        <button type="button" className="btn btn-secondary" onClick={addImage}>
          + Thêm
        </button>
      </div>
      {images.length === 0 && (
        <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "20px 0" }}>
          Chưa có ảnh nào
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px,1fr))", gap: 10 }}>
        {images.map((img, i) => (
          <div
            key={i}
            style={{
              border: img.is_primary
                ? "2px solid var(--accent)"
                : "1px solid var(--border)",
              borderRadius: 8,
              overflow: "hidden",
              position: "relative",
            }}
          >
            <img
              src={img.image_url}
              alt=""
              style={{ width: "100%", height: 100, objectFit: "cover" }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.background = "var(--surface-2)";
              }}
            />
            {img.is_primary && (
              <div
                style={{
                  position: "absolute",
                  top: 4,
                  left: 4,
                  background: "var(--accent)",
                  color: "#fff",
                  fontSize: 10,
                  borderRadius: 4,
                  padding: "2px 5px",
                }}
              >
                Chính
              </div>
            )}
            <div
              style={{
                display: "flex",
                gap: 4,
                padding: "4px",
                background: "var(--surface)",
              }}
            >
              {!img.is_primary && (
                <button
                  type="button"
                  style={{ flex: 1, fontSize: 10 }}
                  className="btn btn-secondary"
                  onClick={() => setPrimary(i)}
                  title="Đặt làm ảnh chính"
                >
                  ★
                </button>
              )}
              <button
                type="button"
                style={{ flex: 1, fontSize: 10 }}
                className="btn btn-ghost"
                onClick={() => remove(i)}
                title="Xóa"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Price table ──────────────────────────────────────────────────
function PriceTable({
  prices,
  onChange,
}: {
  prices: ProductPriceIn[];
  onChange: (p: ProductPriceIn[]) => void;
}) {
  function set(channel: string, field: keyof ProductPriceIn, value: any) {
    const exists = prices.find((p) => p.channel === channel);
    if (exists) {
      onChange(
        prices.map((p) => (p.channel === channel ? { ...p, [field]: value } : p)),
      );
    } else {
      onChange([...prices, { channel, price: 0, is_active: true, [field]: value }]);
    }
  }

  function getRow(channel: string): ProductPriceIn {
    return prices.find((p) => p.channel === channel) ?? { channel, price: 0, is_active: true };
  }

  return (
    <div>
      <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 12 }}>
        Cài giá cho từng kênh bán. Để trống hoặc bỏ kích hoạt nếu không áp dụng.
      </p>
      <table className="data-table" id="price-table">
        <thead>
          <tr>
            <th>Kênh bán</th>
            <th>Giá (VND)</th>
            <th>Kích hoạt</th>
            <th>Ghi chú</th>
          </tr>
        </thead>
        <tbody>
          {PRICE_CHANNELS.map(({ value, label }) => {
            const row = getRow(value);
            return (
              <tr key={value}>
                <td style={{ fontWeight: 500 }}>{label}</td>
                <td>
                  <input
                    type="number"
                    className="form-control"
                    style={{ maxWidth: 160 }}
                    min={0}
                    step={1000}
                    value={row.price || ""}
                    onChange={(e) => set(value, "price", parseFloat(e.target.value) || 0)}
                    id={`price-${value}`}
                    placeholder="0"
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={row.is_active ?? true}
                    onChange={(e) => set(value, "is_active", e.target.checked)}
                    id={`active-${value}`}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ghi chú (tuỳ chọn)"
                    value={row.note ?? ""}
                    onChange={(e) => set(value, "note", e.target.value)}
                    id={`note-${value}`}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ marginTop: 12, color: "var(--text-muted)", fontSize: 12 }}>
        Preview giá lẻ:{" "}
        <strong>{fmtVnd(prices.find((p) => p.channel === "retail")?.price)}</strong>
      </div>
    </div>
  );
}

// ── Inventory table ──────────────────────────────────────────────
function InventoryTable({
  inventory,
  onChange,
}: {
  inventory: ProductInventoryIn[];
  onChange: (i: ProductInventoryIn[]) => void;
}) {
  function set(warehouse: string, field: keyof ProductInventoryIn, value: any) {
    const exists = inventory.find((i) => i.warehouse === warehouse);
    if (exists) {
      onChange(inventory.map((i) => (i.warehouse === warehouse ? { ...i, [field]: value } : i)));
    } else {
      onChange([...inventory, { warehouse, qty_on_hand: 0, qty_reserved: 0, low_stock_threshold: 10, [field]: value }]);
    }
  }

  function getRow(warehouse: string): ProductInventoryIn {
    return inventory.find((i) => i.warehouse === warehouse) ?? {
      warehouse,
      qty_on_hand: 0,
      qty_reserved: 0,
      low_stock_threshold: 10,
    };
  }

  const totalStock = inventory.reduce((sum, i) => sum + Math.max(0, (i.qty_on_hand ?? 0) - (i.qty_reserved ?? 0)), 0);

  return (
    <div>
      <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 12 }}>
        Nhập tồn kho ban đầu theo từng kho hàng.
      </p>
      <table className="data-table" id="inventory-table">
        <thead>
          <tr>
            <th>Kho</th>
            <th>Tồn thực tế</th>
            <th>Đang giữ</th>
            <th>Ngưỡng cảnh báo</th>
            <th>Khả dụng</th>
          </tr>
        </thead>
        <tbody>
          {WAREHOUSES.map((wh) => {
            const row = getRow(wh);
            const avail = Math.max(0, (row.qty_on_hand ?? 0) - (row.qty_reserved ?? 0));
            return (
              <tr key={wh}>
                <td style={{ fontWeight: 500 }}>
                  {wh === "main" ? "🏭 Kho chính" : `📦 ${wh.toUpperCase()}`}
                </td>
                <td>
                  <input
                    type="number"
                    className="form-control"
                    style={{ maxWidth: 100 }}
                    min={0}
                    value={row.qty_on_hand ?? 0}
                    onChange={(e) => set(wh, "qty_on_hand", parseInt(e.target.value) || 0)}
                    id={`qty-${wh}`}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="form-control"
                    style={{ maxWidth: 100 }}
                    min={0}
                    value={row.qty_reserved ?? 0}
                    onChange={(e) => set(wh, "qty_reserved", parseInt(e.target.value) || 0)}
                    id={`reserved-${wh}`}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="form-control"
                    style={{ maxWidth: 100 }}
                    min={0}
                    value={row.low_stock_threshold ?? 10}
                    onChange={(e) => set(wh, "low_stock_threshold", parseInt(e.target.value) || 10)}
                    id={`threshold-${wh}`}
                  />
                </td>
                <td>
                  <span
                    style={{
                      fontWeight: 600,
                      color: avail === 0 ? "var(--danger)" : avail < 10 ? "var(--warning)" : "var(--success)",
                    }}
                  >
                    {avail}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4} style={{ textAlign: "right", fontWeight: 600 }}>
              Tổng khả dụng:
            </td>
            <td style={{ fontWeight: 700, color: "var(--accent)" }}>{totalStock}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ── Main Editor ──────────────────────────────────────────────────
export default function ProductEditor() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("info");
  const [err, setErr] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [description, setDescription] = useState("");
  const [refPrice, setRefPrice] = useState("");
  const [unit, setUnit] = useState("");
  const [packagingInfo, setPackagingInfo] = useState("");
  const [weightG, setWeightG] = useState("");
  const [usageInfo, setUsageInfo] = useState("");
  const [disclaimer, setDisclaimer] = useState("");
  const [status, setStatus] = useState("active");
  const [sortOrder, setSortOrder] = useState(0);
  const [images, setImages] = useState<ProductImageIn[]>([]);
  const [prices, setPrices] = useState<ProductPriceIn[]>([]);
  const [inventory, setInventory] = useState<ProductInventoryIn[]>([]);

  // SEO
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");
  const [ogImage, setOgImage] = useState("");

  // Load categories
  const { data: categories = [] } = useQuery({
    queryKey: ["product-categories"],
    queryFn: () => productApi.listCategories(),
  });

  // Load product if editing
  const { data: existingProduct } = useQuery({
    queryKey: ["product", id],
    queryFn: () => productApi.get(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (!existingProduct) return;
    const p = existingProduct;
    setName(p.name);
    setSku(p.sku ?? "");
    setBarcode(p.barcode ?? "");
    setCategoryId(p.category.id);
    setShortDesc(p.short_desc ?? "");
    setDescription(p.description ?? "");
    setRefPrice(p.reference_price != null ? String(p.reference_price) : "");
    setUnit(p.unit ?? "");
    setPackagingInfo(p.packaging_info ?? "");
    setWeightG(p.weight_g != null ? String(p.weight_g) : "");
    setUsageInfo(p.usage_info ?? "");
    setDisclaimer(p.disclaimer ?? "");
    setStatus(p.status);
    setSortOrder(p.sort_order);
    setSeoTitle(p.seo_title ?? "");
    setSeoDesc(p.seo_description ?? "");
    setOgImage(p.og_image_url ?? "");
    setImages(
      p.images.map((img) => ({
        image_url: img.image_url,
        alt_text: img.alt_text ?? undefined,
        is_primary: img.is_primary,
        sort_order: img.sort_order,
      })),
    );
    setPrices(
      p.prices.map((pr) => ({
        channel: pr.channel,
        price: typeof pr.price === "string" ? parseFloat(pr.price) : pr.price,
        is_active: pr.is_active,
        note: pr.note ?? undefined,
      })),
    );
    setInventory(
      p.inventory.map((inv) => ({
        warehouse: inv.warehouse,
        qty_on_hand: inv.qty_on_hand,
        qty_reserved: inv.qty_reserved,
        low_stock_threshold: inv.low_stock_threshold,
      })),
    );
  }, [existingProduct]);

  const saveMut = useMutation({
    mutationFn: () => {
      const payload = {
        name,
        sku: sku || undefined,
        barcode: barcode || undefined,
        category_id: categoryId,
        short_desc: shortDesc || undefined,
        description: description || undefined,
        reference_price: refPrice ? parseFloat(refPrice) : undefined,
        unit: unit || undefined,
        packaging_info: packagingInfo || undefined,
        weight_g: weightG ? parseInt(weightG) : undefined,
        usage_info: usageInfo || undefined,
        disclaimer: disclaimer || undefined,
        seo_title: seoTitle || undefined,
        seo_description: seoDesc || undefined,
        og_image_url: ogImage || undefined,
        status,
        sort_order: sortOrder,
        images,
        prices: prices.filter((p) => p.price > 0),
        inventory: inventory.filter((i) => (i.qty_on_hand ?? 0) > 0 || (i.qty_reserved ?? 0) > 0),
      };
      if (isEdit) return productApi.update(id!, payload);
      return productApi.create(payload);
    },
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ["products"] });
      if (!isEdit) navigate(`/products-catalog/${saved.id}`);
    },
    onError: (e: any) => {
      setErr(e?.response?.data?.error?.message ?? "Có lỗi khi lưu sản phẩm");
    },
  });

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: "info", label: "Thông tin", icon: "📋" },
    { key: "prices", label: "Bảng giá", icon: "💰" },
    { key: "inventory", label: "Kho hàng", icon: "📦" },
    { key: "seo", label: "SEO", icon: "🔍" },
  ];

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {isEdit ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
          </h1>
          {existingProduct && (
            <p className="page-subtitle">
              SKU: {existingProduct.sku ?? "—"} · Tồn kho:{" "}
              {existingProduct.total_stock} sp
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="btn btn-ghost"
            onClick={() => navigate("/products-catalog")}
          >
            ← Danh sách
          </button>
          <button
            className="btn btn-primary"
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending || !name || !categoryId}
            id="save-product-btn"
          >
            {saveMut.isPending ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo sản phẩm"}
          </button>
        </div>
      </div>

      {err && (
        <div className="alert alert-danger" style={{ marginBottom: 16 }}>
          {err}
        </div>
      )}

      {/* Tab bar */}
      <div className="tab-bar" style={{ marginBottom: 20 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab-btn ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
            id={`tab-${t.key}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Thông tin ── */}
      {tab === "info" && (
        <div className="form-card">
          <div className="form-section">
            <h3 className="section-title">Thông tin cơ bản</h3>
            <div className="form-grid-2">
              <div className="form-row">
                <label className="form-label" htmlFor="prd-name">
                  Tên sản phẩm <span className="required">*</span>
                </label>
                <input
                  id="prd-name"
                  type="text"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tên sản phẩm..."
                />
              </div>

              <div className="form-row">
                <label className="form-label" htmlFor="prd-category">
                  Danh mục <span className="required">*</span>
                </label>
                <select
                  id="prd-category"
                  className="form-control"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <label className="form-label" htmlFor="prd-sku">SKU</label>
                <input
                  id="prd-sku"
                  type="text"
                  className="form-control"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="Mã hàng nội bộ..."
                  style={{ fontFamily: "monospace" }}
                />
              </div>

              <div className="form-row">
                <label className="form-label" htmlFor="prd-barcode">Barcode / EAN</label>
                <input
                  id="prd-barcode"
                  type="text"
                  className="form-control"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Mã vạch..."
                  style={{ fontFamily: "monospace" }}
                />
              </div>

              <div className="form-row">
                <label className="form-label" htmlFor="prd-unit">Đơn vị</label>
                <input
                  id="prd-unit"
                  type="text"
                  className="form-control"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="kg, gói, chai, hộp..."
                />
              </div>

              <div className="form-row">
                <label className="form-label" htmlFor="prd-ref-price">
                  Giá lẻ tham khảo (VND)
                </label>
                <input
                  id="prd-ref-price"
                  type="number"
                  className="form-control"
                  value={refPrice}
                  onChange={(e) => setRefPrice(e.target.value)}
                  placeholder="Giá hiển thị website..."
                  min={0}
                />
              </div>

              <div className="form-row">
                <label className="form-label" htmlFor="prd-packaging">Quy cách đóng gói</label>
                <input
                  id="prd-packaging"
                  type="text"
                  className="form-control"
                  value={packagingInfo}
                  onChange={(e) => setPackagingInfo(e.target.value)}
                  placeholder="VD: 1 thùng = 24 chai 500ml"
                />
              </div>

              <div className="form-row">
                <label className="form-label" htmlFor="prd-weight">Trọng lượng (gram)</label>
                <input
                  id="prd-weight"
                  type="number"
                  className="form-control"
                  value={weightG}
                  onChange={(e) => setWeightG(e.target.value)}
                  placeholder="Dùng tính phí ship..."
                  min={0}
                />
              </div>

              <div className="form-row">
                <label className="form-label" htmlFor="prd-status">Trạng thái</label>
                <select
                  id="prd-status"
                  className="form-control"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="active">Đang bán</option>
                  <option value="hidden">Ẩn</option>
                  <option value="discontinued">Ngừng kinh doanh</option>
                </select>
              </div>

              <div className="form-row">
                <label className="form-label" htmlFor="prd-sort">Thứ tự hiển thị</label>
                <input
                  id="prd-sort"
                  type="number"
                  className="form-control"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="form-row" style={{ marginTop: 12 }}>
              <label className="form-label" htmlFor="prd-short-desc">Mô tả ngắn</label>
              <textarea
                id="prd-short-desc"
                className="form-control"
                rows={2}
                value={shortDesc}
                onChange={(e) => setShortDesc(e.target.value)}
                placeholder="Hiển thị trong danh sách sản phẩm (tối đa 200 ký tự)..."
                maxLength={500}
              />
            </div>

            <div className="form-row" style={{ marginTop: 12 }}>
              <label className="form-label" htmlFor="prd-desc">Mô tả chi tiết</label>
              <textarea
                id="prd-desc"
                className="form-control"
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nội dung đầy đủ (hỗ trợ markdown)..."
              />
            </div>

            <div className="form-row" style={{ marginTop: 12 }}>
              <label className="form-label" htmlFor="prd-usage">Hướng dẫn sử dụng</label>
              <textarea
                id="prd-usage"
                className="form-control"
                rows={3}
                value={usageInfo}
                onChange={(e) => setUsageInfo(e.target.value)}
                placeholder="Liều dùng, cách dùng..."
              />
            </div>

            <div className="form-row" style={{ marginTop: 12 }}>
              <label className="form-label" htmlFor="prd-disclaimer">Lưu ý / Cảnh báo</label>
              <textarea
                id="prd-disclaimer"
                className="form-control"
                rows={2}
                value={disclaimer}
                onChange={(e) => setDisclaimer(e.target.value)}
                placeholder="Chống chỉ định, lưu ý bảo quản..."
              />
            </div>
          </div>

          {/* Images */}
          <div className="form-section" style={{ marginTop: 24 }}>
            <h3 className="section-title">Hình ảnh sản phẩm</h3>
            <ImageManager images={images} onChange={setImages} />
          </div>
        </div>
      )}

      {/* ── Tab: Bảng giá ── */}
      {tab === "prices" && (
        <div className="form-card">
          <div className="form-section">
            <h3 className="section-title">Bảng giá đa kênh</h3>
            <PriceTable prices={prices} onChange={setPrices} />
          </div>
        </div>
      )}

      {/* ── Tab: Kho hàng ── */}
      {tab === "inventory" && (
        <div className="form-card">
          <div className="form-section">
            <h3 className="section-title">Tồn kho theo kho hàng</h3>
            <InventoryTable inventory={inventory} onChange={setInventory} />
          </div>
        </div>
      )}

      {/* ── Tab: SEO ── */}
      {tab === "seo" && (
        <div className="form-card">
          <div className="form-section">
            <h3 className="section-title">Cài đặt SEO</h3>
            <div className="form-row">
              <label className="form-label" htmlFor="prd-seo-title">
                SEO Title{" "}
                <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
                  ({(seoTitle || name).length}/60 ký tự)
                </span>
              </label>
              <input
                id="prd-seo-title"
                type="text"
                className="form-control"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                maxLength={60}
                placeholder={name || "SEO title..."}
              />
            </div>
            <div className="form-row" style={{ marginTop: 12 }}>
              <label className="form-label" htmlFor="prd-seo-desc">
                Meta Description{" "}
                <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
                  ({(seoDesc || shortDesc).length}/160 ký tự)
                </span>
              </label>
              <textarea
                id="prd-seo-desc"
                className="form-control"
                rows={3}
                value={seoDesc}
                onChange={(e) => setSeoDesc(e.target.value)}
                maxLength={160}
                placeholder="Mô tả ngắn cho Google..."
              />
            </div>
            <div className="form-row" style={{ marginTop: 12 }}>
              <label className="form-label" htmlFor="prd-og-image">OG Image URL</label>
              <input
                id="prd-og-image"
                type="url"
                className="form-control"
                value={ogImage}
                onChange={(e) => setOgImage(e.target.value)}
                placeholder="URL ảnh chia sẻ mạng xã hội..."
              />
              {ogImage && (
                <img
                  src={ogImage}
                  alt="OG preview"
                  style={{ marginTop: 8, maxWidth: 200, borderRadius: 6, border: "1px solid var(--border)" }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
            </div>

            {/* Preview card */}
            <div
              style={{
                marginTop: 20,
                padding: 16,
                background: "var(--surface-2)",
                borderRadius: 10,
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>
                Preview Google Search
              </div>
              <div style={{ color: "#1a0dab", fontSize: 18, fontWeight: 500 }}>
                {seoTitle || name || "Tên sản phẩm"}
              </div>
              <div style={{ color: "#006621", fontSize: 14 }}>
                badenfarm.com.vn/san-pham/...
              </div>
              <div style={{ color: "#545454", fontSize: 14 }}>
                {seoDesc || shortDesc || "Mô tả sản phẩm sẽ hiện ở đây..."}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
