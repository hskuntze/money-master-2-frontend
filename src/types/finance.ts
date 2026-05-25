export type AccountType = "CHECKING" | "SAVINGS" | "CASH" | "CREDIT_CARD" | "INVESTMENT" | "OTHER";
export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";
export type TransactionSource = "MANUAL" | "AI_CHAT" | "IMPORTED";
export type FinancialPeriodStatus = "OPEN" | "SCHEDULED" | "CLOSED";
export type MonthlyPlanItemStatus = "PENDING" | "PARTIALLY_PAID" | "PAID" | "CANCELED";
export type MonthlyPlanItemNature = "FIXED" | "VARIABLE" | "CREDIT_CARD";
export type MonthlyPlanItemAggregationType = "NORMAL" | "GROUP_PARENT" | "GROUP_CHILD";
export type MonthlyPlanItemSettlementOrigin = "DIRECT" | "PARENT";
export type SavingsJarYieldCalculationType = "MANUAL" | "CDI_PERCENTAGE";
export type SavingsJarMovementType = "INITIAL_BALANCE" | "INITIAL_YIELD" | "DEPOSIT" | "WITHDRAWAL" | "YIELD" | "YIELD_ADJUSTMENT" | "ADJUSTMENT";

export type AccountResponse = {
  id: number;
  name: string;
  type: AccountType;
  initialBalance: number;
  active: boolean;
  internalDefault?: boolean;
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
  internalDefault?: boolean;
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
  financialPeriodId?: number | null;
  financialPeriodName?: string | null;
  monthlyPlanItemId?: number | null;
  monthlyPlanItemStatus?: MonthlyPlanItemStatus | null;
  aiRawMessage?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type FinancialTransactionPayload = {
  accountId?: number | null;
  categoryId?: number | null;
  financialPeriodId?: number | null;
  monthlyPlanItemId?: number | null;
  clearMonthlyPlanItem?: boolean;
  type: TransactionType;
  description: string;
  amount: number;
  occurredOn: string;
  source?: TransactionSource;
  aiRawMessage?: string | null;
  notes?: string | null;
};

export type FinancialPeriodResponse = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  turnoverDay?: number | null;
  status: FinancialPeriodStatus;
  archivedIncomeTotal: number;
  archivedExpenseTotal: number;
  archivedTransferTotal: number;
  archivedNetTotal: number;
  closedAt?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
};

export type FinancialPeriodTurnoverPayload = {
  turnoverDate: string;
  newPeriodName?: string | null;
};

export type FinancialPeriodUpdatePayload = {
  name?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  turnoverDay?: number | null;
  status?: FinancialPeriodStatus | null;
};

export type MonthlyPlanItemResponse = {
  id: number;
  financialPeriodId: number;
  financialPeriodName?: string | null;
  parentItemId?: number | null;
  parentItemDescription?: string | null;
  type: TransactionType;
  description: string;
  expectedAmount: number;
  actualAmount: number;
  remainingAmount?: number;
  dueDate: string;
  paidOn?: string | null;
  status: MonthlyPlanItemStatus;
  nature: MonthlyPlanItemNature;
  aggregationType?: MonthlyPlanItemAggregationType;
  settlementOrigin?: MonthlyPlanItemSettlementOrigin;
  paidByParent?: boolean;
  includedInMainTotals?: boolean;
  recurring: boolean;
  recurrenceEndDate?: string | null;
  recurringTemplateId?: number | null;
  generatedFromItemId?: number | null;
  recurrenceKey?: string | null;
  recurrenceModifiedManually?: boolean;
  accountId?: number | null;
  accountName?: string | null;
  categoryId?: number | null;
  categoryName?: string | null;
  account?: AccountResponse | null;
  category?: CategoryResponse | null;
  childExpectedTotal?: number;
  childActualTotal?: number;
  childDifference?: number;
  children?: MonthlyPlanItemResponse[];
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
};

