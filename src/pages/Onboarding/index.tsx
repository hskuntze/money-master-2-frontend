import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import FlightIcon from "@mui/icons-material/Flight";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlineOutlined";
import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { FormEvent, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthContext } from "@/contexts/AuthContext";
import { OnboardingFixedBillPayload, OnboardingSetupPayload } from "@/types/finance";
import { getErrorMessage } from "@/utils/formatters";
import { formatMoneyInput, parseMoneyInput } from "@/utils/moneyMask";
import { api } from "@/utils/requests";

type FormState = {
  preferredName: string;
  age: string;
  profession: string;
  cycleStartDay: string;
  monthlyIncome: string;
  incomeDay: string;
  fixedBills: Array<{ description: string; amount: string; dueDay: string }>;
  goals: string[];
  initialGoalTargetAmount: string;
  investmentKnowledge: string;
  riskTolerance: string;
  startTourAfterOnboarding: boolean;
};

type GoalOption = {
  id: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
};

const totalSteps = 5;

const goals: GoalOption[] = [
  { id: "RESERVA_EMERGENCIA", title: "Reserva de Emergência", subtitle: "Segurança primeiro", icon: <SavingsOutlinedIcon /> },
  { id: "VIAGEM", title: "Viagem", subtitle: "Conhecer o mundo", icon: <FlightIcon /> },
  { id: "COMPRAR_CASA", title: "Comprar Casa", subtitle: "O seu próprio espaço", icon: <HomeOutlinedIcon /> },
  { id: "APOSENTADORIA", title: "Aposentadoria", subtitle: "Futuro tranquilo", icon: <TrendingUpIcon /> },
  { id: "OUTROS", title: "Outros", subtitle: "Tenho outros planos", icon: <InfoOutlinedIcon /> },
];

const initialForm: FormState = {
  preferredName: "",
  age: "",
  profession: "",
  cycleStartDay: "1",
  monthlyIncome: "",
  incomeDay: "5",
  fixedBills: [{ description: "", amount: "", dueDay: "" }],
  goals: [],
  initialGoalTargetAmount: "",
  investmentKnowledge: "",
  riskTolerance: "",
  startTourAfterOnboarding: true,
};

const parseDay = (value: string) => Number(value || 0);
const parseOptionalNumber = (value: string) => (value ? Number(value) : null);

