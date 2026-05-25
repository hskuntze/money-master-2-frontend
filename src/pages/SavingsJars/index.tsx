import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import AddIcon from "@mui/icons-material/Add";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import CelebrationIcon from "@mui/icons-material/Celebration";
import CloseIcon from "@mui/icons-material/Close";
import ComputerIcon from "@mui/icons-material/Computer";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import EditIcon from "@mui/icons-material/Edit";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import HomeIcon from "@mui/icons-material/Home";
import LocalAtmIcon from "@mui/icons-material/LocalAtm";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import SavingsIcon from "@mui/icons-material/Savings";
import PetsIcon from "@mui/icons-material/Pets";
import SchoolIcon from "@mui/icons-material/School";
import SecurityIcon from "@mui/icons-material/Security";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import WalletIcon from "@mui/icons-material/Wallet";
import WorkIcon from "@mui/icons-material/Work";
import { Box, Modal } from "@mui/material";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import ConfirmDialog from "@/components/ConfirmDialog";
import EmptyState from "@/components/EmptyState";
import ProgressBar from "@/components/ProgressBar";
import SafeApexChart from "@/components/SafeApexChart";
import {
  SavingsJarMovementResponse,
  SavingsJarPayload,
  SavingsJarResponse,
} from "@/types/finance";
import { todayISO } from "@/utils/dates";
import {
  enumLabel,
  formatDate,
  formatMoney,
  formatPercent,
  getErrorMessage,
} from "@/utils/formatters";
import { formatMoneyInput, parseMoneyInput } from "@/utils/moneyMask";
import { api } from "@/utils/requests";

const emptyForm: SavingsJarPayload = {
  name: "",
  institutionName: "Itaú",
  description: "",
  targetAmount: 0,
  targetDate: "",
  imageUrl: "",
  icon: "savings",
  color: "#2563EB",
  linkedAccountId: null,
  currentAmount: 0,
  currentYieldAmount: 0,
  active: true,
  yieldEnabled: true,
  yieldCalculationType: "CDI_PERCENTAGE",
  yieldPercentage: 100,
  businessDaysOnly: true,
  useBrazilianHolidays: false,
  yieldStartDate: todayISO(),
};

const emptyMovement = { amount: 0, occurredOn: todayISO(), description: "" };

type MovementAction = "deposit" | "withdraw" | "yield";
type JarVisualMode = "icon" | "image";

const jarIconOptions = [
  { value: "savings", label: "Cofrinho", icon: <SavingsIcon /> },
  { value: "wallet", label: "Carteira", icon: <WalletIcon /> },
  { value: "car", label: "Carro", icon: <DirectionsCarIcon /> },
  { value: "travel", label: "Viagem", icon: <FlightTakeoffIcon /> },
  { value: "computer", label: "Tecnologia", icon: <ComputerIcon /> },
  { value: "home", label: "Casa", icon: <HomeIcon /> },
  { value: "education", label: "Estudos", icon: <SchoolIcon /> },
  { value: "security", label: "Reserva", icon: <SecurityIcon /> },
  { value: "health", label: "Saúde", icon: <MedicalServicesIcon /> },
  { value: "work", label: "Trabalho", icon: <WorkIcon /> },
  { value: "cash", label: "Dinheiro", icon: <LocalAtmIcon /> },
  { value: "investment", label: "Investimento", icon: <TrendingUpIcon /> },
  { value: "shopping", label: "Compras", icon: <ShoppingBagIcon /> },
  { value: "party", label: "Festa", icon: <CelebrationIcon /> },
  { value: "beach", label: "Praia", icon: <BeachAccessIcon /> },
  { value: "pet", label: "Pet", icon: <PetsIcon /> },
  { value: "game", label: "Games", icon: <SportsEsportsIcon /> },
  { value: "dream", label: "Sonho", icon: <FavoriteIcon /> },
  { value: "account", label: "Conta", icon: <AccountBalanceWalletIcon /> },
];

