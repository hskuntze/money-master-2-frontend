import AddIcon from "@mui/icons-material/Add";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import EventRepeatIcon from "@mui/icons-material/EventRepeat";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import NorthEastIcon from "@mui/icons-material/NorthEast";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import SavingsIcon from "@mui/icons-material/Savings";
import SouthEastIcon from "@mui/icons-material/SouthEast";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import WalletIcon from "@mui/icons-material/Wallet";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "@/components/EmptyState";
import SafeApexChart from "@/components/SafeApexChart";
import { AuthContext } from "@/contexts/AuthContext";
import {
  AccountBalanceResponse,
  CategoryReportResponse,
  DailyCashFlowResponse,
  FinancialPeriodResponse,
  FinancialSummaryResponse,
  FinancialTransactionResponse,
  MonthlyPeriodSummaryResponse,
  MonthlyPlanItemResponse,
  SavingsJarSummaryResponse,
} from "@/types/finance";
import { api } from "@/utils/requests";
import { enumLabel, formatDate, formatMoney } from "@/utils/formatters";

const toNumber = (value: number | string | null | undefined) =>
  Number(value || 0);
const percent = (value: number, total: number) =>
  total > 0 ? Math.min((value / total) * 100, 100) : 0;

function periodLabel(period: FinancialPeriodResponse | null) {
  if (!period) return "Mês financeiro atual";
  return `${period.name} • ${enumLabel(period.status)} • ${formatDate(period.startDate)} a ${formatDate(period.endDate)}`;
}

