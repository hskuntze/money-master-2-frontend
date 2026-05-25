import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import BarChartIcon from "@mui/icons-material/BarChart";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ChecklistRtlIcon from "@mui/icons-material/ChecklistRtl";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import NorthEastIcon from "@mui/icons-material/NorthEast";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SavingsIcon from "@mui/icons-material/Savings";
import SouthEastIcon from "@mui/icons-material/SouthEast";
import WalletIcon from "@mui/icons-material/Wallet";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "@/components/EmptyState";
import SafeApexChart from "@/components/SafeApexChart";
import {
  CategoryReportResponse,
  DailyCashFlowResponse,
  FinancialPeriodResponse,
  FinancialSummaryResponse,
  FinancialTransactionResponse,
  MonthlyPeriodSummaryResponse,
  MonthlyPlanItemResponse,
  MonthlyPlanItemNature,
  MonthlyPlanItemStatus,
  TransactionType,
} from "@/types/finance";
import { api } from "@/utils/requests";
import { enumLabel, formatDate, formatMoney } from "@/utils/formatters";

const toNumber = (value: number | string | null | undefined) => Number(value || 0);
const percent = (value: number, total: number) => (total > 0 ? Math.min((value / total) * 100, 100) : 0);
const moneyAxis = (value: number) => formatMoney(value).replace("R$", "R$");

function periodLabel(period: FinancialPeriodResponse | null | undefined) {
  if (!period) return "Selecione um ciclo";
  return `${period.name} • ${enumLabel(period.status)} • ${formatDate(period.startDate)} a ${formatDate(period.endDate)}`;
}

function statusLabel(status?: MonthlyPlanItemStatus | null) {
  const labels: Record<MonthlyPlanItemStatus, string> = {
    PENDING: "Pendente",
    PARTIALLY_PAID: "Parcial",
    PAID: "Pago",
    CANCELED: "Cancelado",
  };
  return status ? labels[status] : "-";
}

function statusTone(status?: MonthlyPlanItemStatus | null) {
  if (status === "PAID") return "ok";
  if (status === "PARTIALLY_PAID") return "warning";
  if (status === "CANCELED") return "muted";
  return "pending";
}

function transactionTypeLabel(type?: TransactionType | null) {
  if (type === "INCOME") return "Receita";
  if (type === "EXPENSE") return "Despesa";
  return "Transferência";
}

function transactionTypeTone(type?: TransactionType | null) {
  if (type === "INCOME") return "ok";
  if (type === "EXPENSE") return "danger";
  return "muted";
}

function compactDate(value?: string | null) {
  return value ? formatDate(value) : "-";
}

function sortByDueDate(items: MonthlyPlanItemResponse[]) {
  return [...items].sort((a, b) => `${a.dueDate}-${a.id}`.localeCompare(`${b.dueDate}-${b.id}`));
}

