export type AccountType =
  | "CHECKING"
  | "SAVINGS"
  | "CASH"
  | "CREDIT_CARD"
  | "INVESTMENT"
  | "OTHER";
export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";
export type TransactionSource = "MANUAL" | "AI_CHAT" | "IMPORTED";
export type SavingsJarYieldCalculationType = "MANUAL" | "CDI_PERCENTAGE";
export type SavingsJarMovementType =
  | "INITIAL_BALANCE"
  | "INITIAL_YIELD"
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "YIELD"
  | "YIELD_ADJUSTMENT"
  | "ADJUSTMENT";

export type AccountResponse = {
  id: number;
  name: string;
  type: AccountType;
  initialBalance: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type AccountBalanceResponse = {
  accountId: number;
  accountName: string;
  accountType: AccountType;
  initialBalance: number;
  incomeTotal: number;
  expenseTotal: number;
  transferTotal: number;
  currentBalance: number;
};

export type CategoryResponse = {
  id: number;
  name: string;
  type: TransactionType;
  icon?: string | null;
  color?: string | null;
  systemDefault: boolean;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type FinancialTransactionResponse = {
  id: number;
  type: TransactionType;
  description: string;
  amount: number;
  occurredOn: string;
  source: TransactionSource;
  account: AccountResponse;
  category?: CategoryResponse | null;
  aiRawMessage?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type FinancialTransactionPayload = {
  accountId: number;
  categoryId?: number | null;
  type: TransactionType;
  description: string;
  amount: number;
  occurredOn: string;
  source?: TransactionSource;
  aiRawMessage?: string | null;
  notes?: string | null;
};

export type FinancialSummaryResponse = {
  from: string;
  to: string;
  incomeTotal: number;
  expenseTotal: number;
  transferTotal: number;
  netResult: number;
  transactionCount: number;
};

export type DailyCashFlowResponse = {
  date: string;
  incomeTotal: number;
  expenseTotal: number;
  netResult: number;
};

export type CategoryReportResponse = {
  categoryId: number;
  categoryName: string;
  type: TransactionType;
  total: number;
  transactionCount: number;
};

export type ComparativeReportResponse = {
  firstPeriod: FinancialSummaryResponse;
  secondPeriod: FinancialSummaryResponse;
  incomeDifference: number;
  expenseDifference: number;
  netResultDifference: number;
};

export type SavingsJarYieldPreviewResponse = {
  referenceDate: string;
  baseAmount: number;
  cdiDailyRate: number;
  appliedRate: number;
  projectedYieldAmount: number;
  estimated: boolean;
  message?: string;
};

export type SavingsJarResponse = {
  id: number;
  name: string;
  institutionName?: string | null;
  description?: string | null;
  targetAmount: number;
  targetDate?: string | null;
  imageUrl?: string | null;
  icon?: string | null;
  color?: string | null;
  linkedAccountId?: number | null;
  linkedAccountName?: string | null;
  active: boolean;
  yieldEnabled: boolean;
  yieldCalculationType: SavingsJarYieldCalculationType;
  yieldPercentage: number;
  businessDaysOnly: boolean;
  useBrazilianHolidays: boolean;
  yieldStartDate?: string | null;
  lastYieldCalculationDate?: string | null;
  currentAmount: number;
  totalYield: number;
  principalAmount: number;
  remainingToTarget: number;
  progressPercentage: number;
  projectedYieldToday?: SavingsJarYieldPreviewResponse | null;
  createdAt?: string;
  updatedAt?: string;
};

export type SavingsJarSummaryResponse = {
  totalSaved: number;
  totalTarget: number;
  totalYield: number;
  remainingToTargets: number;
  averageProgressPercentage: number;
  totalJars: number;
  jars: SavingsJarResponse[];
};

export type SavingsJarMovementResponse = {
  id: number;
  savingsJarId: number;
  type: SavingsJarMovementType;
  amount: number;
  occurredOn: string;
  description?: string | null;
  source: TransactionSource;
  baseAmount?: number | null;
  rateApplied?: number | null;
  rateReference?: string | null;
  notes?: string | null;
  createdAt?: string;
};

export type SavingsJarYieldCorrectionResponse = {
  savingsJarId: number;
  savingsJarName: string;
  occurredOn: string;
  previousYieldAmount: number;
  realYieldAmount: number;
  adjustmentAmount: number;
  currentAmountAfterAdjustment: number;
  movement: SavingsJarMovementResponse;
  message: string;
};

export type SavingsJarPayload = {
  name: string;
  institutionName?: string | null;
  description?: string | null;
  targetAmount?: number | null;
  targetDate?: string | null;
  imageUrl?: string | null;
  icon?: string | null;
  color?: string | null;
  linkedAccountId?: number | null;
  currentAmount?: number | null;
  currentYieldAmount?: number | null;
  active?: boolean;
  yieldEnabled?: boolean;
  yieldCalculationType?: SavingsJarYieldCalculationType;
  yieldPercentage?: number | null;
  businessDaysOnly?: boolean;
  useBrazilianHolidays?: boolean;
  yieldStartDate?: string | null;
  lastYieldCalculationDate?: string | null;
};

export type FinanceChatResponse = {
  answer: string;
  conversationId: string;
  answeredAt: string;
};
