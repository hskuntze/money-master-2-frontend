import AddIcon from "@mui/icons-material/Add";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import EmptyState from "@/components/EmptyState";
import { AccountResponse, AccountType } from "@/types/finance";
import { api } from "@/utils/requests";
import { enumLabel, formatMoney, getErrorMessage } from "@/utils/formatters";

const accountTypes: AccountType[] = ["CHECKING", "SAVINGS", "CASH", "CREDIT_CARD", "INVESTMENT", "OTHER"];

const emptyForm = { name: "", type: "CHECKING" as AccountType, initialBalance: 0, active: true };

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<AccountResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    api.listAccounts().then((res) => setAccounts(res.data));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (editing) {
        await api.updateAccount(editing.id, form);
        toast.success("Conta atualizada.");
      } else {
        await api.createAccount(form);
        toast.success("Conta criada.");
      }
      setForm(emptyForm);
      setEditing(null);
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  function edit(account: AccountResponse) {
    setEditing(account);
    setForm({ name: account.name, type: account.type, initialBalance: account.initialBalance || 0, active: account.active });
  }

  async function deactivate(id: number) {
    try {
      await api.deactivateAccount(id);
      toast.success("Conta desativada.");
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <div className="page-stack">
      <section className="page-hero compact">
        <div>
          <h1>Contas</h1>
          <p>Cadastre onde seu dinheiro entra, sai ou fica guardado.</p>
        </div>
      </section>

      <section className="management-grid">
        <form className="panel form-panel" onSubmit={submit}>
          <div className="panel-header">
            <h2>{editing ? "Editar conta" : "Nova conta"}</h2>
          </div>
          <label>Nome</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Conta Itaú, Carteira, Nubank" />
          <label>Tipo</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as AccountType })}>
            {accountTypes.map((type) => (
              <option key={type} value={type}>
                {enumLabel(type)}
              </option>
            ))}
          </select>
          <label>Saldo inicial</label>
          <input
            type="number"
            step="0.01"
            value={form.initialBalance}
            onChange={(e) => setForm({ ...form, initialBalance: Number(e.target.value) })}
          />
          <label className="checkbox-row">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Ativa
          </label>
          <div className="form-actions">
            {editing && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setEditing(null);
                  setForm(emptyForm);
                }}
              >
                Cancelar
              </button>
            )}
            <button className="btn btn-primary" disabled={loading} type="submit">
              <AddIcon /> {editing ? "Salvar" : "Criar"}
            </button>
          </div>
        </form>

        <section className="panel table-panel">
          <div className="panel-header">
            <h2>Contas cadastradas</h2>
            <small>{accounts.length} registro(s)</small>
          </div>
          {accounts.length ? (
            <div className="responsive-table">
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Tipo</th>
                    <th>Saldo inicial</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr key={account.id}>
                      <td>{account.name}</td>
                      <td>{enumLabel(account.type)}</td>
                      <td>{formatMoney(account.initialBalance)}</td>
                      <td>
                        <span className={`status-pill ${account.active ? "ok" : "muted"}`}>{account.active ? "Ativa" : "Inativa"}</span>
                      </td>
                      <td className="table-actions">
                        <button onClick={() => edit(account)}>Editar</button>
                        <button onClick={() => deactivate(account.id)}>Desativar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="Nenhuma conta" message="Crie sua primeira conta para começar a registrar lançamentos." />
          )}
        </section>
      </section>
    </div>
  );
}
