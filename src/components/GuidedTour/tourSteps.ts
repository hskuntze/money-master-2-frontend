export type TourStep = {
  id: string;
  route: string;
  selector: string;
  title: string;
  description: string;
  preferredPosition?: "top" | "bottom" | "left" | "right";
};

export const guidedTourSteps: TourStep[] = [
  {
    id: "dashboard-monthly-summary",
    route: "/app/dashboard",
    selector: "[data-tour='dashboard-monthly-summary']",
    title: "Dashboard mensal",
    description: "Aqui você acompanha o resultado projetado do ciclo atual, receitas, contas e o que ainda está pendente.",
    preferredPosition: "right",
  },
  {
    id: "monthly-periods-cycle",
    route: "/app/monthly-periods",
    selector: "[data-tour='monthly-periods-cycle']",
    title: "Ciclo mensal atual",
    description: "Gerencie o período financeiro, ajuste a virada do mês e controle quando um ciclo deve ser fechado ou reaberto.",
    preferredPosition: "bottom",
  },
  {
    id: "monthly-plan-items",
    route: "/app/monthly-periods",
    selector: "[data-tour='monthly-plan-items']",
    title: "Receitas e contas do mês",
    description: "Cadastre rendas, contas fixas e gastos variáveis planejados. Essa é a base do planejamento mensal.",
    preferredPosition: "top",
  },
  {
    id: "transactions-history",
    route: "/app/transactions",
    selector: "[data-tour='transactions-history']",
    title: "Histórico diário",
    description: "Registre gastos e recebimentos do dia a dia. Eles podem ser vinculados às contas planejadas do ciclo.",
    preferredPosition: "bottom",
  },
  {
    id: "installments",
    route: "/app/installment-purchases",
    selector: "[data-tour='installments']",
    title: "Compras parceladas",
    description: "Controle compromissos futuros. As parcelas alimentam automaticamente os ciclos mensais correspondentes.",
    preferredPosition: "top",
  },
  {
    id: "savings-jars",
    route: "/app/savings-jars",
    selector: "[data-tour='savings-jars']",
    title: "Cofrinhos e metas",
    description: "Crie reservas, acompanhe progresso e controle aportes, retiradas e rendimentos.",
    preferredPosition: "left",
  },
  {
    id: "reports",
    route: "/app/reports",
    selector: "[data-tour='reports']",
    title: "Relatórios",
    description: "Analise receitas, gastos, categorias, pendências e comparativos para entender seu comportamento financeiro.",
    preferredPosition: "bottom",
  },
  {
    id: "financial-profile",
    route: "/app/profile",
    selector: "[data-tour='financial-profile']",
    title: "Perfil financeiro",
    description: "Mantenha seu perfil atualizado para que o Money Master personalize melhor diagnósticos, metas e sugestões.",
    preferredPosition: "bottom",
  },
];
