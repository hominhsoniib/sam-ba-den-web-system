import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

import { tokenStore } from "./tokenStore";
import type { ApiResponse, TokenPair } from "./types";

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
    ? "https://sambaden-api.loca.lt/api/v1"
    : `${window.location.protocol}//${window.location.hostname}:8000/api/v1`);

export const api = axios.create({ baseURL: BASE_URL });

// Gắn access token vào mỗi request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.access();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers["Bypass-Tunnel-Reminder"] = "true";
  return config;
});

// Tự refresh khi gặp 401 (một lần), tránh vòng lặp
let refreshing: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const refresh = tokenStore.refresh();
  if (!refresh) return null;
  try {
    const res = await axios.post<ApiResponse<TokenPair>>(
      `${BASE_URL}/auth/refresh`,
      { refresh_token: refresh },
      { headers: { "Bypass-Tunnel-Reminder": "true" } }
    );
    const pair = res.data.data;
    if (!pair) return null;
    tokenStore.set(pair.access_token, pair.refresh_token);
    return pair.access_token;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as
      | (AxiosRequestConfig & { _retried?: boolean })
      | undefined;
    const status = error.response?.status;

    if (status === 401 && original && !original._retried) {
      original._retried = true;
      refreshing ??= doRefresh();
      const newToken = await refreshing;
      refreshing = null;
      if (newToken) {
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>).Authorization =
          `Bearer ${newToken}`;
        return api(original);
      }
      tokenStore.clear();
      if (location.pathname !== "/login") location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Helper: bóc message lỗi chuẩn từ backend
export function errorMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const body = e.response?.data as ApiResponse<unknown> | undefined;
    if (body?.error?.message) return body.error.message;
    if (e.code === "ERR_NETWORK")
      return "Không kết nối được máy chủ. Kiểm tra API có đang chạy ở cổng 8000.";
  }
  return "Đã có lỗi xảy ra. Vui lòng thử lại.";
}
