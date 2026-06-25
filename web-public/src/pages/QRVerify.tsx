import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { qrcode, type QRVerifyResponse, fmtDate } from "../lib/api";

export default function QRVerify() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<QRVerifyResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    qrcode
      .verify(token)
      .then((data) => {
        setResult(data);
        setErr(null);
      })
      .catch((e) => {
        setErr(e.message || "Không thể xác thực mã QR này.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  return (
    <div className="site-container" style={{ padding: "40px 16px", minHeight: "80vh" }}>
      <Helmet>
        <title>Xác thực sản phẩm chính hãng — Sâm Bà Đen</title>
        <meta name="description" content="Hệ thống xác thực mã QR chống hàng giả và truy xuất nguồn gốc Sâm Bà Đen Tây Ninh." />
      </Helmet>

      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        
        {/* Logo/Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
            <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#1e3d2f", margin: 0 }}>
              SÂM BÀ ĐEN
            </h1>
            <span style={{ fontSize: "12px", letterSpacing: "3px", color: "#b89243", textTransform: "uppercase", fontWeight: 600 }}>
              Truy xuất nguồn gốc &amp; Xác thực
            </span>
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div className="spinner" style={{
              width: "40px",
              height: "40px",
              border: "4px solid rgba(184, 146, 67, 0.1)",
              borderTop: "4px solid #b89243",
              borderRadius: "50%",
              margin: "0 auto 16px",
              animation: "spin 1s linear infinite"
            }} />
            <p style={{ color: "#7f8c8d" }}>Đang kết nối hệ thống xác thực...</p>
            <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }` }} />
          </div>
        ) : err || !result ? (
          <div className="card" style={{
            background: "#fff5f5",
            border: "1px solid #feb2b2",
            borderRadius: "12px",
            padding: "32px 24px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
            <h3 style={{ color: "#c53030", margin: "0 0 12px 0", fontSize: "20px" }}>Mã QR Không Hợp Lệ</h3>
            <p style={{ color: "#742a2a", margin: "0 0 24px 0", fontSize: "14px", lineHeight: "1.6" }}>
              Mã QR này không tồn tại trên hệ thống dữ liệu chính thức của Sâm Bà Đen. Hãy cẩn thận kiểm tra nguồn gốc sản phẩm để tránh mua phải hàng giả.
            </p>
            <Link to="/lien-he" className="btn btn-primary" style={{ display: "inline-block", background: "#c53030", borderColor: "#c53030" }}>
              Báo cáo hàng giả
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Status Card */}
            <div className="card" style={{
              background: result.authentic ? "#f0fdf4" : "#fef2f2",
              border: `1px solid ${result.authentic ? "#bbf7d0" : "#fecaca"}`,
              borderRadius: "16px",
              padding: "32px 24px",
              textAlign: "center",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)"
            }}>
              <div style={{ fontSize: "56px", marginBottom: "16px" }}>
                {result.authentic ? "🛡️" : "🚨"}
              </div>
              
              <h2 style={{
                color: result.authentic ? "#166534" : "#991b1b",
                margin: "0 0 12px 0",
                fontSize: "22px",
                fontWeight: 700
              }}>
                {result.authentic ? "Xác Thực Chính Hãng" : "Cảnh Báo Hàng Giả / Lỗi"}
              </h2>

              <p style={{
                color: result.authentic ? "#1e293b" : "#7f1d1d",
                fontSize: "15px",
                lineHeight: "1.6",
                margin: "0 0 16px 0",
                fontWeight: 500
              }}>
                {result.message}
              </p>

              {result.warning && (
                <div style={{
                  background: "#fffbeb",
                  border: "1px solid #fef3c7",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  color: "#92400e",
                  fontSize: "13px",
                  lineHeight: "1.5",
                  marginTop: "16px",
                  textAlign: "left"
                }}>
                  <strong>Lưu ý:</strong> {result.warning}
                </div>
              )}

              <div style={{
                display: "inline-block",
                background: result.authentic ? "#dcfce7" : "#fee2e2",
                color: result.authentic ? "#15803d" : "#b91c1c",
                fontSize: "13px",
                padding: "6px 16px",
                borderRadius: "20px",
                fontWeight: 600,
                marginTop: "16px"
              }}>
                Số lần đã quét: {result.scan_count} lần
              </div>

              {result.first_scan_at && (
                <p style={{ fontSize: "12px", color: "#64748b", margin: "12px 0 0 0" }}>
                  Lần quét đầu tiên: {fmtDate(result.first_scan_at)}
                </p>
              )}
            </div>

            {/* Batch & Traceability Info */}
            {result.batch && (
              <div className="card" style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)"
              }}>
                <h3 style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#1e3d2f",
                  margin: "0 0 16px 0",
                  borderBottom: "2px solid #f1f5f9",
                  paddingBottom: "8px"
                }}>
                  Thông Tin Sản Xuất &amp; Nguồn Gốc
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                    <span style={{ color: "#64748b" }}>Tên sản phẩm:</span>
                    <span style={{ fontWeight: 600, color: "#1e293b" }}>{result.batch.product_name}</span>
                  </div>
                  {result.batch.sku && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                      <span style={{ color: "#64748b" }}>Mã SKU:</span>
                      <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{result.batch.sku}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                    <span style={{ color: "#64748b" }}>Số lô sản xuất:</span>
                    <span style={{ fontWeight: 600 }}>{result.batch.batch_no}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                    <span style={{ color: "#64748b" }}>Ngày sản xuất:</span>
                    <span style={{ fontWeight: 600 }}>{result.batch.manufacture_date ? fmtDate(result.batch.manufacture_date) : "—"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                    <span style={{ color: "#64748b" }}>Hạn sử dụng:</span>
                    <span style={{ fontWeight: 600 }}>{result.batch.expiry_date ? fmtDate(result.batch.expiry_date) : "—"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                    <span style={{ color: "#64748b" }}>Vùng nuôi trồng:</span>
                    <span style={{ fontWeight: 600, color: "#b89243" }}>{result.batch.origin_region || "Tây Ninh"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                    <span style={{ color: "#64748b" }}>Nhà cung cấp vật tư:</span>
                    <span style={{ fontWeight: 600 }}>{result.batch.supplier_name || "Baden Farm"}</span>
                  </div>
                </div>

                {result.batch.notes && (
                  <div style={{
                    marginTop: "20px",
                    background: "#f8fafc",
                    borderRadius: "8px",
                    padding: "16px",
                    fontSize: "13px",
                    lineHeight: "1.6"
                  }}>
                    <strong style={{ color: "#475569", display: "block", marginBottom: "6px" }}>
                      Quy Trình &amp; Nhật Ký Sản Xuất:
                    </strong>
                    <p style={{ color: "#334155", margin: 0 }}>{result.batch.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Sâm Bà Đen Quality Promise */}
            <div style={{
              textAlign: "center",
              fontSize: "12px",
              color: "#94a3b8",
              lineHeight: "1.6",
              padding: "16px 0"
            }}>
              Sâm Bà Đen cam kết cung cấp sản phẩm sâm trồng tự nhiên chất lượng cao nhất tại Tây Ninh. Mọi hành vi làm giả, sao chép tem nhãn sẽ bị xử lý nghiêm minh theo pháp luật.
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
