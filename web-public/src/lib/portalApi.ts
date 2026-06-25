import axios from "axios";

// Support dynamic URL via query param or localStorage for easier mobile testing
const urlParams = new URLSearchParams(window.location.search);
const apiParam = urlParams.get("api");
if (apiParam) {
  localStorage.setItem("VITE_API_BASE_URL", apiParam);
  const apiDomain = apiParam.replace("/api/v1", "");
  localStorage.setItem("VITE_API_URL", apiDomain);
}

const savedApiUrl = localStorage.getItem("VITE_API_URL");
const VITE_API_URL =
  savedApiUrl ||
  (import.meta.env.VITE_API_URL as string | undefined) ||
  (window.location.hostname.includes("vercel.app")
    ? "https://sambaden-api.loca.lt"
    : `${window.location.protocol}//${window.location.hostname}:8000`);

// Tạo instance dành riêng cho portal với auth header
export const portalClient = axios.create({
  baseURL: VITE_API_URL,
});

// Middleware tự động đính kèm token của Đại lý nếu có
portalClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("portal_access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers["Bypass-Tunnel-Reminder"] = "true";
  return config;
});

export interface PortalDealerProfile {
  id: string;
  code: string;
  name: string;
  tier: string;
  region: string;
  address?: string;
  contact_name?: string;
  phone?: string;
  credit_limit: number;
  payment_term_days: number;
  status: string;
  balance: number;
}

export interface PortalProduct {
  id: string;
  sku: string;
  name: string;
  image_url?: string;
  description?: string;
  unit: string;
  base_price: number;
  dealer_price: number;
  discount_percent: number;
  in_stock: boolean;
}

export const portalApi = {
  // Authentication (dùng chung API đăng nhập)
  login: async (email: string, password: string) => {
    // Note: Dùng formData vì FastAPI OAuth2 mặc định nhận form data
    const formData = new FormData();
    formData.append("username", email);
    formData.append("password", password);
    const res = await portalClient.post("/api/v1/auth/login", formData);
    return res.data.data;
  },
  
  // Profile
  getProfile: async () => {
    const res = await portalClient.get("/api/v1/portal/me");
    return res.data.data as PortalDealerProfile;
  },

  // Products
  getProducts: async () => {
    const res = await portalClient.get("/api/v1/portal/products");
    return res.data.data as PortalProduct[];
  },

  // Orders
  createOrder: async (items: {product_id: string, quantity: number}[], shipping_address?: string, note?: string) => {
    const payload = { items, shipping_address, note };
    const res = await portalClient.post("/api/v1/portal/orders", payload);
    return res.data.data;
  },

  getOrders: async () => {
    const res = await portalClient.get("/api/v1/portal/orders");
    return res.data.data;
  },

  exportOrders: async (format: "excel" | "pdf") => {
    const res = await portalClient.get(`/api/v1/portal/orders/export?format=${format}`, {
      responseType: "blob"
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Don_hang_SBD.${format === "excel" ? "xlsx" : "pdf"}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  getLedgers: async () => {
    const res = await portalClient.get("/api/v1/portal/ledger");
    return res.data.data;
  },

  exportLedger: async (format: "excel" | "pdf") => {
    const res = await portalClient.get(`/api/v1/portal/ledger/export?format=${format}`, {
      responseType: "blob"
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `So_cai_SBD.${format === "excel" ? "xlsx" : "pdf"}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  createPaymentUrl: async (amount: number) => {
    const res = await portalClient.post("/api/v1/portal/payments/vnpay_url", { amount });
    return res.data.data.payment_url;
  },

  verifyPayment: async (params: Record<string, string>) => {
    const res = await portalClient.get("/api/v1/portal/payments/vnpay_return", { params });
    return res.data.data;
  }
};
