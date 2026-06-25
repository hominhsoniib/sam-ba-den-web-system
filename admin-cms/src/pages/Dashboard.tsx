/**
 * Dashboard.tsx – Tổng quan doanh nghiệp (M9)
 * KPI real-time + biểu đồ SVG thuần (không cần thư viện Chart)
 * Dữ liệu lấy từ 7 analytics endpoints.
 */
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../store/auth";
import {
  analyticsApi,
  type TrendPoint,
  type StatusPoint,
  type ChannelPoint,
} from "../lib/analyticsApi";
import { fmtVnd, ORDER_STATUS_MAP } from "../lib/orderApi";

// ─── Format helpers ───────────────────────────────────────────────
function fmtShort(v: number): string {
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + "B";
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (v >= 1_000) return (v / 1_000).toFixed(0) + "K";
  return String(v);
}

function fmtDate(iso: string | null): string {
  if (!iso) return "Lần đầu";
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── KPI Card ─────────────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  change?: number | null;
  icon: string;
  color?: string;
}
function KpiCard({ label, value, sub, change, icon, color = "#1b5e20" }: KpiCardProps) {
  const up = change != null && change > 0;
  const down = change != null && change < 0;
  return (
    <div className="kpi-card">
      <div className="kpi-icon" style={{ background: color + "18", color }}>
        {icon}
      </div>
      <div className="kpi-body">
        <span className="kpi-label">{label}</span>
        <span className="kpi-value">{value}</span>
        {(sub || change != null) && (
          <span className="kpi-sub">
            {change != null && (
              <span className={up ? "kpi-up" : down ? "kpi-down" : "kpi-flat"}>
                {up ? "▲" : down ? "▼" : "—"} {Math.abs(change ?? 0).toFixed(1)}%
              </span>
            )}
            {sub && <span style={{ marginLeft: change != null ? 6 : 0 }}>{sub}</span>}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Line Chart (SVG) ─────────────────────────────────────────────
function LineChart({ data, field }: { data: TrendPoint[]; field: "count" | "revenue" }) {
  if (!data.length) return <div className="chart-empty">Chưa có dữ liệu</div>;

  const W = 600, H = 140, PAD = 10;
  const values = data.map((d) => d[field] as number);
  const max = Math.max(...values, 1);
  const min = 0;
  const range = max - min;

  const pts = data.map((d, i) => {
    const x = PAD + (i / (data.length - 1 || 1)) * (W - PAD * 2);
    const y = H - PAD - ((d[field] as number - min) / range) * (H - PAD * 2);
    return [x, y] as [number, number];
  });

  const polyline = pts.map((p) => p.join(",")).join(" ");
  const area = `M${pts[0][0]},${H - PAD} ` +
    pts.map((p) => `L${p[0]},${p[1]}`).join(" ") +
    ` L${pts[pts.length - 1][0]},${H - PAD} Z`;

  // X-axis labels: show every 5th day
  const labels = data
    .filter((_, i) => i % 5 === 0 || i === data.length - 1)
    .map((d) => ({
      label: d.date.slice(5), // MM-DD
      x: PAD + (data.indexOf(d) / (data.length - 1 || 1)) * (W - PAD * 2),
    }));

  return (
    <svg viewBox={`0 0 ${W} ${H + 20}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1b5e20" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#1b5e20" stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <path d={area} fill="url(#lineGrad)" />
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map((f) => {
        const y = H - PAD - f * (H - PAD * 2);
        return (
          <line key={f} x1={PAD} y1={y} x2={W - PAD} y2={y}
            stroke="#e4dfd2" strokeWidth="1" strokeDasharray="4,4" />
        );
      })}
      {/* Line */}
      <polyline points={polyline} fill="none" stroke="#1b5e20" strokeWidth="2.5"
        strokeLinejoin="round" strokeLinecap="round" />
      {/* Dots on non-zero points */}
      {pts.map(([x, y], i) =>
        values[i] > 0 ? (
          <circle key={i} cx={x} cy={y} r="3" fill="#1b5e20" />
        ) : null
      )}
      {/* X-axis labels */}
      {labels.map(({ label, x }) => (
        <text key={label} x={x} y={H + 16} textAnchor="middle"
          fontSize="10" fill="#8d9381">{label}</text>
      ))}
    </svg>
  );
}

// ─── Donut Chart (SVG) ────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  draft: "#8d9381",
  confirmed: "#1b5e20",
  shipping: "#c9a227",
  completed: "#2e7d32",
  cancelled: "#a4161a",
  return_requested: "#b45309",
  returned: "#78716c",
};

function DonutChart({ data }: { data: StatusPoint[] }) {
  if (!data.length) return <div className="chart-empty">Chưa có dữ liệu</div>;
  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) return <div className="chart-empty">Chưa có đơn hàng</div>;

  const R = 60, cx = 80, cy = 80, strokeW = 26;
  const circ = 2 * Math.PI * R;

  let offset = 0;
  const slices = data.map((d) => {
    const pct = d.count / total;
    const dash = circ * pct;
    const gap = circ - dash;
    const result = { ...d, pct, dash, gap, offset };
    offset += dash;
    return result;
  });

  return (
    <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
      <svg viewBox="0 0 160 160" style={{ width: 140, height: 140, flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#f3f0e7" strokeWidth={strokeW} />
        {slices.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={R} fill="none"
            stroke={STATUS_COLORS[s.status] ?? "#999"}
            strokeWidth={strokeW}
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={-s.offset + circ / 4}
            style={{ transform: "rotate(-90deg)", transformOrigin: `${cx}px ${cy}px` }}
          />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="20" fontWeight="700" fill="#1c2419">
          {total}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill="#8d9381">
          đơn
        </text>
      </svg>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        {slices.map((s) => {
          const statusInfo = ORDER_STATUS_MAP[s.status as keyof typeof ORDER_STATUS_MAP];
          return (
            <div key={s.status} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <span style={{
                width: 10, height: 10, borderRadius: 3, flexShrink: 0,
                background: STATUS_COLORS[s.status] ?? "#999"
              }} />
              <span style={{ flex: 1, color: "#5b6354" }}>
                {statusInfo?.label ?? s.status}
              </span>
              <span style={{ fontWeight: 600 }}>{s.count}</span>
              <span style={{ color: "#8d9381", minWidth: 38, textAlign: "right" }}>
                {(s.pct * 100).toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Bar Chart Horizontal (Channel) ──────────────────────────────
const CHANNEL_COLORS: Record<string, string> = {
  retail: "#2e7d32",
  tier_1: "#1b5e20",
  tier_2: "#c9a227",
  tier_3: "#b45309",
  wholesale: "#78716c",
};
const CHANNEL_LABELS: Record<string, string> = {
  retail: "Bán lẻ",
  tier_1: "Đại lý Tier 1",
  tier_2: "Đại lý Tier 2",
  tier_3: "Đại lý Tier 3",
  wholesale: "Bán sỉ",
};

function ChannelBars({ data }: { data: ChannelPoint[] }) {
  if (!data.length) return <div className="chart-empty">Chưa có dữ liệu</div>;
  const maxRev = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {data.map((d) => (
        <div key={d.channel} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: "#5b6354", minWidth: 100 }}>
            {CHANNEL_LABELS[d.channel] ?? d.channel}
          </span>
          <div style={{ flex: 1, background: "#f3f0e7", borderRadius: 4, height: 18, overflow: "hidden" }}>
            <div style={{
              width: `${(d.revenue / maxRev) * 100}%`,
              height: "100%",
              background: CHANNEL_COLORS[d.channel] ?? "#1b5e20",
              borderRadius: 4,
              transition: "width 0.6s ease",
            }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, minWidth: 80, textAlign: "right" }}>
            {fmtShort(d.revenue)} ₫
          </span>
          <span style={{ fontSize: 11, color: "#8d9381", minWidth: 48, textAlign: "right" }}>
            {d.order_count} đơn
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────
function Skeleton({ h = 120 }: { h?: number }) {
  return (
    <div className="skeleton" style={{ height: h, borderRadius: 12 }} />
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────
export default function Dashboard() {
  const user = useAuth((s) => s.user)!;

  const hour = new Date().getHours();
  const greet = hour < 11 ? "Chào buổi sáng" : hour < 18 ? "Chào buổi chiều" : "Chào buổi tối";
  const firstName = user.full_name.split(" ").slice(-1)[0];

  const { data: overview, isLoading: ovLoading } = useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: analyticsApi.overview,
  });
  const { data: trend = [], isLoading: trendLoading } = useQuery({
    queryKey: ["analytics", "trend"],
    queryFn: analyticsApi.trend,
  });
  const { data: byStatus = [] } = useQuery({
    queryKey: ["analytics", "by-status"],
    queryFn: analyticsApi.byStatus,
  });
  const { data: byChannel = [] } = useQuery({
    queryKey: ["analytics", "by-channel"],
    queryFn: analyticsApi.byChannel,
  });
  const { data: topProducts = [] } = useQuery({
    queryKey: ["analytics", "top-products"],
    queryFn: analyticsApi.topProducts,
  });
  const { data: dealerDebts = [] } = useQuery({
    queryKey: ["analytics", "dealer-summary"],
    queryFn: analyticsApi.dealerSummary,
    enabled: user.permissions.includes("dealer.read"),
  });
  const { data: recentOrders = [] } = useQuery({
    queryKey: ["analytics", "recent-orders"],
    queryFn: analyticsApi.recentOrders,
  });

  const ov = overview;

  return (
    <div className="page-container">
      {/* ── Greeting ── */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">{greet}, {firstName} 👋</h1>
          <p className="page-subtitle">
            Đây là tổng quan kinh doanh của Sâm Bà Đen hôm nay.
            Dữ liệu được cập nhật theo thời gian thực.
          </p>
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", alignSelf: "center" }}>
          {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
        </div>
      </div>

      {/* ── KPI Cards Row ── */}
      {ovLoading ? (
        <div className="kpi-grid">
          {[...Array(6)].map((_, i) => <Skeleton key={i} h={90} />)}
        </div>
      ) : (
        <div className="kpi-grid">
          <KpiCard
            icon="💰"
            label="Doanh thu tháng này"
            value={fmtVnd(ov?.revenue.this_month)}
            change={ov?.revenue.change_pct}
            sub={`Tháng trước: ${fmtVnd(ov?.revenue.last_month)}`}
            color="#1b5e20"
          />
          <KpiCard
            icon="📦"
            label="Đơn hàng tháng này"
            value={ov?.orders.this_month ?? 0}
            change={ov?.orders.change_pct}
            sub={`Tháng trước: ${ov?.orders.last_month ?? 0} đơn`}
            color="#c9a227"
          />
          <KpiCard
            icon="👤"
            label="Tổng khách hàng"
            value={ov?.customers.total ?? 0}
            sub={`${ov?.customers.new_leads ?? 0} lead mới chưa xử lý`}
            color="#1e40af"
          />
          <KpiCard
            icon="🤝"
            label="Đại lý đang hoạt động"
            value={ov?.dealers.active ?? 0}
            sub="đại lý B2B"
            color="#7c3aed"
          />
          <KpiCard
            icon="⚠️"
            label="Sản phẩm gần hết hàng"
            value={ov?.inventory.low_stock_count ?? 0}
            sub="cần nhập thêm"
            color={
              (ov?.inventory.low_stock_count ?? 0) > 0 ? "#a4161a" : "#1b5e20"
            }
          />
          <KpiCard
            icon="🔲"
            label="Lô QR đang hoạt động"
            value={ov?.qrcode.active_batches ?? 0}
            sub="lô hàng đang phát hành"
            color="#0f766e"
          />
        </div>
      )}

      {/* ── Charts Row 1: Trend + Status ── */}
      <div className="dash-row-2">
        <div className="card dash-chart-card" style={{ flex: 2 }}>
          <div className="dash-chart-head">
            <div>
              <h3 className="dash-section-title">Xu hướng đơn hàng 30 ngày</h3>
              <p className="dash-section-sub">Số lượng đơn hàng tạo mỗi ngày</p>
            </div>
            <div className="dash-chart-toggle">
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Tổng: {trend.reduce((s, d) => s + d.count, 0)} đơn
              </span>
            </div>
          </div>
          {trendLoading ? <Skeleton h={160} /> : <LineChart data={trend} field="count" />}
        </div>

        <div className="card dash-chart-card" style={{ flex: 1, minWidth: 280 }}>
          <div className="dash-chart-head">
            <div>
              <h3 className="dash-section-title">Phân bổ trạng thái đơn</h3>
              <p className="dash-section-sub">Tất cả thời gian</p>
            </div>
          </div>
          <DonutChart data={byStatus} />
        </div>
      </div>

      {/* ── Charts Row 2: Channel Bars + Top Products ── */}
      <div className="dash-row-2">
        <div className="card dash-chart-card" style={{ flex: 1 }}>
          <div className="dash-chart-head">
            <div>
              <h3 className="dash-section-title">Doanh thu theo kênh bán</h3>
              <p className="dash-section-sub">Đơn đã xác nhận / đang giao / hoàn thành</p>
            </div>
          </div>
          <ChannelBars data={byChannel} />
        </div>

        <div className="card dash-chart-card" style={{ flex: 1 }}>
          <div className="dash-chart-head">
            <div>
              <h3 className="dash-section-title">Top 5 sản phẩm bán chạy</h3>
              <p className="dash-section-sub">Xếp theo tổng doanh thu</p>
            </div>
          </div>
          {topProducts.length === 0 ? (
            <div className="chart-empty">Chưa có đơn hàng hoàn thành</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {topProducts.map((p, i) => {
                const maxRev = topProducts[0]?.total_revenue || 1;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: "50%",
                      background: i === 0 ? "#c9a227" : i === 1 ? "#8d9381" : i === 2 ? "#b45309" : "#e4dfd2",
                      color: i < 3 ? "#fff" : "#5b6354",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700, flexShrink: 0,
                    }}>
                      {i + 1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13, fontWeight: 600,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {p.product_name}
                      </div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}>
                        <div style={{
                          flex: 1, height: 5, background: "#f3f0e7", borderRadius: 3, overflow: "hidden"
                        }}>
                          <div style={{
                            width: `${(p.total_revenue / maxRev) * 100}%`,
                            height: "100%", background: "#1b5e20", borderRadius: 3,
                          }} />
                        </div>
                        <span style={{ fontSize: 11, color: "#8d9381" }}>{p.total_qty} cái</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, textAlign: "right" }}>
                      {fmtVnd(p.total_revenue)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 3: Recent Orders + Dealer Debts ── */}
      <div className="dash-row-2" style={{ alignItems: "flex-start" }}>

        {/* Recent Orders */}
        <div className="card dash-chart-card" style={{ flex: 3 }}>
          <div className="dash-chart-head">
            <div>
              <h3 className="dash-section-title">10 Đơn hàng mới nhất</h3>
              <p className="dash-section-sub">Cập nhật theo thời gian thực</p>
            </div>
            <a href="/orders" style={{ fontSize: 12, color: "var(--green-600)", fontWeight: 600 }}>
              Xem tất cả →
            </a>
          </div>
          {recentOrders.length === 0 ? (
            <div className="chart-empty">Chưa có đơn hàng nào</div>
          ) : (
            <div className="table-responsive">
              <table className="table" style={{ fontSize: 13 }}>
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Kênh</th>
                    <th>Trạng thái</th>
                    <th style={{ textAlign: "right" }}>Tổng tiền</th>
                    <th>Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => {
                    const sm = ORDER_STATUS_MAP[o.status as keyof typeof ORDER_STATUS_MAP];
                    return (
                      <tr key={o.id}>
                        <td style={{ fontFamily: "monospace", fontWeight: 600 }}>{o.order_no}</td>
                        <td style={{ color: "var(--text-muted)", fontSize: 12 }}>
                          {CHANNEL_LABELS[o.channel] ?? o.channel}
                        </td>
                        <td>
                          {sm ? (
                            <span className={`status-chip ${sm.cls}`} style={{ fontSize: 11 }}>
                              {sm.icon} {sm.label}
                            </span>
                          ) : o.status}
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>
                          {fmtVnd(o.total_amount)}
                        </td>
                        <td style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          {fmtDate(o.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Dealer Debts */}
        {user.permissions.includes("dealer.read") && (
          <div className="card dash-chart-card" style={{ flex: 2 }}>
            <div className="dash-chart-head">
              <div>
                <h3 className="dash-section-title">Công nợ đại lý</h3>
                <p className="dash-section-sub">Top 10 đại lý theo số dư</p>
              </div>
            </div>
            {dealerDebts.length === 0 ? (
              <div className="chart-empty">Không có công nợ</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {dealerDebts.map((d) => (
                  <div key={d.dealer_id} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 0", borderBottom: "1px solid var(--border)",
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{d.company_name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {d.tier.toUpperCase()}
                      </div>
                    </div>
                    <span style={{
                      fontWeight: 700, fontSize: 14,
                      color: d.balance > 0 ? "var(--err)" : "var(--ok)",
                    }}>
                      {fmtVnd(d.balance)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
