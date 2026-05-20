import CloseIcon from "@mui/icons-material/Close";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PaletteIcon from "@mui/icons-material/Palette";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import VisibilityIcon from "@mui/icons-material/Visibility";
import WalletIcon from "@mui/icons-material/Wallet";
import { Box, Modal } from "@mui/material";
import { FormEvent, useCallback, useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import ProgressBar from "@/components/ProgressBar";
import { ThemeContext } from "@/contexts/ThemeContext";
import { defaultTheme, ThemeResponse } from "@/types/theme";
import { formatMoney, getErrorMessage } from "@/utils/formatters";
import { api } from "@/utils/requests";

const colorSections: Array<{
  title: string;
  fields: Array<keyof Pick<ThemeResponse, "primaryColor" | "secondaryColor" | "accentColor" | "backgroundColor" | "textColor" | "cardColor">>;
}> = [
  { title: "Paleta de cores", fields: ["primaryColor", "secondaryColor", "accentColor"] },
  { title: "Superfícies e cartões", fields: ["backgroundColor", "cardColor", "textColor"] },
];

const labels: Record<string, string> = {
  primaryColor: "Cor primária",
  secondaryColor: "Cor secundária",
  accentColor: "Cor de destaque",
  backgroundColor: "Cor de fundo",
  textColor: "Cor do texto",
  cardColor: "Cor do card",
};

export default function ThemeSettingsPage() {
  const { theme, applyPreview, reloadTheme } = useContext(ThemeContext);
  const [form, setForm] = useState<ThemeResponse>(theme);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    setForm(theme);
  }, [theme]);

  const update = useCallback(
    <K extends keyof ThemeResponse>(key: K, value: ThemeResponse[K]) => {
      setForm((current) => {
        const next = { ...current, [key]: value };
        applyPreview(next);
        return next;
      });
    },
    [applyPreview],
  );

  const save = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      setSaving(true);
      try {
        const { id, ...payload } = form;
        await api.updateTheme(payload);
        await reloadTheme();
        toast.success("Tema salvo com sucesso.");
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setSaving(false);
      }
    },
    [form, reloadTheme],
  );

  const restore = useCallback(() => {
    setForm(defaultTheme);
    applyPreview(defaultTheme);
  }, [applyPreview]);

  const PreviewCard = ({ large = false }: { large?: boolean }) => (
    <div
      className={`theme-live-card ${large ? "large" : ""}`}
      style={{ background: form.cardColor, color: form.textColor, borderColor: `${form.secondaryColor}22` }}
    >
      <div className="theme-live-header">
        <h3>Dashboard</h3>
        <span style={{ background: `${form.primaryColor}18`, color: form.primaryColor }}>
          <DashboardIcon />
        </span>
      </div>
      <article className="theme-live-balance" style={{ background: form.primaryColor }}>
        <div>
          <span>Saldo Total</span>
          <strong>{formatMoney(45290)}</strong>
        </div>
        <WalletIcon />
      </article>
      <div className="theme-live-mini-grid">
        <article style={{ background: form.backgroundColor }}>
          <span>Metas</span>
          <strong>65%</strong>
          <ProgressBar value={65} />
        </article>
        <article style={{ background: form.backgroundColor }}>
          <span>Gastos</span>
          <strong>-R$ 1.200</strong>
          <small style={{ color: form.accentColor }}>12% este mês</small>
        </article>
      </div>
      <label>Input exemplo</label>
      <input readOnly value="Texto focado..." style={{ borderColor: form.primaryColor, color: form.textColor }} />
      <button style={{ background: form.primaryColor, color: "#fff" }}>Botão primário</button>
      <button className="preview-secondary-button" style={{ borderColor: form.primaryColor, color: form.primaryColor }}>
        Botão secundário
      </button>
      <div className="theme-live-typography">
        <span>Tipografia</span>
        <strong>Headline Medium</strong>
        <p>Corpo de texto padrão para descrições e parágrafos.</p>
      </div>
    </div>
  );

  return (
    <div className="theme-settings-page page-stack">
      <section className="module-heading-row theme-heading-row">
        <div>
          <h1>Configuração de Tema</h1>
          <p>Personalize a identidade visual do seu ecossistema financeiro.</p>
        </div>
      </section>

      <section className="theme-editor-grid">
        <form className="theme-form-stack" onSubmit={save}>
          <article className="theme-editor-section">
            <h2>Identidade</h2>
            <div className="theme-single-field">
              <label>Nome do aplicativo</label>
              <input value={form.appName || ""} onChange={(event) => update("appName", event.target.value)} />
            </div>
            <div className="theme-two-fields">
              <label>
                Logo URL
                <input value={form.logoUrl || ""} onChange={(event) => update("logoUrl", event.target.value)} placeholder="https://..." />
              </label>
              <label>
                Título do login
                <input value={form.loginTitle || ""} onChange={(event) => update("loginTitle", event.target.value)} />
              </label>
            </div>
            <label>
              Subtítulo do login
              <textarea value={form.loginSubtitle || ""} onChange={(event) => update("loginSubtitle", event.target.value)} />
            </label>
          </article>

          {colorSections.map((section) => (
            <article className="theme-editor-section" key={section.title}>
              <h2>{section.title}</h2>
              <div className="theme-color-grid">
                {section.fields.map((field) => (
                  <label key={field}>
                    {labels[field]}
                    <div className="theme-color-input">
                      <input
                        type="color"
                        value={(form[field] as string) || "#000000"}
                        onChange={(event) => update(field, event.target.value as any)}
                      />
                      <input value={(form[field] as string) || ""} onChange={(event) => update(field, event.target.value as any)} />
                    </div>
                  </label>
                ))}
              </div>
            </article>
          ))}

          <div className="theme-actions-row">
            <button className="btn btn-primary" disabled={saving} type="submit">
              Salvar alterações
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => setPreviewOpen(true)}>
              <VisibilityIcon /> Visualizar tela cheia
            </button>
            <button className="theme-restore-button" type="button" onClick={restore}>
              <RestartAltIcon /> Restaurar padrões
            </button>
          </div>
        </form>

        <aside className="theme-preview-rail">
          <span className="theme-preview-badge">
            <PaletteIcon /> Visualização em tempo real
          </span>
          <PreviewCard />
          <small>As alterações feitas aqui são aplicadas globalmente após salvar.</small>
        </aside>
      </section>

      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} aria-labelledby="theme-preview-title">
        <Box className="mm-modal-box theme-preview-modal">
          <div className="modal-heading">
            <div>
              <span>
                <VisibilityIcon /> Prévia
              </span>
              <h2 id="theme-preview-title">Visualização do tema</h2>
            </div>
            <button type="button" onClick={() => setPreviewOpen(false)}>
              <CloseIcon />
            </button>
          </div>
          <PreviewCard large />
        </Box>
      </Modal>
    </div>
  );
}
