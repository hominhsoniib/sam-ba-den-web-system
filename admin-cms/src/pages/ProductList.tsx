/**
 * Products.tsx – Quản lý sản phẩm (M6)
 * Danh sách + lọc + quick-action (điều chỉnh tồn kho, xóa)
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  productApi,
  fmtVnd,
  PROD_STATUS,
} from "../lib/productApi";

import type { ProductListItem } from "../lib/types";

// ── helpers ────────────────────────────────────────────────────
function StockBadge({ n }: { n: number }) {
  if (n === 0) return <span className="badge badge-danger">Hết hàng</span>;
  if (n < 10) return <span className="badge badge-warning">{n} còn lại</span>;
  return <span className="badge badge-success">{n}</span>;
}

function StatusChip({ status }: { status: string }) {
  const s = PROD_STATUS[status] ?? { label: status, cls: "st-draft" };
  return <span className={`status-chip ${s.cls}`}>{s.label}</span>;
}

// ── Modal điều chỉnh tồn kho ────────────────────────────────────
interface AdjustModalProps {
  product: ProductListItem;
  onClose: () => void;
}
function AdjustModal({ product, onClose }: AdjustModalProps) {
  const qc = useQueryClient();
  const [delta, setDelta] = useState(0);
  const [warehouse, setWarehouse] = useState("main");
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");

  const mut = useMutation({
    mutationFn: () =>
      productApi.adjustInventory(product.id, { warehouse, delta, reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      onClose();
    },
    onError: (e: any) => {
      setErr(e?.response?.data?.error?.message ?? "Lỗi điều chỉnh tồn kho");
    },
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: 440 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">Điều chỉnh tồn kho</h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="form-row">
            <label className="form-label">Sản phẩm</label>
            <div style={{ fontWeight: 600 }}>{product.name}</div>
            {product.sku && <div style={{ color: "var(--text-muted)", fontSize: 12 }}>SKU: {product.sku}</div>}
          </div>

          <div className="form-row">
            <label className="form-label" htmlFor="adj-warehouse">Kho</label>
            <select
              id="adj-warehouse"
              className="form-control"
              value={warehouse}
              onChange={(e) => setWarehouse(e.target.value)}
            >
              {["main", "hanoi", "hcm", "danang"].map((w) => (
                <option key={w} value={w}>{w === "main" ? "Kho chính" : w.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label className="form-label" htmlFor="adj-delta">
              Số lượng (+ nhập / − xuất)
            </label>
            <input
              id="adj-delta"
              type="number"
              className="form-control"
              value={delta}
              onChange={(e) => setDelta(Number(e.target.value))}
              placeholder="VD: 100 hoặc -5"
            />
          </div>

          <div className="form-row">
            <label className="form-label" htmlFor="adj-reason">Lý do</label>
            <input
              id="adj-reason"
              type="text"
              className="form-control"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập hàng từ NCC, kiểm kê,..."
            />
          </div>

          {err && <div className="alert alert-danger">{err}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Huỷ</button>
          <button
            className="btn btn-primary"
            onClick={() => mut.mutate()}
            disabled={mut.isPending || delta === 0}
          >
            {mut.isPending ? "Đang lưu..." : "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────
export default function Products() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [search, setSearch] = useState("");
  const [adjustTarget, setAdjustTarget] = useState<ProductListItem | null>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", filterStatus],
    queryFn: () => productApi.list(filterStatus || undefined),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => productApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });

  const filtered = products.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.barcode?.toLowerCase().includes(q)
    );
  });

  function handleDelete(p: ProductListItem) {
    if (!confirm(`Xóa sản phẩm "${p.name}"? Thao tác không thể khôi phục.`)) return;
    deleteMut.mutate(p.id);
  }

  // Thống kê nhanh
  const totalActive = products.filter((p) => p.status === "active").length;
  const totalOutOfStock = products.filter((p) => p.total_stock === 0).length;
  const totalLowStock = products.filter(
    (p) => p.total_stock > 0 && p.total_stock < 10,
  ).length;

  return (
    <div className="page-wrapper">
      {/* ── Page header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Sản phẩm</h1>
          <p className="page-subtitle">
            Quản lý danh mục, giá bán đa kênh và tồn kho
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link to="/products-catalog/new" className="btn btn-primary">
            + Thêm sản phẩm
          </Link>
        </div>
      </div>

      {/* ── KPI bar ── */}
      <div className="kpi-row" style={{ marginBottom: 20 }}>
        <div className="kpi-card">
          <div className="kpi-value">{products.length}</div>
          <div className="kpi-label">Tổng sản phẩm</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value" style={{ color: "var(--success)" }}>{totalActive}</div>
          <div className="kpi-label">Đang bán</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value" style={{ color: "var(--warning)" }}>{totalLowStock}</div>
          <div className="kpi-label">Sắp hết hàng</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value" style={{ color: "var(--danger)" }}>{totalOutOfStock}</div>
          <div className="kpi-label">Hết hàng</div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="filter-bar" style={{ marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <input
          type="search"
          className="form-control"
          style={{ maxWidth: 280 }}
          placeholder="🔍 Tìm tên, SKU, barcode..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          id="product-search"
        />
        <select
          className="form-control"
          style={{ maxWidth: 160 }}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          id="product-status-filter"
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(PROD_STATUS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* ── Table ── */}
      {isLoading ? (
        <div className="loading-state">Đang tải sản phẩm...</div>
      ) : (
        <div className="table-card">
          <table className="data-table" id="products-table">
            <thead>
              <tr>
                <th style={{ width: 56 }}>Ảnh</th>
                <th>Sản phẩm</th>
                <th>SKU / Barcode</th>
                <th>Giá lẻ</th>
                <th>Tồn kho</th>
                <th>Trạng thái</th>
                <th>Danh mục</th>
                <th style={{ width: 120 }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", color: "var(--text-muted)", padding: 40 }}>
                    Không có sản phẩm nào
                  </td>
                </tr>
              )}
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.primary_image ? (
                      <img
                        src={p.primary_image}
                        alt={p.name}
                        style={{
                          width: 44,
                          height: 44,
                          objectFit: "cover",
                          borderRadius: 6,
                          border: "1px solid var(--border)",
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          background: "var(--surface-2)",
                          borderRadius: 6,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 18,
                        }}
                      >
                        📦
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    {p.short_desc && (
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                        {p.short_desc.slice(0, 80)}...
                      </div>
                    )}
                    {p.unit && (
                      <div style={{ fontSize: 11, color: "var(--accent)", marginTop: 2 }}>
                        Đơn vị: {p.unit}
                      </div>
                    )}
                  </td>
                  <td style={{ fontFamily: "monospace", fontSize: 13 }}>
                    {p.sku && <div style={{ fontWeight: 600 }}>{p.sku}</div>}
                    {p.barcode && (
                      <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
                        🔖 {p.barcode}
                      </div>
                    )}
                    {!p.sku && !p.barcode && <span style={{ color: "var(--text-muted)" }}>—</span>}
                  </td>
                  <td style={{ fontWeight: 600 }}>{fmtVnd(p.reference_price)}</td>
                  <td>
                    <StockBadge n={p.total_stock} />
                  </td>
                  <td>
                    <StatusChip status={p.status} />
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: 13 }}>
                    {p.category.name}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        className="btn-icon"
                        title="Chỉnh tồn kho"
                        onClick={() => setAdjustTarget(p)}
                        id={`inv-adjust-${p.id}`}
                      >
                        📦
                      </button>
                      <button
                        className="btn-icon"
                        title="Chỉnh sửa"
                        onClick={() => navigate(`/products-catalog/${p.id}`)}
                        id={`edit-product-${p.id}`}
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-icon btn-icon-danger"
                        title="Xóa"
                        onClick={() => handleDelete(p)}
                        id={`delete-product-${p.id}`}
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Inventory adjust modal ── */}
      {adjustTarget && (
        <AdjustModal
          product={adjustTarget}
          onClose={() => setAdjustTarget(null)}
        />
      )}
    </div>
  );
}
