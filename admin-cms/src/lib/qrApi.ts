import { api } from "./api";
import type { ApiResponse } from "./types";

export interface ProductBatchOut {
  id: string;
  batch_no: string;
  product_id: string;
  product_name?: string | null;
  sku?: string | null;
  manufacture_date?: string | null;
  expiry_date?: string | null;
  quantity: number;
  warehouse: string;
  supplier_name?: string | null;
  origin_region?: string | null;
  notes?: string | null;
  status: string;
  qr_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface QRCodeOut {
  id: string;
  batch_id: string;
  token: string;
  label?: string | null;
  status: string;
  scan_count: number;
  single_use: boolean;
  created_at: string;
}

export interface ProductBatchCreatePayload {
  batch_no?: string;
  product_id: string;
  manufacture_date?: string;
  expiry_date?: string;
  quantity: number;
  warehouse?: string;
  supplier_name?: string;
  origin_region?: string;
  notes?: string;
}

export interface ProductBatchUpdatePayload {
  manufacture_date?: string;
  expiry_date?: string;
  warehouse?: string;
  supplier_name?: string;
  origin_region?: string;
  notes?: string;
  status?: string;
}

export const qrApi = {
  async listBatches(params?: {
    product_id?: string;
    status?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ data: ProductBatchOut[]; total: number }> {
    const r = await api.get<ApiResponse<ProductBatchOut[]>>("/admin/qrcode/batches", {
      params,
    });
    return {
      data: r.data.data ?? [],
      total: (r.data.meta?.total as number) ?? 0,
    };
  },

  async getBatch(id: string): Promise<ProductBatchOut> {
    const r = await api.get<ApiResponse<ProductBatchOut>>(`/admin/qrcode/batches/${id}`);
    return r.data.data!;
  },

  async createBatch(payload: ProductBatchCreatePayload): Promise<ProductBatchOut> {
    const r = await api.post<ApiResponse<ProductBatchOut>>("/admin/qrcode/batches", payload);
    return r.data.data!;
  },

  async updateBatch(id: string, payload: ProductBatchUpdatePayload): Promise<ProductBatchOut> {
    const r = await api.put<ApiResponse<ProductBatchOut>>(`/admin/qrcode/batches/${id}`, payload);
    return r.data.data!;
  },

  async listQRCodes(
    batchId: string,
    params?: { page?: number; page_size?: number }
  ): Promise<{ data: QRCodeOut[]; total: number }> {
    const r = await api.get<ApiResponse<QRCodeOut[]>>(
      `/admin/qrcode/batches/${batchId}/qrcodes`,
      { params }
    );
    return {
      data: r.data.data ?? [],
      total: (r.data.meta?.total as number) ?? 0,
    };
  },

  async revokeBatch(id: string): Promise<ProductBatchOut> {
    const r = await api.post<ApiResponse<ProductBatchOut>>(`/admin/qrcode/batches/${id}/revoke`);
    return r.data.data!;
  },

  async revokeQRCode(qrId: string): Promise<QRCodeOut> {
    const r = await api.post<ApiResponse<QRCodeOut>>(`/admin/qrcode/qrcodes/${qrId}/revoke`);
    return r.data.data!;
  },
};
