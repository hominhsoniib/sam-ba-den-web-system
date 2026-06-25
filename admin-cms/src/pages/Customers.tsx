import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { crmApi, type UserMin } from "../lib/crmApi";
import type { Customer } from "../lib/types";

export default function Customers() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<UserMin[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await crmApi.listCustomers({ page, page_size: pageSize });
      setCustomers(res.items);
      setTotal(res.total);
    } catch (e) {
      console.error("Error fetching customers", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCustomers();
  }, [page]);

  useEffect(() => {
    void crmApi.listUsers().then(setUsers).catch(console.error);
  }, []);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="dash">
      <div className="page-head">
        <div>
          <h1>Hồ sơ Khách hàng lẻ</h1>
          <p>Danh sách thông tin liên hệ và lịch sử tương tác của khách hàng cá nhân.</p>
        </div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div className="empty">Đang tải danh sách…</div>
        ) : customers.length === 0 ? (
          <div className="empty">Chưa có khách hàng cá nhân nào được tạo hoặc chuyển đổi.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Số điện thoại</th>
                <th>Email</th>
                <th>Địa chỉ</th>
                <th>Nguồn khách</th>
                <th>Người quản lý</th>
                <th>Ngày tạo</th>
                <th style={{ textAlign: "right" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const owner = users.find((u) => u.id === c.owner_id)?.full_name ?? "Chưa gán";
                
                let sourceLabel = "Thủ công";
                if (c.source === "contact_form") sourceLabel = "Form Liên hệ";
                else if (c.source === "dealer_register") sourceLabel = "Đăng ký Đại lý";
                else if (c.source === "web") sourceLabel = "Đặt hàng lẻ";

                return (
                  <tr
                    key={c.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/customers/${c.id}/journey`)}
                  >
                    <td>
                      <strong>{c.full_name}</strong>
                      {c.tags && (
                        <div style={{ marginTop: "4px", display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          {c.tags.split(",").map((t) => (
                            <span key={t} className="badge" style={{ fontSize: "10px", padding: "1px 6px" }}>
                              {t.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>{c.phone}</td>
                    <td>{c.email || "—"}</td>
                    <td style={{ color: "var(--text-soft)", fontSize: "14px", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.address || "—"}
                    </td>
                    <td>
                      <span className="badge badge-gold">{sourceLabel}</span>
                    </td>
                    <td style={{ color: "var(--text-soft)" }}>{owner}</td>
                    <td style={{ color: "var(--text-soft)", fontSize: "14px" }}>
                      {new Date(c.created_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: "13px", padding: "4px 10px" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/customers/${c.id}/journey`);
                        }}
                      >
                        Hành trình 360°
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "10px" }}>
          <button
            className="btn btn-ghost"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            style={{ padding: "6px 12px", fontSize: "14px" }}
          >
            Trước
          </button>
          <span style={{ display: "flex", alignItems: "center", padding: "0 12px", fontSize: "14px", color: "var(--text-soft)" }}>
            Trang {page} / {totalPages}
          </span>
          <button
            className="btn btn-ghost"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            style={{ padding: "6px 12px", fontSize: "14px" }}
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}