function ProgressHeader({ step, label }: { step: number; label?: string }) {
  const progress = (step / totalSteps) * 100;
  return (
    <div className="onboarding-progress-wrap">
      <div className="onboarding-progress-label">
        <strong>Passo {step} de {totalSteps}</strong>
        <span>{label || `${Math.round(progress)}% concluído`}</span>
      </div>
      <div className="onboarding-progress-track">
        <span style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [checking, setChecking] = useState(true);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    if (!user?.email) return;
    api
      .getOnboardingStatus()
      .then((response) => {
        if (!active) return;
        if (response.data.onboardingCompleted) {
          setAlreadyCompleted(true);
          return;
        }
        const profile = response.data.profile;
        setForm((current) => ({
          ...current,
          preferredName: profile.preferredName || user.name?.split(" ")[0] || "",
          age: profile.age ? String(profile.age) : "",
          profession: profile.profession || "",
          cycleStartDay: profile.cycleStartDay ? String(profile.cycleStartDay) : current.cycleStartDay,
          monthlyIncome: profile.approximateMonthlyIncome ? formatMoneyInput(String(profile.approximateMonthlyIncome).replace(".", ",")) : "",
          incomeDay: profile.incomeDay ? String(profile.incomeDay) : current.incomeDay,
          investmentKnowledge: profile.investmentKnowledge || "",
          riskTolerance: profile.riskTolerance || "",
        }));
      })
      .catch((error) => toast.error(getErrorMessage(error, "Não foi possível carregar sua configuração inicial.")))
      .finally(() => active && setChecking(false));
    return () => {
      active = false;
    };
  }, [user?.email, user?.name]);

  const progressLabel = useMemo(() => {
    if (step === 5) return "Finalizando sua jornada";
    return `${Math.round((step / totalSteps) * 100)}% concluído`;
  }, [step]);

  if (!authLoading && !user) return <Navigate to="/login" replace />;
  if (checking || authLoading) return <div className="page-loading">Carregando configuração inicial...</div>;
  if (alreadyCompleted) return <Navigate to="/app/dashboard" replace />;

  const update = (field: keyof FormState, value: any) => setForm((current) => ({ ...current, [field]: value }));

  const updateBill = (index: number, field: keyof FormState["fixedBills"][number], value: string) => {
    setForm((current) => ({
      ...current,
      fixedBills: current.fixedBills.map((bill, currentIndex) => currentIndex === index ? { ...bill, [field]: value } : bill),
    }));
  };

  const addBill = () => setForm((current) => ({ ...current, fixedBills: [...current.fixedBills, { description: "", amount: "", dueDay: "" }] }));
  const removeBill = (index: number) => setForm((current) => ({ ...current, fixedBills: current.fixedBills.filter((_, currentIndex) => currentIndex !== index) }));

  const toggleGoal = (goal: string) => {
    setForm((current) => ({
      ...current,
      goals: current.goals.includes(goal) ? current.goals.filter((item) => item !== goal) : [...current.goals, goal],
    }));
  };

  const validateCurrentStep = () => {
    if (step === 1 && (!form.age || !form.profession.trim())) {
      toast.warning("Informe idade e profissão para personalizar sua experiência.");
      return false;
    }
    if (step === 2) {
      const income = parseMoneyInput(form.monthlyIncome);
      const incomeDay = parseDay(form.incomeDay);
      const cycleDay = parseDay(form.cycleStartDay);
      if (income < 0 || incomeDay < 1 || incomeDay > 31 || cycleDay < 1 || cycleDay > 31) {
        toast.warning("Confira a renda, o dia de recebimento e o dia de início do ciclo.");
        return false;
      }
    }
    if (step === 5 && (!form.investmentKnowledge || !form.riskTolerance)) {
      toast.warning("Selecione seu conhecimento e sua tolerância a riscos.");
      return false;
    }
    return true;
  };

  const next = () => {
    if (!validateCurrentStep()) return;
    setStep((current) => Math.min(totalSteps, current + 1));
  };
  const back = () => setStep((current) => Math.max(1, current - 1));

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!validateCurrentStep()) return;

    const fixedBills: OnboardingFixedBillPayload[] = form.fixedBills
      .filter((bill) => bill.description.trim() && parseMoneyInput(bill.amount) > 0)
      .map((bill) => ({ description: bill.description.trim(), amount: parseMoneyInput(bill.amount), dueDay: parseDay(bill.dueDay) || 1 }));

    const payload: OnboardingSetupPayload = {
      preferredName: form.preferredName || null,
      age: parseOptionalNumber(form.age),
      profession: form.profession || null,
      cycleStartDay: parseDay(form.cycleStartDay) || 1,
      monthlyIncome: parseMoneyInput(form.monthlyIncome),
      incomeDay: parseDay(form.incomeDay) || 5,
      fixedBills,
      goals: form.goals,
      initialGoalTargetAmount: form.initialGoalTargetAmount ? parseMoneyInput(form.initialGoalTargetAmount) : null,
      investmentKnowledge: form.investmentKnowledge || null,
      riskTolerance: form.riskTolerance || null,
      investorProfile: form.riskTolerance || null,
      startTourAfterOnboarding: form.startTourAfterOnboarding,
    };

    setSubmitting(true);
    try {
      await api.completeOnboarding(payload);
      sessionStorage.setItem("mm-start-tour-after-onboarding", form.startTourAfterOnboarding ? "true" : "false");
      toast.success("Configuração inicial concluída.");
      navigate("/app/dashboard", { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível concluir a configuração inicial."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="onboarding-page" onSubmit={submit}>
      <header className="onboarding-brand-bar">
        <strong>Money Master 2</strong>
        <InfoOutlinedIcon />
      </header>

      <main className="onboarding-main">
        <ProgressHeader step={step} label={progressLabel} />

        {step === 1 && (
          <section className="onboarding-card profile-step">
            <div className="onboarding-circle-icon"><PersonOutlineIcon /></div>
            <h1>Vamos começar pelo seu perfil</h1>
            <p>Conte-nos um pouco sobre você para personalizarmos sua experiência.</p>
            <label>Como podemos te chamar?</label>
            <input value={form.preferredName} onChange={(e) => update("preferredName", e.target.value)} placeholder="Ex: Hassan" />
            <label>Idade</label>
            <input value={form.age} onChange={(e) => update("age", e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="Ex: 28" inputMode="numeric" />
            <label>Profissão</label>
            <input value={form.profession} onChange={(e) => update("profession", e.target.value)} placeholder="Ex: Engenheiro de Software" />
            <small>Esses dados ajudam o Money Master 2 a sugerir metas financeiras realistas para sua faixa etária e carreira.</small>
          </section>
        )}

        {step === 2 && (
          <section className="onboarding-card income-step">
            <h1>Sua Renda Mensal</h1>
            <p>Quanto e quando você costuma receber seu salário ou renda principal?</p>
            <label>Valor da Renda Fixa</label>
            <input value={form.monthlyIncome} onChange={(e) => update("monthlyIncome", formatMoneyInput(e.target.value))} placeholder="R$ 0,00" inputMode="decimal" />
            <label>Dia do Recebimento</label>
            <input value={form.incomeDay} onChange={(e) => update("incomeDay", e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="Ex: 05" inputMode="numeric" />
            <small>Informe o dia do mês que o dinheiro entra na conta.</small>
            <label>Dia de início do ciclo mensal</label>
            <input value={form.cycleStartDay} onChange={(e) => update("cycleStartDay", e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="Ex: 05" inputMode="numeric" />
            <div className="onboarding-quote-card">
              <div><TrendingUpIcon /></div>
              <em>“Organizar sua renda é o primeiro passo para o domínio financeiro total.”</em>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="onboarding-card bills-step">
            <h1>Suas Contas Fixas</h1>
            <p>Adicione seus gastos recorrentes como aluguel, luz, internet e assinaturas.</p>
            <div className="fixed-bills-list">
              {form.fixedBills.map((bill, index) => (
                <div className="fixed-bill-row" key={index}>
                  <label>Nome da Conta
                    <input value={bill.description} onChange={(e) => updateBill(index, "description", e.target.value)} placeholder="Ex: Aluguel" />
                  </label>
                  <label>Valor
                    <input value={bill.amount} onChange={(e) => updateBill(index, "amount", formatMoneyInput(e.target.value))} placeholder="R$ 0,00" inputMode="decimal" />
                  </label>
                  <label>Vencimento
                    <input value={bill.dueDay} onChange={(e) => updateBill(index, "dueDay", e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="Dia" inputMode="numeric" />
                  </label>
                  <button type="button" className="bill-remove" onClick={() => removeBill(index)} aria-label="Remover conta fixa"><DeleteOutlineIcon /></button>
                </div>
              ))}
            </div>
            <button type="button" className="onboarding-add-button" onClick={addBill}><AddCircleOutlineIcon /> Adicionar Outra</button>
            <div className="security-note"><SecurityOutlinedIcon /><div><strong>Segurança Total</strong><span>Seus dados financeiros são criptografados com padrões bancários.</span></div></div>
          </section>
        )}

        {step === 4 && (
          <section className="onboarding-card goals-step">
            <h1>Seus Objetivos</h1>
            <p>O que você quer conquistar com o Money Master 2?</p>
            <div className="goal-grid">
              {goals.map((goal) => (
                <button type="button" key={goal.id} className={`goal-card ${form.goals.includes(goal.id) ? "selected" : ""}`} onClick={() => toggleGoal(goal.id)}>
                  <span>{goal.icon}</span><div><strong>{goal.title}</strong><small>{goal.subtitle}</small></div>
                </button>
              ))}
            </div>
            <label>Meta inicial de reserva/cofrinho</label>
            <input value={form.initialGoalTargetAmount} onChange={(e) => update("initialGoalTargetAmount", formatMoneyInput(e.target.value))} placeholder="R$ 0,00" inputMode="decimal" />
            <small>Você pode selecionar mais de um objetivo.</small>
          </section>
        )}

        {step === 5 && (
          <section className="onboarding-card investor-step">
            <h1>Perfil de Investidor</h1>
            <p>Como você se sente em relação a riscos e investimentos?</p>
            <h2>Qual seu nível de conhecimento?</h2>
            <div className="knowledge-grid">
              {[{ id: "BASICO", label: "Básico", icon: <SchoolOutlinedIcon /> }, { id: "MEDIO", label: "Médio", icon: <InfoOutlinedIcon /> }, { id: "AVANCADO", label: "Avançado", icon: <TrendingUpIcon /> }].map((item) => (
                <button type="button" key={item.id} className={form.investmentKnowledge === item.id ? "selected" : ""} onClick={() => update("investmentKnowledge", item.id)}>{item.icon}<strong>{item.label}</strong></button>
              ))}
            </div>
            <h2>Tolerância a riscos</h2>
            <div className="risk-list">
              {[{ id: "CONSERVADOR", title: "Conservador", text: "Priorizo segurança acima de rentabilidade." }, { id: "MODERADO", title: "Moderado", text: "Aceito riscos pequenos para ganhos melhores." }, { id: "ARROJADO", title: "Arrojado", text: "Busco alta rentabilidade, ciente dos riscos." }].map((item) => (
                <button type="button" key={item.id} className={form.riskTolerance === item.id ? "selected" : ""} onClick={() => update("riskTolerance", item.id)}><span className="radio-dot" /><div><strong>{item.title}</strong><small>{item.text}</small></div></button>
              ))}
            </div>
            <label className="checkbox-row tour-choice"><input type="checkbox" checked={form.startTourAfterOnboarding} onChange={(e) => update("startTourAfterOnboarding", e.target.checked)} /> Quero iniciar o tour guiado ao entrar no dashboard.</label>
            <div className="investor-note"><InfoOutlinedIcon /> Suas respostas nos ajudam a personalizar sugestões de carteira e ferramentas de monitoramento de acordo com seu apetite financeiro.</div>
          </section>
        )}
      </main>

      <footer className="onboarding-footer">
        <button type="button" onClick={back} disabled={step === 1 || submitting}><ArrowBackIcon /> Voltar</button>
        {step < totalSteps ? (
          <button type="button" className="next" onClick={next}>Próximo <ArrowForwardIcon /></button>
        ) : (
          <button type="submit" className="next" disabled={submitting}>{submitting ? "Salvando..." : "Finalizar"} <ArrowForwardIcon /></button>
        )}
      </footer>
    </form>
  );
}
