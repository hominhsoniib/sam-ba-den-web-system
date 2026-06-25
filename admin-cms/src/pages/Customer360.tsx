import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { crmApi, INTERACTION_TYPE, OPP_STAGE, type UserMin } from "../lib/crmApi";
import type { CustomerJourney } from "../lib/types";
import { useAuth } from "../store/auth";
import { errorMessage } from "../lib/api";
import { fmtVnd } from "../lib/productApi";

export default function Customer360() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canWrite = useAuth((s) => s.can("customer.write"));

  const [journey, setJourney] = useState<CustomerJourney | null>(null);
  const [users, setUsers] = useState<UserMin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit Customer state
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [custTags, setCustTags] = useState("");
  const [custNote, setCustNote] = useState("");
  const [custOwner, setCustOwner] = useState("");
  const [updatingCust, setUpdatingCust] = useState(false);

  // New Opportunity state
  const [isAddingOpp, setIsAddingOpp] = useState(false);
  const [oppTitle, setOppTitle] = useState("");
  const [oppStage, setOppStage] = useState<"new" | "qualified" | "proposal" | "won" | "lost">("new");
  const [oppVal, setOppVal] = useState<number>(0);
  const [oppCloseDate, setOppCloseDate] = useState("");
  const [oppError, setOppError] = useState("");
  const [oppSaving, setOppSaving] = useState(false);

  // Log Interaction state
  const [intType, setIntType] = useState<"call" | "note" | "email" | "sms">("call");
  const [intContent, setIntContent] = useState("");
  const [intChannel, setIntChannel] = useState("");
  const [intError, setIntError] = useState("");
  const [intSaving, setIntSaving] = useState(false);

  const fetchJourney = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError("");
      const res = await crmApi.getCustomerJourney(id);
      setJourney(res);
      
      // Initialize edit state
      setCustName(res.customer.full_name);
      setCustPhone(res.customer.phone);
      setCustEmail(res.customer.email || "");
      setCustAddress(res.customer.address || "");
      setCustTags(res.customer.tags || "");
      setCustNote(res.customer.note || "");
      setCustOwner(res.customer.owner_id || "");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchJourney();
  }, [id]);

  useEffect(() => {
    void crmApi.listUsers().then(setUsers).catch(console.error);
  }, []);

  if (loading) return <div className="screen-center">Đang tải hồ sơ khách hàng…</div>;
  if (error || !journey) {
    return (
      <div className="dash" style={{ padding: "40px 0", textAlign: "center" }}>
        <div className="alert alert-err" style={{ display: "inline-block", maxWidth: "500px" }}>
          Lỗi: {error || "Không tìm thấy thông tin khách hàng"}
        </div>
        <div style={{ marginTop: "20px" }}>
          <button className="btn btn-ghost" onClick={() => navigate("/customers")}>Quay lại danh sách</button>
        </div>
      </div>
    );
  }

  const { customer, opportunities, interactions } = journey;
  const ownerName = users.find((u) => u.id === customer.owner_id)?.full_name ?? "Chưa gán";

  // Handle customer updates
  const handleUpdateCustomer = async () => {
    try {
      setUpdatingCust(true);
      const updated = await crmApi.updateCustomer(customer.id, {
        full_name: custName,
        phone: custPhone,
        email: custEmail || null,
        address: custAddress || null,
        tags: custTags || null,
        note: custNote || null,
        owner_id: custOwner || null,
      });
      setJourney({ ...journey, customer: updated });
      setIsEditingCustomer(false);
      alert("Cập nhật hồ sơ khách hàng thành công!");
    } catch (e) {
      alert(errorMessage(e));
    } finally {
      setUpdatingCust(false);
    }
  };

  // Handle adding a new opportunity
  const handleAddOpportunity = async () => {
    try {
      setOppSaving(true);
      setOppError("");
      const payload = {
        customer_id: customer.id,
        title: oppTitle.trim(),
        stage: oppStage,
        est_value: oppVal || 0,
        owner_id: customer.owner_id || null,
        expected_close_date: oppCloseDate ? new Date(oppCloseDate).toISOString() : null,
      };
      await crmApi.createOpportunity(payload);
      
      // Reset
      setOppTitle("");
      setOppStage("new");
      setOppVal(0);
      setOppCloseDate("");
      setIsAddingOpp(false);
      
      // Refresh journey
      void fetchJourney();
      alert("Tạo cơ hội bán hàng mới thành công!");
    } catch (e) {
      setOppError(errorMessage(e));
    } finally {
      setOppSaving(false);
    }
  };

  // Handle updating an opportunity stage
  const handleUpdateOppStage = async (oppId: string, newStage: any) => {
    try {
      await crmApi.updateOpportunity(oppId, { stage: newStage });
      void fetchJourney();
      alert("Cập nhật tiến trình cơ hội thành công!");
    } catch (e) {
      alert(errorMessage(e));
    }
  };

  // Handle adding new interaction
  const handleAddInteraction = async () => {
    try {
      setIntSaving(true);
      setIntError("");
      await crmApi.createInteraction({
        entity_type: "customer",
        entity_id: customer.id,
        type: intType,
        content: intContent.trim(),
        channel: intChannel.trim() || null
      });
      setIntContent("");
      setIntChannel("");
      
      // Refresh
      void fetchJourney();
      alert("Đã ghi tương tác thành công!");
    } catch (e) {
      setIntError(errorMessage(e));
    } finally {
      setIntSaving(false);
    }
  };

  return (
    <div className="dash">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "16px" }}>
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate("/customers")} style={{ marginBottom: "8px" }}>
            ← Quay lại
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <h1 style={{ fontSize: "28px" }}>Hành trình Khách hàng 360°</h1>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: "24px", alignItems: "start" }}>
        
        {/* LEFT COLUMN: Profile & Opportunities */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Customer Profile card */}
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "12px", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600" }}>Thông tin liên hệ</h3>
              {canWrite && !isEditingCustomer && (
                <button className="btn btn-ghost btn-sm" onClick={() => setIsEditingCustomer(true)} style={{ padding: "3px 8px", fontSize: "13px" }}>
                  Chỉnh sửa
                </button>
              )}
            </div>

            {isEditingCustomer ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="field">
                  <span className="label">Họ tên</span>
                  <input className="input" value={custName} onChange={(e) => setCustName(e.target.value)} />
                </div>
                <div className="field">
                  <span className="label">Số điện thoại</span>
                  <input className="input" value={custPhone} onChange={(e) => setCustPhone(e.target.value)} />
                </div>
                <div className="field">
                  <span className="label">Email</span>
                  <input className="input" type="email" value={custEmail} onChange={(e) => setCustEmail(e.target.value)} />
                </div>
                <div className="field">
                  <span className="label">Địa chỉ</span>
                  <input className="input" value={custAddress} onChange={(e) => setCustAddress(e.target.value)} />
                </div>
                <div className="field">
                  <span className="label">Tags (cách nhau bằng dấu phẩy)</span>
                  <input className="input" placeholder="VIP, đại lý tiềm năng, sâm củ..." value={custTags} onChange={(e) => setCustTags(e.target.value)} />
                </div>
                <div className="field">
                  <span className="label">Người phụ trách</span>
                  <select className="input" value={custOwner} onChange={(e) => setCustOwner(e.target.value)}>
                    <option value="">-- Chưa gán --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.full_name}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <span className="label">Ghi chú bổ sung</span>
                  <textarea className="input" rows={2} value={custNote} onChange={(e) => setCustNote(e.target.value)} />
                </div>
                
                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                  <button className="btn btn-primary" style={{ flex: 1, padding: "8px", fontSize: "14px" }} onClick={handleUpdateCustomer} disabled={updatingCust}>
                    Lưu
                  </button>
                  <button className="btn btn-ghost" style={{ flex: 1, padding: "8px", fontSize: "14px" }} onClick={() => setIsEditingCustomer(false)}>
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px" }}>
                <div>
                  <span className="label">Họ tên:</span>
                  <div><strong>{customer.full_name}</strong></div>
                </div>
                <div>
                  <span className="label">Số điện thoại:</span>
                  <div>{customer.phone}</div>
                </div>
                <div>
                  <span className="label">Email:</span>
                  <div>{customer.email || <span style={{ color: "var(--text-faint)" }}>—</span>}</div>
                </div>
                <div>
                  <span className="label">Địa chỉ:</span>
                  <div>{customer.address || <span style={{ color: "var(--text-faint)" }}>—</span>}</div>
                </div>
                <div>
                  <span className="label">Người quản lý:</span>
                  <div>{ownerName}</div>
                </div>
                <div>
                  <span className="label">Nhóm / Tags:</span>
                  <div style={{ marginTop: "4px", display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    {customer.tags ? (
                      customer.tags.split(",").map((t) => (
                        <span key={t} className="badge" style={{ padding: "2px 8px" }}>{t.trim()}</span>
                      ))
                    ) : (
                      <span style={{ color: "var(--text-faint)" }}>Không có tag</span>
                    )}
                  </div>
                </div>
                {customer.note && (
                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px", marginTop: "4px" }}>
                    <span className="label">Ghi chú nội bộ:</span>
                    <div style={{ whiteSpace: "pre-line", color: "var(--text-soft)", fontSize: "13px" }}>{customer.note}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Opportunities card */}
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "12px", marginBottom: "16px", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600" }}>Cơ hội bán hàng</h3>
              {canWrite && !isAddingOpp && (
                <button className="btn btn-ghost btn-sm" onClick={() => setIsAddingOpp(true)} style={{ padding: "3px 8px", fontSize: "13px" }}>
                  + Thêm
                </button>
              )}
            </div>

            {isAddingOpp && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px", background: "var(--surface-2)", padding: "12px", borderRadius: "var(--radius-sm)" }}>
                <h4 style={{ fontSize: "14px", fontWeight: "600" }}>Cơ hội mới</h4>
                {oppError && <div className="alert alert-err" style={{ padding: "6px" }}>{oppError}</div>}
                
                <div className="field">
                  <span className="label">Tiêu đề cơ hội</span>
                  <input className="input" placeholder="Mua sâm biếu Tết..." value={oppTitle} onChange={(e) => setOppTitle(e.target.value)} style={{ padding: "6px" }} />
                </div>
                <div className="field">
                  <span className="label">Giá trị ước tính (VND)</span>
                  <input className="input" type="number" value={oppVal} onChange={(e) => setOppVal(Number(e.target.value))} style={{ padding: "6px" }} />
                </div>
                <div className="field">
                  <span className="label">Giai đoạn</span>
                  <select className="input" value={oppStage} onChange={(e) => setOppStage(e.target.value as any)} style={{ padding: "6px" }}>
                    {Object.entries(OPP_STAGE).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <span className="label">Dự kiến chốt</span>
                  <input className="input" type="date" value={oppCloseDate} onChange={(e) => setOppCloseDate(e.target.value)} style={{ padding: "6px" }} />
                </div>

                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                  <button className="btn btn-primary" style={{ flex: 1, padding: "6px", fontSize: "13px" }} onClick={handleAddOpportunity} disabled={oppSaving || !oppTitle.trim()}>
                    Tạo
                  </button>
                  <button className="btn btn-ghost" style={{ flex: 1, padding: "6px", fontSize: "13px" }} onClick={() => setIsAddingOpp(false)}>
                    Hủy
                  </button>
                </div>
              </div>
            )}

            {opportunities.length === 0 ? (
              <div style={{ padding: "12px 0", color: "var(--text-faint)", fontSize: "14px", textAlign: "center" }}>
                Chưa có cơ hội bán hàng nào được ghi nhận.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {opportunities.map((opp) => {
                  const stage = OPP_STAGE[opp.stage] ?? OPP_STAGE.new;
                  return (
                    <div key={opp.id} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "12px", fontSize: "14px" }}>
                      <div style={{ fontWeight: "600", marginBottom: "4px" }}>{opp.title}</div>
                      <div style={{ color: "var(--green-700)", fontWeight: "600", fontSize: "15px" }}>
                        {opp.est_value ? fmtVnd(opp.est_value) : "—"}
                      </div>
                      
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", paddingTop: "8px", borderTop: "1px dashed var(--border)" }}>
                        {canWrite ? (
                          <select
                            value={opp.stage}
                            onChange={(e) => handleUpdateOppStage(opp.id, e.target.value as any)}
                            style={{ fontSize: "12px", padding: "2px 4px", borderRadius: "4px", borderColor: "var(--border)" }}
                          >
                            {Object.entries(OPP_STAGE).map(([k, v]) => (
                              <option key={k} value={k}>{v.label}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`status-pill ${stage.cls}`}>{stage.label}</span>
                        )}

                        <span style={{ fontSize: "11px", color: "var(--text-faint)" }}>
                          Cập nhật: {new Date(opp.updated_at).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Timeline & Log interaction */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Add Interaction Quick Form */}
          {canWrite && (
            <div className="card" style={{ padding: "20px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", borderBottom: "1px solid var(--border)", paddingBottom: "12px", marginBottom: "16px" }}>
                Ghi nhận tương tác chăm sóc mới
              </h3>
              {intError && <div className="alert alert-err" style={{ padding: "8px", marginBottom: "12px" }}>{intError}</div>}
              
              <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: "12px", marginBottom: "12px" }}>
                <div className="field">
                  <span className="label">Hình thức</span>
                  <select className="input" value={intType} onChange={(e) => setIntType(e.target.value as any)} style={{ padding: "8px" }}>
                    {Object.entries(INTERACTION_TYPE).map(([k, v]) => (
                      <option key={k} value={k}>{v.icon} {v.label}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <span className="label">Kênh (Số đt/Email)</span>
                  <input className="input" placeholder="098..." value={intChannel} onChange={(e) => setIntChannel(e.target.value)} style={{ padding: "8px" }} />
                </div>
              </div>

              <div className="field" style={{ marginBottom: "16px" }}>
                <span className="label">Nội dung trao đổi chi tiết</span>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Ghi rõ thông tin cuộc gọi, ý kiến khách hàng, hẹn gặp..."
                  value={intContent}
                  onChange={(e) => setIntContent(e.target.value)}
                  style={{ fontFamily: "inherit", padding: "10px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button className="btn btn-primary" onClick={handleAddInteraction} disabled={intSaving || !intContent.trim()} style={{ padding: "10px 24px" }}>
                  {intSaving ? "Đang ghi..." : "Ghi nhật ký tương tác"}
                </button>
              </div>
            </div>
          )}

          {/* Timeline of interactions */}
          <div className="card" style={{ padding: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "600", borderBottom: "1px solid var(--border)", paddingBottom: "12px", marginBottom: "20px" }}>
              Nhật ký hành trình tương tác
            </h3>

            {interactions.length === 0 ? (
              <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text-faint)" }}>
                Chưa có sự kiện tương tác nào được ghi nhận.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px", position: "relative", paddingLeft: "24px" }}>
                {/* Vertical Timeline bar */}
                <div style={{ position: "absolute", left: "9px", top: "10px", bottom: "10px", width: "2px", background: "var(--border)" }}></div>

                {interactions.map((int) => {
                  const typeMeta = INTERACTION_TYPE[int.type] ?? { label: "Ghi chú", icon: "📝" };
                  const creator = users.find((u) => u.id === int.created_by)?.full_name ?? "Hệ thống";
                  
                  return (
                    <div key={int.id} style={{ position: "relative", display: "flex", flexDirection: "column", gap: "4px" }}>
                      
                      {/* Timeline dot */}
                      <div
                        style={{
                          position: "absolute",
                          left: "-24px",
                          top: "2px",
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          background: "#fff",
                          border: "2px solid var(--green-600)",
                          display: "grid",
                          placeItems: "center",
                          fontSize: "10px",
                          zIndex: 2
                        }}
                      >
                        {typeMeta.icon}
                      </div>

                      {/* Timeline content */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-soft)" }}>
                          {typeMeta.label} {int.channel ? `(${int.channel})` : ""} · Ghi nhận bởi <strong>{creator}</strong>
                        </span>
                        <span style={{ fontSize: "12px", color: "var(--text-faint)" }}>
                          {new Date(int.created_at).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}
                        </span>
                      </div>

                      <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "12px", fontSize: "14px", whiteSpace: "pre-line", color: "var(--text)" }}>
                        {int.content}
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
  );
}
