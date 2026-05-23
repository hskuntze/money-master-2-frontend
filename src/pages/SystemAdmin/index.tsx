import EmailIcon from "@mui/icons-material/Email";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import ListAltIcon from "@mui/icons-material/ListAlt";
import RefreshIcon from "@mui/icons-material/Refresh";
import SettingsIcon from "@mui/icons-material/Settings";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  FormEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "react-toastify";
import { AuthContext } from "@/contexts/AuthContext";
import {
  AccessLogResponse,
  EmailSettingsResponse,
  EmailSettingsUpdateRequest,
  FailureLogDetailResponse,
  FailureLogResponse,
  PageResponse,
} from "@/types/admin";
import { formatDate, getErrorMessage } from "@/utils/formatters";
import { api } from "@/utils/requests";

type TabKey = "email" | "access" | "failures";

const emptyEmailSettings: EmailSettingsUpdateRequest = {
  enabled: true,
  host: "smtppro.zoho.com",
  port: 587,
  username: "",
  password: "",
  fromAddress: "",
  smtpAuth: true,
  startTlsEnable: true,
  startTlsRequired: true,
  sslEnable: false,
  debug: false,
  connectionTimeoutMs: 10000,
  timeoutMs: 10000,
  writeTimeoutMs: 10000,
  confirmationBaseUrl: "",
};

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return formatDate(value);
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);
}

function statusClass(status?: number) {
  if (!status) return "neutral";
  if (status >= 500) return "danger";
  if (status >= 400) return "warning";
  return "success";
}

export default function SystemAdminPage() {
  const { hasPermission } = useContext(AuthContext);
  const canManageEmail = hasPermission("EMAIL_SETTINGS_MANAGE");
  const canReadLogs = hasPermission("LOG_READ");
  const [tab, setTab] = useState<TabKey>(canManageEmail ? "email" : "access");

  useEffect(() => {
    if (tab === "email" && !canManageEmail) setTab("access");
    if (
      (tab === "access" || tab === "failures") &&
      !canReadLogs &&
      canManageEmail
    )
      setTab("email");
  }, [tab, canManageEmail, canReadLogs]);

  return (
    <div className="system-admin-page page-stack">
      <section className="module-heading-row">
        <div>
          <h1>Sistema</h1>
          <p>
            Configure SMTP, teste o envio de e-mails e acompanhe acessos e
            falhas da aplicação.
          </p>
        </div>
      </section>

      <div className="system-tabs">
        {canManageEmail && (
          <button
            className={tab === "email" ? "active" : ""}
            onClick={() => setTab("email")}
            type="button"
          >
            <EmailIcon /> E-mail
          </button>
        )}
        {canReadLogs && (
          <>
            <button
              className={tab === "access" ? "active" : ""}
              onClick={() => setTab("access")}
              type="button"
            >
              <ListAltIcon /> Logs de acesso
            </button>
            <button
              className={tab === "failures" ? "active" : ""}
              onClick={() => setTab("failures")}
              type="button"
            >
              <ErrorOutlineOutlinedIcon /> Logs de falhas
            </button>
          </>
        )}
      </div>

      {tab === "email" && canManageEmail && <EmailSettingsPanel />}
      {tab === "access" && canReadLogs && <AccessLogsPanel />}
      {tab === "failures" && canReadLogs && <FailureLogsPanel />}
    </div>
  );
}

