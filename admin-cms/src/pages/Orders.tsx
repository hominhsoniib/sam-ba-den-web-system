/**
 * Orders.tsx – Quản lý đơn hàng (M7)
 * Danh sách + filter + modal chi tiết + đổi trạng thái
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useNavigate } from "react-router-dom";
import {
  orderApi,
  fmtVnd,
  ORDER_STATUS_MAP,
  CHANNELS,
  type OrderDetail,
  type OrderStatus,
} from "../lib/orderApi";

// ── Status chip ───────────────────────────────────────────────────
function StatusChip({ status }: { status: string }) {
  const s = ORDER_STATUS_MAP[status as OrderStatus] ?? {
    label: status,
    cls: "st-draft",
    icon: "❓",
  };
  return (
    <span className={`status-chip ${s.cls}`}>
      {s.icon} {s.label}
    </span>
  );
}

// ── Status change modal ───────────────────────────────────────────
interface StatusModalProps {
  order: OrderDetail;
  onClose: () => void;
}

function StatusModal({ order, onClose }: StatusModalProps) {
  const qc = useQueryClient();
  const currentStatus = order.status as OrderStatus;
  const allowedNext = ORDER_STATUS_MAP[currentStatus]?.next ?? [];
  const [toStatus, setToStatus] = useState(allowedNext[0] ?? "");
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");

  const mut = useMutation({
    mutationFn: () => orderApi.changeStatus(order.id, toStatus, note || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["order", order.id] });
      onClose();
    },
    onError: (e: any) => {
      setErr(e?.response?.data?.error?.message ?? "Lỗi cập nhật trạng thái");
    },
  });

  if (allowedNext.length === 0) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-card" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">Trạng thái đơn hàng</h3>
            <button className="btn-icon" onClick={onClose}>✕</button>
          </div>
          <div className="modal-body">
            <p>Đơn hàng <strong>{order.order_no}</strong> đã ở trạng thái cuối, không thể thay đổi.</p>
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={onClose}>Đóng</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: 480 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">Cập nhật trạng thái</h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="form-row">
            <label className="form-label">Đơn hàng</label>
            <div style={{ fontWeight: 600 }}>{order.order_no}</div>
            <div style={{ marginTop: 4 }}>
              Trạng thái hiện tại: <StatusChip status={order.status} />
            </div>
          </div>

          <div className="form-row">
            <label className="form-label" htmlFor="new-status">Chuyển sang</label>
            <select
              id="new-status"
              className="form-control"
              value={toStatus}
              onChange={(e) => setToStatus(e.target.value as OrderStatus)}
            >
              {allowedNext.map((s) => (
                <option key={s} value={s}>
                  {ORDER_STATUS_MAP[s]?.icon} {ORDER_STATUS_MAP[s]?.label ?? s}
                </option>
              ))}
            </select>
          </div>

          {/* Hiển thị cảnh báo về side effects */}
          {toStatus === "confirmed" && (
            <div className="alert alert-warning">
              ⚠️ <strong>Xác nhận sẽ:</strong> Khoá tồn kho hàng hoá và ghi nợ vào sổ cái đại lý (nếu là đơn B2B).
            </div>
          )}
          {toStatus === "completed" && (
            <div className="alert alert-warning">
              ⚠️ <strong>Hoàn thành sẽ:</strong> Xuất kho thực sự (trừ số lượng tồn kho thực tế).
            </div>
          )}
          {toStatus === "cancelled" && (
            <div className="alert alert-danger">
              ❌ <strong>Huỷ sẽ:</strong> Giải phóng tồn kho đã khoá và ghi có vào sổ cái (nếu cần).
            </div>
          )}
          {toStatus === "returned" && (
            <div className="alert alert-warning">
              ↩️ <strong>Trả hàng sẽ:</strong> Nhập lại kho và ghi có vào sổ cái đại lý.
            </div>
          )}

          <div className="form-row">
            <label className="form-label" htmlFor="status-note">Ghi chú</label>
            <textarea
              id="status-note"
              className="form-control"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Lý do thay đổi (tuỳ chọn)..."
            />
          </div>

          {err && <div className="alert alert-danger">{err}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Huỷ</button>
          <button
            className="btn btn-primary"
            onClick={() => mut.mutate()}
            disabled={mut.isPending || !toStatus}
            id="confirm-status-btn"
          >
            {mut.isPending ? "Đang cập nhật..." : "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Order detail drawer ───────────────────────────────────────────
function OrderDrawer({
  order,
  onClose,
  onStatusChange,
}: {
  order: OrderDetail;
  onClose: () => void;
  onStatusChange: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          bottom: 0,
          width: "min(560px, 95vw)",
          background: "var(--surface)",
          boxShadow: "-4px 0 30px rgba(0,0,0,.15)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{order.order_no}</div>
            <div style={{ marginTop: 4 }}>
              <StatusChip status={order.status} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-primary"
              onClick={onStatusChange}
              id={`change-status-${order.id}`}
            >
              Đổi trạng thái
            </button>
            <button className="btn-icon" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {/* Buyer info */}
          <div className="detail-section">
            <h4 className="detail-section-title">Thông tin khách hàng</h4>
            <div className="detail-grid">
              <span className="detail-label">Người mua</span>
              <span>{order.buyer_name ?? "—"}</span>
              <span className="detail-label">Kênh bán</span>
              <span>{CHANNELS.find((c) => c.value === order.channel)?.label ?? order.channel}</span>
              <span className="detail-label">Kho</span>
              <span>{order.warehouse.toUpperCase()}</span>
            </div>
          </div>

          {/* Shipping */}
          {(order.shipping_name || order.shipping_address) && (
            <div className="detail-section">
              <h4 className="detail-section-title">Địa chỉ giao hàng</h4>
              <div className="detail-grid">
                <span className="detail-label">Người nhận</span>
                <span>{order.shipping_name ?? "—"}</span>
                <span className="detail-label">SĐT</span>
                <span>{order.shipping_phone ?? "—"}</span>
                <span className="detail-label">Địa chỉ</span>
                <span>{order.shipping_address ?? "—"}</span>
                <span className="detail-label">Tỉnh/TP</span>
                <span>{order.shipping_province ?? "—"}</span>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="detail-section">
            <h4 className="detail-section-title">Sản phẩm đặt hàng</h4>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Đơn giá</th>
                  <th>SL</th>
                  <th>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.product_name}</div>
                      {item.sku && (
                        <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>
                          {item.sku}
                        </div>
                      )}
                      {Number(item.discount_pct) > 0 && (
                        <div style={{ fontSize: 11, color: "var(--warning)" }}>
                          CK {item.discount_pct}%
                        </div>
                      )}
                    </td>
                    <td>{fmtVnd(item.unit_price)}</td>
                    <td style={{ textAlign: "center" }}>{item.qty}</td>
                    <td style={{ fontWeight: 600 }}>{fmtVnd(item.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div
              style={{
                marginTop: 12,
                padding: 14,
                background: "var(--surface-2)",
                borderRadius: 8,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Tạm tính</span>
                <span>{fmtVnd(order.subtotal)}</span>
              </div>
              {Number(order.discount_amount) > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Giảm giá</span>
                  <span style={{ color: "var(--success)" }}>- {fmtVnd(order.discount_amount)}</span>
                </div>
              )}
              {Number(order.shipping_fee) > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Phí ship</span>
                  <span>{fmtVnd(order.shipping_fee)}</span>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: 700,
                  fontSize: 16,
                  paddingTop: 6,
                  borderTop: "1px solid var(--border)",
                  marginTop: 4,
                }}
              >
                <span>Tổng cộng</span>
                <span style={{ color: "var(--accent)" }}>{fmtVnd(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Status timeline */}
          <div className="detail-section">
            <h4 className="detail-section-title">Lịch sử trạng thái</h4>
            <div className="timeline">
              {order.status_logs.map((log) => (
                <div key={log.id} className="timeline-item">
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {log.from_status && (
                        <>
                          <span className={`status-chip ${ORDER_STATUS_MAP[log.from_status as OrderStatus]?.cls ?? "st-draft"}`} style={{ fontSize: 11 }}>
                            {log.from_status}
                          </span>
                          <span>→</span>
                        </>
                      )}
                      <span className={`status-chip ${ORDER_STATUS_MAP[log.to_status as OrderStatus]?.cls ?? "st-draft"}`} style={{ fontSize: 11 }}>
                        {log.to_status}
                      </span>
                    </div>
                    {log.note && (
                      <div style={{ marginTop: 4, fontSize: 13, color: "var(--text-muted)" }}>
                        {log.note}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>
                      {new Date(log.created_at).toLocaleString("vi-VN")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Note / cancel reason */}
          {order.note && (
            <div className="detail-section">
              <h4 className="detail-section-title">Ghi chú</h4>
              <p style={{ color: "var(--text-soft)" }}>{order.note}</p>
            </div>
          )}
          {order.cancel_reason && (
            <div className="detail-section">
              <h4 className="detail-section-title">Lý do huỷ</h4>
              <p style={{ color: "var(--danger)" }}>{order.cancel_reason}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export default function Orders() {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "">("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [statusTarget, setStatusTarget] = useState<OrderDetail | null>(null);

  const PAGE_SIZE = 20;

  const { data: result, isLoading } = useQuery({
    queryKey: ["orders", filterStatus, page],
    queryFn: () =>
      orderApi.list({
        status: filterStatus || undefined,
        page,
        page_size: PAGE_SIZE,
      }),
  });

  const orders = result?.data ?? [];
  const total = result?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Fetch detail when clicking a row
  const { data: orderDetail } = useQuery({
    queryKey: ["order", selectedOrder?.id],
    queryFn: () => orderApi.get(selectedOrder!.id),
    enabled: !!selectedOrder,
  });

  const filtered = orders.filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.order_no.toLowerCase().includes(q) ||
      o.buyer_name?.toLowerCase().includes(q)
    );
  });

  // KPI counts
  const kpis = [
    { label: "Tổng đơn", value: total, color: "" },
    { label: "Chờ xác nhận", value: orders.filter((o) => o.status === "draft").length, color: "var(--text-muted)" },
    { label: "Đang giao", value: orders.filter((o) => o.status === "shipping").length, color: "var(--warning)" },
    { label: "Hoàn thành", value: orders.filter((o) => o.status === "completed").length, color: "var(--success)" },
  ];

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Đơn hàng</h1>
          <p className="page-subtitle">Quản lý vòng đời đơn hàng, tồn kho và sổ cái đại lý</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/orders/new")}
          id="create-order-btn"
        >
          + Tạo đơn hàng
        </button>
      </div>

      {/* KPI row */}
      <div className="kpi-row" style={{ marginBottom: 20 }}>
        {kpis.map((k) => (
          <div className="kpi-card" key={k.label}>
            <div className="kpi-value" style={k.color ? { color: k.color } : {}}>
              {k.value}
            </div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filter-bar" style={{ marginBottom: 16 }}>
        <input
          type="search"
          className="form-control"
          style={{ maxWidth: 260 }}
          placeholder="🔍 Mã đơn, tên khách..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          id="order-search"
        />
        <select
          className="form-control"
          style={{ maxWidth: 180 }}
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value as OrderStatus | ""); setPage(1); }}
          id="order-status-filter"
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(ORDER_STATUS_MAP).map(([k, v]) => (
            <option key={k} value={k}>{v.icon} {v.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="loading-state">Đang tải đơn hàng...</div>
      ) : (
        <div className="table-card">
          <table className="data-table" id="orders-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Người mua</th>
                <th>Kênh</th>
                <th>Trạng thái</th>
                <th>Tổng tiền</th>
                <th>Ngày tạo</th>
                <th style={{ width: 80 }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: 40 }}>
                    Không có đơn hàng nào
                  </td>
                </tr>
              )}
              {filtered.map((order) => (
                <tr
                  key={order.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelectedOrder(order as OrderDetail)}
                >
                  <td>
                    <div style={{ fontWeight: 700, fontFamily: "monospace" }}>
                      {order.order_no}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {order.warehouse.toUpperCase()}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{order.buyer_name ?? "—"}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {order.dealer_id ? "🏢 Đại lý" : "👤 Khách lẻ"}
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: "var(--text-soft)" }}>
                    {CHANNELS.find((c) => c.value === order.channel)?.label ?? order.channel}
                  </td>
                  <td>
                    <StatusChip status={order.status} />
                  </td>
                  <td style={{ fontWeight: 600, color: "var(--accent)" }}>
                    {fmtVnd(order.total_amount)}
                  </td>
                  <td style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    {new Date(order.created_at).toLocaleDateString("vi-VN")}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn-icon"
                      title="Đổi trạng thái"
                      onClick={() => setStatusTarget(order as OrderDetail)}
                      id={`status-btn-${order.id}`}
                    >
                      🔄
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                padding: 14,
                borderTop: "1px solid var(--border)",
              }}
            >
              <button
                className="btn btn-ghost"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ←
              </button>
              <span style={{ fontSize: 14, color: "var(--text-muted)" }}>
                Trang {page} / {totalPages} ({total} đơn)
              </span>
              <button
                className="btn btn-ghost"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Order detail drawer */}
      {selectedOrder && orderDetail && (
        <OrderDrawer
          order={orderDetail}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={() => {
            setStatusTarget(orderDetail);
            setSelectedOrder(null);
          }}
        />
      )}

      {/* Status change modal */}
      {statusTarget && (
        <StatusModal
          order={statusTarget}
          onClose={() => setStatusTarget(null)}
        />
      )}
    </div>
  );
}
