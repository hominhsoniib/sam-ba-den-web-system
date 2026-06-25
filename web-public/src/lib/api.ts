import axios from "axios";

// Support dynamic URL via query param or localStorage for easier mobile testing
const urlParams = new URLSearchParams(window.location.search);
const apiParam = urlParams.get("api");
if (apiParam) {
  localStorage.setItem("VITE_API_BASE_URL", apiParam);
}

const savedBaseUrl = localStorage.getItem("VITE_API_BASE_URL");

const BASE_URL =
  savedBaseUrl ||
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  (window.location.hostname.includes("vercel.app")
    ? "https://e9b532d623ede0.lhr.life/api/v1"
    : `${window.location.protocol}//${window.location.hostname}:8000/api/v1`);

export const api = axios.create({ baseURL: BASE_URL });

export interface ApiResponse<T> {
  data: T | null;
  meta: Record<string, unknown>;
  error: { code: string; message: string } | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface PostListItem {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  cover_image_url?: string | null;
  status: string;
  category: Category;
  published_at?: string | null;
  view_count: number;
}

export interface SeoMeta {
  title: string;
  description?: string | null;
  keywords?: string | null;
  canonical_url?: string | null;
  robots: string;
  og_title?: string | null;
  og_description?: string | null;
  og_image?: string | null;
}

export interface PostDetail {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  cover_image_url?: string | null;
  category: Category;
  author_name: string;
  tags: Tag[];
  published_at?: string | null;
  disclaimer?: string | null;
  seo: SeoMeta;
  json_ld: object[];
  related: PostListItem[];
}

export const blog = {
  async list(category?: string, page = 1) {
    const r = await api.get<ApiResponse<PostListItem[]>>("/public/posts", {
      params: { "danh-muc": category, page },
    });
    return { items: r.data.data ?? [], meta: r.data.meta };
  },
  async detail(slug: string) {
    const r = await api.get<ApiResponse<PostDetail>>(`/public/posts/${slug}`);
    return r.data.data;
  },
};

export function fmtDate(iso?: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ---- Product (M6) ----
export interface ProductImage {
  id: string;
  image_url: string;
  alt_text?: string | null;
  is_primary: boolean;
  sort_order: number;
}
export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  short_desc?: string | null;
  reference_price?: number | string | null;
  unit?: string | null;
  status: string;
  category: Category;
  primary_image?: string | null;
}
export interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  short_desc?: string | null;
  description?: string | null;
  reference_price?: number | string | null;
  unit?: string | null;
  usage_info?: string | null;
  disclaimer?: string | null;
  category: Category;
  images: ProductImage[];
  seo: SeoMeta;
  json_ld: object[];
  related: ProductListItem[];
}

export const product = {
  async list(category?: string) {
    const r = await api.get<ApiResponse<ProductListItem[]>>("/public/products", {
      params: { "danh-muc": category },
    });
    return r.data.data ?? [];
  },
  async detail(slug: string) {
    const r = await api.get<ApiResponse<ProductDetail>>(
      `/public/products/${slug}`,
    );
    return r.data.data;
  },
};

export function fmtVnd(v?: number | string | null): string {
  if (v == null || v === "") return "Liên hệ";
  const n = typeof v === "string" ? parseFloat(v) : v;
  return n.toLocaleString("vi-VN") + " ₫";
}

// ---- Contact & Dealer forms ----
export interface ContactPayload {
  full_name: string;
  phone: string;
  email?: string;
  subject?: string;
  message: string;
}

export interface DealerPayload {
  full_name: string;
  phone: string;
  email?: string;
  area: string;
  message?: string;
}

export interface ContactResult {
  id: string;
  message: string;
}

export const contact = {
  async submit(data: ContactPayload): Promise<ContactResult> {
    const r = await api.post<ApiResponse<ContactResult>>(
      "/public/contact",
      data,
    );
    if (r.data.error) throw new Error(r.data.error.message);
    return r.data.data!;
  },
  async submitDealer(data: DealerPayload): Promise<ContactResult> {
    const r = await api.post<ApiResponse<ContactResult>>(
      "/public/contact/dealer",
      data,
    );
    if (r.data.error) throw new Error(r.data.error.message);
    return r.data.data!;
  },
};

// ---- QR Code verification (M8) ----
export interface QRVerifyResponse {
  authentic: boolean;
  status: string;
  scan_count: number;
  first_scan_at?: string | null;
  batch?: {
    id: string;
    batch_no: string;
    product_name?: string | null;
    sku?: string | null;
    manufacture_date?: string | null;
    expiry_date?: string | null;
    warehouse?: string | null;
    supplier_name?: string | null;
    origin_region?: string | null;
    notes?: string | null;
  } | null;
  message: string;
  warning?: string | null;
}

export const qrcode = {
  async verify(token: string): Promise<QRVerifyResponse> {
    const r = await api.get<ApiResponse<QRVerifyResponse>>(
      `/public/qrcode/verify/${token}`,
    );
    if (r.data.error) throw new Error(r.data.error.message);
    return r.data.data!;
  },
};
