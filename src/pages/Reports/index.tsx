import BarChartIcon from "@mui/icons-material/BarChart";
import { useCallback, useEffect, useMemo, useState } from "react";
import SafeApexChart from "@/components/SafeApexChart";
import MetricCard from "@/components/MetricCard";
import { CategoryReportResponse, ComparativeReportResponse, DailyCashFlowResponse, FinancialSummaryResponse } from "@/types/finance";
import { api } from "@/utils/requests";
import { daysAgoISO, firstDayOfCurrentMonthISO, todayISO } from "@/utils/dates";
import { formatDate, formatMoney } from "@/utils/formatters";

export default function ReportsPage() {
  const [range, setRange] = useState({ from: firstDayOfCurrentMonthISO(), to: todayISO() });
  const [compareRange, setCompareRange] = useState({
    fromA: firstDayOfCurrentMonthISO(),
    toA: todayISO(),
    fromB: daysAgoISO(60),
    toB: daysAgoISO(31),
  });
  const [summary, setSummary] = useState<FinancialSummaryResponse | null>(null);
  const [flow, setFlow] = useState<DailyCashFlowResponse[]>([]);
  const [categories, setCategories] = useState<CategoryReportResponse[]>([]);
  const [compare, setCompare] = useState<ComparativeReportResponse | null>(null);

  const load = useCallback(() => {
    Promise.all([
      api.summary(range),
      api.dailyCashFlow(range.from, range.to),
      api.categoriesReport(range.from, range.to, "EXPENSE"),
      api.compare(compareRange),
    ]).then(([s, f, c, comp]) => {
      setSummary(s.data);
      setFlow(f.data);
      setCategories(c.data);
      setCompare(comp.data);
    });
  }, [range, compareRange]);

  useEffect(() => {
    load();
  }, [load]);

  const flowOptions: any = useMemo(
    () => ({
      chart: { toolbar: { show: false } },
      stroke: { curve: "smooth", width: 3 },
      dataLabels: { enabled: false },
      xaxis: { categories: flow.map((i) => formatDate(i.date)) },
      yaxis: { labels: { formatter: (v: number) => formatMoney(v) } },
    }),
    [flow],
  );

  const categoryOptions: any = useMemo(
    () => ({
      chart: { toolbar: { show: false } },
      xaxis: { categories: categories.map((i) => i.categoryName) },
      yaxis: { labels: { formatter: (v: number) => formatMoney(v) } },
      dataLabels: { enabled: false },
    }),
    [categories],
  );

  return (
    <div className="page-stack">
      <section className="page-hero compact">
        <div>
          <span className="eyebrow">
            <BarChartIcon /> Relatórios
          </span>
          <h1>Análise financeira</h1>
          <p>Compare períodos, categorias e comportamento de fluxo de caixa.</p>
        </div>
      </section>

      <section className="panel filters-panel">
        <div>
          <label>Data inicial</label>
          <input type="date" value={range.from} onChange={(e) => setRange((prev) => ({ ...prev, from: e.target.value }))} />
        </div>
        <div>
          <label>Data final</label>
          <input type="date" value={range.to} onChange={(e) => setRange((prev) => ({ ...prev, to: e.target.value }))} />
        </div>
        <button className="btn btn-primary" onClick={load}>
          Atualizar
        </button>
      </section>

      <section className="metrics-grid">
        <MetricCard title="Entradas" value={formatMoney(summary?.incomeTotal)} tone="positive" />
        <MetricCard title="Saídas" value={formatMoney(summary?.expenseTotal)} tone="negative" />
        <MetricCard title="Transferências" value={formatMoney(summary?.transferTotal)} tone="neutral" />
        <MetricCard
          title="Resultado líquido"
          value={formatMoney(summary?.netResult)}
          tone={(summary?.netResult || 0) >= 0 ? "positive" : "negative"}
        />
      </section>

      <section className="dashboard-grid">
        <article className="panel large-panel">
          <div className="panel-header">
            <h2>Fluxo de caixa diário</h2>
          </div>
          <SafeApexChart
            id="reports-cash-flow"
            options={flowOptions}
            series={[
              { name: "Entradas", data: flow.map((i) => i.incomeTotal) },
              { name: "Saídas", data: flow.map((i) => i.expenseTotal) },
              { name: "Resultado", data: flow.map((i) => i.netResult) },
            ]}
            type="line"
            height={330}
          />
        </article>
        <article className="panel">
          <div className="panel-header">
            <h2>Despesas por categoria</h2>
          </div>
          <SafeApexChart
            id="reports-categories"
            options={categoryOptions}
            series={[{ name: "Total", data: categories.map((i) => i.total) }]}
            type="bar"
            height={330}
          />
        </article>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Comparar períodos</h2>
        </div>
        <div className="compare-grid">
          <div>
            <label>Período A início</label>
            <input type="date" value={compareRange.fromA} onChange={(e) => setCompareRange((prev) => ({ ...prev, fromA: e.target.value }))} />
          </div>
          <div>
            <label>Período A fim</label>
            <input type="date" value={compareRange.toA} onChange={(e) => setCompareRange((prev) => ({ ...prev, toA: e.target.value }))} />
          </div>
          <div>
            <label>Período B início</label>
            <input type="date" value={compareRange.fromB} onChange={(e) => setCompareRange((prev) => ({ ...prev, fromB: e.target.value }))} />
          </div>
          <div>
            <label>Período B fim</label>
            <input type="date" value={compareRange.toB} onChange={(e) => setCompareRange((prev) => ({ ...prev, toB: e.target.value }))} />
          </div>
          <button className="btn btn-primary" onClick={load}>
            Comparar
          </button>
        </div>
        {compare && (
          <div className="comparison-result">
            <article>
              <span>Diferença de entradas</span>
              <strong>{formatMoney(compare.incomeDifference)}</strong>
            </article>
            <article>
              <span>Diferença de saídas</span>
              <strong>{formatMoney(compare.expenseDifference)}</strong>
            </article>
            <article>
              <span>Diferença líquida</span>
              <strong>{formatMoney(compare.netResultDifference)}</strong>
            </article>
          </div>
        )}
      </section>
    </div>
  );
}
