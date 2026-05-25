import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { ChangeEvent, FormEvent, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { AuthContext } from "@/contexts/AuthContext";
import { UserFinancialProfilePayload } from "@/types/finance";
import { getErrorMessage } from "@/utils/formatters";
import { formatMoneyInput, parseMoneyInput } from "@/utils/moneyMask";
import { api, resolveApiAssetUrl } from "@/utils/requests";

const MAX_AVATAR_SOURCE_SIZE = 5 * 1024 * 1024;
const CROP_CANVAS_SIZE = 420;

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

function initials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || "MM";
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function makeCroppedAvatarBlob(imageUrl: string, zoom: number, offsetX: number, offsetY: number) {
  return new Promise<Blob>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = CROP_CANVAS_SIZE;
      canvas.height = CROP_CANVAS_SIZE;
      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("Não foi possível preparar o recorte da imagem."));
        return;
      }

      context.clearRect(0, 0, CROP_CANVAS_SIZE, CROP_CANVAS_SIZE);
      const baseScale = Math.max(CROP_CANVAS_SIZE / image.width, CROP_CANVAS_SIZE / image.height);
      const scale = baseScale * zoom;
      const drawWidth = image.width * scale;
      const drawHeight = image.height * scale;
      const dx = (CROP_CANVAS_SIZE - drawWidth) / 2 + offsetX;
      const dy = (CROP_CANVAS_SIZE - drawHeight) / 2 + offsetY;

      context.drawImage(image, dx, dy, drawWidth, drawHeight);
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Não foi possível gerar o arquivo da foto de perfil."));
          return;
        }
        resolve(blob);
      }, "image/png", 0.92);
    };
    image.onerror = () => reject(new Error("Não foi possível ler a imagem selecionada."));
    image.src = imageUrl;
  });
}