function statusTone(status?: string | null) {
  if (status === "PAID") return "ok";
  if (status === "PARTIALLY_PAID") return "warning";
  if (status === "CANCELED") return "muted";
  return "pending";
}

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [currentPeriod, setCurrentPeriod] =
    useState<FinancialPeriodResponse | null>(null);
  const [monthlySummary, setMonthlySummary] =
    useState<MonthlyPeriodSummaryResponse | null>(null);
  const [planItems, setPlanItems] = useState<MonthlyPlanItemResponse[]>([]);
  const [summary, setSummary] = useState<FinancialSummaryResponse | null>(null);
  const [balances, setBalances] = useState<AccountBalanceResponse[]>([]);
  const [cashFlow, setCashFlow] = useState<DailyCashFlowResponse[]>([]);
  const [categories, setCategories] = useState<CategoryReportResponse[]>([]);
  const [transactions, setTransactions] = useState<
    FinancialTransactionResponse[]
  >([]);
  const [jars, setJars] = useState<SavingsJarSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [periodResponse, balancesResponse, savingsJarsResponse] =
        await Promise.all([
          api.currentFinancialPeriod(),
          api.accountBalances(),
          api.savingsJarSummary(),
        ]);

      const period = periodResponse.data;
      const from = period.startDate;
      const to = period.endDate;

      const [
        monthlySummaryResponse,
        planItemsResponse,
        summaryResponse,
        cashFlowResponse,
        categoriesResponse,
        transactionsResponse,
      ] = await Promise.all([
        api.monthlyPeriodSummary(period.id),
        api.listMonthlyPlanItems(period.id),
        api.summary({ from, to }),
        api.dailyCashFlow(from, to),
        api.categoriesReport(from, to, "EXPENSE"),
        api.listTransactions({ from, to }),
      ]);

      setCurrentPeriod(period);
      setMonthlySummary(monthlySummaryResponse.data);
      setPlanItems(planItemsResponse.data);
      setSummary(summaryResponse.data);
      setBalances(balancesResponse.data);
      setCashFlow(cashFlowResponse.data);
      setCategories(categoriesResponse.data);
      setTransactions(transactionsResponse.data.slice(0, 6));
      setJars(savingsJarsResponse.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totalBalance = useMemo(
    () =>
      balances.reduce((sum, item) => sum + toNumber(item.currentBalance), 0),
    [balances],
  );
  const totalTracked = totalBalance + toNumber(jars?.totalSaved);
  const netResult = toNumber(summary?.netResult);
  const positiveMonth = netResult >= 0;

  const plannedIncome = toNumber(monthlySummary?.plannedIncomeTotal);
  const plannedExpense = toNumber(monthlySummary?.plannedExpenseTotal);
  const receivedIncome = toNumber(monthlySummary?.paidIncomeTotal);
  const paidExpense = toNumber(monthlySummary?.paidExpenseTotal);
  const pendingIncome = toNumber(monthlySummary?.pendingIncomeTotal);
  const pendingExpense = toNumber(monthlySummary?.pendingExpenseTotal);
  const projectedAvailable = toNumber(monthlySummary?.projectedAvailableAmount);
  const pendingCount = Number(monthlySummary?.pendingItems || 0);
  const paidCount = Number(monthlySummary?.paidItems || 0);
  const incomeProgress = percent(receivedIncome, plannedIncome);
  const expenseProgress = percent(paidExpense, plannedExpense);
  const linkedTransactions = transactions.filter(
    (item) => item.monthlyPlanItemId,
  ).length;

  const nextPendingItems = useMemo(
    () =>
      [...planItems]
        .filter(
          (item) =>
            item.status === "PENDING" || item.status === "PARTIALLY_PAID",
        )
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .slice(0, 6),
    [planItems],
  );

  const cashFlowSeries = useMemo(
    () => [
      {
        name: "Entradas",
        data: cashFlow.map((item) => toNumber(item.incomeTotal)),
      },
      {
        name: "Saídas",
        data: cashFlow.map((item) => toNumber(item.expenseTotal)),
      },
    ],
    [cashFlow],
  );

  const cashFlowOptions = useMemo(
    () => ({
      chart: { toolbar: { show: false }, zoom: { enabled: false } },
      plotOptions: { bar: { borderRadius: 8, columnWidth: "52%" } },
      dataLabels: { enabled: false },
      grid: { borderColor: "#E2E8F0", strokeDashArray: 0 },
      legend: { position: "top", horizontalAlign: "right" },
      xaxis: {
        categories: cashFlow.map((item) => formatDate(item.date).slice(0, 5)),
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          formatter: (value: number) => formatMoney(value).replace("R$", "R$"),
        },
      },
      tooltip: { y: { formatter: (value: number) => formatMoney(value) } },
    }),
    [cashFlow],
  );

  const categoryOptions = useMemo(
    () => ({
      chart: { toolbar: { show: false } },
      labels: categories.map((item) => item.categoryName),
      dataLabels: { enabled: false },
      legend: { show: false },
      stroke: { width: 0 },
      plotOptions: {
        pie: {
          donut: {
            size: "72%",
            labels: {
              show: true,
              total: { show: true, label: "Total", formatter: () => "100%" },
            },
          },
        },
      },
      tooltip: { y: { formatter: (value: number) => formatMoney(value) } },
    }),
    [categories],
  );

  return (
    <div className="mm-home page-stack monthly-first-dashboard">
      <section className="mm-home-header">
        <div>
          <h1>Olá, {user?.name?.split(" ")[0] || "usuário"}!</h1>
          <p>
            Seu mês financeiro no centro: acompanhe planejamento, baixas e
            gastos reais.
          </p>
        </div>
        <div className="mm-home-actions">
          <span className="period-chip">
            <CalendarMonthIcon /> {periodLabel(currentPeriod)}
          </span>
          <Link className="btn btn-outline" to="/app/monthly-periods">
            <EventRepeatIcon /> Virada do mês
          </Link>
          <Link className="btn btn-primary" to="/app/transactions">
            <AddIcon /> Nova transação
          </Link>
        </div>
      </section>

      <section className="finance-badges">
        <span className={pendingCount ? "warning" : "good"}>
          <PendingActionsIcon />{" "}
          {pendingCount
            ? `${pendingCount} item(ns) pendente(s)`
            : "Planejamento em dia"}
        </span>
        <span className={projectedAvailable >= 0 ? "good-blue" : "warning"}>
          <TrendingUpIcon /> Disponível projetado{" "}
          {formatMoney(projectedAvailable)}
        </span>
        <span>
          <CheckCircleOutlineOutlinedIcon /> {paidCount} baixa(s) registrada(s)
          no ciclo
        </span>
      </section>

      <section className="monthly-overview-grid">
        <article className="monthly-main-card">
          <div className="monthly-main-card-header">
            <div>
              <span>Planejamento do mês</span>
              <strong>{formatMoney(projectedAvailable)}</strong>
              <small>
                Disponível projetado considerando valores pendentes e
                realizados.
              </small>
            </div>
            <AccountBalanceWalletIcon />
          </div>

          <div className="monthly-progress-stack">
            <div className="monthly-progress-item income">
              <div>
                <span>Receitas recebidas</span>
                <strong>{formatMoney(receivedIncome)}</strong>
                <small>de {formatMoney(plannedIncome)} planejados</small>
              </div>
              <div className="monthly-progress-track">
                <i style={{ width: `${incomeProgress}%` }} />
              </div>
              <b>{Math.round(incomeProgress)}%</b>
            </div>

            <div className="monthly-progress-item expense">
              <div>
                <span>Contas pagas</span>
                <strong>{formatMoney(paidExpense)}</strong>
                <small>de {formatMoney(plannedExpense)} planejados</small>
              </div>
              <div className="monthly-progress-track">
                <i style={{ width: `${expenseProgress}%` }} />
              </div>
              <b>{Math.round(expenseProgress)}%</b>
            </div>
          </div>
        </article>

        <article className="compact-finance-card income-card monthly-kpi-card">
          <div className="compact-card-top">
            <span>Receitas planejadas</span>
            <SouthEastIcon />
          </div>
          <strong>{formatMoney(plannedIncome)}</strong>
          <small>
            Recebido: {formatMoney(receivedIncome)} · Pendente:{" "}
            {formatMoney(pendingIncome)}
          </small>
          <i />
        </article>

        <article className="compact-finance-card expense-card monthly-kpi-card">
          <div className="compact-card-top">
            <span>Contas planejadas</span>
            <NorthEastIcon />
          </div>
          <strong>{formatMoney(plannedExpense)}</strong>
          <small>
            Pago: {formatMoney(paidExpense)} · Pendente:{" "}
            {formatMoney(pendingExpense)}
          </small>
          <i />
        </article>

        <article className="compact-finance-card result-card monthly-kpi-card">
          <div className="compact-card-top">
            <span>Realizado no ciclo</span>
            <WalletIcon />
          </div>
          <strong>{formatMoney(netResult)}</strong>
          <small>
            {positiveMonth
              ? "Entradas reais superam saídas"
              : "Saídas reais superam entradas"}
          </small>
          <i />
        </article>
      </section>

      <section className="monthly-dashboard-grid">
        <article className="panel pending-plan-panel">
          <div className="panel-header clean">
            <div>
              <h2>Próximas pendências</h2>
              <small>Contas e rendas previstas ainda sem baixa.</small>
            </div>
            <Link to="/app/monthly-periods">
              Gerenciar <KeyboardArrowRightIcon />
            </Link>
          </div>

          {nextPendingItems.length ? (
            <div className="pending-plan-list">
              {nextPendingItems.map((item) => (
                <div className="pending-plan-row" key={item.id}>
                  <div>
                    <strong>{item.description}</strong>
                    <small>
                      {enumLabel(item.type)} · {enumLabel(item.nature)} · vence
                      em {formatDate(item.dueDate)}
                    </small>
                  </div>
                  <span className={`status-pill ${statusTone(item.status)}`}>
                    {enumLabel(item.status)}
                  </span>
                  <b
                    className={
                      item.type === "EXPENSE"
                        ? "negative-text"
                        : "positive-text"
                    }
                  >
                    {formatMoney(item.expectedAmount)}
                  </b>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Sem pendências"
              message="Tudo que estava planejado já foi baixado ou ainda não há planejamento para este ciclo."
            />
          )}
        </article>

        <article className="panel monthly-health-panel">
          <div className="panel-header clean">
            <h2>Saúde do mês</h2>
          </div>
          <div className="monthly-health-list">
            <div>
              <span>Transações recentes vinculadas ao planejamento</span>
              <strong>
                {linkedTransactions}/{transactions.length || 0}
              </strong>
            </div>
            <div>
              <span>Saldo real em contas</span>
              <strong>{formatMoney(totalBalance)}</strong>
            </div>
            <div>
              <span>Total guardado em cofrinhos</span>
              <strong>{formatMoney(jars?.totalSaved)}</strong>
            </div>
            <div>
              <span>Patrimônio acompanhado</span>
              <strong>{formatMoney(totalTracked)}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="home-analytics-grid monthly-analytics-grid">
        <article className="panel saved-ring-card">
          <div
            className="saved-ring"
            style={{
              ["--progress" as any]: `${Math.min(toNumber(jars?.averageProgressPercentage), 100) * 3.6}deg`,
            }}
          >
            <SavingsIcon />
            <span>
              {Math.round(toNumber(jars?.averageProgressPercentage))}%
            </span>
          </div>
          <span>Total guardado</span>
          <strong>{formatMoney(jars?.totalSaved)}</strong>
          <Link to="/app/savings-jars">Ver cofrinhos</Link>
        </article>

        <article className="panel home-chart-card">
          <div className="panel-header clean">
            <h2>Fluxo realizado no ciclo</h2>
            <small>
              {currentPeriod
                ? `${formatDate(currentPeriod.startDate)} a ${formatDate(currentPeriod.endDate)}`
                : "Mês atual"}
            </small>
          </div>
          {cashFlow.length ? (
            <SafeApexChart
              id="home-cash-flow-bars"
              options={cashFlowOptions}
              series={cashFlowSeries}
              type="bar"
              height={280}
            />
          ) : (
            <EmptyState
              title="Sem fluxo realizado"
              message="As transações reais do ciclo aparecerão aqui quando forem registradas ou baixadas."
            />
          )}
        </article>

        <article className="panel category-donut-card">
          <div className="panel-header clean">
            <h2>Gastos reais por categoria</h2>
          </div>
          {categories.length ? (
            <>
              <SafeApexChart
                id="home-categories-donut"
                options={categoryOptions}
                series={categories.map((item) => toNumber(item.total))}
                type="donut"
                height={235}
              />
              <div className="category-legend-list">
                {categories.slice(0, 4).map((item) => (
                  <div key={item.categoryId}>
                    <span>{item.categoryName}</span>
                    <strong>{formatMoney(item.total)}</strong>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState
              title="Sem despesas realizadas"
              message="Nenhuma despesa real encontrada no ciclo atual."
            />
          )}
        </article>
      </section>

      <section className="panel recent-transactions-panel">
        <div className="panel-header clean">
          <div>
            <h2>Transações recentes do ciclo</h2>
            <small>
              Lançamentos reais que alimentam as baixas e o controle do mês.
            </small>
          </div>
          <Link to="/app/transactions">
            Ver extrato completo <KeyboardArrowRightIcon />
          </Link>
        </div>
        {transactions.length ? (
          <div className="recent-table monthly-recent-table">
            <div className="recent-table-head">
              <span>Plano</span>
              <span>Descrição</span>
              <span>Categoria</span>
              <span>Data</span>
              <span>Valor</span>
            </div>
            {transactions.map((item) => (
              <div className="recent-table-row" key={item.id}>
                <span
                  className={`linked-plan-chip ${item.monthlyPlanItemId ? "linked" : "unlinked"}`}
                >
                  {item.monthlyPlanItemId ? <LinkOutlinedIcon /> : null}
                  {item.monthlyPlanItemId ? "Associada" : "Avulsa"}
                </span>
                <strong>{item.description}</strong>
                <small>{item.category?.name || enumLabel(item.type)}</small>
                <small>{formatDate(item.occurredOn)}</small>
                <b
                  className={
                    item.type === "EXPENSE" ? "negative-text" : "positive-text"
                  }
                >
                  {item.type === "EXPENSE" ? "- " : "+ "}
                  {formatMoney(item.amount)}
                </b>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Sem transações reais no ciclo"
            message="Dê baixa em itens planejados ou registre gastos diários pelo chat."
          />
        )}
      </section>

      {loading && (
        <span className="soft-loading">
          Atualizando informações financeiras...
        </span>
      )}
    </div>
  );
}
