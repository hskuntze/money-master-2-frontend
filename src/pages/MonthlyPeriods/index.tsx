import AddIcon from "@mui/icons-material/Add";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import CloseIcon from "@mui/icons-material/Close";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import EventRepeatIcon from "@mui/icons-material/EventRepeat";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import PaymentsIcon from "@mui/icons-material/Payments";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import UndoOutlinedIcon from "@mui/icons-material/UndoOutlined";
import { Box, Modal } from "@mui/material";
import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import EmptyState from "@/components/EmptyState";
import {
  CategoryResponse,
  FinancialPeriodResponse,
  FinancialPeriodStatus,
  MonthlyPeriodSummaryResponse,
  FinancialTransactionResponse,
  MonthlyPlanItemAggregationType,
  MonthlyPlanItemPayload,
  MonthlyPlanItemResponse,
  MonthlyPlanItemStatus,
  TransactionType,
} from "@/types/finance";
import { todayISO } from "@/utils/dates";
import { enumLabel, formatDate, formatMoney, getErrorMessage } from "@/utils/formatters";
import { formatMoneyInput, parseMoneyInput } from "@/utils/moneyMask";
import { api } from "@/utils/requests";

const planTypes: TransactionType[] = ["EXPENSE", "INCOME"];
const planStatuses: MonthlyPlanItemStatus[] = ["PENDING", "PARTIALLY_PAID", "PAID", "CANCELED"];

const periodStatuses: FinancialPeriodStatus[] = ["OPEN", "SCHEDULED", "CLOSED"];

const emptyPlanForm = (period?: FinancialPeriodResponse | null): MonthlyPlanItemPayload => ({
  accountId: null,
  categoryId: null,
  type: "EXPENSE",
  description: "",
  expectedAmount: 0,
  actualAmount: 0,
  dueDate: period?.startDate || todayISO(),
  status: "PENDING",
  nature: "VARIABLE",
  aggregationType: "NORMAL",
  parentItemId: null,
  recurring: false,
  recurrenceEndDate: null,
  notes: "",
});

function addOneDayISO(date: string) {
  if (!date) return todayISO();
  const parsed = new Date(`${date}T00:00:00`);
  parsed.setDate(parsed.getDate() + 1);
  return parsed.toISOString().slice(0, 10);
}

function statusTone(status: MonthlyPlanItemStatus) {
  if (status === "PAID") return "ok";
  if (status === "CANCELED") return "muted";
  if (status === "PARTIALLY_PAID") return "warning";
  return "pending";
}

function periodStatusTone(status?: FinancialPeriodStatus | null) {
  if (status === "OPEN") return "ok";
  if (status === "SCHEDULED") return "warning";
  return "muted";
}

function flattenPlanItems(items: MonthlyPlanItemResponse[]): MonthlyPlanItemResponse[] {
  return items.flatMap((item) => [item, ...(item.children ? flattenPlanItems(item.children) : [])]);
}

function isInvoiceParent(item: MonthlyPlanItemResponse) {
  return item.type === "EXPENSE" && item.aggregationType === "GROUP_PARENT" && item.status !== "CANCELED";
}

