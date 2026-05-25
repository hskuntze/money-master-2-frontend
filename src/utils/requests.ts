import axios, { AxiosRequestConfig } from "axios";
import { API_URL } from "@/config/env";
import { AuthLoginRequest, AuthRegisterRequest, AuthResponse, UserResponse } from "@/types/auth";
import { getAuthData } from "@/utils/storage";
import { ThemeResponse, ThemeUpdateRequest } from "@/types/theme";
import {
  AccessLogResponse,
  EmailSettingsResponse,
  EmailSettingsUpdateRequest,
  FailureLogDetailResponse,
  FailureLogResponse,
  PageResponse,
} from "@/types/admin";
import {
  AccountBalanceResponse,
  AccountResponse,
  CategoryReportResponse,
  CategoryResponse,
  ComparativeReportResponse,
  DailyCashFlowResponse,
  FinanceChatResponse,
  FinancialPeriodResponse,
  FinancialPeriodTurnoverPayload,
  FinancialPeriodUpdatePayload,
  FinancialSummaryResponse,
  FinancialTransactionPayload,
  FinancialTransactionResponse,
  InstallmentEntryPaymentPayload,
  InstallmentPurchasePayload,
  InstallmentPurchaseResponse,
  UserFinancialProfilePayload,
  UserFinancialProfileResponse,
  FinancialReferenceResponse,
  MonthlyPeriodSummaryResponse,
  MonthlyPlanItemPayload,
  MonthlyPlanItemPaymentPayload,
  MonthlyPlanItemLinkTransactionPayload,
  MonthlyPlanItemReopenPayload,
  MonthlyPlanItemUnlinkTransactionPayload,
  MonthlyPlanItemResponse,
  MonthlyPlanItemStatus,
  MonthlyPlanReconcilePayload,
  MonthlyPlanReconcileResponse,
  OnboardingSetupPayload,
  OnboardingStatusResponse,
  SavingsJarMovementResponse,
  SavingsJarPayload,
  SavingsJarResponse,
  SavingsJarSummaryResponse,
  SavingsJarYieldCorrectionResponse,
  TransactionType,
  TourStatePayload,
} from "@/types/finance";

export type RequestConfig = AxiosRequestConfig & {
  skipAuth?: boolean;
  skipGlobalErrorHandler?: boolean;
  skipAuthRefresh?: boolean;
};