function renderJarIcon(icon?: string | null) {
  const normalized = (icon || "savings").trim().toLowerCase();

  if (["piggy-bank", "piggybank", "cofrinho", "savings"].includes(normalized))
    return <SavingsIcon />;
  if (["wallet", "carteira"].includes(normalized)) return <WalletIcon />;
  if (
    [
      "car",
      "directions-car",
      "directionscar",
      "carro",
      "veiculo",
      "veículo",
    ].includes(normalized)
  )
    return <DirectionsCarIcon />;
  if (
    ["travel", "flight", "flight-takeoff", "flighttakeoff", "viagem"].includes(
      normalized,
    )
  )
    return <FlightTakeoffIcon />;
  if (["computer", "notebook", "technology", "tecnologia"].includes(normalized))
    return <ComputerIcon />;
  if (["home", "house", "casa"].includes(normalized)) return <HomeIcon />;
  if (["education", "school", "estudos"].includes(normalized))
    return <SchoolIcon />;
  if (
    ["security", "reserva", "emergency", "emergencia", "emergência"].includes(
      normalized,
    )
  )
    return <SecurityIcon />;
  if (["health", "saude", "saúde", "medical"].includes(normalized))
    return <MedicalServicesIcon />;
  if (["work", "trabalho"].includes(normalized)) return <WorkIcon />;
  if (["cash", "dinheiro"].includes(normalized)) return <LocalAtmIcon />;
  if (["investment", "investimento", "trending"].includes(normalized))
    return <TrendingUpIcon />;
  if (["shopping", "compras"].includes(normalized)) return <ShoppingBagIcon />;
  if (["party", "festa", "celebration"].includes(normalized))
    return <CelebrationIcon />;
  if (["beach", "praia"].includes(normalized)) return <BeachAccessIcon />;
  if (["pet", "pets"].includes(normalized)) return <PetsIcon />;
  if (["game", "games"].includes(normalized)) return <SportsEsportsIcon />;
  if (["dream", "sonho", "favorite"].includes(normalized))
    return <FavoriteIcon />;
  if (["account", "conta"].includes(normalized))
    return <AccountBalanceWalletIcon />;

  return <SavingsIcon />;
}

function getJarIcon(
  jar: Pick<SavingsJarResponse, "name" | "icon"> | SavingsJarPayload,
) {
  if (jar.icon) return renderJarIcon(jar.icon);

  const text = `${jar.name || ""}`.toLowerCase();
  if (
    text.includes("viagem") ||
    text.includes("travel") ||
    text.includes("avi")
  )
    return <FlightTakeoffIcon />;
  if (text.includes("comput") || text.includes("notebook"))
    return <ComputerIcon />;
  if (text.includes("reserva") || text.includes("emerg"))
    return <SecurityIcon />;
  if (text.includes("carro") || text.includes("veículo"))
    return <DirectionsCarIcon />;
  return <SavingsIcon />;
}

