import { api } from "./api";
import type {
  ApiResponse,
  ProductCategory,
  ProductDetail,
  ProductInventory,
  ProductListItem,
  ProductPrice,
} from "./types";

// ---- Payload types ----
export interface ProductImageIn {
  image_url: string;
  alt_text?: string;
  is_primary?: boolean;
  sort_order?: number;
}

export interface ProductPriceIn {
  channel: string;  // retail | tier_1 | tier_2 | tier_3 | wholesale
  price: number;
  is_active?: boolean;
  note?: string;
}

export interface ProductInventoryIn {
  warehouse?: string;
  qty_on_hand?: number;
  qty_reserved?: number;
  low_stock_threshold?: number;
}

export interface InventoryAdjustIn {
  warehouse?: string;
  delta: number;      // dương = nhập, âm = xuất
  reason?: string;
}

export interface ProductPayload {
  name: string;
  category_id: string;
  sku?: string;
  barcode?: string;
  short_desc?: string;
  description?: string;
  reference_price?: number;
  unit?: string;
  packaging_info?: string;
  weight_g?: number;
  usage_info?: string;
  disclaimer?: string;
  seo_title?: string;
  seo_description?: string;
  og_image_url?: string;
  status?: string;
  sort_order?: number;
  images?: ProductImageIn[];
  prices?: ProductPriceIn[];
  inventory?: ProductInventoryIn[];
}

export const productApi = {
  // ---- Categories ----
  async listCategories(): Promise<ProductCategory[]> {
    const r = await api.get<ApiResponse<ProductCategory[]>>("/admin/products/categories");
    return r.data.data ?? [];
  },
  async createCategory(name: string): Promise<ProductCategory> {
    const r = await api.post<ApiResponse<ProductCategory>>("/admin/products/categories", { name });
    return r.data.data!;
  },

  // ---- Products CRUD ----
  async list(status?: string): Promise<ProductListItem[]> {
    const r = await api.get<ApiResponse<ProductListItem[]>>("/admin/products", {
      params: status ? { status } : {},
    });
    return r.data.data ?? [];
  },
  async get(id: string): Promise<ProductDetail> {
    const r = await api.get<ApiResponse<ProductDetail>>(`/admin/products/${id}`);
    return r.data.data!;
  },
  async create(payload: ProductPayload): Promise<ProductDetail> {
    const r = await api.post<ApiResponse<ProductDetail>>("/admin/products", payload);
    return r.data.data!;
  },
  async update(id: string, payload: Partial<ProductPayload>): Promise<ProductDetail> {
    const r = await api.put<ApiResponse<ProductDetail>>(`/admin/products/${id}`, payload);
    return r.data.data!;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/admin/products/${id}`);
  },

  // ---- Prices ----
  async getPrices(id: string): Promise<ProductPrice[]> {
    const r = await api.get<ApiResponse<ProductPrice[]>>(`/admin/products/${id}/prices`);
    return r.data.data ?? [];
  },
  async upsertPrices(id: string, prices: ProductPriceIn[]): Promise<ProductDetail> {
    const r = await api.post<ApiResponse<ProductDetail>>(`/admin/products/${id}/prices`, prices);
    return r.data.data!;
  },

  // ---- Inventory ----
  async getInventory(id: string): Promise<ProductInventory[]> {
    const r = await api.get<ApiResponse<ProductInventory[]>>(`/admin/products/${id}/inventory`);
    return r.data.data ?? [];
  },
  async adjustInventory(id: string, payload: InventoryAdjustIn): Promise<ProductDetail> {
    const r = await api.post<ApiResponse<ProductDetail>>(
      `/admin/products/${id}/inventory/adjust`,
      payload,
    );
    return r.data.data!;
  },
};

// ---- Helpers ----
export function fmtVnd(v?: number | string | null): string {
  if (v == null || v === "") return "—";
  const n = typeof v === "string" ? parseFloat(v) : v;
  return n.toLocaleString("vi-VN") + " ₫";
}

export const PRICE_CHANNELS: { value: string; label: string }[] = [
  { value: "retail", label: "Bán lẻ" },
  { value: "tier_1", label: "Đại lý Tier 1" },
  { value: "tier_2", label: "Đại lý Tier 2" },
  { value: "tier_3", label: "Đại lý Tier 3" },
  { value: "wholesale", label: "Bán sỉ" },
];

export const PROD_STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: "Đang bán", cls: "st-published" },
  hidden: { label: "Đã ẩn", cls: "st-archived" },
  discontinued: { label: "Ngừng KD", cls: "st-draft" },
};

export const WAREHOUSES = ["main", "hanoi", "hcm", "danang"];
