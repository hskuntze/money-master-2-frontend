import axios, { AxiosRequestConfig } from "axios";
import { API_URL } from "@/config/env";
import { AuthLoginRequest, AuthRegisterRequest, AuthResponse, UserResponse } from "@/types/auth";
import { getAuthData } from "@/utils/storage";
import { ThemeResponse, ThemeUpdateRequest } from "@/types/theme";
import {
  AccountBalanceResponse,
  AccountResponse,
  CategoryReportResponse,
  CategoryResponse,
  ComparativeReportResponse,
  DailyCashFlowResponse,
  FinanceChatResponse,
  FinancialSummaryResponse,
  FinancialTransactionPayload,
  FinancialTransactionResponse,
  SavingsJarMovementResponse,
  SavingsJarPayload,
  SavingsJarResponse,
  SavingsJarSummaryResponse,
  TransactionType,
} from "@/types/finance";

export type RequestConfig = AxiosRequestConfig & {
  skipAuth?: boolean;
  skipGlobalErrorHandler?: boolean;
  skipAuthRefresh?: boolean;
};

export function requestBackend<T = any>(config: RequestConfig) {
  const auth = getAuthData();
  const headers = {
    ...config.headers,
    ...(!config.skipAuth && auth.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {}),
  };

  return axios.request<T>({
    ...config,
    baseURL: API_URL,
    headers,
  });
}

export function requestBackendLogin(data: AuthLoginRequest) {
  return axios.post<AuthResponse>(`${API_URL}/auth/login`, data, {
    headers: { "Content-Type": "application/json" },
    skipGlobalErrorHandler: true,
    skipAuthRefresh: true,
  } as any);
}

export function requestBackendRegister(data: AuthRegisterRequest) {
  return axios.post<UserResponse>(`${API_URL}/auth/register`, data, {
    headers: { "Content-Type": "application/json" },
    skipGlobalErrorHandler: true,
    skipAuthRefresh: true,
  } as any);
}

export function requestBackendRefreshToken(refreshToken: string) {
  return axios.post<AuthResponse>(`${API_URL}/auth/refresh`, { refreshToken }, {
    headers: { "Content-Type": "application/json" },
    skipGlobalErrorHandler: true,
    skipAuthRefresh: true,
  } as any);
}

