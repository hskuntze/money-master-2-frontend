import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { toast } from "react-toastify";
import { clearStoredSession, getAuthData } from "@/utils/storage";
import { tryRefreshToken } from "@/utils/auth";

let isSet = false;
let refreshPromise: Promise<boolean> | null = null;

type RetryConfig = AxiosRequestConfig & {
  _retry?: boolean;
  skipAuthRefresh?: boolean;
  skipGlobalErrorHandler?: boolean;
};

export function setupInterceptors(navigate: (path: string) => void) {
  if (isSet) return;
  isSet = true;

  axios.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<any>) => {
      const cfg = (error.config || {}) as RetryConfig;
      const status = error.response?.status;

      if (cfg.skipGlobalErrorHandler) return Promise.reject(error);

      if (!status) {
        toast.error("Falha de conexão com o backend.");
        return Promise.reject(error);
      }

      const message = error.response?.data?.message || error.response?.data?.error || "Ocorreu um erro inesperado.";

      if (status === 401) {
        const url = cfg.url || "";
        const isAuthRequest = url.includes("/auth/login") || url.includes("/auth/refresh");

        if (!cfg._retry && !cfg.skipAuthRefresh && !isAuthRequest) {
          cfg._retry = true;
          if (!refreshPromise) {
            refreshPromise = tryRefreshToken().finally(() => {
              refreshPromise = null;
            });
          }
          const refreshed = await refreshPromise;
          if (refreshed) {
            const auth = getAuthData();
            cfg.headers = { ...cfg.headers, Authorization: `Bearer ${auth.accessToken}` };
            return axios(cfg);
          }
        }

        clearStoredSession();
        toast.error("Sessão expirada. Faça login novamente.");
        navigate("/login");
        return Promise.reject(error);
      }

      if (status === 403) {
        toast.warning("Você não possui permissão para acessar este recurso.");
        navigate("/app/denied");
      } else if (status >= 500) {
        toast.error(message || "Erro interno no servidor.");
      } else {
        toast.error(message);
      }

      return Promise.reject(error);
    },
  );
}
