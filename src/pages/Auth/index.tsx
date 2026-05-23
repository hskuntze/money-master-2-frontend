import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useContext, useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { toast } from "react-toastify";
import { AuthContext } from "@/contexts/AuthContext";
import { ThemeContext } from "@/contexts/ThemeContext";
import {
  requestBackendLogin,
  requestBackendRegister,
  api,
} from "@/utils/requests";
import { getErrorMessage } from "@/utils/formatters";

export default function AuthPage({
  mode,
}: {
  mode: "login" | "register" | "recover" | "confirm";
}) {
  const { setSession, authenticated } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const confirmationToken = searchParams.get("token");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [confirmationStatus, setConfirmationStatus] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (authenticated && (mode === "login" || mode === "register")) {
      navigate("/app/dashboard", { replace: true });
    }
  }, [authenticated, mode, navigate]);

  useEffect(() => {
    if (mode !== "confirm") return;
    if (!confirmationToken) {
      setConfirmationStatus("Token não informado.");
      return;
    }
    api
      .confirmEmail(confirmationToken)
      .then((res) => setConfirmationStatus(res.data.message))
      .catch((err) =>
        setConfirmationStatus(
          getErrorMessage(err, "Não foi possível confirmar o e-mail."),
        ),
      );
  }, [mode, confirmationToken]);

  const from = (location.state as any)?.from?.pathname || "/app/dashboard";

  async function submitLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await requestBackendLogin({
        email: form.email,
        password: form.password,
      });
      setSession(response.data);
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, "Falha no login."));
    } finally {
      setLoading(false);
    }
  }

  async function submitRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await requestBackendRegister({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      toast.success(
        "Cadastro realizado. Confira seu e-mail para ativar a conta.",
      );
      navigate("/login");
    } catch (error) {
      toast.error(getErrorMessage(error, "Falha ao cadastrar."));
    } finally {
      setLoading(false);
    }
  }

  async function resendConfirmation() {
    if (!form.email) {
      toast.warning("Informe o e-mail para reenviar a confirmação.");
      return;
    }
    try {
      await api.resendConfirmation(form.email);
      toast.success("E-mail de confirmação reenviado.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const isLogin = mode === "login";
  const isRegister = mode === "register";

  return (
    <div className="auth-page">
      <section className="auth-aside">
        <Link to="/" className="public-brand light">
          {theme.logoUrl ? (
            <img src={theme.logoUrl} alt={theme.appName || "Money Master 2"} />
          ) : (
            <span>MM</span>
          )}
          <strong>{theme.appName || "Money Master 2"}</strong>
        </Link>
        <div>
          <span className="eyebrow">
            <AutoAwesomeIcon /> IA financeira
          </span>
          <h1>{theme.loginTitle || "Controle financeiro inteligente"}</h1>
          <p>
            {theme.loginSubtitle ||
              "Registre seus lançamentos conversando com a IA e acompanhe seus resultados em tempo real."}
          </p>
        </div>
        <div className="auth-benefits">
          <span>Classificação automática por categoria</span>
          <span>Dashboard com saldo atual</span>
          <span>Cofrinhos com metas e rendimento</span>
        </div>
      </section>

      <section className="auth-panel">
        {mode === "confirm" ? (
          <div className="auth-card">
            <h2>Confirmação de e-mail</h2>
            <p>{confirmationStatus || "Confirmando seu cadastro..."}</p>
            <Link className="btn btn-primary full" to="/login">
              Ir para login
            </Link>
          </div>
        ) : mode === "recover" ? (
          <div className="auth-card">
            <h2>Recuperar senha</h2>
            <p className="muted">
              A tela está preparada, mas o backend atual ainda não possui
              endpoint de recuperação de senha. Quando o endpoint for criado,
              este formulário será conectado ao fluxo real.
            </p>
            <label>E-mail</label>
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="seu@email.com"
            />
            <button className="btn btn-primary full" type="button" disabled>
              Enviar instruções
            </button>
            <Link to="/login">Voltar ao login</Link>
          </div>
        ) : (
          <form
            className="auth-card"
            onSubmit={isLogin ? submitLogin : submitRegister}
          >
            <div className="auth-title-row">
              <div className="auth-icon">
                <LockOutlinedIcon />
              </div>
              <div>
                <h2>{isLogin ? "Entrar" : "Criar conta"}</h2>
                <p>
                  {isLogin
                    ? "Acesse seu painel financeiro."
                    : "Crie sua conta e confirme o e-mail para começar."}
                </p>
              </div>
            </div>

            {isRegister && (
              <>
                <label>Nome</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Seu nome"
                />
              </>
            )}

            <label>E-mail</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="seu@email.com"
              autoComplete="email"
            />

            <label>Senha</label>
            <div className="password-input">
              <input
                required
                minLength={8}
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Sua senha"
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)}>
                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </button>
            </div>

            <button
              className="btn btn-primary full"
              type="submit"
              disabled={loading}
            >
              {loading ? "Processando..." : isLogin ? "Entrar" : "Cadastrar"}
            </button>

            <div className="auth-links">
              {isLogin ? (
                <>
                  <Link to="/recover-password">Esqueci minha senha</Link>
                  <Link to="/register">Criar conta</Link>
                </>
              ) : (
                <Link to="/login">Já tenho conta</Link>
              )}
            </div>

            {isLogin && (
              <button
                type="button"
                className="link-button"
                onClick={resendConfirmation}
              >
                Reenviar confirmação de e-mail
              </button>
            )}
          </form>
        )}
      </section>
    </div>
  );
}
