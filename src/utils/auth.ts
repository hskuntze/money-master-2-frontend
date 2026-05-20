import { jwtDecode } from "jwt-decode";
import { clearStoredSession, getAuthData, saveAuthData } from "@/utils/storage";
import { requestBackendRefreshToken } from "@/utils/requests";

interface JwtPayload {
  exp?: number;
}

export function isTokenExpired(token?: string): boolean {
  if (!token) return true;
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    if (!decoded.exp) return true;
    return decoded.exp <= Date.now() / 1000;
  } catch {
    return true;
  }
}

export function isAuthenticated(): boolean {
  const auth = getAuthData();
  return Boolean(auth.accessToken && !isTokenExpired(auth.accessToken));
}

export async function tryRefreshToken(): Promise<boolean> {
  const auth = getAuthData();
  if (!auth.refreshToken) return false;

  try {
    const response = await requestBackendRefreshToken(auth.refreshToken);
    saveAuthData(response.data);
    return true;
  } catch {
    clearStoredSession();
    return false;
  }
}

export function hasAnyPermission(userPermissions: string[] | undefined, permissions?: string[]) {
  if (!permissions?.length) return true;
  return permissions.some((permission) => userPermissions?.includes(permission));
}
