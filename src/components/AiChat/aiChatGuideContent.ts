export const AI_CHAT_CONVERSATION_STORAGE_KEY = "money-master-ai-conversation-id";
export const AI_FLOATING_CHAT_CONVERSATION_STORAGE_KEY =
  "money-master-ai-floating-conversation-id";
export const AI_CHAT_GUIDE_PDF_URL = "/docs/guia-chat-ia-money-master.pdf";

export type AiChatCommandGroup = {
  title: string;
  description: string;
  examples: string[];
  keywords: string[];
};

export const AI_CHAT_QUICK_SUGGESTIONS = [
  "Quais contas vencem essa semana?",
  "Cadastre um gasto de R$ 45,90 com mercado hoje",
  "Paguei a fatura do cartão",
  "Quanto ainda tenho disponível neste ciclo?",
  "Crie um cofrinho para viagem",
  "Gere um relatório dos gastos do mês",
];

export const AI_CHAT_COMMAND_GROUPS: AiChatCommandGroup[] = [
  {
    title: "Gastos e despesas",
    description:
      "Use para registrar saídas do dia a dia, compras simples e pagamentos avulsos.",
    examples: [
      "Cadastre um gasto de R$ 45,90 com mercado hoje",
      "Registre uma despesa de R$ 120,00 em alimentação",
      "Adicione um gasto de R$ 89,90 na categoria lazer",
      "Lance uma despesa de R$ 300,00 para amanhã",
      "Anote que gastei R$ 25,00 com transporte",
    ],
    keywords: [
      "gasto",
      "despesa",
      "paguei",
      "comprei",
      "lance",
      "registre",
      "adicione",
      "anote",
      "saída",
      "conta",
      "pagamento",
    ],
  },
  {
    title: "Receitas e entradas",
    description:
      "Use para registrar salário, renda extra, freelance, depósitos e outros recebimentos.",
    examples: [
      "Cadastre uma receita de R$ 3.000,00 como salário",
      "Recebi R$ 500,00 de freelance",
      "Adicionar renda extra de R$ 250,00",
      "Registrar recebimento de R$ 1.200,00",
    ],
    keywords: [
      "receita",
      "renda",
      "recebi",
      "entrada",
      "salário",
      "freelance",
      "pagamento recebido",
      "ganhei",
      "depósito",
    ],
  },
  {
    title: "Contas do mês",
    description:
      "Use para consultar vencimentos, pendências e dar baixa em contas planejadas no ciclo mensal.",
    examples: [
      "Quais contas ainda estão pendentes este mês?",
      "Mostre meus gastos do ciclo atual",
      "O que vence essa semana?",
      "Quais contas vencem hoje?",
      "Marque a conta de internet como paga",
      "Paguei o aluguel",
      "Dê baixa na conta de energia",
    ],
    keywords: [
      "conta",
      "vencimento",
      "pendente",
      "pago",
      "pagar",
      "baixa",
      "quitar",
      "liquidar",
      "em aberto",
      "atrasado",
    ],
  },
  {
    title: "Ciclos mensais",
    description:
      "Use para entender o planejamento do mês, saldo previsto, saldo realizado e resumo do ciclo atual.",
    examples: [
      "Mostre o ciclo atual",
      "Quanto ainda tenho disponível neste ciclo?",
      "Qual é o resumo do mês?",
      "Quais são as receitas planejadas?",
      "Quais são as despesas planejadas?",
      "Quanto falta pagar neste ciclo?",
    ],
    keywords: [
      "ciclo",
      "mês",
      "planejamento",
      "mensal",
      "resumo",
      "disponível",
      "previsto",
      "realizado",
      "saldo",
    ],
  },
  {
    title: "Compras parceladas",
    description:
      "Use para cadastrar compras em prestações e consultar ou baixar parcelas existentes.",
    examples: [
      "Cadastre uma compra parcelada de R$ 600,00 em 6 vezes",
      "Comprei um curso de R$ 360,90 em 6 parcelas",
      "Paguei mais uma parcela do curso de mandarim",
      "Já paguei 3 parcelas da compra Shopee",
      "Quais parcelas vencem este mês?",
    ],
    keywords: [
      "parcela",
      "parcelado",
      "compra parcelada",
      "prestações",
      "paguei parcela",
      "quitar parcela",
      "próxima parcela",
    ],
  },
  {
    title: "Cartão de crédito e fatura",
    description:
      "Use para consultar fatura manual, itens vinculados e baixa da fatura quando ela for paga.",
    examples: [
      "Mostre minha fatura do cartão deste mês",
      "Paguei a fatura do cartão",
      "Vincule essa compra ao cartão de crédito",
      "Quais itens estão dentro da fatura?",
      "Quanto falta pagar do cartão?",
    ],
    keywords: [
      "cartão",
      "fatura",
      "crédito",
      "fatura manual",
      "itens da fatura",
      "compra no cartão",
      "paguei a fatura",
    ],
  },
  {
    title: "Cofrinhos",
    description:
      "Use para criar metas, acompanhar reservas, adicionar valores, retirar dinheiro e consultar saldos.",
    examples: [
      "Criar cofrinho para viagem",
      "Adicionar R$ 100,00 no cofrinho de emergência",
      "Quanto tenho nos cofrinhos?",
      "Remover R$ 50,00 do cofrinho viagem",
      "Excluir cofrinho antigo",
    ],
    keywords: [
      "cofrinho",
      "guardar",
      "reserva",
      "meta",
      "objetivo",
      "poupança",
      "adicionar no cofrinho",
      "retirar do cofrinho",
    ],
  },
  {
    title: "Relatórios e dashboard",
    description:
      "Use para pedir análises, totais por categoria, histórico financeiro e comparação entre receitas e despesas.",
    examples: [
      "Gere um relatório dos gastos do mês",
      "Mostre meus gastos por categoria",
      "Quanto gastei com alimentação?",
      "Comparar receitas e despesas deste mês",
      "Mostre meu histórico financeiro",
    ],
    keywords: [
      "relatório",
      "resumo",
      "histórico",
      "comparar",
      "categoria",
      "análise",
      "gráfico",
      "total",
      "dashboard",
    ],
  },
];

export const AI_CHAT_WRITING_TIPS = [
  "Informe valor, descrição e data sempre que possível.",
  "Diga se quer apenas consultar ou se quer alterar dados.",
  "Quando a IA pedir confirmação, responda com clareza: confirme, sim, pode executar ou cancelar.",
  "Evite comandos muito curtos. Em vez de escrever \"paguei\", escreva \"Paguei a conta de internet de R$ 120,00 hoje\".",
  "Para datas, use expressões como hoje, amanhã, ontem, este mês, próxima sexta ou 15/06/2026.",
  "Para valores, escreva R$ 45,90, 45,90 reais ou 45.90; o assistente tentará interpretar o valor positivo.",
];