export type MonthlyPlanItemPayload = {
  accountId?: number | null;
  categoryId?: number | null;
  type: TransactionType;
  description: string;
  expectedAmount: number;
  actualAmount?: number | null;
  dueDate: string;
  paidOn?: string | null;
  status?: MonthlyPlanItemStatus | null;
  nature?: MonthlyPlanItemNature | null;
  aggregationType?: MonthlyPlanItemAggregationType | null;
  parentItemId?: number | null;
  recurring?: boolean;
  recurrenceEndDate?: string | null;
  notes?: string | null;
};

export type MonthlyPlanItemPaymentPayload = {
  transactionId?: number | null;
  accountId?: number | null;
  categoryId?: number | null;
  amount?: number | null;
  occurredOn?: string | null;
  preferExistingTransaction?: boolean;
  notes?: string | null;
};

export type MonthlyPlanItemLinkTransactionPayload = {
  transactionId: number;
  copyCategoryFromPlanItem?: boolean;
  copyAccountFromPlanItem?: boolean;
  forceRelink?: boolean;
};

export type MonthlyPlanItemReopenPayload = {
  deleteLinkedTransactions?: boolean;
  keepTransactionsUnlinked?: boolean;
  notes?: string | null;
};

export type MonthlyPlanItemUnlinkTransactionPayload = {
  transactionId: number;
  deleteTransaction?: boolean;
  notes?: string | null;
};

export type MonthlyPlanReconcileCandidateResponse = {
  transactionId?: number | null;
  transactionDescription?: string | null;
  transactionAmount?: number | null;
  transactionDate?: string | null;
  planItemId?: number | null;
  planItemDescription?: string | null;
  expectedAmount?: number | null;
  dueDate?: string | null;
  score: number;
  action: string;
  executed: boolean;
  message: string;
};

export type MonthlyPlanReconcilePayload = {
  dryRun?: boolean;
  createMissingPlanItems?: boolean;
  linkExistingTransactions?: boolean;
  onlyUnlinkedTransactions?: boolean;
  defaultNature?: MonthlyPlanItemNature;
  recurring?: boolean;
  type?: TransactionType | null;
  from?: string | null;
  to?: string | null;
  createPlanItemsAsPendingOnly?: boolean;
  deleteSourceTransactionsWhenCreatingPlanItems?: boolean;
};

export type MonthlyPlanReconcileResponse = {
  dryRun: boolean;
  periodId: number;
  periodName: string;
  analyzedTransactions: number;
  matchedTransactions: number;
  createdPlanItems: number;
  linkedTransactions: number;
  ambiguousTransactions: number;
  ignoredTransactions: number;
  candidates: MonthlyPlanReconcileCandidateResponse[];
  message: string;
  processedAt: string;
};