function EmailSettingsPanel() {
  const [form, setForm] =
    useState<EmailSettingsUpdateRequest>(emptyEmailSettings);
  const [loadedSettings, setLoadedSettings] =
    useState<EmailSettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testTo, setTestTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getEmailSettings();
      setLoadedSettings(response.data);
      setForm({ ...response.data, password: "" });
      setTestTo(response.data.fromAddress || response.data.username || "");
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Não foi possível carregar as configurações de e-mail.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = useCallback(
    <K extends keyof EmailSettingsUpdateRequest>(
      key: K,
      value: EmailSettingsUpdateRequest[K],
    ) => {
      setForm((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  const save = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      setSaving(true);
      try {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        const response = await api.updateEmailSettings(payload);
        setLoadedSettings(response.data);
        setForm({ ...response.data, password: "" });
        toast.success("Configurações de e-mail salvas.");
      } catch (error) {
        toast.error(
          getErrorMessage(error, "Não foi possível salvar as configurações."),
        );
      } finally {
        setSaving(false);
      }
    },
    [form],
  );

  const testEmail = useCallback(async () => {
    if (!testTo) {
      toast.warning("Informe um destinatário para o teste.");
      return;
    }
    setTesting(true);
    try {
      const response = await api.testEmailSettings(testTo);
      toast.success(response.data.message);
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Falha ao enviar e-mail de teste. Verifique os logs de falhas.",
        ),
      );
    } finally {
      setTesting(false);
    }
  }, [testTo]);

  if (loading)
    return (
      <section className="system-card">Carregando configurações...</section>
    );

  return (
    <section className="system-card">
      <div className="system-card-heading">
        <div>
          <span className="eyebrow">
            <SettingsIcon /> SMTP
          </span>
          <h2>Configuração de envio de e-mail</h2>
          <p>
            O sistema usa estas configurações para confirmação de cadastro e
            reenvio de confirmação. Senhas não são exibidas depois de salvas.
          </p>
        </div>
        <button className="btn btn-ghost" type="button" onClick={load}>
          <RefreshIcon /> Recarregar
        </button>
      </div>

      <div className="email-settings-status">
        <span
          className={
            loadedSettings?.usingDatabaseSettings
              ? "status-pill success"
              : "status-pill neutral"
          }
        >
          {loadedSettings?.usingDatabaseSettings
            ? "Usando configuração do banco"
            : "Usando variáveis de ambiente"}
        </span>
        <span
          className={
            loadedSettings?.passwordConfigured
              ? "status-pill success"
              : "status-pill warning"
          }
        >
          {loadedSettings?.passwordConfigured
            ? "Senha configurada"
            : "Senha não configurada"}
        </span>
        <span
          className={
            form.enabled ? "status-pill success" : "status-pill danger"
          }
        >
          {form.enabled ? "Envio ativo" : "Envio desabilitado"}
        </span>
      </div>

      <form className="system-form" onSubmit={save}>
        <label className="checkbox-line">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(event) => update("enabled", event.target.checked)}
          />
          Habilitar envio de e-mail
        </label>

        <div className="system-grid two">
          <label>
            Host SMTP
            <input
              required
              value={form.host || ""}
              onChange={(event) => update("host", event.target.value)}
              placeholder="smtppro.zoho.com"
            />
          </label>
          <label>
            Porta
            <input
              required
              type="number"
              value={form.port || 587}
              onChange={(event) => update("port", Number(event.target.value))}
            />
          </label>
          <label>
            Usuário SMTP
            <input
              value={form.username || ""}
              onChange={(event) => update("username", event.target.value)}
              placeholder="usuario@dominio.com"
            />
          </label>
          <label>
            Senha SMTP
            <input
              type="password"
              value={form.password || ""}
              onChange={(event) => update("password", event.target.value)}
              placeholder="Deixe vazio para manter a atual"
            />
          </label>
          <label>
            Remetente / From
            <input
              required
              type="email"
              value={form.fromAddress || ""}
              onChange={(event) => update("fromAddress", event.target.value)}
              placeholder="noreply@dominio.com"
            />
          </label>
          <label>
            URL de confirmação
            <input
              required
              value={form.confirmationBaseUrl || ""}
              onChange={(event) =>
                update("confirmationBaseUrl", event.target.value)
              }
              placeholder="https://app.seudominio.com/api/auth/confirm-email"
            />
          </label>
        </div>

        <div className="system-grid four">
          <label className="checkbox-line">
            <input
              type="checkbox"
              checked={form.smtpAuth}
              onChange={(event) => update("smtpAuth", event.target.checked)}
            />
            SMTP auth
          </label>
          <label className="checkbox-line">
            <input
              type="checkbox"
              checked={form.startTlsEnable}
              onChange={(event) =>
                update("startTlsEnable", event.target.checked)
              }
            />
            STARTTLS
          </label>
          <label className="checkbox-line">
            <input
              type="checkbox"
              checked={form.startTlsRequired}
              onChange={(event) =>
                update("startTlsRequired", event.target.checked)
              }
            />
            STARTTLS obrigatório
          </label>
          <label className="checkbox-line">
            <input
              type="checkbox"
              checked={form.sslEnable}
              onChange={(event) => update("sslEnable", event.target.checked)}
            />
            SSL direto
          </label>
          <label className="checkbox-line">
            <input
              type="checkbox"
              checked={form.debug}
              onChange={(event) => update("debug", event.target.checked)}
            />
            Mail debug
          </label>
        </div>

        <div className="system-grid three">
          <label>
            Connection timeout (ms)
            <input
              type="number"
              value={form.connectionTimeoutMs || 10000}
              onChange={(event) =>
                update("connectionTimeoutMs", Number(event.target.value))
              }
            />
          </label>
          <label>
            Timeout (ms)
            <input
              type="number"
              value={form.timeoutMs || 10000}
              onChange={(event) =>
                update("timeoutMs", Number(event.target.value))
              }
            />
          </label>
          <label>
            Write timeout (ms)
            <input
              type="number"
              value={form.writeTimeoutMs || 10000}
              onChange={(event) =>
                update("writeTimeoutMs", Number(event.target.value))
              }
            />
          </label>
        </div>

        <div className="system-actions-row">
          <button className="btn btn-primary" disabled={saving} type="submit">
            {saving ? "Salvando..." : "Salvar configurações"}
          </button>
        </div>
      </form>

      <div className="email-test-box">
        <label>
          Destinatário do teste
          <input
            type="email"
            value={testTo}
            onChange={(event) => setTestTo(event.target.value)}
            placeholder="destinatario@dominio.com"
          />
        </label>
        <button
          className="btn btn-ghost"
          disabled={testing}
          type="button"
          onClick={testEmail}
        >
          <EmailIcon /> {testing ? "Enviando..." : "Enviar teste"}
        </button>
      </div>
    </section>
  );
}

