import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import FlagIcon from "@mui/icons-material/Flag";
import InsightsIcon from "@mui/icons-material/Insights";
import SavingsIcon from "@mui/icons-material/Savings";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { UserFinancialProfilePayload } from "@/types/finance";
import { formatMoneyInput, parseMoneyInput } from "@/utils/moneyMask";
import { getErrorMessage } from "@/utils/formatters";
import { api } from "@/utils/requests";

const emptyProfile: UserFinancialProfilePayload = {
  age: null,
  ageRange: "",
  profession: "",
  approximateMonthlyIncome: null,
  currentFinancialSituation: "",
  spendingHabits: "",
  financialObjectives: "",
  shortTermGoals: "",
  mediumTermGoals: "",
  longTermGoals: "",
  riskTolerance: "",
  investmentKnowledge: "",
  investorProfile: "",
  financialPreferences: "",
  onboardingCompleted: false,
};

const tourItems = [
  {
    icon: <InsightsIcon />,
    title: "Dashboard mensal",
    text: "Acompanhe o saldo planejado, o realizado e o que ainda está pendente no ciclo atual.",
  },
  {
    icon: <FlagIcon />,
    title: "Ciclos e planejamento",
    text: "Organize receitas, contas do mês, recorrências e baixas a partir do ciclo financeiro.",
  },
  {
    icon: <SavingsIcon />,
    title: "Compras parceladas e metas",
    text: "Veja parcelas futuras, mês de término e impacto no planejamento; acompanhe também seus cofrinhos.",
  },
  {
    icon: <AutoAwesomeIcon />,
    title: "Chat financeiro",
    text: "Peça registros, ajustes e dicas. A IA usa este perfil como contexto educacional, sem prometer resultados.",
  },
];

