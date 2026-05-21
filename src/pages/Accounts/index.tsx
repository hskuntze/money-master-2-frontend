import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import CloseIcon from "@mui/icons-material/Close";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import EditIcon from "@mui/icons-material/Edit";
import LocalAtmIcon from "@mui/icons-material/LocalAtm";
import SavingsIcon from "@mui/icons-material/Savings";
import SearchIcon from "@mui/icons-material/Search";
import SyncIcon from "@mui/icons-material/Sync";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import WalletIcon from "@mui/icons-material/Wallet";
import { Box, Modal } from "@mui/material";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import EmptyState from "@/components/EmptyState";
import {
  AccountBalanceResponse,
  AccountResponse,
  AccountType,
} from "@/types/finance";
import { api } from "@/utils/requests";
import { enumLabel, formatMoney, getErrorMessage } from "@/utils/formatters";

const accountTypes: AccountType[] = [
  "CHECKING",
  "SAVINGS",
  "CASH",
  "CREDIT_CARD",
  "INVESTMENT",
  "OTHER",
];

type AccountForm = {
  name: string;
  type: AccountType;
  initialBalance: number;
  active: boolean;
};

const emptyForm: AccountForm = {
  name: "",
  type: "CHECKING",
  initialBalance: 0,
  active: true,
};

function getAccountIcon(type: AccountType) {
  if (type === "CREDIT_CARD") return <CreditCardIcon />;
  if (type === "INVESTMENT") return <TrendingUpIcon />;
  if (type === "SAVINGS") return <SavingsIcon />;
  if (type === "CASH") return <LocalAtmIcon />;
  if (type === "CHECKING") return <AccountBalanceWalletIcon />;
  return <WalletIcon />;
}

