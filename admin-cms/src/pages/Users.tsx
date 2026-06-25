import { useEffect, useState } from "react";
import { useAuth } from "../store/auth";
import { rbacApi, type Role, type Permission } from "../lib/rbacApi";
import type { User } from "../lib/types";
import { errorMessage } from "../lib/api";

export default function Users() {
  const canWrite = useAuth((s) => s.can("user.write"));

  const [activeTab, setActiveTab] = useState<"users" | "roles">("users");

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Roles state
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  // User Role Editing Modal
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userSelectedRoles, setUserSelectedRoles] = useState<string[]>([]);
  const [savingUserRoles, setSavingUserRoles] = useState(false);

  // Role Editing Modal
  const [editingRole, setEditingRole] = useState<Role | Partial<Role> | null>(null);
  const [roleName, setRoleName] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const [rolePerms, setRolePerms] = useState<string[]>([]);
  const [savingRole, setSavingRole] = useState(false);

  useEffect(() => {
    if (activeTab === "users") {
      void fetchUsers();
    } else {
      void fetchRolesAndPerms();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await rbacApi.listUsers();
      setUsers(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchRolesAndPerms = async () => {
    try {
      setLoadingRoles(true);
      const [r, p] = await Promise.all([
        rbacApi.listRoles(),
        rbacApi.listPermissions()
      ]);
      setRoles(r);
      setPermissions(p);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRoles(false);
    }
  };

  // ---- Role Handlers ----
  const handleOpenRoleForm = (r?: Role) => {
    if (r) {
      setEditingRole(r);
      setRoleName(r.name);
      setRoleDesc(r.description || "");
      setRolePerms(r.permissions.map((p) => p.id));
    } else {
      setEditingRole({});
      setRoleName("");
      setRoleDesc("");
      setRolePerms([]);
    }
  };

  const handleSaveRole = async () => {
    try {
      setSavingRole(true);
      const payload = {
        name: roleName.trim(),
        description: roleDesc.trim() || null,
        permission_ids: rolePerms,
      };

      if ((editingRole as Role).id) {
        await rbacApi.updateRole((editingRole as Role).id, payload);
        alert("Cập nhật Vai trò thành công!");
      } else {
        await rbacApi.createRole(payload);
        alert("Tạo Vai trò mới thành công!");
      }
      setEditingRole(null);
      void fetchRolesAndPerms();
    } catch (e) {
      alert(errorMessage(e));
    } finally {
      setSavingRole(false);
    }
  };

  const handleDeleteRole = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa Vai trò này không? (Những người dùng đang dùng Role này sẽ mất quyền tương ứng)")) return;
    try {
      await rbacApi.deleteRole(id);
      void fetchRolesAndPerms();
    } catch (e) {
      alert(errorMessage(e));
    }
  };

  const togglePermission = (permId: string) => {
    if (rolePerms.includes(permId)) {
      setRolePerms(rolePerms.filter((id) => id !== permId));
    } else {
      setRolePerms([...rolePerms, permId]);
    }
  };

  // ---- User Handlers ----
  const handleOpenUserForm = async (u: User) => {
    try {
      // Make sure we have roles to select from
      if (roles.length === 0) {
        const r = await rbacApi.listRoles();
        setRoles(r);
      }
      setEditingUser(u);
      
      // Determine which roles this user has by matching their permission_codes or if we have a direct /roles endpoint
      // Note: currently UserOut only returns permission codes, not role IDs.
      // We will initialize with empty selection and let admin overwrite it for now, 
      // since the original schema didn't include role objects in UserOut.
      // (For a robust system, we should add role IDs to UserOut)
      setUserSelectedRoles([]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveUserRoles = async () => {
    if (!editingUser) return;
    try {
      setSavingUserRoles(true);
      await rbacApi.updateUserRoles(editingUser.id, userSelectedRoles);
      alert("Cập nhật Vai trò cho Người dùng thành công!");
      setEditingUser(null);
      void fetchUsers();
    } catch (e) {
      alert(errorMessage(e));
    } finally {
      setSavingUserRoles(false);
    }
  };

  return (
    <div className="dash">
      <div className="page-head" style={{ marginBottom: "20px" }}>
        <div>
          <h1>Quản trị Người dùng & Phân quyền</h1>
          <p>Thiết lập truy cập và phân bổ vai trò cho nhân sự.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="card" style={{ display: "flex", gap: "2px", background: "var(--surface-2)", padding: "4px", borderRadius: "var(--radius)", marginBottom: "24px" }}>
        <button
          className={`btn ${activeTab === "users" ? "btn-primary" : "btn-ghost"}`}
          style={{ flex: 1 }}
          onClick={() => setActiveTab("users")}
        >
          👤 Danh sách Người dùng
        </button>
        <button
          className={`btn ${activeTab === "roles" ? "btn-primary" : "btn-ghost"}`}
          style={{ flex: 1 }}
          onClick={() => setActiveTab("roles")}
        >
          🛡️ Vai trò & Phân quyền
        </button>
      </div>

      {activeTab === "users" && (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Lần đăng nhập cuối</th>
                <th>Quyền hiện tại (Permissions)</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loadingUsers ? (
                <tr><td colSpan={5} className="empty">Đang tải...</td></tr>
              ) : users.map((u) => (
                <tr key={u.id}>
                  <td><strong>{u.full_name}</strong></td>
                  <td>{u.email}</td>
                  <td style={{ color: "var(--text-soft)" }}>
                    {u.last_login_at ? new Date(u.last_login_at).toLocaleString("vi-VN") : "Chưa từng đăng nhập"}
                  </td>
                  <td>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {u.permissions.slice(0, 3).map((p) => (
                        <span key={p} className="badge" style={{ background: "var(--surface-2)" }}>{p}</span>
                      ))}
                      {u.permissions.length > 3 && (
                        <span className="badge" style={{ background: "var(--surface-2)" }}>+{u.permissions.length - 3}</span>
                      )}
                      {u.permissions.length === 0 && <span style={{ color: "var(--text-faint)" }}>—</span>}
                    </div>
                  </td>
                  <td>
                    {canWrite && (
                      <button className="btn btn-sm btn-ghost" onClick={() => handleOpenUserForm(u)}>
                        Cấp quyền
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "roles" && (
        <div className="card">
          <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "600" }}>Danh sách Vai trò (Roles)</h3>
            {canWrite && (
              <button className="btn btn-primary btn-sm" onClick={() => handleOpenRoleForm()}>
                + Tạo Role mới
              </button>
            )}
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Tên Role</th>
                <th>Mô tả</th>
                <th>Quyền hạn</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loadingRoles ? (
                <tr><td colSpan={4} className="empty">Đang tải...</td></tr>
              ) : roles.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.name}</strong></td>
                  <td>{r.description || "—"}</td>
                  <td>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {r.permissions.length > 0 ? r.permissions.map((p) => (
                        <span key={p.id} className="badge badge-gold" title={p.description || p.code}>{p.code}</span>
                      )) : <span style={{ color: "var(--text-faint)" }}>Chưa có quyền</span>}
                    </div>
                  </td>
                  <td>
                    {canWrite && (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button className="btn btn-sm btn-ghost" onClick={() => handleOpenRoleForm(r)}>Sửa</button>
                        <button className="btn btn-sm btn-ghost" style={{ color: "var(--danger)" }} onClick={() => handleDeleteRole(r.id)}>Xóa</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: EDIT ROLE */}
      {editingRole && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: "600px", width: "100%" }}>
            <h2 style={{ fontSize: "20px", marginBottom: "16px" }}>
              {(editingRole as Role).id ? "Chỉnh sửa Vai trò" : "Tạo Vai trò mới"}
            </h2>
            <div className="field">
              <span className="label">Tên Role</span>
              <input className="input" value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="VD: Kế toán, Sales Manager..." />
            </div>
            <div className="field">
              <span className="label">Mô tả</span>
              <input className="input" value={roleDesc} onChange={(e) => setRoleDesc(e.target.value)} placeholder="Quyền cho nhân sự phòng kế toán" />
            </div>
            
            <div className="field">
              <span className="label">Chọn nhóm quyền (Permissions)</span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "var(--surface-2)", padding: "16px", borderRadius: "var(--radius)", maxHeight: "300px", overflowY: "auto" }}>
                {permissions.map((p) => (
                  <label key={p.id} style={{ display: "flex", alignItems: "flex-start", gap: "8px", cursor: "pointer", fontSize: "14px" }}>
                    <input 
                      type="checkbox" 
                      checked={rolePerms.includes(p.id)} 
                      onChange={() => togglePermission(p.id)} 
                      style={{ marginTop: "4px" }}
                    />
                    <div>
                      <strong>{p.code}</strong>
                      <div style={{ fontSize: "12px", color: "var(--text-soft)" }}>{p.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "24px", justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setEditingRole(null)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSaveRole} disabled={savingRole || !roleName.trim()}>
                {savingRole ? "Đang lưu..." : "Lưu Vai trò"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER ROLES */}
      {editingUser && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: "500px", width: "100%" }}>
            <h2 style={{ fontSize: "20px", marginBottom: "8px" }}>Cấp quyền cho Nhân viên</h2>
            <p style={{ color: "var(--text-soft)", marginBottom: "20px" }}>Tài khoản: <strong>{editingUser.full_name} ({editingUser.email})</strong></p>
            
            <div className="field">
              <span className="label">Gán các Vai trò (Roles)</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "var(--surface-2)", padding: "16px", borderRadius: "var(--radius)", maxHeight: "300px", overflowY: "auto" }}>
                {roles.length === 0 && <div className="empty">Chưa có Vai trò nào trên hệ thống.</div>}
                {roles.map((r) => (
                  <label key={r.id} style={{ display: "flex", alignItems: "flex-start", gap: "12px", cursor: "pointer", fontSize: "15px", padding: "8px", background: "var(--bg)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                    <input 
                      type="checkbox" 
                      checked={userSelectedRoles.includes(r.id)} 
                      onChange={(e) => {
                        if (e.target.checked) setUserSelectedRoles([...userSelectedRoles, r.id]);
                        else setUserSelectedRoles(userSelectedRoles.filter((id) => id !== r.id));
                      }} 
                      style={{ marginTop: "4px", transform: "scale(1.2)" }}
                    />
                    <div>
                      <strong>{r.name}</strong>
                      <div style={{ fontSize: "13px", color: "var(--text-soft)" }}>{r.description || "Chưa có mô tả"}</div>
                      <div style={{ marginTop: "6px", display: "flex", gap: "4px", flexWrap: "wrap" }}>
                        {r.permissions.map(p => <span key={p.id} className="badge" style={{ fontSize: "10px" }}>{p.code}</span>)}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "24px", justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setEditingUser(null)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSaveUserRoles} disabled={savingUserRoles}>
                {savingUserRoles ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
