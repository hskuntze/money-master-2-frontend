import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { UserResponse } from "@/types/auth";
import { clearStoredSession, getAuthData, saveAuthData } from "@/utils/storage";
import { isAuthenticated, tryRefreshToken } from "@/utils/auth";
import { api } from "@/utils/requests";

export type AuthContextType = {
  authenticated: boolean;
  loading: boolean;
  user: UserResponse | null;
  setSession: (auth: any) => void;
  reloadUser: () => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
};

export const AuthContext = createContext<AuthContextType>({
  authenticated: false,
  loading: true,
  user: null,
  setSession: () => null,
  reloadUser: async () => undefined,
  logout: () => null,
  hasPermission: () => false,
  hasRole: () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserResponse | null>(null);

  const reloadUser = useCallback(async () => {
    const response = await api.me();
    setUser(response.data);
  }, []);

  const logout = useCallback(() => {
    clearStoredSession();
    setAuthenticated(false);
    setUser(null);
  }, []);

  const setSession = useCallback((auth: any) => {
    saveAuthData(auth);
    setUser(auth.user);
    setAuthenticated(true);
  }, []);

  const hasPermission = useCallback(
    (permission: string) => Boolean(user?.permissions?.includes(permission)),
    [user?.permissions],
  );

  const hasRole = useCallback(
    (role: string) => Boolean(user?.roles?.includes(role)),
    [user?.roles],
  );

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      setLoading(true);
      const auth = getAuthData();
      const hasToken = Boolean(auth.accessToken || auth.refreshToken);

      if (!hasToken) {
        if (mounted) {
          setAuthenticated(false);
          setUser(null);
          setLoading(false);
        }
        return;
      }

      let ok = isAuthenticated();
      if (!ok) ok = await tryRefreshToken();

      if (!mounted) return;

      if (ok) {
        try {
          const response = await api.me();
          if (!mounted) return;
          setUser(response.data);
          setAuthenticated(true);
        } catch {
          logout();
        } finally {
          if (mounted) setLoading(false);
        }
      } else {
        logout();
        setLoading(false);
      }
    }

    bootstrap();
    return () => {
      mounted = false;
    };
  }, [logout]);

  const value = useMemo(
    () => ({
      authenticated,
      loading,
      user,
      setSession,
      reloadUser,
      logout,
      hasPermission,
      hasRole,
    }),
    [
      authenticated,
      loading,
      user,
      setSession,
      reloadUser,
      logout,
      hasPermission,
      hasRole,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