export const api = {
  me: () => requestBackend<UserResponse>({ method: "GET", url: "/auth/me" }),
  confirmEmail: (token: string) =>
    requestBackend<{ message: string }>({ method: "GET", url: "/auth/confirm-email", params: { token }, skipAuth: true }),
  resendConfirmation: (email: string) =>
    requestBackend<{ message: string }>({ method: "POST", url: "/auth/resend-confirmation", params: { email }, skipAuth: true }),

  getTheme: () => requestBackend<ThemeResponse>({ method: "GET", url: "/themes/active", skipAuth: true }),
  updateTheme: (data: ThemeUpdateRequest) => requestBackend<ThemeResponse>({ method: "PUT", url: "/themes/active", data }),

  listAccounts: () => requestBackend<AccountResponse[]>({ method: "GET", url: "/accounts" }),
  getAccountBalance: (id: number) => requestBackend<AccountBalanceResponse>({ method: "GET", url: `/accounts/${id}/balance` }),
  createAccount: (data: Partial<AccountResponse>) => requestBackend<AccountResponse>({ method: "POST", url: "/accounts", data }),
  updateAccount: (id: number, data: Partial<AccountResponse>) => requestBackend<AccountResponse>({ method: "PUT", url: `/accounts/${id}`, data }),
  deactivateAccount: (id: number) => requestBackend<{ message: string }>({ method: "DELETE", url: `/accounts/${id}` }),

  listCategories: (type?: TransactionType) => requestBackend<CategoryResponse[]>({ method: "GET", url: "/categories", params: { type } }),
  createCategory: (data: Partial<CategoryResponse>) => requestBackend<CategoryResponse>({ method: "POST", url: "/categories", data }),
  updateCategory: (id: number, data: Partial<CategoryResponse>) =>
    requestBackend<CategoryResponse>({ method: "PUT", url: `/categories/${id}`, data }),
  deactivateCategory: (id: number) => requestBackend<{ message: string }>({ method: "DELETE", url: `/categories/${id}` }),

  listTransactions: (params?: Record<string, any>) => requestBackend<FinancialTransactionResponse[]>({ method: "GET", url: "/transactions", params }),
  createTransaction: (data: FinancialTransactionPayload) =>
    requestBackend<FinancialTransactionResponse>({ method: "POST", url: "/transactions", data }),
  updateTransaction: (id: number, data: FinancialTransactionPayload) =>
    requestBackend<FinancialTransactionResponse>({ method: "PUT", url: `/transactions/${id}`, data }),
  deleteTransaction: (id: number) => requestBackend<{ message: string }>({ method: "DELETE", url: `/transactions/${id}` }),

  summary: (params?: Record<string, any>) => requestBackend<FinancialSummaryResponse>({ method: "GET", url: "/reports/summary", params }),
  accountBalances: () => requestBackend<AccountBalanceResponse[]>({ method: "GET", url: "/reports/accounts/balances" }),
  dailyCashFlow: (from: string, to: string) =>
    requestBackend<DailyCashFlowResponse[]>({ method: "GET", url: "/reports/cash-flow/daily", params: { from, to } }),
  categoriesReport: (from: string, to: string, type?: TransactionType) =>
    requestBackend<CategoryReportResponse[]>({ method: "GET", url: "/reports/categories", params: { from, to, type } }),
  compare: (params: Record<string, any>) => requestBackend<ComparativeReportResponse>({ method: "GET", url: "/reports/compare", params }),

  chat: (message: string) => requestBackend<FinanceChatResponse>({ method: "POST", url: "/ai/chat", data: { message } }),

  listSavingsJars: () => requestBackend<SavingsJarResponse[]>({ method: "GET", url: "/savings-jars" }),
  savingsJarSummary: () => requestBackend<SavingsJarSummaryResponse>({ method: "GET", url: "/savings-jars/summary" }),
  createSavingsJar: (data: SavingsJarPayload) => requestBackend<SavingsJarResponse>({ method: "POST", url: "/savings-jars", data }),
  updateSavingsJar: (id: number, data: SavingsJarPayload) => requestBackend<SavingsJarResponse>({ method: "PUT", url: `/savings-jars/${id}`, data }),
  deactivateSavingsJar: (id: number) => requestBackend<{ message: string }>({ method: "DELETE", url: `/savings-jars/${id}` }),
  listSavingsJarMovements: (id: number) => requestBackend<SavingsJarMovementResponse[]>({ method: "GET", url: `/savings-jars/${id}/movements` }),
  depositSavingsJar: (id: number, data: { amount: number; occurredOn: string; description?: string; source?: string }) =>
    requestBackend<SavingsJarMovementResponse>({ method: "POST", url: `/savings-jars/${id}/deposits`, data }),
  withdrawSavingsJar: (id: number, data: { amount: number; occurredOn: string; description?: string; source?: string }) =>
    requestBackend<SavingsJarMovementResponse>({ method: "POST", url: `/savings-jars/${id}/withdrawals`, data }),
  yieldSavingsJar: (id: number, data: { amount: number; occurredOn: string; description?: string; source?: string }) =>
    requestBackend<SavingsJarMovementResponse>({ method: "POST", url: `/savings-jars/${id}/yields`, data }),
  applySavingsJarYield: (id: number, to?: string) => requestBackend({ method: "POST", url: `/savings-jars/${id}/yield/apply`, params: { to } }),
  applyPendingSavingsJarYields: (to?: string) => requestBackend({ method: "POST", url: "/savings-jars/yield/apply-pending", params: { to } }),
};