export default function ReportsPage() {
  const [periods, setPeriods] = useState<FinancialPeriodResponse[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [comparePeriodId, setComparePeriodId] = useState<number | null>(null);
  const [period, setPeriod] = useState<FinancialPeriodResponse | null>(null);
  const [monthlySummary, setMonthlySummary] = useState<MonthlyPeriodSummaryResponse | null>(null);
  const [compareSummary, setCompareSummary] = useState<MonthlyPeriodSummaryResponse | null>(null);
  const [planItems, setPlanItems] = useState<MonthlyPlanItemResponse[]>([]);
  const [summary, setSummary] = useState<FinancialSummaryResponse | null>(null);
  const [flow, setFlow] = useState<DailyCashFlowResponse[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<CategoryReportResponse[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<CategoryReportResponse[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransactionResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedPeriod = useMemo(() => periods.find((item) => item.id === selectedPeriodId) || period, [periods, selectedPeriodId, period]);

  const orderedPeriods = useMemo(() => [...periods].sort((a, b) => b.startDate.localeCompare(a.startDate)), [periods]);

  const loadPeriods = useCallback(async () => {
    const [periodsResponse, currentResponse] = await Promise.all([api.listFinancialPeriods(), api.currentFinancialPeriod()]);
    const loadedPeriods = periodsResponse.data || [];
    const current = currentResponse.data;
    setPeriods(loadedPeriods);
    setSelectedPeriodId((previous) => previous || current.id);
    setComparePeriodId((previous) => {
      if (previous) return previous;
      const previousPeriod = loadedPeriods.filter((item) => item.id !== current.id).sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
      return previousPeriod?.id || null;
    });
  }, []);

  const loadReport = useCallback(async () => {
    if (!selectedPeriodId) return;
    setLoading(true);
    try {
      const basePeriod = periods.find((item) => item.id === selectedPeriodId);
      const [periodResponse, monthlySummaryResponse, planItemsResponse] = await Promise.all([
        basePeriod ? Promise.resolve({ data: basePeriod }) : api.getFinancialPeriod(selectedPeriodId),
        api.monthlyPeriodSummary(selectedPeriodId),
        api.listMonthlyPlanItems(selectedPeriodId),
      ]);

      const activePeriod = periodResponse.data;
      setPeriod(activePeriod);
      setMonthlySummary(monthlySummaryResponse.data);
      setPlanItems(planItemsResponse.data || []);

      const [summaryResponse, flowResponse, expensesResponse, incomesResponse, transactionsResponse] = await Promise.all([
        api.summary({ from: activePeriod.startDate, to: activePeriod.endDate }),
        api.dailyCashFlow(activePeriod.startDate, activePeriod.endDate),
        api.categoriesReport(activePeriod.startDate, activePeriod.endDate, "EXPENSE"),
        api.categoriesReport(activePeriod.startDate, activePeriod.endDate, "INCOME"),
        api.listTransactions({
          from: activePeriod.startDate,
          to: activePeriod.endDate,
        }),
      ]);

      setSummary(summaryResponse.data);
      setFlow(flowResponse.data || []);
      setExpenseCategories(expensesResponse.data || []);
      setIncomeCategories(incomesResponse.data || []);
      setTransactions(transactionsResponse.data || []);
    } finally {
      setLoading(false);
    }
  }, [periods, selectedPeriodId]);

  const loadCompare = useCallback(async () => {
    if (!comparePeriodId) {
      setCompareSummary(null);
      return;
    }
    const response = await api.monthlyPeriodSummary(comparePeriodId);
    setCompareSummary(response.data);
  }, [comparePeriodId]);

  useEffect(() => {
    loadPeriods();
  }, [loadPeriods]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  useEffect(() => {
    loadCompare();
  }, [loadCompare]);

  const activeItems = useMemo(() => planItems.filter((item) => item.status !== "CANCELED"), [planItems]);

  const pendingItems = useMemo(
    () => sortByDueDate(activeItems.filter((item) => item.status === "PENDING" || item.status === "PARTIALLY_PAID")),
    [activeItems],
  );

  const overdueItems = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return pendingItems.filter((item) => item.dueDate < today);
  }, [pendingItems]);

  const expenseItems = useMemo(() => activeItems.filter((item) => item.type === "EXPENSE"), [activeItems]);
  const incomeItems = useMemo(() => activeItems.filter((item) => item.type === "INCOME"), [activeItems]);

  const natureTotals = useMemo(() => {
    const build = (type: TransactionType, nature: MonthlyPlanItemNature | "VARIABLE_GROUP") => {
      const items = activeItems.filter(
        (item) => item.type === type && (nature === "VARIABLE_GROUP" ? item.nature !== "FIXED" : item.nature === nature),
      );
      return {
        expected: items.reduce((total, item) => total + toNumber(item.expectedAmount), 0),
        actual: items.reduce((total, item) => total + toNumber(item.actualAmount), 0),
        pending: items.reduce((total, item) => total + Math.max(toNumber(item.expectedAmount) - toNumber(item.actualAmount), 0), 0),
        count: items.length,
      };
    };
    return {
      fixedIncome: build("INCOME", "FIXED"),
      variableIncome: build("INCOME", "VARIABLE_GROUP"),
      fixedExpense: build("EXPENSE", "FIXED"),
      variableExpense: build("EXPENSE", "VARIABLE_GROUP"),
    };
  }, [activeItems]);

  const linkedTransactions = useMemo(() => transactions.filter((transaction) => !!transaction.monthlyPlanItemId), [transactions]);

  const unlinkedTransactions = useMemo(() => transactions.filter((transaction) => !transaction.monthlyPlanItemId), [transactions]);

  const cashFlowOptions: any = useMemo(
    () => ({
      chart: { toolbar: { show: false } },
      stroke: { curve: "smooth", width: 3 },
      dataLabels: { enabled: false },
      xaxis: { categories: flow.map((item) => formatDate(item.date)) },
      yaxis: { labels: { formatter: (value: number) => moneyAxis(value) } },
      legend: { position: "top" },
    }),
    [flow],
  );

  const planVsRealizedOptions: any = useMemo(
    () => ({
      chart: { toolbar: { show: false }, stacked: false },
      plotOptions: { bar: { borderRadius: 8, columnWidth: "52%" } },
      dataLabels: { enabled: false },
      xaxis: { categories: ["Receitas", "Contas"] },
      yaxis: { labels: { formatter: (value: number) => moneyAxis(value) } },
      legend: { position: "top" },
    }),
    [],
  );

  const natureOptions: any = useMemo(
    () => ({
      chart: { toolbar: { show: false } },
      plotOptions: { bar: { borderRadius: 8, horizontal: true } },
      dataLabels: { enabled: false },
      xaxis: { labels: { formatter: (value: number) => moneyAxis(value) } },
      yaxis: { labels: { maxWidth: 160 } },
      legend: { position: "top" },
    }),
    [],
  );

  const categoriesOptions = useCallback(
    (categories: CategoryReportResponse[]): any => ({
      chart: { toolbar: { show: false } },
      plotOptions: { bar: { borderRadius: 8, horizontal: true } },
      dataLabels: { enabled: false },
      xaxis: { labels: { formatter: (value: number) => moneyAxis(value) } },
      yaxis: { labels: { maxWidth: 160 } },
      labels: categories.map((item) => item.categoryName),
    }),
    [],
  );

  const receivedProgress = percent(toNumber(monthlySummary?.paidIncomeTotal), toNumber(monthlySummary?.plannedIncomeTotal));
  const paidProgress = percent(toNumber(monthlySummary?.paidExpenseTotal), toNumber(monthlySummary?.plannedExpenseTotal));
  const associationProgress = percent(linkedTransactions.length, transactions.length);
  const netRealized = toNumber(summary?.incomeTotal) - toNumber(summary?.expenseTotal);

  const comparePeriod = useMemo(
    () => periods.find((item) => item.id === comparePeriodId) || compareSummary?.period || null,
    [periods, comparePeriodId, compareSummary],
  );

  const diff = useMemo(() => {
    if (!monthlySummary || !compareSummary) return null;
    return {
      plannedIncome: toNumber(monthlySummary.plannedIncomeTotal) - toNumber(compareSummary.plannedIncomeTotal),
      plannedExpense: toNumber(monthlySummary.plannedExpenseTotal) - toNumber(compareSummary.plannedExpenseTotal),
      paidIncome: toNumber(monthlySummary.paidIncomeTotal) - toNumber(compareSummary.paidIncomeTotal),
      paidExpense: toNumber(monthlySummary.paidExpenseTotal) - toNumber(compareSummary.paidExpenseTotal),
      projectedAvailable: toNumber(monthlySummary.projectedAvailableAmount) - toNumber(compareSummary.projectedAvailableAmount),
      pendingItems: toNumber(monthlySummary.pendingItems) - toNumber(compareSummary.pendingItems),
    };
  }, [monthlySummary, compareSummary]);

  return (
    <div className="page-stack monthly-reports-page">
      <section className="page-hero compact monthly-report-hero">
        <div>
          <span className="eyebrow">
            <BarChartIcon /> Relatórios
          </span>
          <h1>Relatórios do mês financeiro</h1>
          <p>Analise planejamento, baixas, transações reais e pendências dentro do ciclo selecionado.</p>
        </div>
        <div className="hero-actions">
          <Link className="btn btn-soft" to="/app/monthly-periods">
            <CalendarMonthIcon /> Virada do mês
          </Link>
          <Link className="btn btn-primary" to="/app/transactions">
            <ReceiptLongIcon /> Transações
          </Link>
        </div>
      </section>

      <section className="panel monthly-report-filters">
        <div className="filter-field wide">
          <label>Mês financeiro</label>
          <select value={selectedPeriodId || ""} onChange={(event) => setSelectedPeriodId(Number(event.target.value))}>
            {orderedPeriods.map((item) => (
              <option key={item.id} value={item.id}>
                {periodLabel(item)}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-field wide">
          <label>Comparar com</label>
          <select value={comparePeriodId || ""} onChange={(event) => setComparePeriodId(event.target.value ? Number(event.target.value) : null)}>
            <option value="">Sem comparação</option>
            {orderedPeriods
              .filter((item) => item.id !== selectedPeriodId)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {periodLabel(item)}
                </option>
              ))}
          </select>
        </div>
        <button className="btn btn-primary" onClick={loadReport} disabled={loading}>
          Atualizar
        </button>
      </section>

      <section className="monthly-report-context panel" data-tour="reports">
        <div>
          <span>Ciclo analisado</span>
          <strong>{periodLabel(selectedPeriod)}</strong>
        </div>
        <div>
          <span>Transações reais</span>
          <strong>{transactions.length}</strong>
          <small>{linkedTransactions.length} associadas ao planejamento</small>
        </div>
        <div>
          <span>Pendências</span>
          <strong>{pendingItems.length}</strong>
          <small>{overdueItems.length} vencida(s)</small>
        </div>
        <div>
          <span>Realizado no ciclo</span>
          <strong className={netRealized >= 0 ? "positive-text" : "negative-text"}>{formatMoney(netRealized)}</strong>
          <small>Receitas menos despesas reais</small>
        </div>
      </section>

      <section className="monthly-report-summary-grid">
        <article className="panel monthly-report-main-card">
          <div className="monthly-report-main-card-header">
            <div>
              <span>Disponível projetado</span>
              <strong>{formatMoney(monthlySummary?.projectedAvailableAmount)}</strong>
              <small>Considera receitas/contas planejadas e o que já foi realizado.</small>
            </div>
            <WalletIcon />
          </div>
          <div className="monthly-report-progress-grid">
            <div>
              <div className="progress-headline">
                <span>Recebimento</span>
                <strong>{receivedProgress.toFixed(0)}%</strong>
              </div>
              <div className="progress-track">
                <span className="progress-fill" style={{ width: `${receivedProgress}%` }} />
              </div>
              <small>
                {formatMoney(monthlySummary?.paidIncomeTotal)} de {formatMoney(monthlySummary?.plannedIncomeTotal)}
              </small>
            </div>
            <div>
              <div className="progress-headline">
                <span>Pagamento</span>
                <strong>{paidProgress.toFixed(0)}%</strong>
              </div>
              <div className="progress-track">
                <span className="progress-fill negative-fill" style={{ width: `${paidProgress}%` }} />
              </div>
              <small>
                {formatMoney(monthlySummary?.paidExpenseTotal)} de {formatMoney(monthlySummary?.plannedExpenseTotal)}
              </small>
            </div>
          </div>
        </article>

        <article className="metric-card monthly-report-metric metric-positive">
          <div>
            <span>Rendas planejadas</span>
            <strong>{formatMoney(monthlySummary?.plannedIncomeTotal)}</strong>
            <small>Recebido: {formatMoney(monthlySummary?.paidIncomeTotal)}</small>
          </div>
          <div className="metric-icon">
            <NorthEastIcon />
          </div>
        </article>

        <article className="metric-card monthly-report-metric metric-negative">
          <div>
            <span>Contas planejadas</span>
            <strong>{formatMoney(monthlySummary?.plannedExpenseTotal)}</strong>
            <small>Pago: {formatMoney(monthlySummary?.paidExpenseTotal)}</small>
          </div>
          <div className="metric-icon">
            <SouthEastIcon />
          </div>
        </article>
      </section>

      <section className="monthly-report-kpi-grid">
        <article className="panel">
          <div className="mini-kpi-header">
            <SavingsIcon />
            <span>Rendas pendentes</span>
          </div>
          <strong>{formatMoney(monthlySummary?.pendingIncomeTotal)}</strong>
          <small>Valores previstos ainda não recebidos.</small>
        </article>
        <article className="panel">
          <div className="mini-kpi-header">
            <ChecklistRtlIcon />
            <span>Contas pendentes</span>
          </div>
          <strong>{formatMoney(monthlySummary?.pendingExpenseTotal)}</strong>
          <small>Obrigações previstas ainda não baixadas.</small>
        </article>
        <article className="panel">
          <div className="mini-kpi-header">
            <LinkOutlinedIcon />
            <span>Associação</span>
          </div>
          <strong>{associationProgress.toFixed(0)}%</strong>
          <small>
            {linkedTransactions.length} de {transactions.length} transação(ões) vinculada(s).
          </small>
        </article>
        <article className="panel">
          <div className="mini-kpi-header">
            <AccountBalanceWalletIcon />
            <span>Transações avulsas</span>
          </div>
          <strong>{unlinkedTransactions.length}</strong>
          <small>Lançamentos reais ainda sem item mensal.</small>
        </article>
      </section>

      <section className="monthly-report-grid two-columns">
        <article className="panel large-panel">
          <div className="panel-header">
            <div>
              <h2>Planejado x realizado</h2>
              <small>Mostra o quanto do mês já virou baixa real.</small>
            </div>
          </div>
          <SafeApexChart
            id="monthly-plan-vs-realized"
            options={planVsRealizedOptions}
            series={[
              {
                name: "Planejado",
                data: [toNumber(monthlySummary?.plannedIncomeTotal), toNumber(monthlySummary?.plannedExpenseTotal)],
              },
              {
                name: "Realizado",
                data: [toNumber(monthlySummary?.paidIncomeTotal), toNumber(monthlySummary?.paidExpenseTotal)],
              },
              {
                name: "Pendente",
                data: [toNumber(monthlySummary?.pendingIncomeTotal), toNumber(monthlySummary?.pendingExpenseTotal)],
              },
            ]}
            type="bar"
            height={330}
          />
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <h2>Fixas x variáveis</h2>
              <small>Ajuda a entender o peso de compromissos fixos e gastos variáveis.</small>
            </div>
          </div>
          <SafeApexChart
            id="monthly-nature-report"
            options={{
              ...natureOptions,
              yaxis: {
                categories: ["Renda fixa", "Renda variável", "Conta fixa", "Conta variável"],
              },
            }}
            series={[
              {
                name: "Previsto",
                data: [
                  natureTotals.fixedIncome.expected,
                  natureTotals.variableIncome.expected,
                  natureTotals.fixedExpense.expected,
                  natureTotals.variableExpense.expected,
                ],
              },
              {
                name: "Realizado",
                data: [
                  natureTotals.fixedIncome.actual,
                  natureTotals.variableIncome.actual,
                  natureTotals.fixedExpense.actual,
                  natureTotals.variableExpense.actual,
                ],
              },
            ]}
            type="bar"
            height={330}
          />
        </article>
      </section>

      <section className="monthly-report-grid two-columns">
        <article className="panel large-panel">
          <div className="panel-header">
            <div>
              <h2>Fluxo realizado diário</h2>
              <small>Transações reais registradas no ciclo selecionado.</small>
            </div>
            {period && (
              <small>
                {formatDate(period.startDate)} a {formatDate(period.endDate)}
              </small>
            )}
          </div>
          {flow.length ? (
            <SafeApexChart
              id="reports-cash-flow-monthly"
              options={cashFlowOptions}
              series={[
                {
                  name: "Entradas",
                  data: flow.map((item) => item.incomeTotal),
                },
                { name: "Saídas", data: flow.map((item) => item.expenseTotal) },
                { name: "Resultado", data: flow.map((item) => item.netResult) },
              ]}
              type="line"
              height={330}
            />
          ) : (
            <EmptyState title="Sem fluxo no ciclo" message="As baixas reais ainda não geraram movimentação para o período." />
          )}
        </article>

        <article className="panel pending-report-panel">
          <div className="panel-header">
            <div>
              <h2>Próximas pendências</h2>
              <small>Contas e rendas abertas por vencimento.</small>
            </div>
          </div>
          {pendingItems.length ? (
            <div className="pending-report-list">
              {pendingItems.slice(0, 8).map((item) => (
                <div className="pending-report-item" key={item.id}>
                  <div>
                    <strong>{item.description}</strong>
                    <small>
                      {transactionTypeLabel(item.type)} • {enumLabel(item.nature)} • {compactDate(item.dueDate)}
                    </small>
                  </div>
                  <div className="align-right">
                    <strong>{formatMoney(Math.max(toNumber(item.expectedAmount) - toNumber(item.actualAmount), 0))}</strong>
                    <span className={`status-pill ${statusTone(item.status)}`}>{statusLabel(item.status)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Sem pendências" message="Nenhuma conta ou renda planejada está pendente neste ciclo." />
          )}
        </article>
      </section>

      <section className="monthly-report-grid two-columns">
        <article className="panel">
          <div className="panel-header">
            <div>
              <h2>Despesas reais por categoria</h2>
              <small>Somente valores já baixados/registrados como transação.</small>
            </div>
          </div>
          {expenseCategories.length ? (
            <SafeApexChart
              id="reports-expense-categories-monthly"
              options={categoriesOptions(expenseCategories)}
              series={[
                {
                  name: "Total",
                  data: expenseCategories.map((item) => item.total),
                },
              ]}
              type="bar"
              height={320}
            />
          ) : (
            <EmptyState title="Sem despesas reais" message="As despesas pendentes ainda não foram baixadas neste ciclo." />
          )}
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <h2>Receitas reais por categoria</h2>
              <small>Rendas já recebidas dentro do ciclo selecionado.</small>
            </div>
          </div>
          {incomeCategories.length ? (
            <SafeApexChart
              id="reports-income-categories-monthly"
              options={categoriesOptions(incomeCategories)}
              series={[
                {
                  name: "Total",
                  data: incomeCategories.map((item) => item.total),
                },
              ]}
              type="bar"
              height={320}
            />
          ) : (
            <EmptyState title="Sem receitas reais" message="As receitas planejadas ainda não foram recebidas neste ciclo." />
          )}
        </article>
      </section>

      {diff && (
        <section className="panel monthly-compare-panel">
          <div className="panel-header">
            <div>
              <h2>Comparativo entre ciclos</h2>
              <small>
                {periodLabel(selectedPeriod)} x {periodLabel(comparePeriod)}
              </small>
            </div>
          </div>
          <div className="comparison-result monthly-comparison-result">
            <article>
              <span>Diferença de renda prevista</span>
              <strong className={diff.plannedIncome >= 0 ? "positive-text" : "negative-text"}>{formatMoney(diff.plannedIncome)}</strong>
            </article>
            <article>
              <span>Diferença de contas previstas</span>
              <strong className={diff.plannedExpense <= 0 ? "positive-text" : "negative-text"}>{formatMoney(diff.plannedExpense)}</strong>
            </article>
            <article>
              <span>Diferença de renda recebida</span>
              <strong className={diff.paidIncome >= 0 ? "positive-text" : "negative-text"}>{formatMoney(diff.paidIncome)}</strong>
            </article>
            <article>
              <span>Diferença de contas pagas</span>
              <strong className={diff.paidExpense <= 0 ? "positive-text" : "negative-text"}>{formatMoney(diff.paidExpense)}</strong>
            </article>
            <article>
              <span>Diferença disponível projetado</span>
              <strong className={diff.projectedAvailable >= 0 ? "positive-text" : "negative-text"}>{formatMoney(diff.projectedAvailable)}</strong>
            </article>
            <article>
              <span>Diferença de pendências</span>
              <strong className={diff.pendingItems <= 0 ? "positive-text" : "negative-text"}>{diff.pendingItems}</strong>
            </article>
          </div>
        </section>
      )}

      <section className="panel monthly-report-table-panel">
        <div className="panel-header">
          <div>
            <h2>Resumo dos itens planejados</h2>
            <small>
              {incomeItems.length} renda(s), {expenseItems.length} conta(s) e {transactions.length} transação(ões) reais no ciclo.
            </small>
          </div>
        </div>
        {activeItems.length ? (
          <div className="responsive-table monthly-report-table-wrap">
            <table className="mm-data-table monthly-report-table">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Tipo</th>
                  <th>Natureza</th>
                  <th>Vencimento</th>
                  <th>Status</th>
                  <th className="align-right">Previsto</th>
                  <th className="align-right">Realizado</th>
                  <th className="align-right">Pendente</th>
                </tr>
              </thead>
              <tbody>
                {sortByDueDate(activeItems).map((item) => {
                  const remaining = Math.max(toNumber(item.expectedAmount) - toNumber(item.actualAmount), 0);
                  return (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.description}</strong>
                        <small>{item.categoryName || item.category?.name || "Sem categoria"}</small>
                      </td>
                      <td>
                        <span className={`status-pill ${transactionTypeTone(item.type)}`}>{transactionTypeLabel(item.type)}</span>
                      </td>
                      <td>{enumLabel(item.nature)}</td>
                      <td>{formatDate(item.dueDate)}</td>
                      <td>
                        <span className={`status-pill ${statusTone(item.status)}`}>{statusLabel(item.status)}</span>
                      </td>
                      <td className="align-right">{formatMoney(item.expectedAmount)}</td>
                      <td className="align-right">{formatMoney(item.actualAmount)}</td>
                      <td className="align-right">{formatMoney(remaining)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="Sem planejamento no ciclo"
            message="Cadastre contas fixas, contas variáveis e rendas para gerar relatórios mensais úteis."
            action={
              <Link className="btn btn-primary" to="/app/monthly-periods">
                Abrir Virada do mês
              </Link>
            }
          />
        )}
      </section>

      <section className="panel monthly-report-table-panel">
        <div className="panel-header">
          <div>
            <h2>Transações reais do ciclo</h2>
            <small>Use esta visão para encontrar lançamentos avulsos que ainda precisam ser associados ao planejamento mensal.</small>
          </div>
        </div>
        {transactions.length ? (
          <div className="responsive-table monthly-report-table-wrap">
            <table className="mm-data-table monthly-report-transactions-table">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Tipo</th>
                  <th>Categoria</th>
                  <th>Data</th>
                  <th>Associação</th>
                  <th className="align-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 20).map((transaction) => (
                  <tr key={transaction.id}>
                    <td>
                      <strong>{transaction.description}</strong>
                      <small>{transaction.account?.name || "Sem conta"}</small>
                    </td>
                    <td>
                      <span className={`status-pill ${transactionTypeTone(transaction.type)}`}>{transactionTypeLabel(transaction.type)}</span>
                    </td>
                    <td>{transaction.category?.name || "Sem categoria"}</td>
                    <td>{formatDate(transaction.occurredOn)}</td>
                    <td>
                      {transaction.monthlyPlanItemId ? (
                        <span className="status-pill ok">
                          <LinkOutlinedIcon /> Associada
                        </span>
                      ) : (
                        <span className="status-pill pending">Avulsa</span>
                      )}
                    </td>
                    <td
                      className={`align-right ${transaction.type === "EXPENSE" ? "negative-text" : transaction.type === "INCOME" ? "positive-text" : ""}`}
                    >
                      {transaction.type === "EXPENSE" ? "- " : transaction.type === "INCOME" ? "+ " : ""}
                      {formatMoney(transaction.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="Sem transações reais" message="O ciclo ainda não possui baixas ou lançamentos diários registrados." />
        )}
      </section>
    </div>
  );
}