function AccessLogsPanel() {
  const [page, setPage] = useState(0);
  const [path, setPath] = useState("");
  const [statusCode, setStatusCode] = useState("");
  const [data, setData] = useState<PageResponse<AccessLogResponse> | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  const params = useMemo(
    () => ({
      page,
      size: 25,
      path: path || undefined,
      statusCode: statusCode || undefined,
    }),
    [page, path, statusCode],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.listAccessLogs(params);
      setData(response.data);
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Não foi possível carregar logs de acesso."),
      );
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="system-card">
      <LogToolbar
        title="Logs de acesso"
        loading={loading}
        onRefresh={load}
        path={path}
        setPath={setPath}
        statusCode={statusCode}
        setStatusCode={setStatusCode}
      />
      <div className="system-table-wrap">
        <table className="system-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Método</th>
              <th>Rota</th>
              <th>Status</th>
              <th>Duração</th>
              <th>Usuário</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {data?.content?.map((log) => (
              <tr key={log.id}>
                <td>{formatDateTime(log.occurredAt)}</td>
                <td>{log.method}</td>
                <td>
                  <code>
                    {log.path}
                    {log.queryString ? `?${log.queryString}` : ""}
                  </code>
                </td>
                <td>
                  <span
                    className={`status-pill ${statusClass(log.statusCode)}`}
                  >
                    {log.statusCode}
                  </span>
                </td>
                <td>{log.durationMs}ms</td>
                <td>{log.principal || "-"}</td>
                <td>{log.clientIp || "-"}</td>
              </tr>
            ))}
            {!data?.content?.length && (
              <tr>
                <td colSpan={7}>Nenhum log encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} setPage={setPage} data={data} />
    </section>
  );
}

