import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FilterListIcon from "@mui/icons-material/FilterList";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { Box, Modal } from "@mui/material";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import EmptyState from "../../components/EmptyState";
import {
  CategoryResponse,
  FinancialTransactionPayload,
  FinancialTransactionResponse,
  TransactionType,
} from "../../types/finance";
import { firstDayOfCurrentMonthISO, todayISO } from "../../utils/dates";
import {
  enumLabel,
  formatDate,
  formatMoney,
  getErrorMessage,
} from "../../utils/formatters";
import { formatMoneyInput, parseMoneyInput } from "../../utils/moneyMask";
import { api } from "../../utils/requests";

const types: TransactionType[] = ["EXPENSE", "INCOME", "TRANSFER"];

type TransactionFilters = {
  from: string;
  to: string;
  type: TransactionType | "";
  categoryId: string;
};

const defaultFilters = (): TransactionFilters => ({
  from: firstDayOfCurrentMonthISO(),
  to: todayISO(),
  type: "",
  categoryId: "",
});

const defaultForm = (): FinancialTransactionPayload => ({
  accountId: null,
  categoryId: null,
  type: "EXPENSE",
  description: "",
  amount: 0,
  occurredOn: todayISO(),
  source: "MANUAL",
  notes: "",
});

function getTransactionIcon(type: TransactionType) {
  if (type === "INCOME") return <TrendingUpIcon />;
  if (type === "TRANSFER") return <SwapHorizIcon />;
  return <TrendingDownIcon />;
}

function getTransactionTone(type: TransactionType) {
  if (type === "INCOME") return "income";
  if (type === "TRANSFER") return "transfer";
  return "expense";
}

