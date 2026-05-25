import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EventRepeatIcon from "@mui/icons-material/EventRepeat";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { Box, Modal } from "@mui/material";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import EmptyState from "@/components/EmptyState";
import {
  CategoryResponse,
  InstallmentPurchasePayload,
  InstallmentPurchaseResponse,
} from "@/types/finance";
import { todayISO } from "@/utils/dates";
import {
  enumLabel,
  formatDate,
  formatMoney,
  getErrorMessage,
} from "@/utils/formatters";
import { formatMoneyInput, parseMoneyInput } from "@/utils/moneyMask";
import { api } from "@/utils/requests";

const defaultForm = (): InstallmentPurchasePayload => ({
  description: "",
  totalAmount: null,
  installmentCount: 2,
  installmentAmount: null,
  purchaseDate: todayISO(),
  firstDueDate: todayISO(),
  categoryId: null,
  notes: "",
});

export default function InstallmentPurchasesPage() {
  const [items, setItems] = useState<InstallmentPurchaseResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [details, setDetails] = useState<InstallmentPurchaseResponse | null>(
    null,
  );
  const [form, setForm] = useState<InstallmentPurchasePayload>(defaultForm());
  const [totalAmountText, setTotalAmountText] = useState("");
  const [installmentAmountText, setInstallmentAmountText] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [purchasesResponse, categoriesResponse] = await Promise.all([
        api.listInstallmentPurchases(),
        api.listCategories("EXPENSE"),
      ]);
      setItems(purchasesResponse.data || []);
      setCategories(categoriesResponse.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeItems = useMemo(
    () => items.filter((item) => item.status === "ACTIVE"),
    [items],
  );

  const totalRemaining = useMemo(
    () =>
      activeItems.reduce(
        (sum, item) => sum + Number(item.remainingAmount || 0),
        0,
      ),
    [activeItems],
  );

  function openCreateModal() {
    setForm(defaultForm());
    setTotalAmountText("");
    setInstallmentAmountText("");
    setModalOpen(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.createInstallmentPurchase({
        ...form,
        totalAmount: parseMoneyInput(totalAmountText) || null,
        installmentAmount: parseMoneyInput(installmentAmountText) || null,
        categoryId: form.categoryId || null,
      });
      toast.success("Compra parcelada criada e lançada nos ciclos mensais.");
      setModalOpen(false);
      await load();
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Não foi possível criar a compra parcelada."),
      );
    } finally {
      setSaving(false);
    }
  }

  async function cancelPurchase(item: InstallmentPurchaseResponse) {
    if (
      !window.confirm(
        `Cancelar a compra parcelada \"${item.description}\"? Parcelas futuras planejadas serão canceladas.`,
      )
    ) {
      return;
    }
    try {
      await api.cancelInstallmentPurchase(item.id);
      toast.success("Compra parcelada cancelada.");
      await load();
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Não foi possível cancelar a compra parcelada."),
      );
    }
  }

  return (
    <div className="page-stack installment-purchases-page">
      <section className="page-hero compact">
        <div>
          <span className="eyebrow">
            <EventRepeatIcon /> Compromissos futuros
          </span>
          <h1>Compras parceladas</h1>
          <p>
            Cadastre compras em parcelas uma única vez. O Money Master cria os
            lançamentos planejados nos ciclos mensais corretos e mostra quanto
            ainda falta pagar.
          </p>
        </div>
        <button
          className="btn btn-primary"
          type="button"
          onClick={openCreateModal}
        >
          <AddIcon /> Nova compra parcelada
        </button>
      </section>

      <section className="metrics-grid three">
        <div className="metric-card">
          <span>Compras ativas</span>
          <strong>{activeItems.length}</strong>
          <small>Compromissos parcelados em aberto</small>
        </div>
        <div className="metric-card">
          <span>Saldo pendente</span>
          <strong>{formatMoney(totalRemaining)}</strong>
          <small>Valor futuro ainda não quitado</small>
        </div>
        <div className="metric-card">
          <span>Compras cadastradas</span>
          <strong>{items.length}</strong>
          <small>Histórico completo de parcelamentos</small>
        </div>
      </section>

      <section className="panel table-panel" data-tour="installments">
        {loading ? (
          <p>Carregando compras parceladas...</p>
        ) : items.length === 0 ? (
          <EmptyState
            title="Nenhuma compra parcelada cadastrada"
            message="Cadastre compras como cursos, eletrônicos e compras no cartão para que as parcelas entrem automaticamente no planejamento mensal."
            action={
              <button
                className="btn btn-primary"
                type="button"
                onClick={openCreateModal}
              >
                Criar compra parcelada
              </button>
            }
          />
        ) : (
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>Compra</th>
                  <th>Parcelas</th>
                  <th>Valor</th>
                  <th>Período</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.description}</strong>
                      <small>{item.categoryName || "Sem categoria"}</small>
                    </td>
                    <td>
                      {item.paidInstallments}/{item.installmentCount} pagas
                      <small>{item.pendingInstallments} pendentes</small>
                    </td>
                    <td>
                      {formatMoney(item.installmentAmount)}
                      <small>Total {formatMoney(item.totalAmount)}</small>
                    </td>
                    <td>
                      {formatDate(item.firstDueDate)}
                      <small>até {formatDate(item.lastDueDate)}</small>
                    </td>
                    <td>
                      <span
                        className={`status-pill ${item.status === "ACTIVE" ? "ok" : "muted"}`}
                      >
                        {enumLabel(item.status)}
                      </span>
                    </td>
                    <td className="table-actions">
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => setDetails(item)}
                        title="Ver parcelas"
                      >
                        <VisibilityOutlinedIcon />
                      </button>
                      {item.status === "ACTIVE" && (
                        <button
                          type="button"
                          className="icon-button danger"
                          onClick={() => cancelPurchase(item)}
                          title="Cancelar"
                        >
                          <DeleteOutlineOutlinedIcon />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Box className="mm-modal-box installment-modal-box">
          <div className="modal-header">
            <div>
              <span className="eyebrow">Nova compra parcelada</span>
              <h2>Registrar compromisso futuro</h2>
            </div>
            <button
              type="button"
              className="icon-button"
              onClick={() => setModalOpen(false)}
            >
              <CloseIcon />
            </button>
          </div>
          <form className="form-grid" onSubmit={handleSubmit}>
            <label>
              Descrição
              <input
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Ex.: Curso de Mandarim"
                required
              />
            </label>
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
                {categories.map((category) => (
                  <option value={category.id} key={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Valor total
              <input
                value={totalAmountText}
                onChange={(e) =>
                  setTotalAmountText(formatMoneyInput(e.target.value))
                }
                placeholder="Opcional se informar valor da parcela"
              />
            </label>
            <label>
              Valor da parcela
              <input
                value={installmentAmountText}
                onChange={(e) =>
                  setInstallmentAmountText(formatMoneyInput(e.target.value))
                }
                placeholder="Ex.: 60,15"
              />
            </label>
            <label>
              Quantidade de parcelas
              <input
                type="number"
                min={1}
                max={120}
                value={form.installmentCount}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    installmentCount: Number(e.target.value),
                  }))
                }
                required
              />
            </label>
            <label>
              Data da compra
              <input
                type="date"
                value={form.purchaseDate || ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, purchaseDate: e.target.value }))
                }
              />
            </label>
            <label>
              Primeira parcela
              <input
                type="date"
                value={form.firstDueDate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, firstDueDate: e.target.value }))
                }
                required
              />
            </label>
            <label className="full-span">
              Observações
              <textarea
                value={form.notes || ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={3}
                placeholder="Ex.: compra no cartão, primeira parcela no ciclo atual"
              />
            </label>
            <div className="modal-actions full-span">
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={saving}
              >
                {saving ? "Salvando..." : "Criar compra"}
              </button>
            </div>
          </form>
        </Box>
      </Modal>

      <Modal open={Boolean(details)} onClose={() => setDetails(null)}>
        <Box className="mm-modal-box installment-modal-box installment-details-modal-box">
          <div className="modal-header">
            <div>
              <span className="eyebrow">Parcelas</span>
              <h2>{details?.description}</h2>
            </div>
            <button
              type="button"
              className="icon-button"
              onClick={() => setDetails(null)}
            >
              <CloseIcon />
            </button>
          </div>
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Ciclo</th>
                  <th>Vencimento</th>
                  <th>Valor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {details?.entries?.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      {entry.installmentNumber}/{details.installmentCount}
                    </td>
                    <td>
                      {entry.financialPeriodName ||
                        `Ciclo #${entry.financialPeriodId}`}
                    </td>
                    <td>{formatDate(entry.dueDate)}</td>
                    <td>{formatMoney(entry.amount)}</td>
                    <td>
                      <span className="status-pill pending">
                        {enumLabel(entry.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Box>
      </Modal>
    </div>
  );
}
