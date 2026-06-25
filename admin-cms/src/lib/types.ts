// Kiểu dữ liệu khớp response chuẩn của backend: { data, meta, error }
export interface ApiResponse<T> {
  data: T | null;
  meta: Record<string, unknown>;
  error: ApiError | null;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  last_login_at: string | null;
  permissions: string[];
}

// ---- Blog (M3) ----
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  sort_order: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export type PostStatus = "draft" | "review" | "published" | "archived";

export interface PostListItem {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  cover_image_url?: string | null;
  status: PostStatus;
  category: Category;
  published_at?: string | null;
  view_count: number;
}

export interface PostDetail extends PostListItem {
  content: string;
  author_name: string;
  tags: Tag[];
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  canonical_url?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image_url?: string | null;
  meta_robots: string;
  disclaimer?: string | null;
  created_at: string;
  updated_at: string;
}

// ---- Product (M6) ----
export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}
export interface ProductImage {
  id: string;
  image_url: string;
  alt_text?: string | null;
  is_primary: boolean;
  sort_order: number;
}
export interface ProductPrice {
  id: string;
  channel: string;
  price: number | string;
  is_active: boolean;
  note?: string | null;
}
export interface ProductInventory {
  id: string;
  warehouse: string;
  qty_on_hand: number;
  qty_reserved: number;
  qty_available: number;
  low_stock_threshold: number;
}
export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  sku?: string | null;
  barcode?: string | null;
  short_desc?: string | null;
  reference_price?: number | string | null;
  unit?: string | null;
  status: string;
  category: ProductCategory;
  primary_image?: string | null;
  total_stock: number;
}
export interface ProductDetail extends ProductListItem {
  description?: string | null;
  packaging_info?: string | null;
  weight_g?: number | null;
  usage_info?: string | null;
  disclaimer?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  og_image_url?: string | null;
  sort_order: number;
  images: ProductImage[];
  prices: ProductPrice[];
  inventory: ProductInventory[];
}

// ---- CRM (M4) ----
export interface Interaction {
  id: string;
  entity_type: "lead" | "customer" | "opportunity";
  entity_id: string;
  type: "call" | "note" | "email" | "sms";
  content: string;
  channel?: string | null;
  created_by: string;
  created_at: string;
}

export interface Opportunity {
  id: string;
  customer_id: string;
  title: string;
  stage: "new" | "qualified" | "proposal" | "won" | "lost";
  est_value?: number | null;
  owner_id?: string | null;
  expected_close_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  full_name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  source?: string | null;
  owner_id?: string | null;
  tags?: string | null;
  note?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  full_name: string;
  phone: string;
  email?: string | null;
  source: string;
  source_ref_id?: string | null;
  status: "new" | "contacted" | "qualified" | "converted" | "lost";
  owner_id?: string | null;
  customer_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadConvertResult {
  customer_id: string;
  opportunity_id?: string | null;
}

export interface CustomerJourney {
  customer: Customer;
  interactions: Interaction[];
  opportunities: Opportunity[];
}

// ---- Dealer (M5) ----
export interface Dealer {
  id: string;
  code: string;
  name: string;
  tier: "tier_1" | "tier_2";
  region: string;
  address?: string | null;
  contact_name?: string | null;
  phone?: string | null;
  lat?: number | null;
  lng?: number | null;
  credit_limit: number;
  payment_term_days: number;
  user_id?: string | null;
  status: "pending" | "active" | "suspended";
  created_at: string;
  updated_at: string;
}

export interface DealerDiscount {
  id: string;
  dealer_id?: string | null;
  tier?: string | null;
  product_id?: string | null;
  category_id?: string | null;
  discount_percent: number;
  start_at: string;
  end_at?: string | null;
  is_active: boolean;
}

export interface DealerLedger {
  id: string;
  dealer_id: string;
  entry_type: "debit" | "credit";
  amount: number;
  ref_type: "order" | "payment" | "adjustment" | "return";
  ref_id?: string | null;
  note?: string | null;
  created_by: string;
  created_at: string;
}

export interface DealerDebtSummary {
  total_debit: number;
  total_credit: number;
  balance: number;
  credit_limit: number;
  available_credit: number;
}