export default function SavingsJarsPage() {
  const [jars, setJars] = useState<SavingsJarResponse[]>([]);
  const [form, setForm] = useState<SavingsJarPayload>(emptyForm);
  const [editing, setEditing] = useState<SavingsJarResponse | null>(null);
  const [selected, setSelected] = useState<SavingsJarResponse | null>(null);
  const [movements, setMovements] = useState<SavingsJarMovementResponse[]>([]);
  const [movement, setMovement] = useState(emptyMovement);
  const [movementAction, setMovementAction] =
    useState<MovementAction>("deposit");
  const [jarVisualMode, setJarVisualMode] = useState<JarVisualMode>("icon");
  const [jarModalOpen, setJarModalOpen] = useState(false);
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [jarPendingDelete, setJarPendingDelete] =
    useState<SavingsJarResponse | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedId = selected?.id;

  const load = useCallback(() => {
    api
      .listSavingsJars()
      .then((savingsJarsResponse) => {
        setJars(savingsJarsResponse.data);
        if (selectedId) {
          const updated =
            savingsJarsResponse.data.find((item) => item.id === selectedId) ||
            null;
          setSelected(updated);
        }
      })
      .catch((error) =>
        toast.error(
          getErrorMessage(error, "Não foi possível carregar os cofrinhos."),
        ),
      );
  }, [selectedId]);

  const loadMovementsById = useCallback((jarId: number) => {
    api
      .listSavingsJarMovements(jarId)
      .then((response) => setMovements(response.data))
      .catch((error) =>
        toast.error(
          getErrorMessage(
            error,
            "Não foi possível carregar o extrato do cofrinho.",
          ),
        ),
      );
  }, []);

  const selectJar = useCallback(
    (jar: SavingsJarResponse) => {
      setSelected(jar);
      loadMovementsById(jar.id);
    },
    [loadMovementsById],
  );

  const applyPendingYields = useCallback(() => {
    api
      .applyPendingSavingsJarYields()
      .then(() => {
        toast.success("Cálculo executado.");
        load();
      })
      .catch((error) => toast.error(getErrorMessage(error)));
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  const totalSaved = useMemo(
    () => jars.reduce((sum, jar) => sum + Number(jar.currentAmount || 0), 0),
    [jars],
  );
  const totalYield = useMemo(
    () => jars.reduce((sum, jar) => sum + Number(jar.totalYield || 0), 0),
    [jars],
  );
  const totalTarget = useMemo(
    () => jars.reduce((sum, jar) => sum + Number(jar.targetAmount || 0), 0),
    [jars],
  );

  const yieldChart = useMemo(() => {
    const yieldMovements = movements
      .filter((item) => item.type === "YIELD" || item.type === "INITIAL_YIELD")
      .sort((a, b) => a.occurredOn.localeCompare(b.occurredOn));

    if (yieldMovements.length) {
      let cumulative = 0;
      return {
        labels: yieldMovements.map((item) => {
          cumulative += Number(item.amount || 0);
          return formatDate(item.occurredOn).slice(0, 5);
        }),
        data: yieldMovements.map((_, index) =>
          yieldMovements
            .slice(0, index + 1)
            .reduce((sum, item) => sum + Number(item.amount || 0), 0),
        ),
        title: selected
          ? `Evolução do rendimento: ${selected.name}`
          : "Evolução do rendimento",
      };
    }

    return {
      labels: jars.map((jar) => jar.name),
      data: jars.map((jar) => Number(jar.totalYield || 0)),
      title: "Rendimento acumulado por cofrinho",
    };
  }, [jars, movements, selected]);

  const yieldChartOptions = useMemo(
    () => ({
      chart: { toolbar: { show: false } },
      plotOptions: { bar: { borderRadius: 8, columnWidth: "42%" } },
      dataLabels: { enabled: false },
      grid: { borderColor: "#E2E8F0" },
      xaxis: {
        categories: yieldChart.labels,
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: { labels: { formatter: (value: number) => formatMoney(value) } },
      tooltip: { y: { formatter: (value: number) => formatMoney(value) } },
    }),
    [yieldChart.labels],
  );

  const resetJarForm = useCallback(() => {
    setEditing(null);
    setForm(emptyForm);
    setJarVisualMode("icon");
    setJarModalOpen(false);
  }, []);

  const openCreateModal = useCallback(() => {
    setEditing(null);
    setForm(emptyForm);
    setJarVisualMode("icon");
    setJarModalOpen(true);
  }, []);

  const edit = useCallback((jar: SavingsJarResponse) => {
    setEditing(jar);
    setJarVisualMode(jar.imageUrl ? "image" : "icon");
    setForm({
      name: jar.name,
      institutionName: jar.institutionName || "",
      description: jar.description || "",
      targetAmount: jar.targetAmount,
      targetDate: jar.targetDate || "",
      imageUrl: jar.imageUrl || "",
      icon: jar.icon || "savings",
      color: jar.color || "#2563EB",
      linkedAccountId: jar.linkedAccountId || null,
      active: jar.active,
      yieldEnabled: jar.yieldEnabled,
      yieldCalculationType: jar.yieldCalculationType,
      yieldPercentage: jar.yieldPercentage,
      businessDaysOnly: jar.businessDaysOnly,
      useBrazilianHolidays: jar.useBrazilianHolidays,
      yieldStartDate: jar.yieldStartDate || todayISO(),
      lastYieldCalculationDate: jar.lastYieldCalculationDate || undefined,
    });
    setJarModalOpen(true);
  }, []);

  const submit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      setLoading(true);
      const payload: SavingsJarPayload = {
        ...form,
        imageUrl: jarVisualMode === "image" ? form.imageUrl || "" : "",
        icon: form.icon || "savings",
        targetAmount: Number(form.targetAmount || 0),
        currentAmount: editing ? undefined : Number(form.currentAmount || 0),
        currentYieldAmount: editing
          ? undefined
          : Number(form.currentYieldAmount || 0),
        linkedAccountId: form.linkedAccountId
          ? Number(form.linkedAccountId)
          : null,
        targetDate: form.targetDate || null,
        yieldStartDate: form.yieldStartDate || todayISO(),
        yieldPercentage: Number(form.yieldPercentage || 0),
      };

      try {
        if (editing) {
          await api.updateSavingsJar(editing.id, payload);
          toast.success("Cofrinho atualizado.");
        } else {
          await api.createSavingsJar(payload);
          toast.success("Cofrinho criado.");
        }
        resetJarForm();
        load();
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    },
    [editing, form, jarVisualMode, load, resetJarForm],
  );

  const askDeleteJar = useCallback((jar: SavingsJarResponse) => {
    setJarPendingDelete(jar);
  }, []);

  const cancelDeleteJar = useCallback(() => {
    if (!deletingId) {
      setJarPendingDelete(null);
    }
  }, [deletingId]);

  const confirmDeleteJar = useCallback(async () => {
    if (!jarPendingDelete || deletingId) return;

    setDeletingId(jarPendingDelete.id);
    try {
      await api.deleteSavingsJar(jarPendingDelete.id);
      toast.success("Cofrinho excluído.");

      if (selected?.id === jarPendingDelete.id) {
        setSelected(null);
        setMovements([]);
      }

      setJarPendingDelete(null);
      load();
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Não foi possível excluir o cofrinho."),
      );
    } finally {
      setDeletingId(null);
    }
  }, [deletingId, jarPendingDelete, load, selected?.id]);

  const openMovementModal = useCallback(
    (jar: SavingsJarResponse, action: MovementAction) => {
      setSelected(jar);
      setMovement(emptyMovement);
      setMovementAction(action);
      setMovementModalOpen(true);
      loadMovementsById(jar.id);
    },
    [loadMovementsById],
  );

  const closeMovementModal = useCallback(() => {
    setMovement(emptyMovement);
    setMovementModalOpen(false);
  }, []);

  const doMovement = useCallback(async () => {
    if (!selected) return;
    if (!movement.amount || movement.amount <= 0) {
      toast.warning("Informe um valor válido.");
      return;
    }

    try {
      const payload = {
        ...movement,
        amount: Number(movement.amount),
        source: "MANUAL",
      };
      if (movementAction === "deposit")
        await api.depositSavingsJar(selected.id, payload);
      if (movementAction === "withdraw")
        await api.withdrawSavingsJar(selected.id, payload);
      if (movementAction === "yield")
        await api.yieldSavingsJar(selected.id, payload);
      toast.success("Movimentação registrada.");
      closeMovementModal();
      load();
      loadMovementsById(selected.id);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }, [
    closeMovementModal,
    load,
    loadMovementsById,
    movement,
    movementAction,
    selected,
  ]);

  const applyYield = useCallback(
    async (jar: SavingsJarResponse) => {
      try {
        await api.applySavingsJarYield(jar.id);
        toast.success("Rendimentos pendentes aplicados.");
        load();
        loadMovementsById(jar.id);
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    },
    [load, loadMovementsById],
  );

  return (
    <div className="savings-jars-page page-stack" data-tour="savings-jars">
      <section className="module-heading-row savings-heading-row">
        <div>
          <h1>Meus Cofrinhos</h1>
          <p>
            Gerencie suas metas financeiras, rendimentos e movimentações com
            precisão.
          </p>
        </div>
        <div className="savings-heading-actions">
          <button
            className="btn btn-ghost"
            onClick={applyPendingYields}
            type="button"
          >
            <AutoGraphIcon /> Aplicar rendimentos
          </button>
          <button
            className="btn btn-primary"
            onClick={openCreateModal}
            type="button"
          >
            <AddIcon /> Novo cofrinho
          </button>
        </div>
      </section>

      <section className="savings-summary-strip">
        <article>
          <span>Total guardado</span>
          <strong>{formatMoney(totalSaved)}</strong>
        </article>
        <article>
          <span>Rendimento acumulado</span>
          <strong>{formatMoney(totalYield)}</strong>
        </article>
        <article>
          <span>Meta total</span>
          <strong>{formatMoney(totalTarget)}</strong>
        </article>
      </section>

      {jars.length ? (
        <section className="goal-card-grid">
          {jars.map((jar) => (
            <article
              className="goal-card"
              key={jar.id}
              onClick={() => selectJar(jar)}
            >
              <div className="goal-card-top">
                <span
                  className="goal-icon"
                  style={{
                    background: `${jar.color || "#2563EB"}16`,
                    color: jar.color || "#2563EB",
                  }}
                >
                  {jar.imageUrl ? (
                    <img src={jar.imageUrl} alt={jar.name} />
                  ) : (
                    getJarIcon(jar)
                  )}
                </span>
                <div className="goal-card-top-actions">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      edit(jar);
                    }}
                    title="Editar cofrinho"
                  >
                    <EditIcon />
                  </button>
                  <button
                    type="button"
                    className="danger-icon-button"
                    disabled={deletingId === jar.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      askDeleteJar(jar);
                    }}
                    title="Excluir cofrinho"
                  >
                    <DeleteOutlineOutlinedIcon />
                  </button>
                </div>
              </div>

              <h2>{jar.name}</h2>
              <p>
                {jar.description ||
                  jar.institutionName ||
                  "Objetivo financeiro"}
              </p>
              <div className="goal-progress-line">
                <span>
                  {Math.round(Number(jar.progressPercentage || 0))}% Alcançado
                </span>
                <small>Meta: {formatMoney(jar.targetAmount)}</small>
              </div>
              <ProgressBar value={jar.progressPercentage} />
              <strong className="goal-amount">
                {formatMoney(jar.currentAmount)}
              </strong>
              <small className="goal-yield">
                Rendeu {formatMoney(jar.totalYield)} · {jar.yieldPercentage}% do
                CDI
              </small>
              {jar.projectedYieldToday && (
                <small className="goal-yield projected">
                  Previsão hoje:{" "}
                  {formatMoney(jar.projectedYieldToday.projectedYieldAmount)}
                  {jar.projectedYieldToday.estimated ? " estimado" : ""}
                </small>
              )}
              <div className="goal-actions">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    openMovementModal(jar, "withdraw");
                  }}
                >
                  Retirar
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    openMovementModal(jar, "deposit");
                  }}
                >
                  Adicionar
                </button>
              </div>
            </article>
          ))}

          <button
            className="goal-create-card"
            type="button"
            onClick={openCreateModal}
          >
            <span>
              <AddIcon />
            </span>
            <strong>Criar meta</strong>
            <small>Planeje seu próximo objetivo</small>
          </button>
        </section>
      ) : (
        <EmptyState
          title="Nenhum cofrinho"
          message="Crie um cofrinho para acompanhar metas e rendimentos como no app do banco."
        />
      )}

      <section className="savings-lower-grid">
        <article className="panel yield-evolution-card">
          <div className="panel-header clean">
            <h2>{yieldChart.title}</h2>
            {selected && (
              <button onClick={() => applyYield(selected)} type="button">
                Calcular rendimento
              </button>
            )}
          </div>
          {yieldChart.data.length ? (
            <SafeApexChart
              id="savings-yield-evolution"
              options={yieldChartOptions}
              series={[{ name: "Rendimento", data: yieldChart.data }]}
              type="bar"
              height={300}
            />
          ) : (
            <EmptyState
              title="Sem rendimento"
              message="Informe rendimentos ou selecione um cofrinho com histórico."
            />
          )}
        </article>

        <article className="ai-tip-card">
          <TrendingUpIcon />
          <h2>Dica do IA Master</h2>
          <p>
            Use o chat para dizer “guardei R$ 300 no cofrinho Viagem” ou “o
            cofrinho Reserva rendeu R$ 1,43 hoje”.
          </p>
          <button
            type="button"
            onClick={() => selected && openMovementModal(selected, "yield")}
            disabled={!selected}
          >
            Informar rendimento
          </button>
        </article>
      </section>

      {selected && (
        <section className="panel savings-statement-panel">
          <div className="panel-header clean">
            <div>
              <h2>Extrato do cofrinho: {selected.name}</h2>
              <small>
                {selected.institutionName || "Sem instituição"} ·{" "}
                {formatMoney(selected.currentAmount)}
              </small>
            </div>
            <div className="statement-actions">
              <button
                type="button"
                onClick={() => openMovementModal(selected, "deposit")}
              >
                Aportar
              </button>
              <button
                type="button"
                onClick={() => openMovementModal(selected, "withdraw")}
              >
                Retirar
              </button>
              <button
                type="button"
                onClick={() => openMovementModal(selected, "yield")}
              >
                Rendimento
              </button>
              <button
                className="danger-action"
                type="button"
                onClick={() => askDeleteJar(selected)}
                disabled={deletingId === selected.id}
              >
                <DeleteOutlineOutlinedIcon /> Excluir
              </button>
            </div>
          </div>
          {movements.length ? (
            <div className="responsive-table modern-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Descrição</th>
                    <th>Data</th>
                    <th>Valor</th>
                    <th>Taxa</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((item) => (
                    <tr key={item.id}>
                      <td>{enumLabel(item.type)}</td>
                      <td>{item.description || "-"}</td>
                      <td>{formatDate(item.occurredOn)}</td>
                      <td>{formatMoney(item.amount)}</td>
                      <td>
                        {item.rateApplied
                          ? `${formatPercent(item.rateApplied)}`
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="Sem movimentos"
              message="Nenhum movimento encontrado para este cofrinho."
            />
          )}
        </section>
      )}

      <ConfirmDialog
        open={Boolean(jarPendingDelete)}
        title="Excluir cofrinho"
        message={
          jarPendingDelete
            ? `Você está prestes a excluir o cofrinho "${jarPendingDelete.name}". O cofrinho e todo o histórico de movimentações dele serão removidos definitivamente.`
            : ""
        }
        onCancel={cancelDeleteJar}
        onConfirm={confirmDeleteJar}
      />

      <Modal
        open={jarModalOpen}
        onClose={resetJarForm}
        aria-labelledby="savings-jar-modal-title"
      >
        <Box className="mm-modal-box wide-modal">
          <div className="modal-heading">
            <div>
              <span>
                <SavingsIcon /> Cofrinho
              </span>
              <h2 id="savings-jar-modal-title">
                {editing ? "Editar cofrinho" : "Novo cofrinho"}
              </h2>
            </div>
            <button type="button" onClick={resetJarForm}>
              <CloseIcon />
            </button>
          </div>

          <form className="modal-form savings-modal-form" onSubmit={submit}>
            <div className="form-grid-2">
              <label>
                Nome
                <input
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  placeholder="Reserva, Viagem, Carro"
                />
              </label>
              <label>
                Banco/instituição
                <input
                  value={form.institutionName || ""}
                  onChange={(event) =>
                    setForm({ ...form, institutionName: event.target.value })
                  }
                  placeholder="Itaú, Nubank, PicPay"
                />
              </label>
              <label>
                Descrição
                <input
                  value={form.description || ""}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  placeholder="Objetivo financeiro"
                />
              </label>
              <label>
                Meta
                <input
                  inputMode="decimal"
                  value={formatMoneyInput(form.targetAmount)}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      targetAmount: parseMoneyInput(event.target.value),
                    })
                  }
                />
              </label>
              <label>
                Data alvo
                <input
                  type="date"
                  value={form.targetDate || ""}
                  onChange={(event) =>
                    setForm({ ...form, targetDate: event.target.value })
                  }
                />
              </label>
              {!editing && (
                <>
                  <label>
                    Valor atual no banco
                    <input
                      inputMode="decimal"
                      value={formatMoneyInput(form.currentAmount)}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          currentAmount: parseMoneyInput(event.target.value),
                        })
                      }
                    />
                  </label>
                  <label>
                    Rendimento bruto já acumulado
                    <input
                      inputMode="decimal"
                      value={formatMoneyInput(form.currentYieldAmount)}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          currentYieldAmount: parseMoneyInput(
                            event.target.value,
                          ),
                        })
                      }
                    />
                  </label>
                </>
              )}
              <div className="jar-visual-field form-field-span-2">
                <div className="field-heading-row">
                  <label>Imagem do cofrinho</label>
                  <div className="segmented-control compact">
                    <button
                      type="button"
                      className={jarVisualMode === "icon" ? "active" : ""}
                      onClick={() => {
                        setJarVisualMode("icon");
                        setForm({
                          ...form,
                          imageUrl: "",
                          icon: form.icon || "savings",
                        });
                      }}
                    >
                      Ícone MUI
                    </button>
                    <button
                      type="button"
                      className={jarVisualMode === "image" ? "active" : ""}
                      onClick={() => setJarVisualMode("image")}
                    >
                      URL de imagem
                    </button>
                  </div>
                </div>

                {jarVisualMode === "image" ? (
                  <div className="jar-image-url-row">
                    <span
                      className="jar-visual-preview"
                      style={{
                        background: `${form.color || "#2563EB"}16`,
                        color: form.color || "#2563EB",
                      }}
                    >
                      {form.imageUrl ? (
                        <img src={form.imageUrl} alt="Prévia do cofrinho" />
                      ) : (
                        getJarIcon(form)
                      )}
                    </span>
                    <input
                      value={form.imageUrl || ""}
                      onChange={(event) =>
                        setForm({ ...form, imageUrl: event.target.value })
                      }
                      placeholder="https://..."
                    />
                  </div>
                ) : (
                  <div className="jar-icon-picker">
                    {jarIconOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={form.icon === option.value ? "active" : ""}
                        onClick={() =>
                          setForm({ ...form, icon: option.value, imageUrl: "" })
                        }
                        title={option.label}
                      >
                        <span
                          style={{
                            background: `${form.color || "#2563EB"}16`,
                            color: form.color || "#2563EB",
                          }}
                        >
                          {option.icon}
                        </span>
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <label>
                Cor
                <div className="theme-color-input embedded-color-input">
                  <input
                    type="color"
                    value={form.color || "#2563EB"}
                    onChange={(event) =>
                      setForm({ ...form, color: event.target.value })
                    }
                  />
                  <input
                    value={form.color || "#2563EB"}
                    onChange={(event) =>
                      setForm({ ...form, color: event.target.value })
                    }
                  />
                </div>
              </label>
              <label>
                Tipo de rendimento
                <select
                  value={form.yieldCalculationType}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      yieldCalculationType: event.target.value as any,
                    })
                  }
                >
                  <option value="CDI_PERCENTAGE">Percentual do CDI</option>
                  <option value="MANUAL">Manual</option>
                </select>
              </label>
              <label>
                % do CDI
                <input
                  type="number"
                  step="0.01"
                  value={form.yieldPercentage || 0}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      yieldPercentage: Number(event.target.value),
                    })
                  }
                />
              </label>
              <label>
                Início do cálculo
                <input
                  type="date"
                  value={form.yieldStartDate || todayISO()}
                  onChange={(event) =>
                    setForm({ ...form, yieldStartDate: event.target.value })
                  }
                />
              </label>
            </div>

            <div className="modal-checkbox-grid">
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={Boolean(form.yieldEnabled)}
                  onChange={(event) =>
                    setForm({ ...form, yieldEnabled: event.target.checked })
                  }
                />{" "}
                Rendimento habilitado
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={Boolean(form.businessDaysOnly)}
                  onChange={(event) =>
                    setForm({ ...form, businessDaysOnly: event.target.checked })
                  }
                />{" "}
                Rende apenas em dias úteis
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={Boolean(form.useBrazilianHolidays)}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      useBrazilianHolidays: event.target.checked,
                    })
                  }
                />{" "}
                Considerar feriados brasileiros
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={Boolean(form.active)}
                  onChange={(event) =>
                    setForm({ ...form, active: event.target.checked })
                  }
                />{" "}
                Ativo
              </label>
            </div>

            <div className="form-actions modal-actions">
              <button
                className="btn btn-ghost"
                type="button"
                onClick={resetJarForm}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                disabled={loading}
                type="submit"
              >
                {editing ? "Salvar cofrinho" : "Criar cofrinho"}
              </button>
            </div>
          </form>
        </Box>
      </Modal>

      <Modal
        open={movementModalOpen}
        onClose={closeMovementModal}
        aria-labelledby="savings-movement-modal-title"
      >
        <Box className="mm-modal-box compact-modal">
          <div className="modal-heading">
            <div>
              <span>
                <TrendingUpIcon /> Movimentação
              </span>
              <h2 id="savings-movement-modal-title">
                {movementAction === "deposit" && "Adicionar valor"}
                {movementAction === "withdraw" && "Retirar valor"}
                {movementAction === "yield" && "Informar rendimento"}
              </h2>
            </div>
            <button type="button" onClick={closeMovementModal}>
              <CloseIcon />
            </button>
          </div>

          <div className="modal-form">
            <label>Valor</label>
            <input
              inputMode="decimal"
              value={formatMoneyInput(movement.amount)}
              onChange={(event) =>
                setMovement({
                  ...movement,
                  amount: parseMoneyInput(event.target.value),
                })
              }
            />
            <label>Data</label>
            <input
              type="date"
              value={movement.occurredOn}
              onChange={(event) =>
                setMovement({ ...movement, occurredOn: event.target.value })
              }
            />
            <label>Descrição</label>
            <input
              value={movement.description}
              onChange={(event) =>
                setMovement({ ...movement, description: event.target.value })
              }
              placeholder="Descrição da movimentação"
            />
            <div className="form-actions modal-actions">
              <button
                className="btn btn-ghost"
                type="button"
                onClick={closeMovementModal}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={doMovement}
              >
                Registrar
              </button>
            </div>
          </div>
        </Box>
      </Modal>
    </div>
  );
}
