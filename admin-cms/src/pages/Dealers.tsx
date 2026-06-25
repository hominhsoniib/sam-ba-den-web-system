import { useEffect, useState } from "react";
import { dealerApi, DEALER_STATUS, REG_STATUS, LEDGER_REF_TYPE } from "../lib/dealerApi";
import { productApi, fmtVnd } from "../lib/productApi";
import type { Dealer, DealerDiscount, DealerLedger, DealerDebtSummary } from "../lib/types";
import type { ContactSubmissionMin } from "../lib/dealerApi";
import type { ProductListItem, ProductCategory } from "../lib/types";
import { useAuth } from "../store/auth";
import { errorMessage } from "../lib/api";

export default function Dealers() {
  const canWrite = useAuth((s) => s.can("dealer.write"));

  // Main UI state
  const [activeTab, setActiveTab] = useState<"list" | "regs">("list");
  
  // Dealers list tab state
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loadingDealers, setLoadingDealers] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null);

  // Registrations tab state
  const [regs, setRegs] = useState<ContactSubmissionMin[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(false);
  const [selectedReg, setSelectedReg] = useState<ContactSubmissionMin | null>(null);

  // Approval Modal state
  const [approveCode, setApproveCode] = useState("");
  const [approveTier, setApproveTier] = useState<"tier_1" | "tier_2">("tier_1");
  const [approveRegion, setApproveRegion] = useState("");
  const [approveCreditLimit, setApproveCreditLimit] = useState(10000000);
  const [approveTermDays, setApproveTermDays] = useState(30);
  const [approving, setApproving] = useState(false);

  // Detail Modal Sub-tabs state
  const [detailSubTab, setDetailSubTab] = useState<"info" | "discounts" | "ledger">("info");

  // Ledger state for selected dealer
  const [ledgerSummary, setLedgerSummary] = useState<DealerDebtSummary | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<DealerLedger[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);

  // Payment form state
  const [payAmount, setPayAmount] = useState(0);
  const [payNote, setPayNote] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);

  // Discounts state for selected dealer
  const [discounts, setDiscounts] = useState<DealerDiscount[]>([]);
  const [loadingDiscounts, setLoadingDiscounts] = useState(false);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  
  // New Discount form state
  const [newDiscProd, setNewDiscProd] = useState("");
  const [newDiscCat, setNewDiscCat] = useState("");
  const [newDiscPct, setNewDiscPct] = useState(10.0);
  const [newDiscStart, setNewDiscStart] = useState("");
  const [newDiscEnd, setNewDiscEnd] = useState("");
  const [savingDiscount, setSavingDiscount] = useState(false);

  // Fetch functions
  const fetchDealers = async () => {
    try {
      setLoadingDealers(true);
      const res = await dealerApi.list();
      setDealers(res.items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDealers(false);
    }
  };

  const fetchRegs = async () => {
    try {
      setLoadingRegs(true);
      const res = await dealerApi.listRegistrations();
      setRegs(res.items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRegs(false);
    }
  };

  useEffect(() => {
    if (activeTab === "list") {
      void fetchDealers();
    } else {
      void fetchRegs();
    }
  }, [activeTab]);

  useEffect(() => {
    // Load products and categories for dropdowns
    void productApi.list().then(setProducts).catch(console.error);
    void productApi.listCategories().then(setCategories).catch(console.error);
  }, []);

  const handleSelectDealer = async (dealer: Dealer) => {
    setSelectedDealer(dealer);
    setDetailSubTab("info");
    setLedgerSummary(null);
    setLedgerEntries([]);
    setDiscounts([]);
    
    // Fetch ledger summary
    try {
      setLoadingLedger(true);
      const summary = await dealerApi.getLedgerSummary(dealer.id);
      setLedgerSummary(summary);
      const entries = await dealerApi.listLedgerEntries(dealer.id);
      setLedgerEntries(entries);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLedger(false);
    }

    // Fetch discounts
    try {
      setLoadingDiscounts(true);
      const disc = await dealerApi.listDiscounts(dealer.id);
      setDiscounts(disc);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDiscounts(false);
    }
  };

  const handleApproveRegistration = async () => {
    if (!selectedReg) return;
    try {
      setApproving(true);
      const payload = {
        code: approveCode.trim().toUpperCase(),
        tier: approveTier,
        region: approveRegion.trim(),
        credit_limit: approveCreditLimit,
        payment_term_days: approveTermDays,
      };
      await dealerApi.approve(selectedReg.id, payload);
      alert(`Đã duyệt đơn đăng ký và kích hoạt mã đại lý ${payload.code}!`);
      setSelectedReg(null);
      setApproveCode("");
      setApproveRegion("");
      void fetchRegs();
    } catch (e) {
      alert(errorMessage(e));
    } finally {
      setApproving(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedDealer || payAmount <= 0) return;
    try {
      setSavingPayment(true);
      await dealerApi.recordPayment(selectedDealer.id, {
        amount: payAmount,
        note: payNote.trim() || undefined,
      });
      alert("Ghi nhận khoản thanh toán thành công!");
      setPayAmount(0);
      setPayNote("");
      // Reload ledger
      const summary = await dealerApi.getLedgerSummary(selectedDealer.id);
      setLedgerSummary(summary);
      const entries = await dealerApi.listLedgerEntries(selectedDealer.id);
      setLedgerEntries(entries);
    } catch (e) {
      alert(errorMessage(e));
    } finally {
      setSavingPayment(false);
    }
  };

  const handleCreateDiscount = async () => {
    if (!selectedDealer) return;
    try {
      setSavingDiscount(true);
      const payload = {
        product_id: newDiscProd || undefined,
        category_id: newDiscCat || undefined,
        discount_percent: newDiscPct,
        start_at: newDiscStart ? new Date(newDiscStart).toISOString() : new Date().toISOString(),
        end_at: newDiscEnd ? new Date(newDiscEnd).toISOString() : undefined,
        is_active: true,
      };
      await dealerApi.createDiscount(selectedDealer.id, payload);
      alert("Thêm quy tắc chiết khấu mới thành công!");
      // Reset form
      setNewDiscProd("");
      setNewDiscCat("");
      setNewDiscPct(10.0);
      setNewDiscStart("");
      setNewDiscEnd("");
      // Reload discounts
      const disc = await dealerApi.listDiscounts(selectedDealer.id);
      setDiscounts(disc);
    } catch (e) {
      alert(errorMessage(e));
    } finally {
      setSavingDiscount(false);
    }
  };

  // Filters
  const filteredDealers = dealers.filter((d) => {
    const matchSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.phone && d.phone.includes(searchQuery));
    const matchRegion = regionFilter === "" || d.region === regionFilter;
    return matchSearch && matchRegion;
  });

  const regions = Array.from(new Set(dealers.map((d) => d.region))).filter(Boolean);

  return (
    <div className="dash">
      <div className="page-head">
        <div>
          <h1>Hệ thống Đại lý B2B</h1>
          <p>Quản lý mạng lưới đại lý phân phối sâm, xét duyệt đại lý mới, công nợ ledger và chiết khấu.</p>
        </div>
      </div>

      {/* Primary Tab headers */}
      <div style={{ display: "flex", gap: "2px", borderBottom: "1px solid var(--border)", paddingBottom: "1px" }}>
        <button
          className={`btn ${activeTab === "list" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setActiveTab("list")}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: "10px 24px" }}
        >
          Danh sách Đại lý
        </button>
        <button
          className={`btn ${activeTab === "regs" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setActiveTab("regs")}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: "10px 24px" }}
        >
          Đơn đăng ký Đại lý {regs.filter((r) => r.status === "new").length > 0 && <span style={{ background: "red", color: "white", borderRadius: "50%", padding: "2px 6px", fontSize: "11px", marginLeft: "6px" }}>{regs.filter((r) => r.status === "new").length}</span>}
        </button>
      </div>

      {activeTab === "list" ? (
        <div style={{ display: "grid", gridTemplateColumns: selectedDealer ? "1fr 420px" : "1fr", gap: "20px", alignItems: "start" }}>
          <div className="dash" style={{ gap: "16px" }}>
            {/* Search & Filters */}
            <div className="card" style={{ padding: "14px 18px", display: "flex", gap: "12px", background: "var(--surface-2)" }}>
              <input
                className="input"
                placeholder="Tìm tên, mã, điện thoại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1, padding: "8px 12px", fontSize: "14px" }}
              />
              <select
                className="input"
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                style={{ width: "160px", padding: "8px", fontSize: "14px" }}
              >
                <option value="">Tất cả khu vực</option>
                {regions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Dealers Table */}
            <div className="card" style={{ overflow: "hidden" }}>
              {loadingDealers ? (
                <div className="empty">Đang tải danh sách đại lý…</div>
              ) : filteredDealers.length === 0 ? (
                <div className="empty">Không tìm thấy đại lý nào.</div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Mã</th>
                      <th>Tên đại lý</th>
                      <th>Cấp bậc</th>
                      <th>Khu vực</th>
                      <th>Điện thoại</th>
                      <th style={{ textAlign: "right" }}>Hạn mức nợ</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDealers.map((d) => {
                      const st = DEALER_STATUS[d.status] ?? DEALER_STATUS.pending;
                      return (
                        <tr
                          key={d.id}
                          style={{ cursor: "pointer", background: selectedDealer?.id === d.id ? "var(--green-100)" : "" }}
                          onClick={() => handleSelectDealer(d)}
                        >
                          <td><code>{d.code}</code></td>
                          <td><strong>{d.name}</strong></td>
                          <td>
                            <span className="badge badge-gold">
                              {d.tier === "tier_1" ? "Đại lý Cấp 1" : "Đại lý Cấp 2"}
                            </span>
                          </td>
                          <td>{d.region}</td>
                          <td>{d.phone || "—"}</td>
                          <td style={{ textAlign: "right", fontWeight: "600" }}>{fmtVnd(d.credit_limit)}</td>
                          <td>
                            <span className={`status-pill ${st.cls}`}>{st.label}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Dealer details & Sub-tabs */}
          {selectedDealer && (
            <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px", position: "sticky", top: "80px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
                <h3 style={{ fontSize: "17px", fontWeight: "600" }}>Chi tiết đại lý <code>{selectedDealer.code}</code></h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedDealer(null)} style={{ padding: "4px 8px" }}>Đóng</button>
              </div>

              {/* Sub-tab headers inside Drawer */}
              <div style={{ display: "flex", borderBottom: "1px solid var(--border)", gap: "10px" }}>
                <button
                  className="btn btn-sm btn-ghost"
                  style={{
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                    borderColor: detailSubTab === "info" ? "var(--green-600)" : "transparent",
                    color: detailSubTab === "info" ? "var(--green-700)" : "",
                    fontWeight: detailSubTab === "info" ? "600" : "500",
                    padding: "6px 10px"
                  }}
                  onClick={() => setDetailSubTab("info")}
                >
                  Hồ sơ
                </button>
                <button
                  className="btn btn-sm btn-ghost"
                  style={{
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                    borderColor: detailSubTab === "ledger" ? "var(--green-600)" : "transparent",
                    color: detailSubTab === "ledger" ? "var(--green-700)" : "",
                    fontWeight: detailSubTab === "ledger" ? "600" : "500",
                    padding: "6px 10px"
                  }}
                  onClick={() => setDetailSubTab("ledger")}
                >
                  Công nợ & Sổ cái
                </button>
                <button
                  className="btn btn-sm btn-ghost"
                  style={{
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                    borderColor: detailSubTab === "discounts" ? "var(--green-600)" : "transparent",
                    color: detailSubTab === "discounts" ? "var(--green-700)" : "",
                    fontWeight: detailSubTab === "discounts" ? "600" : "500",
                    padding: "6px 10px"
                  }}
                  onClick={() => setDetailSubTab("discounts")}
                >
                  Chiết khấu
                </button>
              </div>

              {/* Sub-tab 1: Profile Info */}
              {detailSubTab === "info" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px" }}>
                  <div>
                    <span className="label">Tên đại lý:</span>
                    <div><strong>{selectedDealer.name}</strong></div>
                  </div>
                  <div>
                    <span className="label">Người liên hệ:</span>
                    <div>{selectedDealer.contact_name || "—"}</div>
                  </div>
                  <div>
                    <span className="label">Số điện thoại:</span>
                    <div>{selectedDealer.phone || "—"}</div>
                  </div>
                  <div>
                    <span className="label">Địa chỉ đăng ký:</span>
                    <div>{selectedDealer.address || "—"}</div>
                  </div>
                  <div>
                    <span className="label">Khu vực phân bổ:</span>
                    <div>{selectedDealer.region}</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <span className="label">Hạn mức nợ:</span>
                      <div><strong>{fmtVnd(selectedDealer.credit_limit)}</strong></div>
                    </div>
                    <div>
                      <span className="label">Hạn thanh toán:</span>
                      <div><strong>{selectedDealer.payment_term_days} ngày</strong></div>
                    </div>
                  </div>
                  {selectedDealer.user_id && (
                    <div style={{ borderTop: "1px dashed var(--border)", paddingTop: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ color: "var(--green-700)" }}>✓</span>
                      <span style={{ color: "var(--text-soft)", fontSize: "13px" }}>Đã tạo tài khoản truy cập Cổng Đại lý.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Sub-tab 2: Debt Ledger */}
              {detailSubTab === "ledger" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {loadingLedger ? (
                    <div>Đang tải thông tin sổ cái…</div>
                  ) : (
                    <>
                      {/* Summary Cards */}
                      {ledgerSummary && (
                        <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "12px", fontSize: "13px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                            <span>Tổng nợ phát sinh (Debit):</span>
                            <strong>{fmtVnd(ledgerSummary.total_debit)}</strong>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                            <span>Đã thanh toán (Credit):</span>
                            <span style={{ color: "var(--green-700)" }}>{fmtVnd(ledgerSummary.total_credit)}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: "6px", marginBottom: "6px", fontWeight: "700" }}>
                            <span>Số dư công nợ:</span>
                            <span style={{ color: ledgerSummary.balance > 0 ? "var(--err)" : "var(--green-700)" }}>
                              {fmtVnd(ledgerSummary.balance)}
                            </span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-soft)" }}>
                            <span>Hạn mức khả dụng còn lại:</span>
                            <span>{fmtVnd(ledgerSummary.available_credit)}</span>
                          </div>
                        </div>
                      )}

                      {/* Payment Logger Form */}
                      {canWrite && (
                        <div style={{ border: "1px solid var(--border)", padding: "12px", borderRadius: "var(--radius-sm)", background: "var(--surface-2)" }}>
                          <h4 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "10px" }}>Ghi nhận thu tiền nợ</h4>
                          <div className="field" style={{ marginBottom: "10px" }}>
                            <span className="label">Số tiền thu (VND)</span>
                            <input
                              className="input"
                              type="number"
                              value={payAmount}
                              onChange={(e) => setPayAmount(Number(e.target.value))}
                              style={{ padding: "6px", fontSize: "14px" }}
                            />
                          </div>
                          <div className="field" style={{ marginBottom: "10px" }}>
                            <span className="label">Ghi chú phiếu thu</span>
                            <input
                              className="input"
                              placeholder="Số phiếu, ủy nhiệm chi, chuyển khoản..."
                              value={payNote}
                              onChange={(e) => setPayNote(e.target.value)}
                              style={{ padding: "6px", fontSize: "14px" }}
                            />
                          </div>
                          <button
                            className="btn btn-primary"
                            onClick={handleRecordPayment}
                            disabled={savingPayment || payAmount <= 0}
                            style={{ width: "100%", fontSize: "13px", padding: "6px" }}
                          >
                            {savingPayment ? "Đang ghi..." : "Ghi nhận phiếu thu"}
                          </button>
                        </div>
                      )}

                      {/* Ledger History List */}
                      <div style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
                        <h4 style={{ fontSize: "13px", fontWeight: "600" }}>Lịch sử giao dịch sổ cái</h4>
                        {ledgerEntries.length === 0 ? (
                          <div style={{ textAlign: "center", color: "var(--text-faint)", fontSize: "13px", padding: "10px 0" }}>Chưa có bút toán nào.</div>
                        ) : (
                          ledgerEntries.map((e) => (
                            <div key={e.id} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border)", paddingBottom: "6px", fontSize: "12px" }}>
                              <div>
                                <span style={{ fontWeight: "600", color: e.entry_type === "debit" ? "var(--err)" : "var(--green-700)" }}>
                                  {e.entry_type === "debit" ? "NỢ +" : "CÓ -"} {fmtVnd(e.amount)}
                                </span>
                                <div style={{ fontSize: "11px", color: "var(--text-soft)" }}>
                                  {LEDGER_REF_TYPE[e.ref_type] || e.ref_type}
                                  {e.note && ` · ${e.note}`}
                                </div>
                              </div>
                              <span style={{ color: "var(--text-faint)" }}>
                                {new Date(e.created_at).toLocaleDateString("vi-VN")}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Sub-tab 3: Discounts */}
              {detailSubTab === "discounts" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {loadingDiscounts ? (
                    <div>Đang tải chiết khấu…</div>
                  ) : (
                    <>
                      {/* Add Discount Rule Form */}
                      {canWrite && (
                        <div style={{ border: "1px solid var(--border)", padding: "12px", borderRadius: "var(--radius-sm)", background: "var(--surface-2)", fontSize: "13px" }}>
                          <h4 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "10px" }}>Thêm quy tắc chiết khấu mới</h4>
                          
                          <div className="field" style={{ marginBottom: "10px" }}>
                            <span className="label">Áp dụng cho Sản phẩm</span>
                            <select
                              className="input"
                              value={newDiscProd}
                              onChange={(e) => {
                                setNewDiscProd(e.target.value);
                                if (e.target.value) setNewDiscCat(""); // mutually exclusive
                              }}
                              style={{ padding: "6px", fontSize: "13px" }}
                            >
                              <option value="">-- Tất cả sản phẩm --</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </div>

                          <div className="field" style={{ marginBottom: "10px" }}>
                            <span className="label">Hoặc áp dụng cho Danh mục</span>
                            <select
                              className="input"
                              value={newDiscCat}
                              onChange={(e) => {
                                setNewDiscCat(e.target.value);
                                if (e.target.value) setNewDiscProd(""); // mutually exclusive
                              }}
                              style={{ padding: "6px", fontSize: "13px" }}
                            >
                              <option value="">-- Tất cả danh mục --</option>
                              {categories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          </div>

                          <div className="field" style={{ marginBottom: "10px" }}>
                            <span className="label">% Chiết khấu</span>
                            <input
                              className="input"
                              type="number"
                              step="0.1"
                              value={newDiscPct}
                              onChange={(e) => setNewDiscPct(Number(e.target.value))}
                              style={{ padding: "6px", fontSize: "13px" }}
                            />
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                            <div className="field">
                              <span className="label">Có hiệu lực từ</span>
                              <input
                                className="input"
                                type="date"
                                value={newDiscStart}
                                onChange={(e) => setNewDiscStart(e.target.value)}
                                style={{ padding: "6px", fontSize: "12px" }}
                              />
                            </div>
                            <div className="field">
                              <span className="label">Đến ngày (tùy chọn)</span>
                              <input
                                className="input"
                                type="date"
                                value={newDiscEnd}
                                onChange={(e) => setNewDiscEnd(e.target.value)}
                                style={{ padding: "6px", fontSize: "12px" }}
                              />
                            </div>
                          </div>

                          <button
                            className="btn btn-primary"
                            onClick={handleCreateDiscount}
                            disabled={savingDiscount || newDiscPct <= 0}
                            style={{ width: "100%", fontSize: "13px", padding: "6px" }}
                          >
                            {savingDiscount ? "Đang thêm..." : "Áp dụng chiết khấu"}
                          </button>
                        </div>
                      )}

                      {/* Current discounts list */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
                        <h4 style={{ fontSize: "13px", fontWeight: "600" }}>Chiết khấu hiện hành</h4>
                        {discounts.length === 0 ? (
                          <div style={{ textAlign: "center", color: "var(--text-faint)", fontSize: "13px", padding: "10px 0" }}>
                            Không có luật chiết khấu đặc thù nào.
                          </div>
                        ) : (
                          discounts.map((d) => {
                            let scopeName = "Toàn bộ sản phẩm";
                            if (d.product_id) {
                              scopeName = products.find((p) => p.id === d.product_id)?.name ?? "Sản phẩm cụ thể";
                            } else if (d.category_id) {
                              scopeName = categories.find((c) => c.id === d.category_id)?.name ?? "Danh mục sản phẩm";
                            }
                            return (
                              <div key={d.id} style={{ display: "flex", borderBottom: "1px dashed var(--border)", paddingBottom: "6px", fontSize: "12px", justifyContent: "space-between" }}>
                                <div>
                                  <strong>{scopeName}</strong>
                                  <div style={{ fontSize: "11px", color: "var(--text-soft)" }}>
                                    Hạn: {new Date(d.start_at).toLocaleDateString("vi-VN")}
                                    {d.end_at ? ` → ${new Date(d.end_at).toLocaleDateString("vi-VN")}` : " (Vô thời hạn)"}
                                  </div>
                                </div>
                                <span className="badge" style={{ background: "var(--gold-100)", color: "var(--green-900)", fontWeight: "700" }}>
                                  -{d.discount_percent}%
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Tab 2: Registrations list */
        <div style={{ display: "grid", gridTemplateColumns: selectedReg ? "1fr 400px" : "1fr", gap: "20px", alignItems: "start" }}>
          
          {/* Table */}
          <div className="card" style={{ overflow: "hidden" }}>
            {loadingRegs ? (
              <div className="empty">Đang tải danh sách đăng ký…</div>
            ) : regs.length === 0 ? (
              <div className="empty">Không có đơn đăng ký đại lý mới nào.</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Họ tên</th>
                    <th>Số điện thoại</th>
                    <th>Email</th>
                    <th>Khu vực đăng ký</th>
                    <th>Ngày gửi</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {regs.map((reg) => {
                    const st = REG_STATUS[reg.status] ?? REG_STATUS.new;
                    return (
                      <tr
                        key={reg.id}
                        style={{ cursor: "pointer", background: selectedReg?.id === reg.id ? "var(--green-100)" : "" }}
                        onClick={() => {
                          setSelectedReg(reg);
                          setApproveCode("");
                          setApproveRegion(reg.area || "");
                        }}
                      >
                        <td><strong>{reg.full_name}</strong></td>
                        <td>{reg.phone}</td>
                        <td>{reg.email || "—"}</td>
                        <td>{reg.area || "—"}</td>
                        <td style={{ color: "var(--text-soft)", fontSize: "14px" }}>
                          {new Date(reg.created_at).toLocaleDateString("vi-VN")}
                        </td>
                        <td>
                          <span className={`status-pill ${st.cls}`}>{st.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Right Approval Form */}
          {selectedReg && (
            <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px", position: "sticky", top: "80px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
                <h3 style={{ fontSize: "17px", fontWeight: "600" }}>Phê duyệt đại lý mới</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedReg(null)} style={{ padding: "4px 8px" }}>Đóng</button>
              </div>

              {/* Info of Applicant */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px" }}>
                <div>
                  <span className="label">Người ứng tuyển:</span>
                  <div><strong>{selectedReg.full_name}</strong></div>
                </div>
                <div>
                  <span className="label">Số điện thoại:</span>
                  <div>{selectedReg.phone}</div>
                </div>
                <div>
                  <span className="label">Email:</span>
                  <div>{selectedReg.email || "—"}</div>
                </div>
                {selectedReg.message && (
                  <div>
                    <span className="label">Thông tin đính kèm:</span>
                    <div style={{ background: "var(--bg)", padding: "8px 10px", borderRadius: "var(--radius-sm)", fontSize: "13px" }}>
                      {selectedReg.message}
                    </div>
                  </div>
                )}
              </div>

              {/* Approval options Form */}
              {canWrite && selectedReg.status !== "closed" && (
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div className="field">
                    <span className="label">Mã đại lý (Unique)</span>
                    <input
                      className="input"
                      placeholder="Ví dụ: DL_TAYNINH_01"
                      value={approveCode}
                      onChange={(e) => setApproveCode(e.target.value)}
                      style={{ padding: "8px", fontSize: "14px" }}
                    />
                  </div>

                  <div className="field">
                    <span className="label">Xếp hạng Đại lý (Tier)</span>
                    <select
                      className="input"
                      value={approveTier}
                      onChange={(e) => setApproveTier(e.target.value as any)}
                      style={{ padding: "8px", fontSize: "14px" }}
                    >
                      <option value="tier_1">Đại lý Cấp 1 (Chiết khấu cao hơn)</option>
                      <option value="tier_2">Đại lý Cấp 2</option>
                    </select>
                  </div>

                  <div className="field">
                    <span className="label">Khu vực phân phối</span>
                    <input
                      className="input"
                      placeholder="Miền Nam, Tây Ninh, TP.HCM..."
                      value={approveRegion}
                      onChange={(e) => setApproveRegion(e.target.value)}
                      style={{ padding: "8px", fontSize: "14px" }}
                    />
                  </div>

                  <div className="field">
                    <span className="label">Hạn mức công nợ (VND)</span>
                    <input
                      className="input"
                      type="number"
                      value={approveCreditLimit}
                      onChange={(e) => setApproveCreditLimit(Number(e.target.value))}
                      style={{ padding: "8px", fontSize: "14px" }}
                    />
                  </div>

                  <div className="field">
                    <span className="label">Hạn trả công nợ (ngày)</span>
                    <input
                      className="input"
                      type="number"
                      value={approveTermDays}
                      onChange={(e) => setApproveTermDays(Number(e.target.value))}
                      style={{ padding: "8px", fontSize: "14px" }}
                    />
                  </div>

                  <button
                    className="btn btn-primary"
                    onClick={handleApproveRegistration}
                    disabled={approving || !approveCode.trim() || !approveRegion.trim()}
                    style={{ width: "100%", fontSize: "14px", padding: "10px" }}
                  >
                    {approving ? "Đang phê duyệt…" : "✓ Kích hoạt hồ sơ Đại lý"}
                  </button>
                </div>
              )}

              {selectedReg.status === "closed" && (
                <div style={{ background: "var(--green-100)", color: "var(--green-900)", padding: "12px", borderRadius: "var(--radius-sm)", textAlign: "center", fontWeight: "600", fontSize: "14px" }}>
                  ✓ Đơn đăng ký này đã được duyệt và kích hoạt đại lý thành công.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
