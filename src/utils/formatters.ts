export const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export const percentFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(value?: number | null) {
  return moneyFormatter.format(Number(value || 0));
}

export function formatPercent(value?: number | null) {
  return `${percentFormatter.format(Number(value || 0))}%`;
}

export function formatDate(value?: string | null) {
  if (!value) return "-";
  const [year, month, day] = value.split("T")[0].split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

export function enumLabel(value?: string | null) {
  const labels: Record<string, string> = {
    CHECKING: "Conta corrente",
    SAVINGS: "Poupança",
    CASH: "Dinheiro físico",
    CREDIT_CARD: "Cartão de crédito",
    INVESTMENT: "Investimento",
    OTHER: "Outro",
    INCOME: "Receita",
    EXPENSE: "Despesa",
    TRANSFER: "Transferência",
    MANUAL: "Manual",
    AI_CHAT: "Chat IA",
    IMPORTED: "Importado",
    CDI_PERCENTAGE: "% do CDI",
    INITIAL_BALANCE: "Saldo inicial",
    INITIAL_YIELD: "Rendimento inicial",
    DEPOSIT: "Aporte",
    WITHDRAWAL: "Retirada",
    YIELD: "Rendimento",
    ADJUSTMENT: "Ajuste",
  };
  return value ? labels[value] || value : "-";
}

export function getErrorMessage(error: any, fallback = "Não foi possível concluir a operação.") {
  return error?.response?.data?.message || error?.response?.data?.error || fallback;
}
