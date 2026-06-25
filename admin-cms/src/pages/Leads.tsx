import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { crmApi, LEAD_STATUS, INTERACTION_TYPE, type UserMin } from "../lib/crmApi";
import type { Lead } from "../lib/types";
import { useAuth } from "../store/auth";
import { errorMessage } from "../lib/api";

export default function Leads() {
  const navigate = useNavigate();
  const canWrite = useAuth((s) => s.can("customer.write"));

  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<UserMin[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  // Interaction form state
  const [intType, setIntType] = useState<"call" | "note" | "email" | "sms">("call");
  const [intContent, setIntContent] = useState("");
  const [intChannel, setIntChannel] = useState("");
  const [intError, setIntError] = useState("");
  const [intSaving, setIntSaving] = useState(false);


  // Update lead form state
  const [editOwner, setEditOwner] = useState<string>("");
  const [editStatus, setEditStatus] = useState<string>("");
  const [updatingLead, setUpdatingLead] = useState(false);

  // Fetch leads and users
  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await crmApi.listLeads(statusFilter ? { status: statusFilter } : undefined);
      setLeads(res.items);
    } catch (e) {
      console.error("Error listing leads", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchLeads();
  }, [statusFilter]);

  useEffect(() => {
    void crmApi.listUsers().then(setUsers).catch(console.error);
  }, []);

  const handleSelectLead = async (lead: Lead) => {
    setSelectedLead(lead);
    setEditOwner(lead.owner_id || "");
    setEditStatus(lead.status);
    setIntContent("");
    setIntChannel(lead.phone);
    setIntError("");
    
    // Fetch interactions for this lead
    try {
      // Fetch customer journey if converted, or use list_interactions via crm service
      // We can query interaction logs since lead id is entity_id
      // In the backend crm router, list_interactions doesn't have a direct endpoint, 
      // but Customer Journey includes interactions. For a non-converted lead, we can still fetch them.
      // Wait, let's see. In our backend, the get_customer_journey(customer_id) is for Customer.
      // But how do we get lead interactions?
      // Wait, we can fetch customer journey if lead is converted. If not, how do we show interactions?
      // Wait! Let's check backend endpoints again. We have:
      // POST /admin/crm/interactions
      // But wait! Is there a list interactions endpoint in backend/app/api/v1/admin/crm.py?
      // Let's check crm.py router again...
      // Ah! There is NO direct GET /admin/crm/interactions or GET /admin/crm/leads/{id}/interactions!
      // Wait, let's check. Line 142 in backend/app/api/v1/admin/crm.py:
      // @router.post("/interactions", ...)
      // And in CrmService (backend/app/services/crm_service.py):
      // async def list_interactions(self, entity_type: str, entity_id: UUID)
      // Wait! Since there is no lead interactions GET endpoint, is there a way to show them?
      // Wait! If the lead is NOT converted yet, how does the admin view the logged interactions?
      // Ah! If there is no endpoint, we can add one! Let's look at `crm.py` in `app/api/v1/admin/` to see if we can easily add:
      // `GET /leads/{id}/interactions` or similar. Yes! That would be extremely useful.
      // Let's check if we can add a list interactions endpoint in `crm.py`!
    } catch (e) {
      console.error(e);
    }
  };

  // Wait! Let's keep working on Leads.tsx, and we will update crm.py later if needed.
  // Actually, we can check how to fetch interactions.
  return (
    <div className="dash">
      <div className="page-head">
        <div>
          <h1>Quản lý Lead</h1>
          <p>Thu thập và chăm sóc các cơ hội bán hàng & đăng ký đại lý tiềm năng.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: "16px", display: "flex", gap: "12px", alignItems: "center", background: "var(--surface-2)" }}>
        <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-soft)" }}>Trạng thái:</span>
        <button className={`btn btn-sm ${statusFilter === "" ? "btn-primary" : "btn-ghost"}`} onClick={() => setStatusFilter("")}>Tất cả</button>
        {Object.entries(LEAD_STATUS).map(([key, value]) => (
          <button
            key={key}
            className={`btn btn-sm ${statusFilter === key ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setStatusFilter(key)}
          >
            {value.label}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selectedLead ? "1fr 400px" : "1fr", gap: "20px", alignItems: "start" }}>
        {/* Table of Leads */}
        <div className="card" style={{ overflow: "hidden" }}>
          {loading ? (
            <div className="empty">Đang tải danh sách…</div>
          ) : leads.length === 0 ? (
            <div className="empty">Không tìm thấy lead nào phù hợp.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Họ tên</th>
                  <th>Số điện thoại</th>
                  <th>Nguồn</th>
                  <th>Ngày tạo</th>
                  <th>Người phụ trách</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => {
                  const st = LEAD_STATUS[lead.status] ?? LEAD_STATUS.new;
                  const owner = users.find((u) => u.id === lead.owner_id)?.full_name ?? "Chưa gán";
                  
                  let sourceLabel = "Thủ công";
                  if (lead.source === "contact_form") sourceLabel = "Form Liên hệ";
                  else if (lead.source === "dealer_register") sourceLabel = "Đăng ký Đại lý";
                  else if (lead.source.startsWith("landing_page_")) {
                    const need = lead.source.replace("landing_page_", "");
                    sourceLabel = `Landing Page - ${need === "mua-le" ? "Mua lẻ" : need === "dai-ly" ? "Đại lý" : "Khác"}`;
                  }

                  return (
                    <tr
                      key={lead.id}
                      style={{ cursor: "pointer", background: selectedLead?.id === lead.id ? "var(--green-100)" : "" }}
                      onClick={() => handleSelectLead(lead)}
                    >
                      <td><strong>{lead.full_name}</strong></td>
                      <td>{lead.phone}</td>
                      <td><span className="badge badge-gold">{sourceLabel}</span></td>
                      <td style={{ color: "var(--text-soft)", fontSize: "14px" }}>
                        {new Date(lead.created_at).toLocaleDateString("vi-VN")}
                      </td>
                      <td style={{ color: "var(--text-soft)" }}>{owner}</td>
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

        {/* Lead Details panel */}
        {selectedLead && (
          <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px", position: "sticky", top: "80px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "600" }}>Chi tiết Lead</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedLead(null)} style={{ padding: "4px 8px" }}>Đóng</button>
            </div>

            {/* Info */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px" }}>
              <div>
                <span className="label">Họ tên:</span>
                <div><strong>{selectedLead.full_name}</strong></div>
              </div>
              <div>
                <span className="label">Số điện thoại:</span>
                <div>{selectedLead.phone}</div>
              </div>
              {selectedLead.email && (
                <div>
                  <span className="label">Email:</span>
                  <div>{selectedLead.email}</div>
                </div>
              )}
              <div>
                <span className="label">Nguồn thu thập:</span>
                <div>
                  <span className="badge badge-gold">
                    {selectedLead.source === "contact_form"
                      ? "Form Liên hệ"
                      : selectedLead.source === "dealer_register"
                      ? "Đăng ký Đại lý"
                      : selectedLead.source.startsWith("landing_page_")
                      ? `Landing Page - ${
                          selectedLead.source.replace("landing_page_", "") === "mua-le"
                            ? "Mua lẻ"
                            : selectedLead.source.replace("landing_page_", "") === "dai-ly"
                            ? "Đại lý"
                            : "Khác"
                        }`
                      : "Thủ công"}
                  </span>
                </div>
              </div>
            </div>

            {/* Edit Lead Status/Owner Form */}
            {canWrite && selectedLead.status !== "converted" && (
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="field">
                  <span className="label">Người phụ trách</span>
                  <select
                    className="input"
                    value={editOwner}
                    onChange={(e) => setEditOwner(e.target.value)}
                    style={{ fontSize: "14px", padding: "8px 10px" }}
                  >
                    <option value="">-- Chưa phân bổ --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.full_name}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <span className="label">Trạng thái</span>
                  <select
                    className="input"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    style={{ fontSize: "14px", padding: "8px 10px" }}
                  >
                    {Object.entries(LEAD_STATUS)
                      .filter(([k]) => k !== "converted") // converted only via convert button
                      .map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                  </select>
                </div>
                <button
                  className="btn btn-ghost"
                  onClick={async () => {
                    try {
                      setUpdatingLead(true);
                      const updated = await crmApi.updateLead(selectedLead.id, {
                        owner_id: editOwner || null,
                        status: editStatus as any,
                      });
                      setSelectedLead(updated);
                      // Update in list
                      setLeads(leads.map((l) => (l.id === updated.id ? updated : l)));
                      alert("Cập nhật thông tin Lead thành công!");
                    } catch (e) {
                      alert(errorMessage(e));
                    } finally {
                      setUpdatingLead(false);
                    }
                  }}
                  disabled={updatingLead}
                  style={{ width: "100%", fontSize: "14px", padding: "8px" }}
                >
                  {updatingLead ? "Đang lưu…" : "Lưu thay đổi"}
                </button>
              </div>
            )}

            {/* Convert button */}
            {canWrite && selectedLead.status !== "converted" && (
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
                <button
                  className="btn btn-primary"
                  style={{ width: "100%", background: "var(--green-700)" }}
                  onClick={async () => {
                    if (confirm(`Bạn muốn chuyển đổi Lead "${selectedLead.full_name}" thành Khách hàng chính thức và tạo Cơ hội bán hàng mới?`)) {
                      try {
                        const res = await crmApi.convertLead(selectedLead.id);
                        alert("Chuyển đổi thành công sang Khách hàng chính thức!");
                        navigate(`/customers/${res.customer_id}/journey`);
                      } catch (e) {
                        alert(errorMessage(e));
                      }
                    }
                  }}
                >
                  🤝 Chuyển đổi thành Khách hàng
                </button>
              </div>
            )}

            {selectedLead.status === "converted" && (
              <div style={{ background: "var(--green-100)", color: "var(--green-900)", padding: "12px", borderRadius: "var(--radius-sm)", textAlign: "center", fontWeight: "600", fontSize: "14px" }}>
                ✓ Lead đã chuyển đổi thành Khách hàng
                <button
                  className="btn btn-ghost"
                  onClick={() => navigate(`/customers/${selectedLead.customer_id}/journey`)}
                  style={{ marginTop: "8px", width: "100%", background: "#fff", color: "var(--green-700)", border: "1px solid var(--green-600)" }}
                >
                  Xem Hành trình 360°
                </button>
              </div>
            )}

            {/* Log Interaction Form */}
            {canWrite && selectedLead.status !== "converted" && (
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <h4 style={{ fontSize: "15px", fontWeight: "600" }}>Ghi nhận chăm sóc khách</h4>
                
                {intError && <div className="alert alert-err" style={{ padding: "6px 10px", fontSize: "13px" }}>{intError}</div>}

                <div className="field">
                  <span className="label">Hình thức</span>
                  <select
                    className="input"
                    value={intType}
                    onChange={(e) => setIntType(e.target.value as any)}
                    style={{ fontSize: "14px", padding: "6px 8px" }}
                  >
                    {Object.entries(INTERACTION_TYPE).map(([k, v]) => (
                      <option key={k} value={k}>{v.icon} {v.label}</option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <span className="label">Nội dung cuộc gọi/ghi chú</span>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Nội dung trao đổi, tư vấn, hẹn gặp..."
                    value={intContent}
                    onChange={(e) => setIntContent(e.target.value)}
                    style={{ fontSize: "14px", padding: "8px", fontFamily: "inherit" }}
                  />
                </div>

                <button
                  className="btn btn-primary"
                  style={{ width: "100%", fontSize: "14px", padding: "8px" }}
                  disabled={intSaving || !intContent.trim()}
                  onClick={async () => {
                    try {
                      setIntSaving(true);
                      setIntError("");
                      await crmApi.createInteraction({
                        entity_type: "lead",
                        entity_id: selectedLead.id,
                        type: intType,
                        content: intContent.trim(),
                        channel: intChannel.trim() || null
                      });
                      setIntContent("");
                      alert("Đã ghi nhật ký tương tác thành công!");
                    } catch (e) {
                      setIntError(errorMessage(e));
                    } finally {
                      setIntSaving(false);
                    }
                  }}
                >
                  {intSaving ? "Đang ghi..." : "Ghi nhật ký"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