function FailureLogsPanel() {
  const [page, setPage] = useState(0);
  const [path, setPath] = useState("");
  const [statusCode, setStatusCode] = useState("");
  const [data, setData] = useState<PageResponse<FailureLogResponse> | null>(
    null,
  );
  const [selected, setSelected] = useState<FailureLogDetailResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  const params = useMemo(
    () => ({
      page,
      size: 25,
      path: path || undefined,
      statusCode: statusCode || undefined,
    }),
    [page, path, statusCode],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.listFailureLogs(params);
      setData(response.data);
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Não foi possível carregar logs de falhas."),
      );
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = useCallback(async (id: number) => {
    try {
      const response = await api.getFailureLog(id);
      setSelected(response.data);
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Não foi possível abrir o detalhe da falha."),
      );
    }
  }, []);

  return (
    <section className="system-card">
      <LogToolbar
        title="Logs de falhas"
        loading={loading}
        onRefresh={load}
        path={path}
        setPath={setPath}
        statusCode={statusCode}
        setStatusCode={setStatusCode}
      />
      <div className="system-table-wrap">
        <table className="system-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Rota</th>
              <th>Status</th>
              <th>Exceção</th>
              <th>Mensagem</th>
              <th>Usuário</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data?.content?.map((log) => (
              <tr key={log.id}>
                <td>{formatDateTime(log.occurredAt)}</td>
                <td>
                  <code>
                    {log.method} {log.path}
                  </code>
                </td>
                <td>
                  <span
                    className={`status-pill ${statusClass(log.statusCode)}`}
                  >
                    {log.statusCode}
                  </span>
                </td>
                <td>{log.exceptionClass?.split(".").pop()}</td>
                <td>{log.message}</td>
                <td>{log.principal || "-"}</td>
                <td>
                  <button
                    className="icon-link"
                    type="button"
                    onClick={() => openDetail(log.id)}
                  >
                    <VisibilityIcon /> Ver
                  </button>
                </td>
              </tr>
            ))}
            {!data?.content?.length && (
              <tr>
                <td colSpan={7}>Nenhum log encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} setPage={setPage} data={data} />

      {selected && (
        <article className="failure-detail-card">
          <div className="system-card-heading">
            <div>
              <span
                className={`status-pill ${statusClass(selected.statusCode)}`}
              >
                {selected.statusCode}
              </span>
              <h3>{selected.exceptionClass}</h3>
              <p>{selected.message}</p>
            </div>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => setSelected(null)}
            >
              Fechar
            </button>
          </div>
          <div className="failure-meta-grid">
            <span>
              <strong>Data:</strong> {formatDateTime(selected.occurredAt)}
            </span>
            <span>
              <strong>Rota:</strong> {selected.method} {selected.path}
            </span>
            <span>
              <strong>Usuário:</strong> {selected.principal || "-"}
            </span>
            <span>
              <strong>IP:</strong> {selected.clientIp || "-"}
            </span>
          </div>
          <pre>{selected.stackTrace || "Stack trace não disponível."}</pre>
        </article>
      )}
    </section>
  );
}

function LogToolbar({
  title,
  loading,
  onRefresh,
  path,
  setPath,
  statusCode,
  setStatusCode,
}: {
  title: string;
  loading: boolean;
  onRefresh: () => void;
  path: string;
  setPath: (value: string) => void;
  statusCode: string;
  setStatusCode: (value: string) => void;
}) {
  return (
    <div className="system-card-heading log-toolbar">
      <div>
        <h2>{title}</h2>
        <p>
          Filtre por rota e status HTTP para encontrar eventos de produção mais
          rapidamente.
        </p>
      </div>
      <div className="log-filters">
        <input
          value={path}
          onChange={(event) => setPath(event.target.value)}
          placeholder="Filtrar rota"
        />
        <input
          value={statusCode}
          onChange={(event) => setStatusCode(event.target.value)}
          placeholder="Status"
        />
        <button
          className="btn btn-ghost"
          type="button"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshIcon /> {loading ? "Carregando..." : "Atualizar"}
        </button>
      </div>
    </div>
  );
}

function Pagination<T>({
  page,
  setPage,
  data,
}: {
  page: number;
  setPage: (value: number) => void;
  data: PageResponse<T> | null;
}) {
  return (
    <div className="pagination-row">
      <button
        className="btn btn-ghost"
        type="button"
        disabled={!data || data.first}
        onClick={() => setPage(Math.max(0, page - 1))}
      >
        Anterior
      </button>
      <span>
        Página {(data?.number ?? page) + 1} de {data?.totalPages || 1} •{" "}
        {data?.totalElements || 0} registros
      </span>
      <button
        className="btn btn-ghost"
        type="button"
        disabled={!data || data.last}
        onClick={() => setPage(page + 1)}
      >
        Próxima
      </button>
    </div>
  );
}