function daysAgoISO(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<
    FinancialTransactionResponse[]
  >([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [form, setForm] = useState<FinancialTransactionPayload>(defaultForm());
  const [editing, setEditing] = useState<FinancialTransactionResponse | null>(
    null,
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [filters, setFilters] = useState<TransactionFilters>(defaultFilters());
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadBase = useCallback(async () => {
    const categoriesResponse = await api.listCategories();
    setCategories(categoriesResponse.data.filter((item) => item.active));
  }, []);

  const loadTransactions = useCallback(async () => {
    const response = await api.listTransactions({
      from: filters.from || undefined,
      to: filters.to || undefined,
      type: filters.type || undefined,
      categoryId: filters.categoryId || undefined,
    });
    setTransactions(response.data);
  }, [filters]);

  useEffect(() => {
    loadBase().catch((error) => toast.error(getErrorMessage(error)));
  }, [loadBase]);

  useEffect(() => {
    loadTransactions().catch((error) => toast.error(getErrorMessage(error)));
  }, [loadTransactions]);

  const filteredCategories = useMemo(
    () =>
      categories.filter(
        (item) =>
          item.type === form.type ||
          (form.type === "TRANSFER" && item.type === "TRANSFER"),
      ),
    [categories, form.type],
  );

  const advancedCategoryOptions = useMemo(() => {
    if (!filters.type) return categories;
    return categories.filter((item) => item.type === filters.type);
  }, [categories, filters.type]);

  const activeAdvancedFilters = Boolean(filters.categoryId);

  const openCreateModal = useCallback(() => {
    setEditing(null);
    setForm(defaultForm());
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    if (loading) return;
    setModalOpen(false);
    setEditing(null);
    setForm(defaultForm());
  }, [loading]);

  const edit = useCallback((item: FinancialTransactionResponse) => {
    setEditing(item);
    setForm({
      accountId: item.account?.id || null,
      categoryId: item.category?.id || null,
      type: item.type,
      description: item.description,
      amount: item.amount,
      occurredOn: item.occurredOn,
      source: "MANUAL",
      notes: item.notes || "",
    });
    setModalOpen(true);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters());
    setOptionsOpen(false);
  }, []);

  const refreshTransactions = useCallback(() => {
    loadTransactions()
      .then(() => toast.success("Transações atualizadas."))
      .catch((error) => toast.error(getErrorMessage(error)));
    setOptionsOpen(false);
  }, [loadTransactions]);

  const applyLastSevenDays = useCallback(() => {
    setFilters((prev) => ({ ...prev, from: daysAgoISO(7), to: todayISO() }));
    setOptionsOpen(false);
  }, []);

  const applyCurrentMonth = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      from: firstDayOfCurrentMonthISO(),
      to: todayISO(),
    }));
    setOptionsOpen(false);
  }, []);

  const submit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();

      setLoading(true);
      try {
        const payload = {
          ...form,
          categoryId: form.categoryId || null,
          amount: Number(form.amount),
          source: "MANUAL" as const,
        };

        if (editing) {
          await api.updateTransaction(editing.id, payload);
          toast.success("Transação atualizada.");
        } else {
          await api.createTransaction(payload);
          toast.success("Transação criada.");
        }

        setModalOpen(false);
        setEditing(null);
        setForm(defaultForm());
        await loadTransactions();
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    },
    [editing, form, loadTransactions],
  );

  const remove = useCallback(
    async (id: number) => {
      if (!window.confirm("Deseja excluir este lançamento?")) return;

      try {
        await api.deleteTransaction(id);
        toast.success("Transação excluída.");
        await loadTransactions();
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    },
    [loadTransactions],
  );

  return (
    <div className="page-stack transactions-page">
      <section className="page-hero compact transactions-hero">
        <div>
          <span className="eyebrow">Controle manual</span>
          <h1>Histórico diário</h1>
          <p>
            Registre movimentações do dia a dia como detalhes do ciclo mensal. A
            conta principal interna é usada automaticamente.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={openCreateModal}
          type="button"
        >
          <AddIcon /> Nova transação
        </button>
      </section>

      <section
        className="panel mm-table-card transactions-table-card"
        data-tour="transactions-history"
      >
        <div className="mm-table-toolbar">
          <div>
            <h2>Lançamentos do período</h2>
            <p>
              Consulte os registros que compõem categorias, contas do mês e
              histórico financeiro.
            </p>
          </div>
          <div className="mm-table-toolbar-actions">
            <div className="filters-inline compact-filters">
              <input
                type="date"
                value={filters.from}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, from: e.target.value }))
                }
              />
              <input
                type="date"
                value={filters.to}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, to: e.target.value }))
                }
              />
              <select
                value={filters.type}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    type: e.target.value as TransactionType | "",
                    categoryId: "",
                  }))
                }
              >
                <option value="">Todos</option>
                {types.map((type) => (
                  <option key={type} value={type}>
                    {enumLabel(type)}
                  </option>
                ))}
              </select>
            </div>
            <button
              className={`icon-button soft ${advancedFiltersOpen || activeAdvancedFilters ? "active" : ""}`}
              type="button"
              title="Filtros avançados"
              aria-pressed={advancedFiltersOpen}
              onClick={() => setAdvancedFiltersOpen((prev) => !prev)}
            >
              <FilterListIcon />
            </button>
            <div className="transactions-options-wrapper">
              <button
                className={`icon-button ghost ${optionsOpen ? "active" : ""}`}
                type="button"
                title="Mais opções"
                aria-expanded={optionsOpen}
                onClick={() => setOptionsOpen((prev) => !prev)}
              >
                <MoreVertIcon />
              </button>
              {optionsOpen && (
                <div className="transactions-options-menu" role="menu">
                  <button type="button" onClick={applyCurrentMonth}>
                    Mês atual
                  </button>
                  <button type="button" onClick={applyLastSevenDays}>
                    Últimos 7 dias
                  </button>
                  <button type="button" onClick={resetFilters}>
                    Limpar filtros
                  </button>
                  <button type="button" onClick={refreshTransactions}>
                    Atualizar lista
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {advancedFiltersOpen && (
          <div className="transactions-advanced-filters">
            <label>
              Categoria
              <select
                value={filters.categoryId}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    categoryId: e.target.value,
                  }))
                }
              >
                <option value="">Todas as categorias</option>
                {advancedCategoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={resetFilters}
            >
              Limpar filtros
            </button>
          </div>
        )}

        {transactions.length ? (
          <div className="responsive-table transaction-table-wrap">
            <table className="mm-data-table transaction-table">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Tipo</th>
                  <th>Categoria</th>
                  <th>Data</th>
                  <th className="align-right">Valor</th>
                  <th className="align-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((item) => {
                  const tone = getTransactionTone(item.type);

                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="transaction-main-cell">
                          <span className={`transaction-icon ${tone}`}>
                            {getTransactionIcon(item.type)}
                          </span>
                          <span>
                            <strong>{item.description}</strong>
                            <small>
                              {item.notes ||
                                item.category?.name ||
                                "Lançamento financeiro"}
                            </small>
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`transaction-type-pill ${tone}`}>
                          {enumLabel(item.type)}
                        </span>
                      </td>
                      <td>{item.category?.name || "-"}</td>
                      <td>{formatDate(item.occurredOn)}</td>
                      <td className={`transaction-amount align-right ${tone}`}>
                        {item.type === "EXPENSE"
                          ? "- "
                          : item.type === "INCOME"
                            ? "+ "
                            : ""}
                        {formatMoney(item.amount)}
                      </td>
                      <td>
                        <div className="table-actions refined-actions">
                          <button
                            onClick={() => edit(item)}
                            type="button"
                            title="Editar transação"
                          >
                            <EditOutlinedIcon />
                          </button>
                          <button
                            className="danger-action"
                            onClick={() => remove(item.id)}
                            type="button"
                            title="Excluir transação"
                          >
                            <DeleteOutlineOutlinedIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="Sem transações"
            message="Não há lançamentos no período selecionado."
          />
        )}
      </section>

      <Modal open={modalOpen} onClose={closeModal}>
        <Box className="mm-modal-box transaction-modal-box">
          <form className="transaction-modal-form" onSubmit={submit}>
            <div className="modal-title-row">
              <div>
                <span className="eyebrow">
                  {editing ? "Edição" : "Novo lançamento"}
                </span>
                <h2>{editing ? "Editar transação" : "Nova transação"}</h2>
                <p>
                  {editing
                    ? "Atualize os dados do lançamento selecionado."
                    : "Informe os dados para registrar uma movimentação vinculada ao ciclo mensal."}
                </p>
              </div>
              <button
                className="icon-button ghost"
                onClick={closeModal}
                type="button"
                aria-label="Fechar modal"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="form-grid two-columns">
              <label>
                Tipo
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      type: e.target.value as TransactionType,
                      categoryId: null,
                    }))
                  }
                >
                  {types.map((type) => (
                    <option value={type} key={type}>
                      {enumLabel(type)}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Valor
                <input
                  required
                  inputMode="decimal"
                  value={formatMoneyInput(form.amount)}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      amount: parseMoneyInput(e.target.value),
                    }))
                  }
                />
              </label>
            </div>

            <label>
              Descrição
              <input
                required
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Almoço, salário, internet"
              />
            </label>

            <div className="form-grid two-columns">
              <label>
                Data
                <input
                  required
                  type="date"
                  value={form.occurredOn}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, occurredOn: e.target.value }))
                  }
                />
              </label>
            </div>

            <label>
              Categoria
              <select
                value={form.categoryId || ""}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    categoryId: e.target.value ? Number(e.target.value) : null,
                  }))
                }
              >
                <option value="">Sem categoria</option>
                {filteredCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Observação
              <textarea
                value={form.notes || ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Opcional"
              />
            </label>

            <div className="modal-actions end">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={closeModal}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                disabled={loading}
                type="submit"
              >
                <AddIcon />{" "}
                {editing ? "Salvar alterações" : "Cadastrar transação"}
              </button>
            </div>
          </form>
        </Box>
      </Modal>
    </div>
  );
}