export default function MonthlyPeriodsPage() {
  const [periods, setPeriods] = useState<FinancialPeriodResponse[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<FinancialPeriodResponse | null>(null);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [summary, setSummary] = useState<MonthlyPeriodSummaryResponse | null>(null);
  const [items, setItems] = useState<MonthlyPlanItemResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [statusFilter, setStatusFilter] = useState<MonthlyPlanItemStatus | "">("");
  const [planForm, setPlanForm] = useState<MonthlyPlanItemPayload>(emptyPlanForm());
  const [editingItem, setEditingItem] = useState<MonthlyPlanItemResponse | null>(null);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkingItem, setLinkingItem] = useState<MonthlyPlanItemResponse | null>(null);
  const [unlinkedTransactions, setUnlinkedTransactions] = useState<FinancialTransactionResponse[]>([]);
  const [linkOnlyUnlinked, setLinkOnlyUnlinked] = useState(true);
  const [expandedInvoiceIds, setExpandedInvoiceIds] = useState<number[]>([]);
  const [invoiceChildrenModalOpen, setInvoiceChildrenModalOpen] = useState(false);
  const [invoiceChildrenParent, setInvoiceChildrenParent] = useState<MonthlyPlanItemResponse | null>(null);
  const [invoiceChildCandidates, setInvoiceChildCandidates] = useState<MonthlyPlanItemResponse[]>([]);
  const [selectedInvoiceChildIds, setSelectedInvoiceChildIds] = useState<number[]>([]);
  const [turnoverDate, setTurnoverDate] = useState(todayISO());
  const [newPeriodName, setNewPeriodName] = useState("");
  const [cycleForm, setCycleForm] = useState({
    name: "",
    startDate: todayISO(),
    endDate: todayISO(),
    status: "OPEN" as FinancialPeriodStatus,
  });
  const [loading, setLoading] = useState(false);

  const selectedPeriod = useMemo(
    () => periods.find((period) => period.id === selectedPeriodId) || currentPeriod,
    [currentPeriod, periods, selectedPeriodId],
  );

  const selectedPeriodIdValue = selectedPeriod?.id;
  const selectedPeriodClosed = selectedPeriod?.status === "CLOSED";
  const selectedPeriodScheduled = selectedPeriod?.status === "SCHEDULED";

  const invoiceParentOptions = useMemo(() => flattenPlanItems(items).filter(isInvoiceParent), [items]);

  const projectedAvailable = summary?.projectedAvailableAmount ?? 0;
  const plannedAvailable = summary?.plannedAvailableAmount ?? projectedAvailable;
  const unplannedImpact = (summary?.unplannedIncomeTotal ?? 0) - (summary?.unplannedExpenseTotal ?? 0);

  const loadBase = useCallback(async () => {
    const [periodsResponse, currentResponse, categoriesResponse] = await Promise.all([
      api.listFinancialPeriods(),
      api.currentFinancialPeriod(),
      api.listCategories(),
    ]);

    const mergedPeriods = periodsResponse.data.some((period) => period.id === currentResponse.data.id)
      ? periodsResponse.data
      : [currentResponse.data, ...periodsResponse.data];

    setPeriods(mergedPeriods);
    setCurrentPeriod(currentResponse.data);
    setSelectedPeriodId(currentResponse.data.id);
    setTurnoverDate(addOneDayISO(currentResponse.data.endDate));
    setCategories(categoriesResponse.data.filter((category) => category.active));
  }, [selectedPeriodClosed]);

  const loadPeriodData = useCallback(async () => {
    if (!selectedPeriodIdValue) return;

    const [summaryResponse, itemsResponse] = await Promise.all([
      api.monthlyPeriodSummary(selectedPeriodIdValue),
      api.listMonthlyPlanItems(selectedPeriodIdValue, statusFilter),
    ]);

    setSummary(summaryResponse.data);
    setItems(itemsResponse.data);
  }, [selectedPeriodIdValue, statusFilter]);

  useEffect(() => {
    loadBase().catch((error) => toast.error(getErrorMessage(error, "Não foi possível carregar os meses financeiros.")));
  }, [loadBase]);

  useEffect(() => {
    loadPeriodData().catch((error) => toast.error(getErrorMessage(error, "Não foi possível carregar o planejamento do mês.")));
  }, [loadPeriodData]);

  useEffect(() => {
    if (!selectedPeriod) return;
    setCycleForm({
      name: selectedPeriod.name || "",
      startDate: selectedPeriod.startDate,
      endDate: selectedPeriod.endDate,
      status: selectedPeriod.status,
    });
    setTurnoverDate(addOneDayISO(selectedPeriod.endDate));
  }, [selectedPeriod]);

  const filteredCategories = useMemo(() => categories.filter((category) => category.type === planForm.type), [categories, planForm.type]);

  const openCreatePlan = useCallback(() => {
    if (selectedPeriodClosed) {
      toast.warning("Reabra o ciclo antes de criar novos itens planejados.");
      return;
    }
    setEditingItem(null);
    setPlanForm({
      ...emptyPlanForm(selectedPeriod),
      accountId: null,
    });
    setPlanModalOpen(true);
  }, [selectedPeriod, selectedPeriodClosed]);

  const openEditPlan = useCallback(
    (item: MonthlyPlanItemResponse) => {
      if (selectedPeriodClosed) {
        toast.warning("Reabra o ciclo antes de editar itens planejados.");
        return;
      }
      setEditingItem(item);
      setPlanForm({
        accountId: item.accountId || null,
        categoryId: item.categoryId || null,
        type: item.type,
        description: item.description,
        expectedAmount: item.expectedAmount,
        actualAmount: item.actualAmount,
        dueDate: item.dueDate,
        paidOn: item.paidOn || null,
        status: item.status,
        nature: item.nature,
        aggregationType: item.aggregationType || "NORMAL",
        parentItemId: item.parentItemId || null,
        recurring: item.recurring,
        recurrenceEndDate: item.recurrenceEndDate || null,
        notes: item.notes || "",
      });
      setPlanModalOpen(true);
    },
    [selectedPeriodClosed],
  );

  const closePlanModal = useCallback(() => {
    if (loading) return;
    setPlanModalOpen(false);
    setEditingItem(null);
    setPlanForm(emptyPlanForm(selectedPeriod));
  }, [loading, selectedPeriod]);

  const submitPlan = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (!selectedPeriodIdValue) return;
      if (!planForm.description.trim()) {
        toast.warning("Informe a descrição do item planejado.");
        return;
      }
      if (planForm.aggregationType === "GROUP_CHILD" && !planForm.parentItemId) {
        toast.warning("Selecione a fatura vinculada para este item interno.");
        return;
      }

      setLoading(true);
      try {
        const aggregationType = (planForm.aggregationType || "NORMAL") as MonthlyPlanItemAggregationType;
        const payload: MonthlyPlanItemPayload = {
          ...planForm,
          accountId: planForm.accountId || null,
          categoryId: planForm.categoryId || null,
          expectedAmount: Number(planForm.expectedAmount || 0),
          actualAmount: Number(planForm.actualAmount || 0),
          aggregationType,
          parentItemId: aggregationType === "GROUP_CHILD" ? planForm.parentItemId || null : null,
          nature: aggregationType === "GROUP_PARENT" ? "CREDIT_CARD" : planForm.nature || "VARIABLE",
          recurring: aggregationType === "GROUP_CHILD" ? false : Boolean(planForm.recurring),
          recurrenceEndDate: planForm.recurring && aggregationType !== "GROUP_CHILD" ? planForm.recurrenceEndDate || null : null,
          notes: planForm.notes || null,
        };

        if (editingItem) {
          await api.updateMonthlyPlanItem(editingItem.id, payload);
          toast.success("Item do mês atualizado.");
        } else {
          await api.createMonthlyPlanItem(selectedPeriodIdValue, payload);
          toast.success("Item do mês criado.");
        }

        setPlanModalOpen(false);
        setEditingItem(null);
        await loadPeriodData();
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    },
    [editingItem, loadPeriodData, planForm, selectedPeriodIdValue],
  );

  const submitTurnover = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (!turnoverDate) {
        toast.warning("Informe a data da virada.");
        return;
      }

      setLoading(true);
      try {
        const response = await api.turnoverFinancialPeriod({
          turnoverDate,
          newPeriodName: newPeriodName || null,
        });
        toast.success(
          turnoverDate > todayISO() ? "Próximo ciclo agendado. O ciclo atual continua aberto até a data definida." : "Virada do mês realizada.",
        );
        setNewPeriodName("");
        await loadBase();
        setSelectedPeriodId(response.data.id);
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    },
    [loadBase, newPeriodName, turnoverDate],
  );

  const submitCycleSettings = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (!selectedPeriodIdValue) return;
      if (!cycleForm.startDate || !cycleForm.endDate) {
        toast.warning("Informe o início e o fim do ciclo.");
        return;
      }
      setLoading(true);
      try {
        const response = await api.updateFinancialPeriod(selectedPeriodIdValue, {
          name: cycleForm.name || null,
          startDate: cycleForm.startDate,
          endDate: cycleForm.endDate,
          status: cycleForm.status,
        });
        toast.success("Ciclo financeiro atualizado.");
        await loadBase();
        setSelectedPeriodId(response.data.id);
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    },
    [cycleForm, loadBase, selectedPeriodIdValue],
  );

  const reopenSelectedPeriod = useCallback(async () => {
    if (!selectedPeriodIdValue) return;
    setLoading(true);
    try {
      const response = await api.reopenFinancialPeriod(selectedPeriodIdValue);
      toast.success("Ciclo reaberto como ciclo ativo.");
      await loadBase();
      setSelectedPeriodId(response.data.id);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [loadBase, selectedPeriodIdValue]);

  const closeSelectedPeriod = useCallback(async () => {
    if (!selectedPeriodIdValue || !selectedPeriod) return;
    if (
      !window.confirm(`Fechar o ciclo "${selectedPeriod.name}"?

O backend bloqueará o fechamento se existirem contas ou rendas pendentes.`)
    )
      return;
    setLoading(true);
    try {
      const response = await api.closeFinancialPeriod(selectedPeriodIdValue);
      toast.success("Ciclo fechado com sucesso.");
      await loadBase();
      setSelectedPeriodId(response.data.id);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [loadBase, selectedPeriod, selectedPeriodIdValue]);

  const registerPayment = useCallback(
    async (item: MonthlyPlanItemResponse) => {
      if (selectedPeriodClosed) {
        toast.warning("Reabra o ciclo antes de registrar baixa.");
        return;
      }
      if (item.aggregationType === "GROUP_CHILD" && item.parentItemId) {
        toast.warning(`Esta parcela está vinculada à fatura "${item.parentItemDescription || "principal"}". Registre a baixa na fatura.`);
        return;
      }
      if (item.status === "PAID") return;
      const accountId = item.accountId || null;
      const remaining = Math.max(Number(item.expectedAmount || 0) - Number(item.actualAmount || 0), 0);
      const amount = remaining > 0 ? remaining : Number(item.expectedAmount || 0);

      try {
        await api.payMonthlyPlanItem(item.id, {
          accountId,
          categoryId: item.categoryId || null,
          amount,
          occurredOn: todayISO(),
          preferExistingTransaction: true,
          notes: "Baixa solicitada pela tela de virada do mês.",
        });
        toast.success(item.type === "EXPENSE" ? "Baixa de pagamento processada." : "Baixa de recebimento processada.");
        await loadPeriodData();
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    },
    [loadPeriodData, selectedPeriodClosed],
  );

  const reopenPlanItem = useCallback(
    async (item: MonthlyPlanItemResponse) => {
      if (selectedPeriodClosed) {
        toast.warning("Reabra o ciclo antes de desfazer baixas.");
        return;
      }
      if (item.aggregationType === "GROUP_CHILD" && item.parentItemId) {
        toast.warning(`Esta parcela está vinculada à fatura "${item.parentItemDescription || "principal"}". Reabra/desfaça a baixa pela fatura.`);
        return;
      }
      if (item.actualAmount <= 0 && item.status === "PENDING") {
        toast.info("Este item já está pendente.");
        return;
      }

      const deleteLinkedTransactions = window.confirm(
        `Deseja excluir as transações vinculadas a "${item.description}"?\n\nOK = excluir as transações e remover impacto do saldo/dashboard.\nCancelar = apenas desvincular e manter as transações como lançamentos avulsos.`,
      );

      const confirmed = window.confirm(
        deleteLinkedTransactions
          ? `Confirmar: marcar "${item.description}" como pendente e excluir as transações vinculadas?`
          : `Confirmar: marcar "${item.description}" como pendente e manter as transações como avulsas?`,
      );
      if (!confirmed) return;

      setLoading(true);
      try {
        await api.reopenMonthlyPlanItem(item.id, {
          deleteLinkedTransactions,
          keepTransactionsUnlinked: !deleteLinkedTransactions,
          notes: deleteLinkedTransactions
            ? "Baixa desfeita pela tela. Transações vinculadas excluídas."
            : "Baixa desfeita pela tela. Transações vinculadas mantidas como avulsas.",
        });
        toast.success("Item marcado como pendente.");
        await loadPeriodData();
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    },
    [loadPeriodData, selectedPeriodClosed],
  );

  const openLinkTransactionModal = useCallback(
    async (item: MonthlyPlanItemResponse) => {
      if (item.aggregationType === "GROUP_CHILD" && item.parentItemId) {
        toast.warning("Itens internos de fatura não recebem baixa individual. Use a fatura principal.");
        return;
      }
      setLinkingItem(item);
      setLinkModalOpen(true);
      setLoading(true);
      try {
        const response = await api.listUnlinkedPeriodTransactions(item.financialPeriodId, item.type, linkOnlyUnlinked);
        setUnlinkedTransactions(response.data);
      } catch (error) {
        toast.error(getErrorMessage(error, "Não foi possível carregar transações avulsas."));
      } finally {
        setLoading(false);
      }
    },
    [linkOnlyUnlinked],
  );

  const closeLinkTransactionModal = useCallback(() => {
    if (loading) return;
    setLinkModalOpen(false);
    setLinkingItem(null);
    setUnlinkedTransactions([]);
  }, [loading]);

  const linkExistingTransaction = useCallback(
    async (transaction: FinancialTransactionResponse) => {
      if (!linkingItem) return;
      setLoading(true);
      try {
        await api.linkTransactionToMonthlyPlanItem(linkingItem.id, {
          transactionId: transaction.id,
          copyCategoryFromPlanItem: true,
          copyAccountFromPlanItem: false,
          forceRelink: !linkOnlyUnlinked,
        });
        toast.success("Transação associada ao item do mês.");
        closeLinkTransactionModal();
        await loadPeriodData();
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    },
    [closeLinkTransactionModal, linkOnlyUnlinked, linkingItem, loadPeriodData],
  );

  const reconcileTransactions = useCallback(async () => {
    if (!selectedPeriodIdValue) return;
    const createMissing = window.confirm(
      "Deseja criar itens planejados automaticamente para transações sem correspondência? Clique em Cancelar para apenas associar o que já tiver item planejado compatível.",
    );
    setLoading(true);
    try {
      const preview = await api.reconcileMonthlyPlanTransactions(selectedPeriodIdValue, {
        dryRun: true,
        linkExistingTransactions: true,
        createMissingPlanItems: createMissing,
        onlyUnlinkedTransactions: true,
        defaultNature: "VARIABLE",
        recurring: false,
      });
      const message = `${preview.data.analyzedTransactions} transação(ões) analisada(s). ${preview.data.matchedTransactions} associação(ões) seguras. ${preview.data.ambiguousTransactions} ambígua(s).`;
      if (
        !window.confirm(`${message}

Executar esta conciliação agora?`)
      )
        return;
      const result = await api.reconcileMonthlyPlanTransactions(selectedPeriodIdValue, {
        dryRun: false,
        linkExistingTransactions: true,
        createMissingPlanItems: createMissing,
        onlyUnlinkedTransactions: true,
        defaultNature: "VARIABLE",
        recurring: false,
      });
      toast.success(`Conciliação concluída: ${result.data.linkedTransactions} transação(ões) associada(s).`);
      await loadPeriodData();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [loadPeriodData, selectedPeriodIdValue]);

  const createPendingPlanFromTransactions = useCallback(async () => {
    if (!selectedPeriodIdValue) return;
    const deleteSources = window.confirm(
      "Deseja excluir as transações usadas como modelo?\n\nOK = criar itens pendentes e excluir as transações reais, removendo impacto no saldo/dashboard.\nCancelar = criar itens pendentes e manter transações avulsas.",
    );
    if (
      !window.confirm(
        deleteSources
          ? "Confirmar criação de planejamento pendente e exclusão das transações usadas como modelo?"
          : "Confirmar criação de planejamento pendente mantendo as transações como avulsas?",
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const result = await api.reconcileMonthlyPlanTransactions(selectedPeriodIdValue, {
        dryRun: false,
        linkExistingTransactions: false,
        createMissingPlanItems: true,
        onlyUnlinkedTransactions: true,
        defaultNature: "VARIABLE",
        recurring: false,
        createPlanItemsAsPendingOnly: true,
        deleteSourceTransactionsWhenCreatingPlanItems: deleteSources,
      });
      toast.success(`Planejamento criado: ${result.data.createdPlanItems} item(ns) pendente(s).`);
      await loadPeriodData();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [loadPeriodData, selectedPeriodIdValue]);

  const cancelItem = useCallback(
    async (item: MonthlyPlanItemResponse) => {
      if (selectedPeriodClosed) {
        toast.warning("Reabra o ciclo antes de cancelar itens.");
        return;
      }
      if (!window.confirm(`Deseja cancelar "${item.description}"?`)) return;
      try {
        await api.cancelMonthlyPlanItem(item.id);
        toast.success("Item cancelado.");
        await loadPeriodData();
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    },
    [loadPeriodData, selectedPeriodClosed],
  );

  const toggleInvoiceExpanded = useCallback((itemId: number) => {
    setExpandedInvoiceIds((current) => (current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId]));
  }, []);

  const openInvoiceChildrenModal = useCallback(
    async (invoice: MonthlyPlanItemResponse) => {
      if (selectedPeriodClosed) {
        toast.warning("Reabra o ciclo antes de vincular parcelas à fatura.");
        return;
      }
      setInvoiceChildrenParent(invoice);
      setInvoiceChildrenModalOpen(true);
      setSelectedInvoiceChildIds([]);
      setLoading(true);
      try {
        const response = await api.listInvoiceChildCandidates(invoice.id);
        setInvoiceChildCandidates(response.data);
      } catch (error) {
        toast.error(getErrorMessage(error, "Não foi possível carregar os itens disponíveis para vínculo."));
      } finally {
        setLoading(false);
      }
    },
    [selectedPeriodClosed],
  );

  const closeInvoiceChildrenModal = useCallback(() => {
    if (loading) return;
    setInvoiceChildrenModalOpen(false);
    setInvoiceChildrenParent(null);
    setInvoiceChildCandidates([]);
    setSelectedInvoiceChildIds([]);
  }, [loading]);

  const linkItemToInvoice = useCallback(
    async (candidate: MonthlyPlanItemResponse) => {
      if (!invoiceChildrenParent) return;
      setLoading(true);
      try {
        await api.linkMonthlyPlanItemToInvoice(invoiceChildrenParent.id, candidate.id);
        toast.success("Item vinculado à fatura.");
        setExpandedInvoiceIds((current) => (current.includes(invoiceChildrenParent.id) ? current : [...current, invoiceChildrenParent.id]));
        const candidatesResponse = await api.listInvoiceChildCandidates(invoiceChildrenParent.id);
        setInvoiceChildCandidates(candidatesResponse.data);
        setSelectedInvoiceChildIds((current) => current.filter((id) => id !== candidate.id));
        await loadPeriodData();
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    },
    [invoiceChildrenParent, loadPeriodData],
  );

  const toggleInvoiceChildSelection = useCallback((itemId: number) => {
    setSelectedInvoiceChildIds((current) => (current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId]));
  }, []);

  const toggleAllInvoiceChildCandidates = useCallback(() => {
    setSelectedInvoiceChildIds((current) =>
      current.length === invoiceChildCandidates.length ? [] : invoiceChildCandidates.map((candidate) => candidate.id),
    );
  }, [invoiceChildCandidates]);

  const linkSelectedItemsToInvoice = useCallback(async () => {
    if (!invoiceChildrenParent || selectedInvoiceChildIds.length === 0) return;
    setLoading(true);
    try {
      for (const childId of selectedInvoiceChildIds) {
        await api.linkMonthlyPlanItemToInvoice(invoiceChildrenParent.id, childId);
      }
      toast.success(`${selectedInvoiceChildIds.length} item(ns) vinculado(s) à fatura.`);
      setExpandedInvoiceIds((current) => (current.includes(invoiceChildrenParent.id) ? current : [...current, invoiceChildrenParent.id]));
      const candidatesResponse = await api.listInvoiceChildCandidates(invoiceChildrenParent.id);
      setInvoiceChildCandidates(candidatesResponse.data);
      setSelectedInvoiceChildIds([]);
      await loadPeriodData();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [invoiceChildrenParent, loadPeriodData, selectedInvoiceChildIds]);

  const unlinkItemFromInvoice = useCallback(
    async (item: MonthlyPlanItemResponse) => {
      if (selectedPeriodClosed) {
        toast.warning("Reabra o ciclo antes de desvincular itens da fatura.");
        return;
      }
      if (!window.confirm(`Desvincular "${item.description}" da fatura? Ele voltará a somar como item normal do mês.`)) return;
      setLoading(true);
      try {
        await api.unlinkMonthlyPlanItemFromInvoice(item.id);
        toast.success("Item desvinculado da fatura.");
        await loadPeriodData();
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    },
    [loadPeriodData, selectedPeriodClosed],
  );

  const renderPlanItemRow = (item: MonthlyPlanItemResponse, child = false): ReactNode => {
    const children = item.children || [];
    const isParent = item.aggregationType === "GROUP_PARENT";
    const isChild = child || item.aggregationType === "GROUP_CHILD";
    const expanded = expandedInvoiceIds.includes(item.id);
    const canExpand = isParent || children.length > 0;
    const difference = Number(item.childDifference || 0);

    return (
      <>
        <tr key={item.id} className={`${isParent ? "monthly-plan-parent-row" : ""} ${isChild ? "monthly-plan-child-row" : ""}`}>
          <td>
            <div className={isChild ? "monthly-plan-child-description" : "monthly-plan-description-cell"}>
              {isChild && <span className="monthly-plan-child-rail" aria-hidden="true" />}
              {canExpand ? (
                <button
                  type="button"
                  className="monthly-plan-group-toggle"
                  onClick={() => toggleInvoiceExpanded(item.id)}
                  aria-label={expanded ? "Recolher itens da fatura" : "Expandir itens da fatura"}
                >
                  {expanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                </button>
              ) : (
                <span className="monthly-plan-group-toggle-spacer" />
              )}
              {isParent && <CreditCardIcon className="monthly-plan-card-icon" />}
              <div>
                <strong>{item.description}</strong>
                <small>
                  {isChild
                    ? `${item.categoryName || "Sem categoria"} · ${item.paidByParent ? "incluído em fatura paga" : "incluído na fatura"}`
                    : item.categoryName || item.notes || "Item planejado"}
                </small>
                {isParent && children.length > 0 && (
                  <small className={`monthly-plan-invoice-difference ${difference === 0 ? "neutral" : difference > 0 ? "positive" : "negative"}`}>
                    {children.length} item(ns) interno(s) · soma dos itens {formatMoney(item.childExpectedTotal || 0)} · diferença{" "}
                    {formatMoney(difference)}
                  </small>
                )}
              </div>
            </div>
          </td>
          <td>
            <span className={`transaction-type-pill ${item.type === "INCOME" ? "income" : "expense"}`}>{enumLabel(item.type)}</span>
          </td>
          <td>
            {enumLabel(item.nature)}
            {item.aggregationType === "GROUP_PARENT" ? " · fatura" : ""}
            {item.aggregationType === "GROUP_CHILD" ? " · detalhe" : ""}
            {item.recurring ? " · recorrente" : ""}
            {item.recurrenceEndDate ? ` · até ${formatDate(item.recurrenceEndDate)}` : ""}
          </td>
          <td>{formatDate(item.dueDate)}</td>
          <td>
            <span className={`status-pill ${statusTone(item.status)}`}>{enumLabel(item.status)}</span>
          </td>
          <td className="align-right">{formatMoney(item.expectedAmount)}</td>
          <td className="align-right">{formatMoney(item.actualAmount)}</td>
          <td className="align-right monthly-plan-actions-cell">
            <div className="table-actions refined-actions monthly-plan-actions">
              {!isChild && item.status !== "PAID" && item.status !== "CANCELED" && (
                <button type="button" title="Registrar pagamento/recebimento" onClick={() => registerPayment(item)} disabled={selectedPeriodClosed}>
                  <CheckCircleOutlineOutlinedIcon />
                </button>
              )}

              {!isChild && item.status !== "PENDING" && item.status !== "CANCELED" && Number(item.actualAmount || 0) > 0 && (
                <button
                  type="button"
                  title="Desfazer baixa e marcar como pendente"
                  onClick={() => reopenPlanItem(item)}
                  disabled={selectedPeriodClosed}
                >
                  <UndoOutlinedIcon />
                </button>
              )}

              {isParent && (
                <button
                  type="button"
                  title="Vincular parcelas ou despesas à fatura"
                  onClick={() => openInvoiceChildrenModal(item)}
                  disabled={item.status === "CANCELED" || selectedPeriodClosed}
                >
                  <LinkOutlinedIcon />
                </button>
              )}

              {!isChild && !isParent && (
                <button
                  type="button"
                  title="Associar transação existente"
                  onClick={() => openLinkTransactionModal(item)}
                  disabled={item.status === "CANCELED" || selectedPeriodClosed}
                >
                  <LinkOutlinedIcon />
                </button>
              )}

              {isChild && (
                <button type="button" title="Desvincular da fatura" onClick={() => unlinkItemFromInvoice(item)} disabled={selectedPeriodClosed}>
                  <UndoOutlinedIcon />
                </button>
              )}

              <button type="button" title="Editar item planejado" onClick={() => openEditPlan(item)} disabled={loading || selectedPeriodClosed}>
                <EditOutlinedIcon />
              </button>

              {!isChild && (
                <button
                  className="danger-action"
                  type="button"
                  title="Cancelar item planejado"
                  onClick={() => cancelItem(item)}
                  disabled={loading || selectedPeriodClosed || item.status === "CANCELED"}
                >
                  <CloseIcon />
                </button>
              )}
            </div>
          </td>
        </tr>
        {expanded && children.map((childItem) => renderPlanItemRow(childItem, true))}
      </>
    );
  };

  return (
    <div className="page-stack monthly-periods-page">
      <section className="page-hero compact monthly-hero">
        <div>
          <span className="eyebrow">Controle mensal</span>
          <h1>Virada do mês</h1>
          <p>Feche ciclos, acompanhe contas fixas e variáveis e saiba o que ainda falta pagar ou receber.</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={openCreatePlan} disabled={!selectedPeriodIdValue || selectedPeriodClosed}>
          <AddIcon /> Novo item do mês
        </button>
      </section>

      <section className="panel monthly-control-panel monthly-cycle-control-panel" data-tour="monthly-periods-cycle">
        <div className="monthly-period-selector">
          <label>
            Mês financeiro
            <select value={selectedPeriodId || ""} onChange={(event) => setSelectedPeriodId(Number(event.target.value))}>
              {periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.name} · {enumLabel(period.status)} · {formatDate(period.startDate)} a {formatDate(period.endDate)}
                </option>
              ))}
            </select>
          </label>
          {selectedPeriod && <span className={`status-pill ${periodStatusTone(selectedPeriod.status)}`}>{enumLabel(selectedPeriod.status)}</span>}
        </div>

        <form className="turnover-form" onSubmit={submitTurnover}>
          <label>
            Data da próxima virada
            <input type="date" value={turnoverDate} onChange={(event) => setTurnoverDate(event.target.value)} />
          </label>
          <label>
            Nome do novo ciclo
            <input value={newPeriodName} onChange={(event) => setNewPeriodName(event.target.value)} placeholder="Ex.: Junho/2026" />
          </label>
          <button className="btn btn-primary" type="submit" disabled={loading || !selectedPeriodIdValue}>
            <AutorenewIcon /> {turnoverDate > todayISO() ? "Agendar virada" : "Fazer virada"}
          </button>
        </form>
      </section>

      <section className="panel monthly-cycle-settings-panel">
        <div className="cycle-settings-heading">
          <div>
            <h2>Configuração do ciclo selecionado</h2>
            <p>Ajuste o encerramento, reabra ciclos criados por engano ou agende o próximo ciclo sem fechar o atual antes da hora.</p>
          </div>
          {selectedPeriodClosed && <span className="cycle-warning-pill">Fechado: edição e baixas bloqueadas</span>}
          {selectedPeriodScheduled && <span className="cycle-warning-pill scheduled">Agendado: próximo ciclo</span>}
        </div>

        <form className="cycle-settings-form" onSubmit={submitCycleSettings}>
          <label>
            Nome
            <input
              value={cycleForm.name}
              onChange={(event) => setCycleForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Nome do ciclo"
            />
          </label>
          <label>
            Início
            <input
              type="date"
              value={cycleForm.startDate}
              onChange={(event) =>
                setCycleForm((prev) => ({
                  ...prev,
                  startDate: event.target.value,
                }))
              }
            />
          </label>
          <label>
            Fim
            <input
              type="date"
              value={cycleForm.endDate}
              onChange={(event) =>
                setCycleForm((prev) => ({
                  ...prev,
                  endDate: event.target.value,
                }))
              }
            />
          </label>
          <label>
            Status
            <select
              value={cycleForm.status}
              onChange={(event) =>
                setCycleForm((prev) => ({
                  ...prev,
                  status: event.target.value as FinancialPeriodStatus,
                }))
              }
            >
              {periodStatuses.map((status) => (
                <option key={status} value={status}>
                  {enumLabel(status)}
                </option>
              ))}
            </select>
          </label>
          <div className="cycle-settings-actions">
            <button className="btn btn-primary" type="submit" disabled={loading || !selectedPeriodIdValue}>
              Salvar ciclo
            </button>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={reopenSelectedPeriod}
              disabled={loading || !selectedPeriodIdValue || selectedPeriod?.status === "OPEN"}
            >
              Reabrir/ativar
            </button>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={closeSelectedPeriod}
              disabled={loading || !selectedPeriodIdValue || selectedPeriod?.status === "CLOSED"}
            >
              Fechar ciclo
            </button>
          </div>
        </form>
      </section>

      <section className="metrics-grid monthly-metrics-grid">
        <article className="metric-card metric-positive">
          <div>
            <span>Receitas planejadas</span>
            <strong>{formatMoney(summary?.plannedIncomeTotal)}</strong>
            <small>Recebido: {formatMoney(summary?.paidIncomeTotal)}</small>
          </div>
          <span className="metric-icon">
            <TrendingUpIcon />
          </span>
        </article>
        <article className="metric-card metric-negative">
          <div>
            <span>Contas planejadas</span>
            <strong>{formatMoney(summary?.plannedExpenseTotal)}</strong>
            <small>Pago: {formatMoney(summary?.paidExpenseTotal)}</small>
          </div>
          <span className="metric-icon">
            <TrendingDownIcon />
          </span>
        </article>
        <article className="metric-card">
          <div>
            <span>Pendente de pagamento</span>
            <strong>{formatMoney(summary?.pendingExpenseTotal)}</strong>
            <small>{summary?.pendingItems || 0} itens pendentes/parciais</small>
          </div>
          <span className="metric-icon">
            <PendingActionsIcon />
          </span>
        </article>
        <article className={`metric-card ${projectedAvailable < 0 ? "metric-negative" : "metric-positive"}`}>
          <div>
            <span>Disponível projetado</span>
            <strong>{formatMoney(projectedAvailable)}</strong>
            <small>
              Planejado: {formatMoney(plannedAvailable)}
              {unplannedImpact !== 0 ? ` · Avulsos: ${formatMoney(unplannedImpact)}` : ""}
            </small>
          </div>
          <span className="metric-icon">
            <PaymentsIcon />
          </span>
        </article>
      </section>

      <section className="panel mm-table-card monthly-plan-panel" data-tour="monthly-plan-items">
        <div className="mm-table-toolbar">
          <div>
            <h2>Contas e rendas do mês</h2>
            <p>Controle o que é fixo, variável, pago, recebido ou pendente dentro do ciclo selecionado.</p>
          </div>
          <div className="mm-table-toolbar-actions">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as MonthlyPlanItemStatus | "")}>
              <option value="">Todos os status</option>
              {planStatuses.map((status) => (
                <option key={status} value={status}>
                  {enumLabel(status)}
                </option>
              ))}
            </select>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={reconcileTransactions}
              disabled={!selectedPeriodIdValue || loading || selectedPeriodClosed}
              title="Associar transações reais já lançadas aos itens planejados"
            >
              <SearchOutlinedIcon /> Conciliar
            </button>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={createPendingPlanFromTransactions}
              disabled={!selectedPeriodIdValue || loading || selectedPeriodClosed}
              title="Criar planejamento pendente a partir de transações lançadas por engano"
            >
              Planejar pendente
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => loadPeriodData()}>
              Atualizar
            </button>
          </div>
        </div>

        {selectedPeriodClosed && (
          <div className="cycle-locked-alert">
            Este ciclo está fechado. Para editar itens, dar baixa ou associar transações, reabra o ciclo primeiro. O fechamento só será permitido
            quando não houver pendências.
          </div>
        )}

        {items.length ? (
          <div className="responsive-table monthly-plan-table-wrap">
            <table className="mm-data-table monthly-plan-table monthly-plan-items-table">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Tipo</th>
                  <th>Natureza</th>
                  <th>Vencimento</th>
                  <th>Status</th>
                  <th className="align-right">Previsto</th>
                  <th className="align-right">Realizado</th>
                  <th className="align-right">Ações</th>
                </tr>
              </thead>
              <tbody>{items.map((item) => renderPlanItemRow(item))}</tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="Sem planejamento" message="Crie contas fixas, variáveis e rendas para acompanhar o mês." />
        )}
      </section>

      <Modal open={planModalOpen} onClose={closePlanModal}>
        <Box className="mm-modal-box monthly-plan-modal-box">
          <form className="modal-form monthly-plan-form" onSubmit={submitPlan}>
            <div className="modal-title-row">
              <div>
                <span className="eyebrow">{editingItem ? "Edição" : "Planejamento"}</span>
                <h2>{editingItem ? "Editar item do mês" : "Novo item do mês"}</h2>
                <p>Cadastre contas, rendas e compromissos previstos para o ciclo atual.</p>
              </div>
              <button className="icon-button ghost" onClick={closePlanModal} type="button" aria-label="Fechar modal">
                <CloseIcon />
              </button>
            </div>

            <div className="form-grid two-columns">
              <label>
                Tipo
                <select
                  value={planForm.type}
                  disabled={planForm.aggregationType === "GROUP_PARENT" || planForm.aggregationType === "GROUP_CHILD"}
                  onChange={(event) =>
                    setPlanForm((prev) => ({
                      ...prev,
                      type: event.target.value as TransactionType,
                      categoryId: null,
                    }))
                  }
                >
                  {planTypes.map((type) => (
                    <option key={type} value={type}>
                      {enumLabel(type)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Natureza
                <select
                  value={planForm.nature || "VARIABLE"}
                  disabled={planForm.aggregationType === "GROUP_PARENT"}
                  onChange={(event) =>
                    setPlanForm((prev) => ({
                      ...prev,
                      nature: event.target.value as any,
                    }))
                  }
                >
                  <option value="FIXED">Fixo</option>
                  <option value="VARIABLE">Variável</option>
                  <option value="CREDIT_CARD">Fatura/cartão</option>
                </select>
              </label>
            </div>

            <label>
              Agrupamento
              <select
                value={planForm.aggregationType || "NORMAL"}
                onChange={(event) => {
                  const aggregationType = event.target.value as MonthlyPlanItemPayload["aggregationType"];
                  setPlanForm((prev) => ({
                    ...prev,
                    aggregationType,
                    type: aggregationType === "GROUP_PARENT" || aggregationType === "GROUP_CHILD" ? "EXPENSE" : prev.type,
                    nature: aggregationType === "GROUP_PARENT" || aggregationType === "GROUP_CHILD" ? "CREDIT_CARD" : prev.nature,
                    parentItemId: aggregationType === "GROUP_CHILD" ? prev.parentItemId || invoiceParentOptions[0]?.id || null : null,
                    recurring: aggregationType === "GROUP_CHILD" ? false : prev.recurring,
                    recurrenceEndDate: aggregationType === "GROUP_CHILD" ? null : prev.recurrenceEndDate,
                  }));
                }}
              >
                <option value="NORMAL">Item normal do mês</option>
                <option value="GROUP_PARENT">Fatura manual / item agrupador</option>
                <option value="GROUP_CHILD">Item interno de uma fatura</option>
              </select>
              <small>Natureza classifica o item. O vínculo real com a fatura acontece apenas quando há fatura vinculada.</small>
            </label>

            {planForm.aggregationType === "GROUP_CHILD" && (
              <label>
                Fatura vinculada
                <select
                  required
                  value={planForm.parentItemId || ""}
                  onChange={(event) =>
                    setPlanForm((prev) => ({
                      ...prev,
                      parentItemId: event.target.value ? Number(event.target.value) : null,
                    }))
                  }
                >
                  <option value="">Selecione a fatura do ciclo</option>
                  {invoiceParentOptions
                    .filter((invoice) => invoice.id !== editingItem?.id)
                    .map((invoice) => (
                      <option key={invoice.id} value={invoice.id}>
                        {invoice.description} · {formatMoney(invoice.expectedAmount)}
                      </option>
                    ))}
                </select>
                <small>Somente faturas manuais do mesmo ciclo aparecem aqui. Sem este vínculo, o item continua sendo uma linha normal.</small>
              </label>
            )}

            <label>
              Descrição
              <input
                required
                value={planForm.description}
                onChange={(event) =>
                  setPlanForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                placeholder="Internet, cartão, salário, freelance"
              />
            </label>

            <div className="form-grid two-columns">
              <label>
                Valor previsto
                <input
                  required
                  inputMode="decimal"
                  value={formatMoneyInput(planForm.expectedAmount)}
                  onChange={(event) =>
                    setPlanForm((prev) => ({
                      ...prev,
                      expectedAmount: parseMoneyInput(event.target.value),
                    }))
                  }
                />
              </label>
              <label>
                Valor realizado
                <input
                  inputMode="decimal"
                  value={formatMoneyInput(planForm.actualAmount || 0)}
                  onChange={(event) =>
                    setPlanForm((prev) => ({
                      ...prev,
                      actualAmount: parseMoneyInput(event.target.value),
                    }))
                  }
                />
              </label>
            </div>

            <div className="form-grid two-columns">
              <label>
                Vencimento/recebimento
                <input
                  required
                  type="date"
                  value={planForm.dueDate}
                  onChange={(event) =>
                    setPlanForm((prev) => ({
                      ...prev,
                      dueDate: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Status
                <select
                  value={planForm.status || "PENDING"}
                  onChange={(event) =>
                    setPlanForm((prev) => ({
                      ...prev,
                      status: event.target.value as MonthlyPlanItemStatus,
                    }))
                  }
                >
                  {planStatuses.map((status) => (
                    <option key={status} value={status}>
                      {enumLabel(status)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              Categoria
              <select
                value={planForm.categoryId || ""}
                onChange={(event) =>
                  setPlanForm((prev) => ({
                    ...prev,
                    categoryId: event.target.value ? Number(event.target.value) : null,
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

            <label className="checkbox-row monthly-checkbox-row">
              <input
                type="checkbox"
                checked={Boolean(planForm.recurring) && planForm.aggregationType !== "GROUP_CHILD"}
                disabled={planForm.aggregationType === "GROUP_CHILD"}
                onChange={(event) =>
                  setPlanForm((prev) => ({
                    ...prev,
                    recurring: event.target.checked,
                    recurrenceEndDate: event.target.checked ? prev.recurrenceEndDate : null,
                  }))
                }
              />
              Repetir automaticamente na próxima virada
            </label>

            {planForm.recurring && planForm.aggregationType !== "GROUP_CHILD" && (
              <label>
                Repetir até
                <input
                  type="date"
                  value={planForm.recurrenceEndDate || ""}
                  min={planForm.dueDate}
                  onChange={(event) =>
                    setPlanForm((prev) => ({
                      ...prev,
                      recurrenceEndDate: event.target.value || null,
                    }))
                  }
                />
                <small>Opcional. Depois desta data, o item não será replicado para novos ciclos.</small>
              </label>
            )}

            <label>
              Observação
              <textarea
                value={planForm.notes || ""}
                onChange={(event) =>
                  setPlanForm((prev) => ({
                    ...prev,
                    notes: event.target.value,
                  }))
                }
                placeholder="Opcional"
              />
            </label>

            <div className="modal-actions end">
              <button className="btn btn-ghost" type="button" onClick={closePlanModal} disabled={loading}>
                Cancelar
              </button>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                <EventRepeatIcon /> Salvar item
              </button>
            </div>
          </form>
        </Box>
      </Modal>

      <Modal open={linkModalOpen} onClose={closeLinkTransactionModal}>
        <Box className="mm-modal-box monthly-plan-modal-box">
          <div className="modal-form monthly-plan-form">
            <div className="modal-title-row">
              <div>
                <span className="eyebrow">Conciliação</span>
                <h2>Associar transação existente</h2>
                <p>
                  Vincule uma transação já lançada a{linkingItem ? ` "${linkingItem.description}"` : " este item"}, sem criar novo gasto ou receita.
                </p>
              </div>
              <button className="icon-button ghost" onClick={closeLinkTransactionModal} type="button" aria-label="Fechar modal">
                <CloseIcon />
              </button>
            </div>

            <label className="checkbox-row monthly-checkbox-row">
              <input
                type="checkbox"
                checked={!linkOnlyUnlinked}
                onChange={async (event) => {
                  const showAll = event.target.checked;
                  setLinkOnlyUnlinked(!showAll);
                  if (linkingItem) {
                    setLoading(true);
                    try {
                      const response = await api.listUnlinkedPeriodTransactions(linkingItem.financialPeriodId, linkingItem.type, !showAll);
                      setUnlinkedTransactions(response.data);
                    } catch (error) {
                      toast.error(getErrorMessage(error));
                    } finally {
                      setLoading(false);
                    }
                  }
                }}
              />
              Mostrar também transações já associadas para corrigir vínculo errado
            </label>

            {unlinkedTransactions.length ? (
              <div className="responsive-table monthly-plan-table-wrap">
                <table className="mm-data-table monthly-plan-table">
                  <thead>
                    <tr>
                      <th>Descrição</th>
                      <th>Categoria</th>
                      <th>Data</th>
                      <th className="align-right">Valor</th>
                      <th className="align-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unlinkedTransactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>
                          <strong>{transaction.description}</strong>
                          <small>{transaction.category?.name || "Sem categoria"}</small>
                        </td>
                        <td>{transaction.category?.name || "Sem categoria"}</td>
                        <td>{formatDate(transaction.occurredOn)}</td>
                        <td className="align-right">{formatMoney(transaction.amount)}</td>
                        <td className="align-right">
                          <button
                            className="btn btn-primary compact-action"
                            type="button"
                            onClick={() => linkExistingTransaction(transaction)}
                            disabled={loading}
                          >
                            Associar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="Nenhuma transação avulsa" message="Não encontrei transações desse tipo ainda sem associação neste ciclo." />
            )}

            <div className="modal-actions end">
              <button className="btn btn-ghost" type="button" onClick={closeLinkTransactionModal} disabled={loading}>
                Fechar
              </button>
            </div>
          </div>
        </Box>
      </Modal>

      <Modal open={invoiceChildrenModalOpen} onClose={closeInvoiceChildrenModal}>
        <Box className="mm-modal-box monthly-plan-modal-box monthly-plan-invoice-modal-box">
          <div className="modal-form monthly-plan-form">
            <div className="modal-title-row">
              <div>
                <span className="eyebrow">Fatura manual</span>
                <h2>Vincular itens à fatura</h2>
                <p>
                  {invoiceChildrenParent
                    ? `Selecione despesas do ciclo para aparecerem dentro de "${invoiceChildrenParent.description}" sem somar novamente nos totais.`
                    : "Selecione despesas do ciclo para compor a fatura."}
                </p>
              </div>
              <button className="icon-button ghost" onClick={closeInvoiceChildrenModal} type="button" aria-label="Fechar modal">
                <CloseIcon />
              </button>
            </div>

            {invoiceChildrenParent && (
              <div className="monthly-plan-invoice-summary">
                <strong>{invoiceChildrenParent.description}</strong>
                <span>Fatura informada: {formatMoney(invoiceChildrenParent.expectedAmount)}</span>
                <span>Itens vinculados: {formatMoney(invoiceChildrenParent.childExpectedTotal || 0)}</span>
                <span>Diferença: {formatMoney(invoiceChildrenParent.childDifference ?? invoiceChildrenParent.expectedAmount ?? 0)}</span>
              </div>
            )}

            {invoiceChildCandidates.length ? (
              <>
                <div className="invoice-link-bulk-actions">
                  <button className="btn btn-ghost" type="button" onClick={toggleAllInvoiceChildCandidates} disabled={loading}>
                    {selectedInvoiceChildIds.length === invoiceChildCandidates.length ? "Limpar seleção" : "Selecionar todos"}
                  </button>
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={linkSelectedItemsToInvoice}
                    disabled={loading || selectedInvoiceChildIds.length === 0}
                  >
                    Vincular selecionados ({selectedInvoiceChildIds.length})
                  </button>
                </div>
                <div className="responsive-table monthly-plan-table-wrap">
                  <table className="mm-data-table monthly-plan-table">
                    <thead>
                      <tr>
                        <th>Selecionar</th>
                        <th>Item</th>
                        <th>Categoria</th>
                        <th>Vencimento</th>
                        <th className="align-right">Valor</th>
                        <th className="align-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceChildCandidates.map((candidate) => (
                        <tr key={candidate.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedInvoiceChildIds.includes(candidate.id)}
                              onChange={() => toggleInvoiceChildSelection(candidate.id)}
                              aria-label={`Selecionar ${candidate.description}`}
                            />
                          </td>
                          <td>
                            <strong>{candidate.description}</strong>
                            <small>
                              {enumLabel(candidate.nature)} · {enumLabel(candidate.status)}
                            </small>
                          </td>
                          <td>{candidate.categoryName || "Sem categoria"}</td>
                          <td>{formatDate(candidate.dueDate)}</td>
                          <td className="align-right">{formatMoney(candidate.expectedAmount)}</td>
                          <td className="align-right">
                            <button
                              className="btn btn-primary compact-action"
                              type="button"
                              onClick={() => linkItemToInvoice(candidate)}
                              disabled={loading}
                            >
                              Vincular
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <EmptyState
                title="Nenhum item disponível"
                message="Não há despesas normais neste ciclo que possam ser vinculadas à fatura. Itens já vinculados, receitas, faturas e cancelados não aparecem aqui."
              />
            )}

            <div className="modal-actions end">
              <button className="btn btn-ghost" type="button" onClick={closeInvoiceChildrenModal} disabled={loading}>
                Fechar
              </button>
            </div>
          </div>
        </Box>
      </Modal>
    </div>
  );
}
