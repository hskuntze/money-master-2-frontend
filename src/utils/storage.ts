import { AuthResponse } from "@/types/auth";

const AUTH_KEY = "moneyMasterAuth";

export type StoredAuth = Partial<AuthResponse>;

export function saveAuthData(auth: AuthResponse) {
  sessionStorage.setItem(AUTH_KEY, JSON.stringify(auth));
}

export function getAuthData(): StoredAuth {
  const raw = sessionStorage.getItem(AUTH_KEY) || localStorage.getItem(AUTH_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return {};
  }
}

export function clearStoredSession() {
  sessionStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(AUTH_KEY);
}
