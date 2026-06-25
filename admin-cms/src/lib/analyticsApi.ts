import { api } from "./api";

export interface OverviewData {
  revenue: { this_month: number; last_month: number; change_pct: number | null };
  orders: { this_month: number; last_month: number; change_pct: number | null };
  customers: { total: number; new_leads: number };
  dealers: { active: number };
  inventory: { low_stock_count: number };
  qrcode: { active_batches: number };
}

export interface TrendPoint {
  date: string;
  count: number;
  revenue: number;
}

export interface StatusPoint {
  status: string;
  count: number;
}

export interface ChannelPoint {
  channel: string;
  order_count: number;
  revenue: number;
}

export interface TopProduct {
  product_name: string;
  sku: string | null;
  total_qty: number;
  total_revenue: number;
}

export interface DealerDebt {
  dealer_id: string;
  company_name: string;
  tier: string;
  balance: number;
}

export interface RecentOrder {
  id: string;
  order_no: string;
  status: string;
  channel: string;
  total_amount: number;
  created_at: string;
}

async function get<T>(path: string): Promise<T> {
  const r = await api.get<{ data: T }>(path);
  return r.data.data;
}

export const analyticsApi = {
  overview: () => get<OverviewData>("/admin/analytics/overview"),
  trend: () => get<TrendPoint[]>("/admin/analytics/orders-trend"),
  byStatus: () => get<StatusPoint[]>("/admin/analytics/orders-by-status"),
  byChannel: () => get<ChannelPoint[]>("/admin/analytics/orders-by-channel"),
  topProducts: () => get<TopProduct[]>("/admin/analytics/top-products"),
  dealerSummary: () => get<DealerDebt[]>("/admin/analytics/dealer-summary"),
  recentOrders: () => get<RecentOrder[]>("/admin/analytics/recent-orders"),
};