export function resolveApiAssetUrl(url?: string | null) {
  if (!url) return undefined;
  if (/^(https?:)?\/\//.test(url) || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }
  return `${API_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

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
  updateCurrentUserProfile: (data: { name: string }) => requestBackend<UserResponse>({ method: "PUT", url: "/users/me", data }),
  uploadCurrentUserAvatar: (file: Blob) => {
    const formData = new FormData();
    formData.append("file", file, "avatar.png");
    return requestBackend<UserResponse>({
      method: "POST",
      url: "/users/me/avatar",
      data: formData,
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  deleteCurrentUserAvatar: () => requestBackend<UserResponse>({ method: "DELETE", url: "/users/me/avatar" }),
  confirmEmail: (token: string) =>
    requestBackend<{ message: string }>({
      method: "GET",
      url: "/auth/confirm-email",
      params: { token },
      skipAuth: true,
    }),
  resendConfirmation: (email: string) =>
    requestBackend<{ message: string }>({
      method: "POST",
      url: "/auth/resend-confirmation",
      params: { email },
      skipAuth: true,
    }),

  getTheme: () =>
    requestBackend<ThemeResponse>({
      method: "GET",
      url: "/themes/active",
      skipAuth: true,
    }),
  updateTheme: (data: ThemeUpdateRequest) =>
    requestBackend<ThemeResponse>({
      method: "PUT",
      url: "/themes/active",
      data,
    }),

  getEmailSettings: () =>
    requestBackend<EmailSettingsResponse>({
      method: "GET",
      url: "/admin/email-settings",
    }),
  updateEmailSettings: (data: EmailSettingsUpdateRequest) =>
    requestBackend<EmailSettingsResponse>({
      method: "PUT",
      url: "/admin/email-settings",
      data,
    }),
  testEmailSettings: (to: string) =>
    requestBackend<{ message: string }>({
      method: "POST",
      url: "/admin/email-settings/test",
      data: { to },
    }),
  listAccessLogs: (params?: Record<string, any>) =>
    requestBackend<PageResponse<AccessLogResponse>>({
      method: "GET",
      url: "/admin/logs/access",
      params,
    }),
  listFailureLogs: (params?: Record<string, any>) =>
    requestBackend<PageResponse<FailureLogResponse>>({
      method: "GET",
      url: "/admin/logs/failures",
      params,
    }),
  getFailureLog: (id: number) =>
    requestBackend<FailureLogDetailResponse>({
      method: "GET",
      url: `/admin/logs/failures/${id}`,
    }),

  listAccounts: () => requestBackend<AccountResponse[]>({ method: "GET", url: "/accounts" }),
  getAccountBalance: (id: number) =>
    requestBackend<AccountBalanceResponse>({
      method: "GET",
      url: `/accounts/${id}/balance`,
    }),
  createAccount: (data: Partial<AccountResponse>) => requestBackend<AccountResponse>({ method: "POST", url: "/accounts", data }),
  updateAccount: (id: number, data: Partial<AccountResponse>) =>
    requestBackend<AccountResponse>({
      method: "PUT",
      url: `/accounts/${id}`,
      data,
    }),
  deactivateAccount: (id: number) =>
    requestBackend<{ message: string }>({
      method: "DELETE",
      url: `/accounts/${id}`,
    }),

  listCategories: (type?: TransactionType) =>
    requestBackend<CategoryResponse[]>({
      method: "GET",
      url: "/categories",
      params: { type },
    }),
  createCategory: (data: Partial<CategoryResponse>) =>
    requestBackend<CategoryResponse>({
      method: "POST",
      url: "/categories",
      data,
    }),
  createSystemCategory: (data: Partial<CategoryResponse>) =>
    requestBackend<CategoryResponse>({
      method: "POST",
      url: "/categories/system",
      data,
    }),
  updateSystemCategory: (id: number, data: Partial<CategoryResponse>) =>
    requestBackend<CategoryResponse>({
      method: "PUT",
      url: `/categories/system/${id}`,
      data,
    }),
  deactivateSystemCategory: (id: number) =>
    requestBackend<{ message: string }>({
      method: "DELETE",
      url: `/categories/system/${id}`,
    }),
  updateCategory: (id: number, data: Partial<CategoryResponse>) =>
    requestBackend<CategoryResponse>({
      method: "PUT",
      url: `/categories/${id}`,
      data,
    }),
  deactivateCategory: (id: number) =>
    requestBackend<{ message: string }>({
      method: "DELETE",
      url: `/categories/${id}`,
    }),

  listFinancialPeriods: () =>
    requestBackend<FinancialPeriodResponse[]>({
      method: "GET",
      url: "/financial-periods",
    }),
  currentFinancialPeriod: () =>
    requestBackend<FinancialPeriodResponse>({
      method: "GET",
      url: "/financial-periods/current",
    }),
  getFinancialPeriod: (id: number) =>
    requestBackend<FinancialPeriodResponse>({
      method: "GET",
      url: `/financial-periods/${id}`,
    }),
  turnoverFinancialPeriod: (data: FinancialPeriodTurnoverPayload) =>
    requestBackend<FinancialPeriodResponse>({
      method: "POST",
      url: "/financial-periods/turnover",
      data,
    }),
  updateFinancialPeriod: (id: number, data: FinancialPeriodUpdatePayload) =>
    requestBackend<FinancialPeriodResponse>({
      method: "PUT",
      url: `/financial-periods/${id}`,
      data,
    }),
  reopenFinancialPeriod: (id: number) =>
    requestBackend<FinancialPeriodResponse>({
      method: "POST",
      url: `/financial-periods/${id}/reopen`,
    }),
  closeFinancialPeriod: (id: number) =>
    requestBackend<FinancialPeriodResponse>({
      method: "POST",
      url: `/financial-periods/${id}/close`,
    }),
  monthlyPeriodSummary: (periodId: number) =>
    requestBackend<MonthlyPeriodSummaryResponse>({
      method: "GET",
      url: `/financial-periods/${periodId}/summary`,
    }),
  listMonthlyPlanItems: (periodId: number, status?: MonthlyPlanItemStatus | "") =>
    requestBackend<MonthlyPlanItemResponse[]>({
      method: "GET",
      url: `/financial-periods/${periodId}/plan-items`,
      params: { status: status || undefined },
    }),
  createMonthlyPlanItem: (periodId: number, data: MonthlyPlanItemPayload) =>
    requestBackend<MonthlyPlanItemResponse>({
      method: "POST",
      url: `/financial-periods/${periodId}/plan-items`,
      data,
    }),
  updateMonthlyPlanItem: (itemId: number, data: Partial<MonthlyPlanItemPayload>) =>
    requestBackend<MonthlyPlanItemResponse>({
      method: "PUT",
      url: `/financial-periods/plan-items/${itemId}`,
      data,
    }),
  cancelMonthlyPlanItem: (itemId: number) =>
    requestBackend<{ message: string }>({
      method: "DELETE",
      url: `/financial-periods/plan-items/${itemId}`,
    }),

  payMonthlyPlanItem: (itemId: number, data: MonthlyPlanItemPaymentPayload) =>
    requestBackend<MonthlyPlanItemResponse>({
      method: "POST",
      url: `/financial-periods/plan-items/${itemId}/payments`,
      data,
    }),
  reopenMonthlyPlanItem: (itemId: number, data: MonthlyPlanItemReopenPayload) =>
    requestBackend<MonthlyPlanItemResponse>({
      method: "POST",
      url: `/financial-periods/plan-items/${itemId}/reopen`,
      data,
    }),
  unlinkTransactionFromMonthlyPlanItem: (itemId: number, data: MonthlyPlanItemUnlinkTransactionPayload) =>
    requestBackend<MonthlyPlanItemResponse>({
      method: "POST",
      url: `/financial-periods/plan-items/${itemId}/unlink-transaction`,
      data,
    }),
  linkTransactionToMonthlyPlanItem: (itemId: number, data: MonthlyPlanItemLinkTransactionPayload) =>
    requestBackend<MonthlyPlanItemResponse>({
      method: "POST",
      url: `/financial-periods/plan-items/${itemId}/link-transaction`,
      data,
    }),

  listInvoiceChildCandidates: (invoiceItemId: number) =>
    requestBackend<MonthlyPlanItemResponse[]>({
      method: "GET",
      url: `/financial-periods/plan-items/${invoiceItemId}/child-candidates`,
    }),
  linkMonthlyPlanItemToInvoice: (invoiceItemId: number, childItemId: number) =>
    requestBackend<MonthlyPlanItemResponse>({
      method: "POST",
      url: `/financial-periods/plan-items/${invoiceItemId}/children/${childItemId}`,
    }),
  unlinkMonthlyPlanItemFromInvoice: (childItemId: number) =>
    requestBackend<MonthlyPlanItemResponse>({
      method: "DELETE",
      url: `/financial-periods/plan-items/${childItemId}/parent`,
    }),
  listUnlinkedPeriodTransactions: (periodId: number, type?: TransactionType, onlyUnlinked = true) =>
    requestBackend<FinancialTransactionResponse[]>({
      method: "GET",
      url: `/financial-periods/${periodId}/unlinked-transactions`,
      params: { type, onlyUnlinked },
    }),
  reconcileMonthlyPlanTransactions: (periodId: number, data: MonthlyPlanReconcilePayload) =>
    requestBackend<MonthlyPlanReconcileResponse>({
      method: "POST",
      url: `/financial-periods/${periodId}/reconcile-transactions`,
      data,
    }),

  listTransactions: (params?: Record<string, any>) =>
    requestBackend<FinancialTransactionResponse[]>({
      method: "GET",
      url: "/transactions",
      params,
    }),
  createTransaction: (data: FinancialTransactionPayload) =>
    requestBackend<FinancialTransactionResponse>({
      method: "POST",
      url: "/transactions",
      data,
    }),
  updateTransaction: (id: number, data: FinancialTransactionPayload) =>
    requestBackend<FinancialTransactionResponse>({
      method: "PUT",
      url: `/transactions/${id}`,
      data,
    }),
  deleteTransaction: (id: number) =>
    requestBackend<{ message: string }>({
      method: "DELETE",
      url: `/transactions/${id}`,
    }),

  summary: (params?: Record<string, any>) =>
    requestBackend<FinancialSummaryResponse>({
      method: "GET",
      url: "/reports/summary",
      params,
    }),
  accountBalances: () =>
    requestBackend<AccountBalanceResponse[]>({
      method: "GET",
      url: "/reports/accounts/balances",
    }),
  dailyCashFlow: (from: string, to: string) =>
    requestBackend<DailyCashFlowResponse[]>({
      method: "GET",
      url: "/reports/cash-flow/daily",
      params: { from, to },
    }),
  categoriesReport: (from: string, to: string, type?: TransactionType) =>
    requestBackend<CategoryReportResponse[]>({
      method: "GET",
      url: "/reports/categories",
      params: { from, to, type },
    }),
  compare: (params: Record<string, any>) =>
    requestBackend<ComparativeReportResponse>({
      method: "GET",
      url: "/reports/compare",
      params,
    }),

  listInstallmentPurchases: () =>
    requestBackend<InstallmentPurchaseResponse[]>({
      method: "GET",
      url: "/installment-purchases",
    }),
  getInstallmentPurchase: (id: number) =>
    requestBackend<InstallmentPurchaseResponse>({
      method: "GET",
      url: `/installment-purchases/${id}`,
    }),
  createInstallmentPurchase: (data: InstallmentPurchasePayload) =>
    requestBackend<InstallmentPurchaseResponse>({
      method: "POST",
      url: "/installment-purchases",
      data,
    }),
  markInstallmentEntryPaid: (entryId: number, data?: InstallmentEntryPaymentPayload) =>
    requestBackend<InstallmentPurchaseResponse>({
      method: "POST",
      url: `/installment-purchases/entries/${entryId}/payment`,
      data: data || {},
    }),
  reopenInstallmentEntryPayment: (entryId: number) =>
    requestBackend<InstallmentPurchaseResponse>({
      method: "DELETE",
      url: `/installment-purchases/entries/${entryId}/payment`,
    }),
  cancelInstallmentPurchase: (id: number) =>
    requestBackend<{ message: string }>({
      method: "DELETE",
      url: `/installment-purchases/${id}`,
    }),

  getFinancialProfile: () =>
    requestBackend<UserFinancialProfileResponse>({
      method: "GET",
      url: "/financial-profile",
    }),
  updateFinancialProfile: (data: UserFinancialProfilePayload) =>
    requestBackend<UserFinancialProfileResponse>({
      method: "PUT",
      url: "/financial-profile",
      data,
    }),
  getOnboardingStatus: () =>
    requestBackend<OnboardingStatusResponse>({
      method: "GET",
      url: "/onboarding/status",
    }),
  completeOnboarding: (data: OnboardingSetupPayload) =>
    requestBackend<OnboardingStatusResponse>({
      method: "POST",
      url: "/onboarding/complete",
      data,
    }),
  updateTourState: (data: TourStatePayload) =>
    requestBackend<OnboardingStatusResponse>({
      method: "PUT",
      url: "/onboarding/tour",
      data,
    }),
  completeGuidedTour: () =>
    requestBackend<OnboardingStatusResponse>({
      method: "POST",
      url: "/onboarding/tour/complete",
    }),
  skipGuidedTour: () =>
    requestBackend<OnboardingStatusResponse>({
      method: "POST",
      url: "/onboarding/tour/skip",
    }),
  listFinancialReferences: (activeOnly = false) =>
    requestBackend<FinancialReferenceResponse[]>({
      method: "GET",
      url: "/financial-references",
      params: { activeOnly },
    }),

  chat: (message: string, conversationId?: string | null) =>
    requestBackend<FinanceChatResponse>({
      method: "POST",
      url: "/ai/chat",
      data: { message, conversationId },
    }),

  listSavingsJars: () =>
    requestBackend<SavingsJarResponse[]>({
      method: "GET",
      url: "/savings-jars",
    }),
  savingsJarSummary: () =>
    requestBackend<SavingsJarSummaryResponse>({
      method: "GET",
      url: "/savings-jars/summary",
    }),
  createSavingsJar: (data: SavingsJarPayload) =>
    requestBackend<SavingsJarResponse>({
      method: "POST",
      url: "/savings-jars",
      data,
    }),
  updateSavingsJar: (id: number, data: SavingsJarPayload) =>
    requestBackend<SavingsJarResponse>({
      method: "PUT",
      url: `/savings-jars/${id}`,
      data,
    }),
  deleteSavingsJar: (id: number) =>
    requestBackend<{ message: string }>({
      method: "DELETE",
      url: `/savings-jars/${id}`,
    }),
  deactivateSavingsJar: (id: number) =>
    requestBackend<{ message: string }>({
      method: "DELETE",
      url: `/savings-jars/${id}`,
    }),
  listSavingsJarMovements: (id: number) =>
    requestBackend<SavingsJarMovementResponse[]>({
      method: "GET",
      url: `/savings-jars/${id}/movements`,
    }),
  depositSavingsJar: (
    id: number,
    data: {
      amount: number;
      occurredOn: string;
      description?: string;
      source?: string;
    },
  ) =>
    requestBackend<SavingsJarMovementResponse>({
      method: "POST",
      url: `/savings-jars/${id}/deposits`,
      data,
    }),
  withdrawSavingsJar: (
    id: number,
    data: {
      amount: number;
      occurredOn: string;
      description?: string;
      source?: string;
    },
  ) =>
    requestBackend<SavingsJarMovementResponse>({
      method: "POST",
      url: `/savings-jars/${id}/withdrawals`,
      data,
    }),
  yieldSavingsJar: (
    id: number,
    data: {
      amount: number;
      occurredOn: string;
      description?: string;
      source?: string;
    },
  ) =>
    requestBackend<SavingsJarMovementResponse>({
      method: "POST",
      url: `/savings-jars/${id}/yields`,
      data,
    }),
  correctSavingsJarYield: (
    id: number,
    data: {
      realYieldAmount: number;
      occurredOn: string;
      description?: string;
      notes?: string;
    },
  ) =>
    requestBackend<SavingsJarYieldCorrectionResponse>({
      method: "POST",
      url: `/savings-jars/${id}/yield/corrections`,
      data,
    }),
  applySavingsJarYield: (id: number, to?: string) =>
    requestBackend({
      method: "POST",
      url: `/savings-jars/${id}/yield/apply`,
      params: { to },
    }),
  applyPendingSavingsJarYields: (to?: string) =>
    requestBackend({
      method: "POST",
      url: "/savings-jars/yield/apply-pending",
      params: { to },
    }),
};