export default function FinancialProfilePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<UserFinancialProfilePayload>(emptyProfile);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    setInitialLoading(true);
    try {
      const response = await api.getFinancialProfile();
      setForm({
        age: response.data.age ?? null,
        ageRange: response.data.ageRange ?? "",
        profession: response.data.profession ?? "",
        approximateMonthlyIncome:
          response.data.approximateMonthlyIncome ?? null,
        currentFinancialSituation:
          response.data.currentFinancialSituation ?? "",
        spendingHabits: response.data.spendingHabits ?? "",
        financialObjectives: response.data.financialObjectives ?? "",
        shortTermGoals: response.data.shortTermGoals ?? "",
        mediumTermGoals: response.data.mediumTermGoals ?? "",
        longTermGoals: response.data.longTermGoals ?? "",
        riskTolerance: response.data.riskTolerance ?? "",
        investmentKnowledge: response.data.investmentKnowledge ?? "",
        investorProfile: response.data.investorProfile ?? "",
        financialPreferences: response.data.financialPreferences ?? "",
        onboardingCompleted: response.data.onboardingCompleted,
      });
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Não foi possível carregar seu perfil financeiro.",
        ),
      );
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const submit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      setLoading(true);
      try {
        await api.updateFinancialProfile({
          ...form,
          age: form.age ? Number(form.age) : null,
          approximateMonthlyIncome:
            Number(form.approximateMonthlyIncome || 0) || null,
          onboardingCompleted: true,
        });
        toast.success(
          "Perfil financeiro salvo. Seu planejamento já pode usar essas informações.",
        );
        navigate("/app/dashboard");
      } catch (error) {
        toast.error(
          getErrorMessage(
            error,
            "Não foi possível salvar seu perfil financeiro.",
          ),
        );
      } finally {
        setLoading(false);
      }
    },
    [form, navigate],
  );

  return (
    <div
      className="page-stack financial-profile-page"
      data-tour="financial-profile"
    >
      <section className="page-hero compact financial-profile-hero">
        <div>
          <span className="eyebrow">Primeiro acesso</span>
          <h1>Perfil financeiro</h1>
          <p>
            Conte um pouco sobre sua realidade para que o Money Master
            personalize o planejamento mensal e as respostas da IA.
          </p>
        </div>
        {form.onboardingCompleted && (
          <span className="status-pill success">
            <CheckCircleOutlineIcon fontSize="small" /> Perfil configurado
          </span>
        )}
      </section>

      <section className="financial-profile-grid">
        <form className="panel financial-profile-form" onSubmit={submit}>
          <div className="section-heading">
            <span className="eyebrow">Contexto pessoal</span>
            <h2>Dados para recomendações mais responsáveis</h2>
            <p>
              Essas informações ajudam a IA a orientar melhor, sempre em caráter
              educacional.
            </p>
          </div>

          <div className="form-grid two-columns">
            <label>
              Idade
              <input
                type="number"
                min={0}
                value={form.age ?? ""}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    age: event.target.value ? Number(event.target.value) : null,
                  }))
                }
                placeholder="Ex.: 31"
              />
            </label>
            <label>
              Faixa etária
              <input
                value={form.ageRange || ""}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, ageRange: event.target.value }))
                }
                placeholder="Ex.: 30 a 35 anos"
              />
            </label>
          </div>

          <div className="form-grid two-columns">
            <label>
              Profissão
              <input
                value={form.profession || ""}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    profession: event.target.value,
                  }))
                }
                placeholder="Ex.: Desenvolvedor de software"
              />
            </label>
            <label>
              Renda mensal aproximada
              <input
                inputMode="decimal"
                value={formatMoneyInput(form.approximateMonthlyIncome || 0)}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    approximateMonthlyIncome: parseMoneyInput(
                      event.target.value,
                    ),
                  }))
                }
              />
            </label>
          </div>

          <label>
            Situação financeira atual
            <textarea
              value={form.currentFinancialSituation || ""}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  currentFinancialSituation: event.target.value,
                }))
              }
              placeholder="Ex.: Organizando gastos do mês, com foco em quitar cartão e aumentar reserva."
            />
          </label>

          <label>
            Hábitos de consumo
            <textarea
              value={form.spendingHabits || ""}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  spendingHabits: event.target.value,
                }))
              }
              placeholder="Ex.: Uso cartão de crédito, tenho assinaturas, gasto com restaurantes aos fins de semana."
            />
          </label>

          <label>
            Objetivos financeiros
            <textarea
              value={form.financialObjectives || ""}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  financialObjectives: event.target.value,
                }))
              }
              placeholder="Ex.: Sair do aperto, formar reserva, investir melhor e planejar compras grandes."
            />
          </label>

          <div className="form-grid three-columns">
            <label>
              Curto prazo
              <textarea
                value={form.shortTermGoals || ""}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    shortTermGoals: event.target.value,
                  }))
                }
                placeholder="Próximos 3 meses"
              />
            </label>
            <label>
              Médio prazo
              <textarea
                value={form.mediumTermGoals || ""}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    mediumTermGoals: event.target.value,
                  }))
                }
                placeholder="6 a 24 meses"
              />
            </label>
            <label>
              Longo prazo
              <textarea
                value={form.longTermGoals || ""}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    longTermGoals: event.target.value,
                  }))
                }
                placeholder="Acima de 2 anos"
              />
            </label>
          </div>

          <div className="form-grid three-columns">
            <label>
              Tolerância ao risco
              <select
                value={form.riskTolerance || ""}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    riskTolerance: event.target.value,
                  }))
                }
              >
                <option value="">Não informado</option>
                <option value="Baixa">Baixa</option>
                <option value="Moderada">Moderada</option>
                <option value="Alta">Alta</option>
              </select>
            </label>
            <label>
              Conhecimento em investimentos
              <select
                value={form.investmentKnowledge || ""}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    investmentKnowledge: event.target.value,
                  }))
                }
              >
                <option value="">Não informado</option>
                <option value="Iniciante">Iniciante</option>
                <option value="Intermediário">Intermediário</option>
                <option value="Avançado">Avançado</option>
              </select>
            </label>
            <label>
              Perfil de investidor
              <select
                value={form.investorProfile || ""}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    investorProfile: event.target.value,
                  }))
                }
              >
                <option value="">Não informado</option>
                <option value="Conservador">Conservador</option>
                <option value="Moderado">Moderado</option>
                <option value="Arrojado">Arrojado</option>
              </select>
            </label>
          </div>

          <label>
            Preferências financeiras relevantes
            <textarea
              value={form.financialPreferences || ""}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  financialPreferences: event.target.value,
                }))
              }
              placeholder="Ex.: Prefiro previsibilidade, quero evitar dívidas longas, gosto de automatizar aportes."
            />
          </label>

          <div className="modal-actions end">
            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading || initialLoading}
            >
              <CheckCircleOutlineIcon /> Salvar e começar
            </button>
          </div>
        </form>

        <aside className="panel financial-profile-tour">
          <span className="eyebrow">Tour guiado</span>
          <h2>Depois de salvar, comece por aqui</h2>
          <p>
            Esta versão usa um tour simples em cards. Depois, ele pode evoluir
            para um overlay interativo com destaque por elemento.
          </p>
          <div className="tour-card-list">
            {tourItems.map((item) => (
              <article key={item.title} className="tour-card">
                <span>{item.icon}</span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
