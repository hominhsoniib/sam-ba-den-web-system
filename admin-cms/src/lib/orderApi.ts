import { api } from "./api";
import type { ApiResponse } from "./types";

// ── Types ────────────────────────────────────────────────────────
export type OrderStatus =
  | "draft"
  | "confirmed"
  | "shipping"
  | "completed"
  | "cancelled"
  | "return_requested"
  | "returned";

export interface OrderItemIn {
  product_id: string;
  qty: number;
  unit_price?: number;
  discount_pct?: number;
}

export interface OrderItemOut {
  id: string;
  product_id: string;
  product_name: string;
  sku?: string | null;
  unit_price: number | string;
  qty: number;
  discount_pct: number | string;
  line_total: number | string;
}

export interface OrderStatusLogOut {
  id: string;
  from_status?: string | null;
  to_status: string;
  note?: string | null;
  changed_by: string;
  created_at: string;
}

export interface OrderListItem {
  id: string;
  order_no: string;
  status: OrderStatus;
  channel: string;
  customer_id?: string | null;
  dealer_id?: string | null;
  buyer_name?: string | null;
  subtotal: number | string;
  discount_amount: number | string;
  shipping_fee: number | string;
  total_amount: number | string;
  warehouse: string;
  created_at: string;
  updated_at: string;
}

export interface OrderDetail extends OrderListItem {
  shipping_name?: string | null;
  shipping_phone?: string | null;
  shipping_address?: string | null;
  shipping_province?: string | null;
  note?: string | null;
  cancel_reason?: string | null;
  items: OrderItemOut[];
  status_logs: OrderStatusLogOut[];
}

export interface OrderCreatePayload {
  customer_id?: string;
  dealer_id?: string;
  channel?: string;
  warehouse?: string;
  shipping_name?: string;
  shipping_phone?: string;
  shipping_address?: string;
  shipping_province?: string;
  shipping_fee?: number;
  discount_amount?: number;
  note?: string;
  items: OrderItemIn[];
}

export interface OrderUpdatePayload {
  shipping_name?: string;
  shipping_phone?: string;
  shipping_address?: string;
  shipping_province?: string;
  shipping_fee?: number;
  discount_amount?: number;
  note?: string;
}

// ── API ─────────────────────────────────────────────────────────
export const orderApi = {
  async list(params?: {
    status?: string;
    dealer_id?: string;
    customer_id?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ data: OrderListItem[]; total: number }> {
    const r = await api.get<ApiResponse<OrderListItem[]>>("/admin/orders", {
      params,
    });
    return {
      data: r.data.data ?? [],
      total: (r.data.meta?.total as number) ?? 0,
    };
  },

  async get(id: string): Promise<OrderDetail> {
    const r = await api.get<ApiResponse<OrderDetail>>(`/admin/orders/${id}`);
    return r.data.data!;
  },

  async create(payload: OrderCreatePayload): Promise<OrderDetail> {
    const r = await api.post<ApiResponse<OrderDetail>>("/admin/orders", payload);
    return r.data.data!;
  },

  async update(id: string, payload: OrderUpdatePayload): Promise<OrderDetail> {
    const r = await api.put<ApiResponse<OrderDetail>>(`/admin/orders/${id}`, payload);
    return r.data.data!;
  },

  async changeStatus(
    id: string,
    to_status: string,
    note?: string
  ): Promise<OrderDetail> {
    const r = await api.post<ApiResponse<OrderDetail>>(
      `/admin/orders/${id}/status`,
      { to_status, note }
    );
    return r.data.data!;
  },
};

// ── Helpers ──────────────────────────────────────────────────────
export function fmtVnd(v?: number | string | null): string {
  if (v == null || v === "") return "—";
  const n = typeof v === "string" ? parseFloat(v) : v;
  return n.toLocaleString("vi-VN") + " ₫";
}

export const ORDER_STATUS_MAP: Record<
  OrderStatus,
  { label: string; cls: string; icon: string; next: OrderStatus[] }
> = {
  draft: {
    label: "Nháp",
    cls: "st-draft",
    icon: "📝",
    next: ["confirmed", "cancelled"],
  },
  confirmed: {
    label: "Đã xác nhận",
    cls: "st-active",
    icon: "✅",
    next: ["shipping", "cancelled"],
  },
  shipping: {
    label: "Đang giao",
    cls: "st-pending",
    icon: "🚚",
    next: ["completed", "return_requested"],
  },
  completed: {
    label: "Hoàn thành",
    cls: "st-published",
    icon: "🎉",
    next: ["return_requested"],
  },
  cancelled: { label: "Đã huỷ", cls: "st-suspended", icon: "❌", next: [] },
  return_requested: {
    label: "Yêu cầu trả",
    cls: "st-archived",
    icon: "↩️",
    next: ["returned", "completed"],
  },
  returned: { label: "Đã trả hàng", cls: "st-archived", icon: "📦", next: [] },
};

export const CHANNELS = [
  { value: "retail", label: "Bán lẻ (Retail)" },
  { value: "tier_1", label: "Đại lý Tier 1" },
  { value: "tier_2", label: "Đại lý Tier 2" },
  { value: "tier_3", label: "Đại lý Tier 3" },
  { value: "wholesale", label: "Bán sỉ" },
];

export const WAREHOUSES = ["main", "hanoi", "hcm", "danang"];
