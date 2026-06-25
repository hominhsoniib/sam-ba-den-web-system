import { api } from "./api";
import type {
  ApiResponse,
  Dealer,
  DealerDiscount,
  DealerLedger,
  DealerDebtSummary,
} from "./types";

export interface ContactSubmissionMin {
  id: string;
  full_name: string;
  phone: string;
  email?: string | null;
  source: string;
  subject?: string | null;
  message?: string | null;
  area?: string | null;
  status: "new" | "in_review" | "replied" | "closed";
  admin_note?: string | null;
  replied_at?: string | null;
  created_at: string;
}

export interface DealerApprovePayload {
  code: string;
  tier: "tier_1" | "tier_2";
  region: string;
  credit_limit: number;
  payment_term_days: number;
}

export const dealerApi = {
  // Dealers CRUD
  async list(params?: { region?: string; status?: string; page?: number; page_size?: number }) {
    const r = await api.get<ApiResponse<Dealer[]>>("/admin/dealers", { params });
    return {
      items: r.data.data ?? [],
      total: (r.data.meta?.total as number) ?? 0,
    };
  },
  async get(id: string) {
    const r = await api.get<ApiResponse<Dealer>>(`/admin/dealers/${id}`);
    return r.data.data!;
  },
  async create(payload: Partial<Dealer>) {
    const r = await api.post<ApiResponse<Dealer>>("/admin/dealers", payload);
    return r.data.data!;
  },
  async update(id: string, payload: Partial<Dealer>) {
    const r = await api.put<ApiResponse<Dealer>>(`/admin/dealers/${id}`, payload);
    return r.data.data!;
  },

  // Approvals & Registrations
  async listRegistrations(params?: { status?: string; page?: number; page_size?: number }) {
    const r = await api.get<ApiResponse<ContactSubmissionMin[]>>("/admin/contacts", {
      params: { ...params, source: "dealer" },
    });
    return {
      items: r.data.data ?? [],
      total: (r.data.meta?.total as number) ?? 0,
    };
  },
  async approve(contactId: string, payload: DealerApprovePayload) {
    const r = await api.post<ApiResponse<Dealer>>(`/admin/dealers/${contactId}/approve`, payload);
    return r.data.data!;
  },

  // Ledger & Debt
  async getLedgerSummary(id: string) {
    const r = await api.get<ApiResponse<DealerDebtSummary>>(`/admin/dealers/${id}/ledger`);
    return r.data.data!;
  },
  async listLedgerEntries(id: string) {
    const r = await api.get<ApiResponse<DealerLedger[]>>(`/admin/dealers/${id}/ledger/entries`);
    return r.data.data ?? [];
  },
  async recordPayment(id: string, payload: { amount: number; note?: string; ref_id?: string }) {
    const r = await api.post<ApiResponse<DealerLedger>>(`/admin/dealers/${id}/ledger/payment`, payload);
    return r.data.data!;
  },

  // Discounts
  async listDiscounts(id: string) {
    const r = await api.get<ApiResponse<DealerDiscount[]>>(`/admin/dealers/${id}/discounts`);
    return r.data.data ?? [];
  },
  async createDiscount(id: string, payload: Partial<DealerDiscount>) {
    const r = await api.post<ApiResponse<DealerDiscount>>(`/admin/dealers/${id}/discounts`, payload);
    return r.data.data!;
  },
};

export const DEALER_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "Chờ duyệt", cls: "st-draft" },
  active: { label: "Đang hoạt động", cls: "st-published" },
  suspended: { label: "Đang khóa", cls: "st-archived" },
};

export const REG_STATUS: Record<string, { label: string; cls: string }> = {
  new: { label: "Mới gửi", cls: "st-draft" },
  in_review: { label: "Đang xem xét", cls: "st-review" },
  replied: { label: "Đã phản hồi", cls: "st-published" },
  closed: { label: "Đã xử lý (Duyệt)", cls: "st-published" },
};

export const LEDGER_REF_TYPE: Record<string, string> = {
  order: "Đơn hàng",
  payment: "Thanh toán nợ",
  adjustment: "Điều chỉnh công nợ",
  return: "Trả hàng hoàn tiền",
};
