// Lưu token. Dùng localStorage cho demo; production nên cân nhắc HttpOnly cookie.
const ACCESS = "sbd_access";
const REFRESH = "sbd_refresh";

export const tokenStore = {
  access: () => localStorage.getItem(ACCESS),
  refresh: () => localStorage.getItem(REFRESH),
  set(access: string, refresh: string) {
    localStorage.setItem(ACCESS, access);
    localStorage.setItem(REFRESH, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
  },
};