export type MonthlyPeriodSummaryResponse = {
  period: FinancialPeriodResponse;
  plannedIncomeTotal: number;
  plannedExpenseTotal: number;
  paidIncomeTotal: number;
  paidExpenseTotal: number;
  pendingIncomeTotal: number;
  pendingExpenseTotal: number;
  realizedIncomeTotal: number;
  realizedExpenseTotal: number;
  plannedAvailableAmount: number;
  unplannedIncomeTotal: number;
  unplannedExpenseTotal: number;
  projectedAvailableAmount: number;
  pendingItems: number;
  paidItems: number;
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

export type InstallmentPurchaseStatus = "ACTIVE" | "COMPLETED" | "CANCELED";
export type InstallmentEntryStatus = "PENDING" | "POSTED" | "PAID" | "CANCELED";
export type InstallmentPaymentSource = "NONE" | "MANUAL" | "AUTOMATIC" | "CHAT" | "PARENT_INVOICE";

export type InstallmentPurchaseEntryResponse = {
  id: number;
  purchaseId: number;
  financialPeriodId: number;
  financialPeriodName?: string | null;
  monthlyPlanItemId?: number | null;
  installmentNumber: number;
  dueDate: string;
  amount: number;
  status: InstallmentEntryStatus;
  paidOn?: string | null;
  paymentSource?: InstallmentPaymentSource | null;
  paidById?: number | null;
  paidByName?: string | null;
  paymentRegisteredAt?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
};

export type InstallmentPurchaseResponse = {
  id: number;
  description: string;
  totalAmount: number;
  installmentCount: number;
  installmentAmount: number;
  purchaseDate: string;
  firstDueDate: string;
  lastDueDate: string;
  status: InstallmentPurchaseStatus;
  categoryId?: number | null;
  categoryName?: string | null;
  notes?: string | null;
  postedInstallments: number;
  paidInstallments: number;
  pendingInstallments: number;
  paidAmount: number;
  remainingAmount: number;
  entries: InstallmentPurchaseEntryResponse[];
  createdAt?: string;
  updatedAt?: string | null;
};

export type InstallmentEntryPaymentPayload = {
  paidOn?: string | null;
};

export type InstallmentPurchasePayload = {
  description: string;
  totalAmount?: number | null;
  installmentCount: number;
  installmentAmount?: number | null;
  purchaseDate?: string | null;
  firstDueDate: string;
  categoryId?: number | null;
  notes?: string | null;
};

export type UserFinancialProfileResponse = {
  id?: number | null;
  age?: number | null;
  ageRange?: string | null;
  profession?: string | null;
  preferredName?: string | null;
  cycleStartDay?: number | null;
  incomeDay?: number | null;
  approximateMonthlyIncome?: number | null;
  initialGoalTargetAmount?: number | null;
  onboardingVersion?: string | null;
  currentFinancialSituation?: string | null;
  spendingHabits?: string | null;
  financialObjectives?: string | null;
  shortTermGoals?: string | null;
  mediumTermGoals?: string | null;
  longTermGoals?: string | null;
  riskTolerance?: string | null;
  investmentKnowledge?: string | null;
  investorProfile?: string | null;
  financialPreferences?: string | null;
  onboardingCompleted: boolean;
  onboardingCompletedAt?: string | null;
  tourCompleted?: boolean;
  tourSkipped?: boolean;
  tourCompletedAt?: string | null;
  tourSkippedAt?: string | null;
  tourLastStepKey?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
};

export type UserFinancialProfilePayload = Omit<UserFinancialProfileResponse, "id" | "createdAt" | "updatedAt" | "onboardingCompletedAt">;

export type FinancialReferenceType = "ARTICLE" | "STUDY" | "PDF" | "VIDEO" | "BOOK" | "OTHER";

export type FinancialReferenceResponse = {
  id: number;
  title: string;
  type: FinancialReferenceType;
  url?: string | null;
  description?: string | null;
  source?: string | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string | null;
};

export type OnboardingFixedBillPayload = {
  description: string;
  amount: number;
  dueDay: number;
};

export type OnboardingSetupPayload = {
  preferredName?: string | null;
  age?: number | null;
  profession?: string | null;
  cycleStartDay: number;
  monthlyIncome: number;
  incomeDay: number;
  fixedBills: OnboardingFixedBillPayload[];
  goals: string[];
  initialGoalTargetAmount?: number | null;
  investmentKnowledge?: string | null;
  riskTolerance?: string | null;
  investorProfile?: string | null;
  startTourAfterOnboarding?: boolean;
};

export type OnboardingStatusResponse = {
  onboardingCompleted: boolean;
  onboardingCompletedAt?: string | null;
  tourCompleted: boolean;
  tourSkipped: boolean;
  tourCompletedAt?: string | null;
  tourSkippedAt?: string | null;
  tourLastStepKey?: string | null;
  shouldShowOnboarding: boolean;
  shouldInviteTour: boolean;
  profile: UserFinancialProfileResponse;
};

export type TourStatePayload = {
  action: "COMPLETE" | "SKIP" | "RESET" | "PROGRESS";
  lastStepKey?: string | null;
};
