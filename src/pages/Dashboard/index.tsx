import AddIcon from "@mui/icons-material/Add";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import NorthEastIcon from "@mui/icons-material/NorthEast";
import SavingsIcon from "@mui/icons-material/Savings";
import SouthEastIcon from "@mui/icons-material/SouthEast";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import WalletIcon from "@mui/icons-material/Wallet";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "@/components/EmptyState";
import ProgressBar from "@/components/ProgressBar";
import SafeApexChart from "@/components/SafeApexChart";
import { AuthContext } from "@/contexts/AuthContext";
import {
  AccountBalanceResponse,
  CategoryReportResponse,
  DailyCashFlowResponse,
  FinancialSummaryResponse,
  FinancialTransactionResponse,
  SavingsJarSummaryResponse,
} from "@/types/finance";
import { daysAgoISO, todayISO } from "@/utils/dates";
import { api } from "@/utils/requests";
import { enumLabel, formatDate, formatMoney } from "@/utils/formatters";

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [summary, setSummary] = useState<FinancialSummaryResponse | null>(null);
  const [balances, setBalances] = useState<AccountBalanceResponse[]>([]);
  const [cashFlow, setCashFlow] = useState<DailyCashFlowResponse[]>([]);
  const [categories, setCategories] = useState<CategoryReportResponse[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransactionResponse[]>([]);
  const [jars, setJars] = useState<SavingsJarSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const from = useMemo(() => daysAgoISO(6), []);
  const to = useMemo(() => todayISO(), []);

  const load = useCallback(() => {
    setLoading(true);

    Promise.all([
      api.summary({ from, to }),
      api.accountBalances(),
      api.dailyCashFlow(from, to),
      api.categoriesReport(from, to, "EXPENSE"),
      api.listTransactions({ from, to }),
      api.savingsJarSummary(),
    ])
      .then(([summaryResponse, balancesResponse, cashFlowResponse, categoriesResponse, transactionsResponse, savingsJarsResponse]) => {
        setSummary(summaryResponse.data);
        setBalances(balancesResponse.data);
        setCashFlow(cashFlowResponse.data);
        setCategories(categoriesResponse.data);
        setTransactions(transactionsResponse.data.slice(0, 6));
        setJars(savingsJarsResponse.data);
      })
      .finally(() => setLoading(false));
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const totalBalance = useMemo(() => balances.reduce((sum, item) => sum + Number(item.currentBalance || 0), 0), [balances]);
  const netResult = Number(summary?.netResult || 0);
  const totalTracked = totalBalance + Number(jars?.totalSaved || 0);
  const positiveMonth = netResult >= 0;

  const cashFlowSeries = useMemo(
    () => [
      { name: "Entradas", data: cashFlow.map((item) => Number(item.incomeTotal || 0)) },
      { name: "Saídas", data: cashFlow.map((item) => Number(item.expenseTotal || 0)) },
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
      yaxis: { labels: { formatter: (value: number) => formatMoney(value).replace("R$", "R$") } },
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
    <div className="mm-home page-stack">
      <section className="mm-home-header">
        <div>
          <h1>Olá, {user?.name?.split(" ")[0] || "usuário"}!</h1>
          <p>Pronto para dominar suas finanças hoje?</p>
        </div>
        <div className="mm-home-actions">
          <span className="period-chip">
            <CalendarMonthIcon /> Últimos 7 dias
          </span>
          <Link className="btn btn-primary" to="/app/transactions">
            <AddIcon /> Nova transação
          </Link>
        </div>
      </section>

      <section className="finance-badges">
        <span className={positiveMonth ? "good" : "warning"}>
          <CheckCircleOutlineOutlinedIcon /> {positiveMonth ? "Receitas > Despesas" : "Atenção ao fluxo"}
        </span>
        <span>
          <TrendingUpIcon /> Patrimônio acompanhado {formatMoney(totalTracked)}
        </span>
      </section>

      <section className="home-metrics-row">
        <article className="balance-highlight-card">
          <div>
            <span>Saldo Total</span>
            <strong>{formatMoney(totalBalance)}</strong>
            <small>{balances.length} conta(s) monitorada(s)</small>
          </div>
          <WalletIcon />
        </article>

        <article className="compact-finance-card income-card">
          <div className="compact-card-top">
            <span>Entradas</span>
            <SouthEastIcon />
          </div>
          <strong>{formatMoney(summary?.incomeTotal)}</strong>
          <i />
        </article>

        <article className="compact-finance-card expense-card">
          <div className="compact-card-top">
            <span>Saídas</span>
            <NorthEastIcon />
          </div>
          <strong>{formatMoney(summary?.expenseTotal)}</strong>
          <i />
        </article>

        <article className="compact-finance-card result-card">
          <div className="compact-card-top">
            <span>Resultado</span>
            <AccountBalanceWalletIcon />
          </div>
          <strong>{formatMoney(netResult)}</strong>
          <small>{positiveMonth ? "Líquido positivo" : "Líquido negativo"}</small>
        </article>
      </section>

      <section className="home-analytics-grid">
        <article className="panel saved-ring-card">
          <div className="saved-ring" style={{ ["--progress" as any]: `${Math.min(Number(jars?.averageProgressPercentage || 0), 100) * 3.6}deg` }}>
            <SavingsIcon />
            <span>{Math.round(Number(jars?.averageProgressPercentage || 0))}%</span>
          </div>
          <span>Total guardado</span>
          <strong>{formatMoney(jars?.totalSaved)}</strong>
          <Link to="/app/savings-jars">Ver cofrinhos</Link>
        </article>

        <article className="panel home-chart-card">
          <div className="panel-header clean">
            <h2>Histórico de Entradas e Saídas</h2>
            <small>
              {formatDate(from)} a {formatDate(to)}
            </small>
          </div>
          {cashFlow.length ? (
            <SafeApexChart id="home-cash-flow-bars" options={cashFlowOptions} series={cashFlowSeries} type="bar" height={280} />
          ) : (
            <EmptyState title="Sem fluxo no período" message="Cadastre transações para visualizar o gráfico." />
          )}
        </article>

        <article className="panel category-donut-card">
          <div className="panel-header clean">
            <h2>Gastos por Categoria</h2>
          </div>
          {categories.length ? (
            <>
              <SafeApexChart
                id="home-categories-donut"
                options={categoryOptions}
                series={categories.map((item) => Number(item.total || 0))}
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
            <EmptyState title="Sem despesas" message="Nenhuma despesa encontrada no período." />
          )}
        </article>
      </section>

      <section className="panel recent-transactions-panel">
        <div className="panel-header clean">
          <h2>Transações Recentes</h2>
          <Link to="/app/transactions">
            Ver extrato completo <KeyboardArrowRightIcon />
          </Link>
        </div>
        {transactions.length ? (
          <div className="recent-table">
            <div className="recent-table-head">
              <span>Status</span>
              <span>Descrição</span>
              <span>Categoria</span>
              <span>Data</span>
              <span>Valor</span>
            </div>
            {transactions.map((item) => (
              <div className="recent-table-row" key={item.id}>
                <span className={`transaction-status-dot ${item.type.toLowerCase()}`}>{item.type === "EXPENSE" ? "−" : "+"}</span>
                <strong>{item.description}</strong>
                <small>{item.category?.name || enumLabel(item.type)}</small>
                <small>{formatDate(item.occurredOn)}</small>
                <b className={item.type === "EXPENSE" ? "negative-text" : "positive-text"}>
                  {item.type === "EXPENSE" ? "- " : "+ "}
                  {formatMoney(item.amount)}
                </b>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Sem transações" message="Use o chat ou o cadastro manual para registrar lançamentos." />
        )}
      </section>

      {loading && <span className="soft-loading">Atualizando informações financeiras...</span>}
    </div>
  );
}
