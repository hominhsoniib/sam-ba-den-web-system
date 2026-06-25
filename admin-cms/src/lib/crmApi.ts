import { api } from "./api";
import type {
  ApiResponse,
  Lead,
  Customer,
  Interaction,
  Opportunity,
  LeadConvertResult,
  CustomerJourney,
} from "./types";

export interface InteractionPayload {
  entity_type: "lead" | "customer" | "opportunity";
  entity_id: string;
  type: "call" | "note" | "email" | "sms";
  content: string;
  channel?: string | null;
}

export interface OpportunityPayload {
  customer_id: string;
  title: string;
  stage: "new" | "qualified" | "proposal" | "won" | "lost";
  est_value?: number;
  owner_id?: string | null;
  expected_close_date?: string | null;
}

export interface UserMin {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
}

export const crmApi = {
  // Leads
  async listLeads(params?: { status?: string; owner_id?: string; page?: number; page_size?: number }) {
    const r = await api.get<ApiResponse<Lead[]>>("/admin/crm/leads", { params });
    return {
      items: r.data.data ?? [],
      total: (r.data.meta?.total as number) ?? 0,
    };
  },
  async createLead(payload: Partial<Lead>) {
    const r = await api.post<ApiResponse<Lead>>("/admin/crm/leads", payload);
    return r.data.data!;
  },
  async updateLead(id: string, payload: Partial<Lead>) {
    const r = await api.put<ApiResponse<Lead>>(`/admin/crm/leads/${id}`, payload);
    return r.data.data!;
  },
  async convertLead(id: string) {
    const r = await api.post<ApiResponse<LeadConvertResult>>(`/admin/crm/leads/${id}/convert`);
    return r.data.data!;
  },

  // Customers
  async listCustomers(params?: { owner_id?: string; page?: number; page_size?: number }) {
    const r = await api.get<ApiResponse<Customer[]>>("/admin/crm/customers", { params });
    return {
      items: r.data.data ?? [],
      total: (r.data.meta?.total as number) ?? 0,
    };
  },
  async createCustomer(payload: Partial<Customer>) {
    const r = await api.post<ApiResponse<Customer>>("/admin/crm/customers", payload);
    return r.data.data!;
  },
  async updateCustomer(id: string, payload: Partial<Customer>) {
    const r = await api.put<ApiResponse<Customer>>(`/admin/crm/customers/${id}`, payload);
    return r.data.data!;
  },
  async getCustomerJourney(id: string) {
    const r = await api.get<ApiResponse<CustomerJourney>>(`/admin/crm/customers/${id}/journey`);
    return r.data.data!;
  },

  // Interactions
  async createInteraction(payload: InteractionPayload) {
    const r = await api.post<ApiResponse<Interaction>>("/admin/crm/interactions", payload);
    return r.data.data!;
  },

  // Opportunities
  async createOpportunity(payload: OpportunityPayload) {
    const r = await api.post<ApiResponse<Opportunity>>("/admin/crm/opportunities", payload);
    return r.data.data!;
  },
  async updateOpportunity(id: string, payload: Partial<Opportunity>) {
    const r = await api.put<ApiResponse<Opportunity>>(`/admin/crm/opportunities/${id}`, payload);
    return r.data.data!;
  },

  // Users for assignment
  async listUsers() {
    const r = await api.get<ApiResponse<UserMin[]>>("/admin/users");
    return r.data.data ?? [];
  },
};

export const LEAD_STATUS: Record<string, { label: string; cls: string }> = {
  new: { label: "Mới", cls: "st-draft" },
  contacted: { label: "Đã liên hệ", cls: "st-review" },
  qualified: { label: "Tiềm năng", cls: "st-published" },
  converted: { label: "Đã chuyển đổi", cls: "st-published" },
  lost: { label: "Thất bại", cls: "st-archived" },
};

export const INTERACTION_TYPE: Record<string, { label: string; icon: string }> = {
  call: { label: "Cuộc gọi", icon: "📞" },
  note: { label: "Ghi chú", icon: "📝" },
  email: { label: "Email", icon: "✉️" },
  sms: { label: "SMS", icon: "💬" },
};

export const OPP_STAGE: Record<string, { label: string; cls: string }> = {
  new: { label: "Mới", cls: "st-draft" },
  qualified: { label: "Đánh giá", cls: "st-review" },
  proposal: { label: "Báo giá", cls: "st-review" },
  won: { label: "Thành công", cls: "st-published" },
  lost: { label: "Thất bại", cls: "st-archived" },
};