function getAccountAccent(type: AccountType) {
  const accents: Record<AccountType, string> = {
    CHECKING: "#004ac6",
    SAVINGS: "#0f9f6e",
    CASH: "#12956b",
    CREDIT_CARD: "#943700",
    INVESTMENT: "#ff5f00",
    OTHER: "#64748b",
  };

  return accents[type] || accents.OTHER;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [balances, setBalances] = useState<AccountBalanceResponse[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<AccountForm>(emptyForm);
  const [editing, setEditing] = useState<AccountResponse | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const [accountsResponse, balancesResponse] = await Promise.all([
        api.listAccounts(),
        api.accountBalances(),
      ]);
      setAccounts(accountsResponse.data);
      setBalances(balancesResponse.data);
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Não foi possível carregar as contas."),
      );
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const balanceByAccountId = useMemo(() => {
    return balances.reduce<Record<number, AccountBalanceResponse>>(
      (accumulator, balance) => {
        accumulator[balance.accountId] = balance;
        return accumulator;
      },
      {},
    );
  }, [balances]);

  const filteredAccounts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return accounts;

    return accounts.filter((account) =>
      `${account.name} ${enumLabel(account.type)}`
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [accounts, search]);

  const totalBalance = useMemo(
    () =>
      balances.reduce(
        (sum, accountBalance) =>
          sum + Number(accountBalance.currentBalance || 0),
        0,
      ),
    [balances],
  );

  const activeAccounts = useMemo(
    () => accounts.filter((account) => account.active).length,
    [accounts],
  );

  const resetForm = useCallback(() => {
    setForm(emptyForm);
    setEditing(null);
    setModalOpen(false);
  }, []);

  const openCreateModal = useCallback(() => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }, []);

  const edit = useCallback((account: AccountResponse) => {
    setEditing(account);
    setForm({
      name: account.name,
      type: account.type,
      initialBalance: Number(account.initialBalance || 0),
      active: account.active,
    });
    setModalOpen(true);
  }, []);

  const submit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      setLoading(true);

      try {
        const payload = {
          ...form,
          initialBalance: Number(form.initialBalance || 0),
        };

        if (editing) {
          await api.updateAccount(editing.id, payload);
          toast.success("Conta atualizada.");
        } else {
          await api.createAccount(payload);
          toast.success("Conta criada.");
        }

        resetForm();
        await load();
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    },
    [editing, form, load, resetForm],
  );

  const deactivate = useCallback(
    async (id: number) => {
      try {
        await api.deactivateAccount(id);
        toast.success("Conta desativada.");
        await load();
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    },
    [load],
  );

  return (
    <div className="accounts-page page-stack">
      <section className="accounts-heading-row module-heading-row">
        <div>
          <h1>Contas</h1>
          <p>Gerencie suas fontes de receita, gastos e reservas financeiras.</p>
        </div>
        <div className="accounts-search-area">
          <label className="module-search-field" aria-label="Buscar conta">
            <SearchIcon />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar..."
            />
          </label>
        </div>
      </section>

      <section className="accounts-metrics-grid">
        <article className="account-metric-card featured">
          <div>
            <span>Saldo total</span>
            <strong>{formatMoney(totalBalance)}</strong>
            <small className="positive-text">
              Patrimônio disponível nas contas
            </small>
          </div>
          <WalletIcon />
        </article>
        <article className="account-metric-card">
          <div>
            <span>Contas ativas</span>
            <strong>{activeAccounts.toString().padStart(2, "0")}</strong>
            <small>Todas em acompanhamento</small>
          </div>
          <CheckCircleOutlineOutlinedIcon />
        </article>
        <article className="account-metric-card">
          <div>
            <span>Sincronização</span>
            <strong>Atualizado</strong>
            <small>Informações carregadas agora</small>
          </div>
          <SyncIcon />
        </article>
      </section>

      <section className="accounts-list-heading">
        <div>
          <h2>Minhas contas</h2>
          <p>Cadastre onde seu dinheiro entra, sai ou fica guardado.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={openCreateModal}
          type="button"
        >
          <AddIcon /> Nova conta
        </button>
      </section>

      <section className="account-list-card">
        {filteredAccounts.length ? (
          <div className="responsive-table account-table-wrap">
            <table className="account-table">
              <thead>
                <tr>
                  <th>Conta</th>
                  <th>Tipo</th>
                  <th>Saldo inicial</th>
                  <th>Saldo atual</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((account) => {
                  const accent = getAccountAccent(account.type);
                  const balance = balanceByAccountId[account.id];
                  const currentBalance =
                    balance?.currentBalance ?? account.initialBalance;

                  return (
                    <tr key={account.id}>
                      <td>
                        <div className="account-name-cell">
                          <span
                            className="account-icon"
                            style={{ background: `${accent}16`, color: accent }}
                          >
                            {getAccountIcon(account.type)}
                          </span>
                          <div>
                            <strong>{account.name}</strong>
                            <small>
                              {account.type === "CASH"
                                ? "Carteira física"
                                : "Conta financeira"}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="account-type-pill">
                          {enumLabel(account.type)}
                        </span>
                      </td>
                      <td>{formatMoney(account.initialBalance)}</td>
                      <td>
                        <strong
                          className={
                            Number(currentBalance) < 0
                              ? "account-balance negative"
                              : "account-balance"
                          }
                        >
                          {formatMoney(currentBalance)}
                        </strong>
                      </td>
                      <td>
                        <span
                          className={`account-status ${account.active ? "active" : "inactive"}`}
                        >
                          {account.active ? "Ativa" : "Inativa"}
                        </span>
                      </td>
                      <td>
                        <div className="account-actions">
                          <button
                            type="button"
                            onClick={() => edit(account)}
                            title="Editar conta"
                          >
                            <EditIcon />
                          </button>
                          <button
                            type="button"
                            onClick={() => deactivate(account.id)}
                            disabled={!account.active}
                            title="Desativar conta"
                          >
                            <VisibilityOffIcon />
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
            title="Nenhuma conta"
            message="Crie sua primeira conta para começar a registrar lançamentos."
          />
        )}
      </section>

      <Modal
        open={modalOpen}
        onClose={resetForm}
        aria-labelledby="account-modal-title"
      >
        <Box className="mm-modal-box account-modal-box compact-modal">
          <div className="modal-heading">
            <div>
              <span>
                <AccountBalanceWalletIcon /> Conta
              </span>
              <h2 id="account-modal-title">
                {editing ? "Editar conta" : "Nova conta"}
              </h2>
            </div>
            <button type="button" onClick={resetForm}>
              <CloseIcon />
            </button>
          </div>

          <form className="modal-form" onSubmit={submit}>
            <label>
              Nome
              <input
                required
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                placeholder="Conta Itaú, Carteira, Nubank"
              />
            </label>

            <label>
              Tipo
              <select
                value={form.type}
                onChange={(event) =>
                  setForm({ ...form, type: event.target.value as AccountType })
                }
              >
                {accountTypes.map((type) => (
                  <option key={type} value={type}>
                    {enumLabel(type)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Saldo inicial
              <input
                type="number"
                step="0.01"
                value={form.initialBalance}
                onChange={(event) =>
                  setForm({
                    ...form,
                    initialBalance: Number(event.target.value),
                  })
                }
              />
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) =>
                  setForm({ ...form, active: event.target.checked })
                }
              />{" "}
              Ativa
            </label>

            <div className="form-actions modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={resetForm}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                disabled={loading}
                type="submit"
              >
                {editing ? "Salvar conta" : "Criar conta"}
              </button>
            </div>
          </form>
        </Box>
      </Modal>
    </div>
  );
}