export default function UserProfilePage() {
  const { user, reloadUser } = useContext(AuthContext);
  const [profile, setProfile] = useState<UserFinancialProfilePayload>(emptyProfile);
  const [name, setName] = useState(user?.name || "");
  const [initialLoading, setInitialLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [avatarOffsetX, setAvatarOffsetX] = useState(0);
  const [avatarOffsetY, setAvatarOffsetY] = useState(0);

  const currentAvatarUrl = useMemo(() => resolveApiAssetUrl(user?.avatarUrl), [user?.avatarUrl]);
  const visibleAvatarUrl = avatarPreviewUrl || currentAvatarUrl;

  useEffect(() => {
    setName(user?.name || "");
  }, [user?.name]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    };
  }, [avatarPreviewUrl]);

  const loadProfile = useCallback(async () => {
    setInitialLoading(true);
    try {
      const response = await api.getFinancialProfile();
      setProfile({
        age: response.data.age ?? null,
        ageRange: response.data.ageRange ?? "",
        profession: response.data.profession ?? "",
        approximateMonthlyIncome: response.data.approximateMonthlyIncome ?? null,
        currentFinancialSituation: response.data.currentFinancialSituation ?? "",
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
      toast.error(getErrorMessage(error, "Não foi possível carregar seu perfil."));
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleAvatarFile = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem válido.");
      return;
    }
    if (file.size > MAX_AVATAR_SOURCE_SIZE) {
      toast.error("A imagem selecionada deve ter no máximo 5 MB.");
      return;
    }

    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    setAvatarPreviewUrl(URL.createObjectURL(file));
    setAvatarZoom(1);
    setAvatarOffsetX(0);
    setAvatarOffsetY(0);
  }, [avatarPreviewUrl]);

  const submitPersonalData = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    setSavingPersonal(true);
    try {
      await api.updateCurrentUserProfile({ name: name.trim() });
      await reloadUser();
      toast.success("Dados pessoais atualizados.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível atualizar seus dados pessoais."));
    } finally {
      setSavingPersonal(false);
    }
  }, [name, reloadUser]);

  const saveAvatar = useCallback(async () => {
    if (!avatarPreviewUrl) {
      toast.info("Selecione uma imagem para ajustar antes de salvar.");
      return;
    }
    setSavingAvatar(true);
    try {
      const blob = await makeCroppedAvatarBlob(avatarPreviewUrl, avatarZoom, avatarOffsetX, avatarOffsetY);
      await api.uploadCurrentUserAvatar(blob);
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
      setAvatarPreviewUrl(null);
      await reloadUser();
      toast.success("Foto de perfil atualizada.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível salvar a foto de perfil."));
    } finally {
      setSavingAvatar(false);
    }
  }, [avatarOffsetX, avatarOffsetY, avatarPreviewUrl, avatarZoom, reloadUser]);

  const removeAvatar = useCallback(async () => {
    setSavingAvatar(true);
    try {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
        setAvatarPreviewUrl(null);
      } else {
        await api.deleteCurrentUserAvatar();
        await reloadUser();
      }
      toast.success("Foto de perfil removida.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível remover a foto de perfil."));
    } finally {
      setSavingAvatar(false);
    }
  }, [avatarPreviewUrl, reloadUser]);

  const submitFinancialProfile = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      await api.updateFinancialProfile({
        ...profile,
        age: profile.age ? Number(profile.age) : null,
        approximateMonthlyIncome: Number(profile.approximateMonthlyIncome || 0) || null,
        onboardingCompleted: true,
      });
      toast.success("Perfil financeiro salvo.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível salvar seu perfil financeiro."));
    } finally {
      setSavingProfile(false);
    }
  }, [profile]);

  return (
    <div className="page-stack user-profile-page" data-tour="financial-profile">
      <section className="page-hero compact user-profile-hero">
        <div>
          <span className="eyebrow">Conta e preferências</span>
          <h1>Perfil do usuário</h1>
          <p>
            Atualize seus dados pessoais, foto e contexto financeiro usado pelo Money Master para personalizar o planejamento mensal.
          </p>
        </div>
        {profile.onboardingCompleted && (
          <span className="status-pill success">
            <CheckCircleOutlineIcon fontSize="small" /> Perfil configurado
          </span>
        )}
      </section>

      <section className="user-profile-grid">
        <div className="panel user-profile-sidebar-card">
          <div className="profile-avatar-preview" aria-label="Foto de perfil atual">
            {visibleAvatarUrl ? (
              <img src={visibleAvatarUrl} alt="Foto de perfil" />
            ) : (
              <span>{initials(user?.name, user?.email)}</span>
            )}
          </div>
          <div>
            <h2>{user?.name || "Usuário"}</h2>
            <p>{user?.email}</p>
          </div>
          <label className="btn btn-secondary profile-upload-button">
            <PhotoCameraOutlinedIcon /> Escolher foto
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarFile} />
          </label>
          <p className="profile-help-text">Use JPG, PNG ou WEBP. Você poderá centralizar, aproximar e salvar em formato circular.</p>
        </div>

        <div className="panel user-profile-personal-card">
          <div className="compact-heading">
            <span className="eyebrow">Dados cadastrais</span>
            <h2>Informações pessoais</h2>
            <p>Estes dados aparecem no menu, no topo do sistema e nas áreas administrativas.</p>
          </div>
          <form onSubmit={submitPersonalData} className="user-personal-form">
            <label>
              Nome
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Seu nome" />
            </label>
            <label>
              E-mail
              <input value={user?.email || ""} disabled />
            </label>
            <div className="modal-actions end">
              <button type="submit" className="btn btn-primary" disabled={savingPersonal || !name.trim()}>
                <SaveOutlinedIcon /> Salvar dados
              </button>
            </div>
          </form>
        </div>

        <div className="panel profile-avatar-editor-card">
          <div className="compact-heading">
            <span className="eyebrow">Foto do usuário</span>
            <h2>Recorte e redimensione antes de salvar</h2>
            <p>O círculo abaixo mostra exatamente como a imagem será exibida no sistema.</p>
          </div>

          <div className="avatar-crop-shell">
            <div className="avatar-crop-frame">
              {avatarPreviewUrl ? (
                <img
                  src={avatarPreviewUrl}
                  alt="Prévia para recorte"
                  style={{
                    transform: `translate(${avatarOffsetX}px, ${avatarOffsetY}px) scale(${avatarZoom})`,
                  }}
                />
              ) : visibleAvatarUrl ? (
                <img src={visibleAvatarUrl} alt="Foto atual" />
              ) : (
                <AccountCircleOutlinedIcon />
              )}
            </div>
          </div>

          <div className="avatar-controls">
            <label>
              Aproximação
              <input
                type="range"
                min="1"
                max="2.5"
                step="0.05"
                value={avatarZoom}
                disabled={!avatarPreviewUrl}
                onChange={(event) => setAvatarZoom(Number(event.target.value))}
              />
            </label>
            <div className="avatar-control-row">
              <label>
                Horizontal
                <input
                  type="range"
                  min="-120"
                  max="120"
                  step="1"
                  value={avatarOffsetX}
                  disabled={!avatarPreviewUrl}
                  onChange={(event) => setAvatarOffsetX(Number(event.target.value))}
                />
              </label>
              <label>
                Vertical
                <input
                  type="range"
                  min="-120"
                  max="120"
                  step="1"
                  value={avatarOffsetY}
                  disabled={!avatarPreviewUrl}
                  onChange={(event) => setAvatarOffsetY(Number(event.target.value))}
                />
              </label>
            </div>
          </div>

          <div className="modal-actions end">
            <button type="button" className="btn btn-ghost" onClick={removeAvatar} disabled={savingAvatar || (!avatarPreviewUrl && !user?.avatarUrl)}>
              <DeleteOutlineIcon /> Remover
            </button>
            <button type="button" className="btn btn-primary" onClick={saveAvatar} disabled={savingAvatar || !avatarPreviewUrl}>
              <CheckCircleOutlineIcon /> Salvar foto
            </button>
          </div>
        </div>
      </section>

      <form className="panel financial-profile-form user-financial-profile-form" onSubmit={submitFinancialProfile}>
        <div className="compact-heading">
          <span className="eyebrow">Contexto financeiro</span>
          <h2>Dados para recomendações mais responsáveis</h2>
          <p>Essas informações ajudam a IA a orientar melhor, sempre em caráter educacional.</p>
        </div>

        <div className="form-grid two-columns">
          <label>
            Idade
            <input
              type="number"
              min={0}
              value={profile.age ?? ""}
              onChange={(event) => setProfile((prev) => ({ ...prev, age: event.target.value ? Number(event.target.value) : null }))}
              placeholder="Ex.: 31"
            />
          </label>
          <label>
            Faixa etária
            <input
              value={profile.ageRange || ""}
              onChange={(event) => setProfile((prev) => ({ ...prev, ageRange: event.target.value }))}
              placeholder="Ex.: 30 a 35 anos"
            />
          </label>
        </div>

        <div className="form-grid two-columns">
          <label>
            Profissão
            <input
              value={profile.profession || ""}
              onChange={(event) => setProfile((prev) => ({ ...prev, profession: event.target.value }))}
              placeholder="Ex.: Desenvolvedor de software"
            />
          </label>
          <label>
            Renda mensal aproximada
            <input
              inputMode="decimal"
              value={formatMoneyInput(profile.approximateMonthlyIncome || 0)}
              onChange={(event) => setProfile((prev) => ({ ...prev, approximateMonthlyIncome: parseMoneyInput(event.target.value) }))}
            />
          </label>
        </div>

        <label>
          Situação financeira atual
          <textarea
            value={profile.currentFinancialSituation || ""}
            onChange={(event) => setProfile((prev) => ({ ...prev, currentFinancialSituation: event.target.value }))}
            placeholder="Ex.: Organizando gastos do mês, com foco em quitar cartão e aumentar reserva."
          />
        </label>

        <label>
          Hábitos de consumo
          <textarea
            value={profile.spendingHabits || ""}
            onChange={(event) => setProfile((prev) => ({ ...prev, spendingHabits: event.target.value }))}
            placeholder="Ex.: Uso cartão de crédito, tenho assinaturas, gasto com restaurantes aos fins de semana."
          />
        </label>

        <label>
          Objetivos financeiros
          <textarea
            value={profile.financialObjectives || ""}
            onChange={(event) => setProfile((prev) => ({ ...prev, financialObjectives: event.target.value }))}
            placeholder="Ex.: Sair do aperto, formar reserva, investir melhor e planejar compras grandes."
          />
        </label>

        <div className="form-grid three-columns">
          <label>
            Curto prazo
            <textarea
              value={profile.shortTermGoals || ""}
              onChange={(event) => setProfile((prev) => ({ ...prev, shortTermGoals: event.target.value }))}
              placeholder="Próximos 3 meses"
            />
          </label>
          <label>
            Médio prazo
            <textarea
              value={profile.mediumTermGoals || ""}
              onChange={(event) => setProfile((prev) => ({ ...prev, mediumTermGoals: event.target.value }))}
              placeholder="6 a 24 meses"
            />
          </label>
          <label>
            Longo prazo
            <textarea
              value={profile.longTermGoals || ""}
              onChange={(event) => setProfile((prev) => ({ ...prev, longTermGoals: event.target.value }))}
              placeholder="Acima de 2 anos"
            />
          </label>
        </div>

        <div className="form-grid three-columns">
          <label>
            Tolerância ao risco
            <select value={profile.riskTolerance || ""} onChange={(event) => setProfile((prev) => ({ ...prev, riskTolerance: event.target.value }))}>
              <option value="">Não informado</option>
              <option value="Baixa">Baixa</option>
              <option value="Moderada">Moderada</option>
              <option value="Alta">Alta</option>
            </select>
          </label>
          <label>
            Conhecimento em investimentos
            <select value={profile.investmentKnowledge || ""} onChange={(event) => setProfile((prev) => ({ ...prev, investmentKnowledge: event.target.value }))}>
              <option value="">Não informado</option>
              <option value="Iniciante">Iniciante</option>
              <option value="Intermediário">Intermediário</option>
              <option value="Avançado">Avançado</option>
            </select>
          </label>
          <label>
            Perfil de investidor
            <select value={profile.investorProfile || ""} onChange={(event) => setProfile((prev) => ({ ...prev, investorProfile: event.target.value }))}>
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
            value={profile.financialPreferences || ""}
            onChange={(event) => setProfile((prev) => ({ ...prev, financialPreferences: event.target.value }))}
            placeholder="Ex.: Prefiro previsibilidade, quero evitar dívidas longas, gosto de automatizar aportes."
          />
        </label>

        <div className="profile-form-footer">
          <div>
            <AutoAwesomeIcon />
            <span>A IA usa estes dados apenas como contexto educacional para melhorar as respostas.</span>
          </div>
          <button className="btn btn-primary" type="submit" disabled={savingProfile || initialLoading}>
            <CheckCircleOutlineIcon /> Salvar perfil financeiro
          </button>
        </div>
      </form>
    </div>
  );
}
