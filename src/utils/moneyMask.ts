const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

export function parseMoneyInput(value: string | number | null | undefined): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return 0;

  return Number(digits) / 100;
}

export function formatMoneyInput(value: string | number | null | undefined): string {
  const numericValue = typeof value === "string" ? parseMoneyInput(value) : Number(value || 0);
  return moneyFormatter.format(Number.isFinite(numericValue) ? numericValue : 0);
}
