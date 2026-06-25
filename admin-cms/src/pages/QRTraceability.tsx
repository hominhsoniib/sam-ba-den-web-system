/**
 * QRTraceability.tsx – Quản lý Lô hàng & Tem QR truy xuất nguồn gốc (M8)
 * Tạo lô hàng sản xuất → Sinh mã QR hàng loạt → In tem QR → Thu hồi lô/mã.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { qrApi, type ProductBatchOut } from "../lib/qrApi";
import { productApi } from "../lib/productApi";

// Địa chỉ trang public để quét tem (config theo SITE_URL của dự án)
const PUBLIC_QR_BASE_URL = "http://localhost:5173/qr";

export default function QRTraceability() {
  const qc = useQueryClient();
  const [filterProductId, setFilterProductId] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Selected Batch for Details Drawer/Modal
  const [selectedBatch, setSelectedBatch] = useState<ProductBatchOut | null>(null);
  const [qrPage, setQrPage] = useState(1);
  const qrPageSize = 50;

  // Modals visibility
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Form State for creating batch
  const [productId, setProductId] = useState("");
  const [batchNo, setBatchNo] = useState("");
  const [qty, setQty] = useState(100);
  const [mfgDate, setMfgDate] = useState("");
  const [expDate, setExpDate] = useState("");
  const warehouse = "main";
  const [supplierName, setSupplierName] = useState("Baden Farm");
  const [originRegion, setOriginRegion] = useState("Tây Ninh");
  const [notes, setNotes] = useState("");
  const [formErr, setFormErr] = useState("");

  // Queries
  const { data: products = [] } = useQuery({
    queryKey: ["products", "active"],
    queryFn: () => productApi.list("active"),
  });

  const { data: batchesResult = { data: [], total: 0 }, isLoading: loadingBatches } = useQuery({
    queryKey: ["batches", filterProductId, filterStatus, page],
    queryFn: () =>
      qrApi.listBatches({
        product_id: filterProductId || undefined,
        status: filterStatus || undefined,
        page,
        page_size: pageSize,
      }),
  });

  const { data: qrcodesResult = { data: [], total: 0 }, isLoading: loadingQRs } = useQuery({
    queryKey: ["qrcodes", selectedBatch?.id, qrPage],
    queryFn: () => {
      if (!selectedBatch) return Promise.resolve({ data: [], total: 0 });
      return qrApi.listQRCodes(selectedBatch.id, {
        page: qrPage,
        page_size: qrPageSize,
      });
    },
    enabled: !!selectedBatch,
  });

  // Mutations
  const createMut = useMutation({
    mutationFn: () =>
      qrApi.createBatch({
        product_id: productId,
        batch_no: batchNo || undefined,
        quantity: qty,
        manufacture_date: mfgDate || undefined,
        expiry_date: expDate || undefined,
        warehouse,
        supplier_name: supplierName || undefined,
        origin_region: originRegion || undefined,
        notes: notes || undefined,
      }),
    onSuccess: (newBatch) => {
      qc.invalidateQueries({ queryKey: ["batches"] });
      setShowCreateModal(false);
      // Reset form
      setProductId("");
      setBatchNo("");
      setQty(100);
      setMfgDate("");
      setExpDate("");
      setNotes("");
      setFormErr("");
      // Show details immediately
      setSelectedBatch(newBatch);
      setQrPage(1);
    },
    onError: (err: any) => {
      setFormErr(err?.response?.data?.error?.message || "Lỗi tạo lô hàng");
    },
  });

  const revokeBatchMut = useMutation({
    mutationFn: (id: string) => qrApi.revokeBatch(id),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["batches"] });
      setSelectedBatch(updated);
    },
  });

  const revokeQRMut = useMutation({
    mutationFn: (qrId: string) => qrApi.revokeQRCode(qrId),
    onSuccess: () => {
      if (selectedBatch) {
        qc.invalidateQueries({ queryKey: ["qrcodes", selectedBatch.id] });
      }
    },
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="page-container">
      {/* CSS in-page để phục vụ in ấn tem nhãn đẹp đẽ */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
        }
        
        .qr-label-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 15px;
          padding: 10px;
        }

        .qr-label-card {
          border: 1px dashed #ccc;
          border-radius: 6px;
          padding: 12px;
          background: #fff;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          page-break-inside: avoid;
        }

        .qr-label-header {
          font-size: 10px;
          font-weight: 700;
          color: #2c3e50;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .qr-label-prod {
          font-size: 11px;
          font-weight: 600;
          color: #34495e;
          height: 32px;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          margin-bottom: 6px;
          line-height: 1.2;
        }

        .qr-label-img {
          width: 120px;
          height: 120px;
          margin: 4px 0;
        }

        .qr-label-footer {
          font-size: 8px;
          color: #7f8c8d;
          margin-top: 4px;
          line-height: 1.1;
        }

        .qr-label-tag {
          background: #27ae60;
          color: white;
          font-size: 7px;
          padding: 2px 6px;
          border-radius: 10px;
          font-weight: 700;
          margin-bottom: 2px;
          text-transform: uppercase;
        }
      `}} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Mã QR &amp; Truy xuất nguồn gốc</h1>
          <p className="page-subtitle">Quản lý lô sản xuất, cấp phát tem QR chống hàng giả và theo dõi lịch sử quét.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          ➕ Tạo lô hàng mới
        </button>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <select
          className="form-control"
          value={filterProductId}
          onChange={(e) => {
            setFilterProductId(e.target.value);
            setPage(1);
          }}
          style={{ maxWidth: 260 }}
        >
          <option value="">-- Lọc theo sản phẩm --</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          className="form-control"
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(1);
          }}
          style={{ maxWidth: 180 }}
        >
          <option value="">-- Lọc trạng thái --</option>
          <option value="active">Đang hoạt động</option>
          <option value="archived">Đã lưu trữ/Thu hồi</option>
        </select>
      </div>

      {/* Main Table */}
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Mã lô hàng</th>
              <th>Sản phẩm</th>
              <th>Ngày sản xuất</th>
              <th>Hạn sử dụng</th>
              <th>Số lượng QR</th>
              <th>Kho</th>
              <th>Vùng nguồn gốc</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loadingBatches ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: 24 }}>
                  Đang tải danh sách lô hàng...
                </td>
              </tr>
            ) : batchesResult.data.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: 24 }}>
                  Không tìm thấy lô hàng nào.
                </td>
              </tr>
            ) : (
              batchesResult.data.map((b) => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600 }}>{b.batch_no}</td>
                  <td>
                    <div>{b.product_name || "Sản phẩm không rõ"}</div>
                    {b.sku && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>SKU: {b.sku}</span>}
                  </td>
                  <td>{b.manufacture_date || "—"}</td>
                  <td>{b.expiry_date || "—"}</td>
                  <td style={{ fontWeight: 600 }}>{b.qr_count}</td>
                  <td>{b.warehouse === "main" ? "Kho chính" : b.warehouse.toUpperCase()}</td>
                  <td>{b.origin_region || "Tây Ninh"}</td>
                  <td>
                    {b.status === "active" ? (
                      <span className="status-chip st-published">Đang chạy</span>
                    ) : (
                      <span className="status-chip st-suspended">Đã thu hồi</span>
                    )}
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedBatch(b); setQrPage(1); }}>
                      👁️ Chi tiết &amp; In
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {batchesResult.total > pageSize && (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Trước
          </button>
          <span style={{ alignSelf: "center", fontSize: 13 }}>
            Trang {page} / {Math.ceil(batchesResult.total / pageSize)}
          </span>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(batchesResult.total / pageSize)}
          >
            Sau
          </button>
        </div>
      )}

      {/* Drawer: Batch Details */}
      {selectedBatch && (
        <div className="drawer-overlay" onClick={() => setSelectedBatch(null)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()} style={{ width: "650px", maxWidth: "90%" }}>
            <div className="drawer-header">
              <h2 className="drawer-title">Chi tiết Lô hàng: {selectedBatch.batch_no}</h2>
              <button className="btn-icon" onClick={() => setSelectedBatch(null)}>
                ✕
              </button>
            </div>
            <div className="drawer-body" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Sản phẩm</span>
                  <span className="detail-val" style={{ fontWeight: 600 }}>{selectedBatch.product_name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">SKU</span>
                  <span className="detail-val">{selectedBatch.sku || "—"}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Ngày sản xuất</span>
                  <span className="detail-val">{selectedBatch.manufacture_date || "—"}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Hạn sử dụng</span>
                  <span className="detail-val">{selectedBatch.expiry_date || "—"}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Số lượng QR phát hành</span>
                  <span className="detail-val" style={{ fontWeight: 600 }}>{selectedBatch.qr_count} cái</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Vùng nguồn gốc</span>
                  <span className="detail-val">{selectedBatch.origin_region || "—"}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Nhà cung cấp vật tư</span>
                  <span className="detail-val">{selectedBatch.supplier_name || "—"}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Trạng thái</span>
                  <span className="detail-val">
                    {selectedBatch.status === "active" ? (
                      <span className="status-chip st-published">Hoạt động</span>
                    ) : (
                      <span className="status-chip st-suspended">Đã khóa/Thu hồi</span>
                    )}
                  </span>
                </div>
              </div>

              {selectedBatch.notes && (
                <div className="detail-section">
                  <h4 className="detail-section-title">Ghi chú nguồn gốc</h4>
                  <div className="info-box" style={{ background: "var(--bg-light)", padding: 12, borderRadius: 6 }}>
                    {selectedBatch.notes}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 12 }}>
                <button className="btn btn-primary" onClick={() => setShowPrintModal(true)}>
                  🖨️ Xem tem để in ấn
                </button>
                {selectedBatch.status === "active" && (
                  <button
                    className="btn btn-danger"
                    onClick={() => {
                      if (window.confirm(`Xác nhận THU HỒI toàn bộ lô hàng ${selectedBatch.batch_no}?\nTất cả mã QR trong lô này sẽ lập tức báo giả/vô hiệu hóa!`)) {
                        revokeBatchMut.mutate(selectedBatch.id);
                      }
                    }}
                    disabled={revokeBatchMut.isPending}
                  >
                    🚫 Thu hồi toàn lô hàng
                  </button>
                )}
              </div>

              <hr />

              {/* QR Unit List */}
              <div>
                <h3 style={{ fontSize: 16, marginBottom: 12 }}>Danh sách mã QR đơn vị</h3>
                {loadingQRs ? (
                  <div>Đang tải danh sách tem QR...</div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <table className="table" style={{ fontSize: 12 }}>
                        <thead>
                          <tr>
                            <th>Nhãn tem</th>
                            <th>Mã Token (UUID)</th>
                            <th>Quét</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {qrcodesResult.data.map((qr) => (
                            <tr key={qr.id}>
                              <td style={{ fontWeight: 600 }}>{qr.label}</td>
                              <td style={{ fontFamily: "monospace", fontSize: 11 }}>{qr.token}</td>
                              <td style={{ fontWeight: 600 }}>{qr.scan_count} lần</td>
                              <td>
                                {qr.status === "active" ? (
                                  <span className="status-chip st-published" style={{ fontSize: 10, padding: "2px 6px" }}>Mở</span>
                                ) : (
                                  <span className="status-chip st-suspended" style={{ fontSize: 10, padding: "2px 6px" }}>Hủy</span>
                                )}
                              </td>
                              <td>
                                {qr.status === "active" && (
                                  <button
                                    className="btn btn-ghost btn-sm"
                                    style={{ padding: "2px 6px", fontSize: 11, color: "var(--red)" }}
                                    onClick={() => {
                                      if (window.confirm(`Vô hiệu hóa riêng mã QR ${qr.label}?`)) {
                                        revokeQRMut.mutate(qr.id);
                                      }
                                    }}
                                    disabled={revokeQRMut.isPending}
                                  >
                                    Hủy tem
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* QR List Pagination */}
                    {qrcodesResult.total > qrPageSize && (
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setQrPage((p) => Math.max(1, p - 1))}
                          disabled={qrPage === 1}
                        >
                          Trước
                        </button>
                        <span style={{ alignSelf: "center", fontSize: 12 }}>
                          Trang {qrPage} / {Math.ceil(qrcodesResult.total / qrPageSize)}
                        </span>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setQrPage((p) => p + 1)}
                          disabled={qrPage >= Math.ceil(qrcodesResult.total / qrPageSize)}
                        >
                          Sau
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Batch */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card" style={{ maxWidth: 550 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Tạo lô hàng sản xuất &amp; Cấp mã QR</h3>
              <button className="btn-icon" onClick={() => setShowCreateModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {formErr && <div className="alert alert-danger">{formErr}</div>}

              <div className="form-row">
                <label className="form-label" htmlFor="new-product">Sản phẩm</label>
                <select
                  id="new-product"
                  className="form-control"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  required
                >
                  <option value="">-- Chọn sản phẩm --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-row">
                  <label className="form-label" htmlFor="new-batch-no">Mã lô sản xuất (Tùy chọn)</label>
                  <input
                    id="new-batch-no"
                    type="text"
                    className="form-control"
                    placeholder="VD: BAT-202606-A"
                    value={batchNo}
                    onChange={(e) => setBatchNo(e.target.value)}
                  />
                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Để trống để hệ thống tự tạo</span>
                </div>
                <div className="form-row">
                  <label className="form-label" htmlFor="new-qty">Số lượng tem cần in</label>
                  <input
                    id="new-qty"
                    type="number"
                    className="form-control"
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                    min={1}
                    max={1000}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-row">
                  <label className="form-label" htmlFor="new-mfg-date">Ngày sản xuất</label>
                  <input
                    id="new-mfg-date"
                    type="date"
                    className="form-control"
                    value={mfgDate}
                    onChange={(e) => setMfgDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-row">
                  <label className="form-label" htmlFor="new-exp-date">Hạn sử dụng</label>
                  <input
                    id="new-exp-date"
                    type="date"
                    className="form-control"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-row">
                  <label className="form-label" htmlFor="new-supplier">Nhà cung cấp vật tư</label>
                  <input
                    id="new-supplier"
                    type="text"
                    className="form-control"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                  />
                </div>
                <div className="form-row">
                  <label className="form-label" htmlFor="new-origin">Vùng nguồn gốc</label>
                  <input
                    id="new-origin"
                    type="text"
                    className="form-control"
                    value={originRegion}
                    onChange={(e) => setOriginRegion(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <label className="form-label" htmlFor="new-notes">Nhật ký quy trình sản xuất / Ghi chú</label>
                <textarea
                  id="new-notes"
                  className="form-control"
                  rows={3}
                  placeholder="Ghi chi tiết quy trình: Thu hoạch lúc 6:00, Sấy khô nhiệt độ 60C, Đóng gói trong ngày..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>
                Huỷ
              </button>
              <button
                className="btn btn-primary"
                onClick={() => createMut.mutate()}
                disabled={createMut.isPending || !productId || !mfgDate || !expDate}
              >
                {createMut.isPending ? "Đang xử lý..." : "Tạo và Phát hành QR"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal/Full view: Print QR Sheets */}
      {showPrintModal && selectedBatch && (
        <div className="modal-overlay print-area" onClick={() => setShowPrintModal(false)} style={{ background: "rgba(0,0,0,0.85)" }}>
          <div
            className="modal-card"
            style={{ width: "95%", maxWidth: "1200px", height: "90%", display: "flex", flexDirection: "column" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header no-print">
              <h3 className="modal-title">Xem và In danh sách tem QR: {selectedBatch.batch_no}</h3>
              <div style={{ display: "flex", gap: 12 }}>
                <button className="btn btn-primary" onClick={handlePrint}>
                  🖨️ In ấn (Print)
                </button>
                <button className="btn btn-ghost" onClick={() => setShowPrintModal(false)}>
                  Đóng
                </button>
              </div>
            </div>
            <div className="modal-body" style={{ flex: 1, overflowY: "auto", background: "#f5f6fa" }}>
              <div className="print-area">
                <div style={{ textAlign: "center", marginBottom: 20 }} className="no-print">
                  <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
                    Gợi ý: Nhấn <b>In ấn</b> để mở hộp thoại in. Trong phần thiết lập in của trình duyệt, chọn <b>Background graphics</b> và tắt Header/Footer để tem hiển thị đẹp nhất.
                  </p>
                </div>
                
                {loadingQRs ? (
                  <div style={{ textAlign: "center", padding: 40 }}>Đang chuẩn bị danh sách tem...</div>
                ) : (
                  <div className="qr-label-grid">
                    {qrcodesResult.data.map((qr) => {
                      const url = `${PUBLIC_QR_BASE_URL}/${qr.token}`;
                      const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
                      
                      return (
                        <div key={qr.id} className="qr-label-card">
                          <span className="qr-label-tag">Chính hãng</span>
                          <div className="qr-label-header">Sâm Bà Đen</div>
                          <div className="qr-label-prod">{selectedBatch.product_name}</div>
                          
                          <img src={qrImgUrl} alt={qr.label || "QR"} className="qr-label-img" />
                          
                          <div style={{ fontSize: 9, fontWeight: 600, color: "#2c3e50" }}>
                            {qr.label}
                          </div>
                          <div className="qr-label-footer">
                            Lô: {selectedBatch.batch_no}<br />
                            HSD: {selectedBatch.expiry_date}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
