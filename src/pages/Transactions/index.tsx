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
import { AccountResponse, CategoryResponse, FinancialTransactionPayload, FinancialTransactionResponse, TransactionType } from "../../types/finance";
import { firstDayOfCurrentMonthISO, todayISO } from "../../utils/dates";
import { enumLabel, formatDate, formatMoney, getErrorMessage } from "../../utils/formatters";
import { api } from "../../utils/requests";

const types: TransactionType[] = ["EXPENSE", "INCOME", "TRANSFER"];

const defaultForm = (): FinancialTransactionPayload => ({
  accountId: 0,
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

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<FinancialTransactionResponse[]>([]);
  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [form, setForm] = useState<FinancialTransactionPayload>(defaultForm());
  const [editing, setEditing] = useState<FinancialTransactionResponse | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filters, setFilters] = useState({ from: firstDayOfCurrentMonthISO(), to: todayISO(), type: "" as TransactionType | "" });
  const [loading, setLoading] = useState(false);

  const loadBase = useCallback(async () => {
    const [accountsResponse, categoriesResponse] = await Promise.all([api.listAccounts(), api.listCategories()]);
    const activeAccounts = accountsResponse.data.filter((item) => item.active);
    const activeCategories = categoriesResponse.data.filter((item) => item.active);

    setAccounts(activeAccounts);
    setCategories(activeCategories);
    setForm((prev) => (prev.accountId || !activeAccounts[0] ? prev : { ...prev, accountId: activeAccounts[0].id }));
  }, []);

  const loadTransactions = useCallback(async () => {
    const response = await api.listTransactions({ ...filters, type: filters.type || undefined });
    setTransactions(response.data);
  }, [filters]);

  useEffect(() => {
    loadBase().catch((error) => toast.error(getErrorMessage(error)));
  }, [loadBase]);

  useEffect(() => {
    loadTransactions().catch((error) => toast.error(getErrorMessage(error)));
  }, [loadTransactions]);

  const filteredCategories = useMemo(
    () => categories.filter((item) => item.type === form.type || (form.type === "TRANSFER" && item.type === "TRANSFER")),
    [categories, form.type],
  );

  const openCreateModal = useCallback(() => {
    setEditing(null);
    setForm({ ...defaultForm(), accountId: accounts[0]?.id || 0 });
    setModalOpen(true);
  }, [accounts]);

  const closeModal = useCallback(() => {
    if (loading) return;
    setModalOpen(false);
    setEditing(null);
    setForm({ ...defaultForm(), accountId: accounts[0]?.id || 0 });
  }, [accounts, loading]);

  const edit = useCallback((item: FinancialTransactionResponse) => {
    setEditing(item);
    setForm({
      accountId: item.account.id,
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

  const submit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();

      if (!form.accountId) {
        toast.warning("Cadastre ou selecione uma conta.");
        return;
      }

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
        setForm({ ...defaultForm(), accountId: accounts[0]?.id || 0 });
        await loadTransactions();
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    },
    [accounts, editing, form, loadTransactions],
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
          <h1>Transações</h1>
          <p>Registre receitas, despesas e transferências manualmente.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal} type="button">
          <AddIcon /> Nova transação
        </button>
      </section>

      <section className="panel mm-table-card transactions-table-card">
        <div className="mm-table-toolbar">
          <div>
            <h2>Histórico de transações</h2>
            <p>Consulte os lançamentos registrados no período selecionado.</p>
          </div>
          <div className="mm-table-toolbar-actions">
            <div className="filters-inline compact-filters">
              <input type="date" value={filters.from} onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))} />
              <input type="date" value={filters.to} onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))} />
              <select value={filters.type} onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value as TransactionType | "" }))}>
                <option value="">Todos</option>
                {types.map((type) => (
                  <option key={type} value={type}>
                    {enumLabel(type)}
                  </option>
                ))}
              </select>
            </div>
            <button className="icon-button soft" type="button" title="Filtros">
              <FilterListIcon />
            </button>
            <button className="icon-button ghost" type="button" title="Mais opções">
              <MoreVertIcon />
            </button>
          </div>
        </div>

        {transactions.length ? (
          <div className="responsive-table transaction-table-wrap">
            <table className="mm-data-table transaction-table">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Tipo</th>
                  <th>Categoria</th>
                  <th>Conta</th>
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
                          <span className={`transaction-icon ${tone}`}>{getTransactionIcon(item.type)}</span>
                          <span>
                            <strong>{item.description}</strong>
                            <small>{item.notes || item.category?.name || "Lançamento financeiro"}</small>
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`transaction-type-pill ${tone}`}>{enumLabel(item.type)}</span>
                      </td>
                      <td>{item.category?.name || "-"}</td>
                      <td>{item.account.name}</td>
                      <td>{formatDate(item.occurredOn)}</td>
                      <td className={`transaction-amount align-right ${tone}`}>
                        {item.type === "EXPENSE" ? "- " : item.type === "INCOME" ? "+ " : ""}
                        {formatMoney(item.amount)}
                      </td>
                      <td>
                        <div className="table-actions refined-actions">
                          <button onClick={() => edit(item)} type="button" title="Editar transação">
                            <EditOutlinedIcon />
                          </button>
                          <button className="danger-action" onClick={() => remove(item.id)} type="button" title="Excluir transação">
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
          <EmptyState title="Sem transações" message="Não há lançamentos no período selecionado." />
        )}
      </section>

      <Modal open={modalOpen} onClose={closeModal}>
        <Box className="mm-modal-box transaction-modal-box">
          <form className="transaction-modal-form" onSubmit={submit}>
            <div className="modal-title-row">
              <div>
                <span className="eyebrow">{editing ? "Edição" : "Novo lançamento"}</span>
                <h2>{editing ? "Editar transação" : "Nova transação"}</h2>
                <p>{editing ? "Atualize os dados do lançamento selecionado." : "Informe os dados para registrar uma movimentação manual."}</p>
              </div>
              <button className="icon-button ghost" onClick={closeModal} type="button" aria-label="Fechar modal">
                <CloseIcon />
              </button>
            </div>

            <div className="form-grid two-columns">
              <label>
                Tipo
                <select
                  value={form.type}
                  onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as TransactionType, categoryId: null }))}
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
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.amount}
                  onChange={(e) => setForm((prev) => ({ ...prev, amount: Number(e.target.value) }))}
                />
              </label>
            </div>

            <label>
              Descrição
              <input
                required
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Almoço, salário, internet"
              />
            </label>

            <div className="form-grid two-columns">
              <label>
                Data
                <input required type="date" value={form.occurredOn} onChange={(e) => setForm((prev) => ({ ...prev, occurredOn: e.target.value }))} />
              </label>

              <label>
                Conta
                <select value={form.accountId} onChange={(e) => setForm((prev) => ({ ...prev, accountId: Number(e.target.value) }))}>
                  <option value={0}>Selecione</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              Categoria
              <select
                value={form.categoryId || ""}
                onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value ? Number(e.target.value) : null }))}
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
              <textarea value={form.notes || ""} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Opcional" />
            </label>

            <div className="modal-actions end">
              <button type="button" className="btn btn-ghost" onClick={closeModal} disabled={loading}>
                Cancelar
              </button>
              <button className="btn btn-primary" disabled={loading} type="submit">
                <AddIcon /> {editing ? "Salvar alterações" : "Cadastrar transação"}
              </button>
            </div>
          </form>
        </Box>
      </Modal>
    </div>
  );
}
