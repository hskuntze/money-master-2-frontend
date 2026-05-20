import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import InsightsIcon from "@mui/icons-material/Insights";
import SavingsIcon from "@mui/icons-material/Savings";
import SecurityIcon from "@mui/icons-material/Security";
import { Link } from "react-router-dom";
import { useContext } from "react";
import { ThemeContext } from "@/contexts/ThemeContext";
import { formatMoney } from "@/utils/formatters";

export default function Landing() {
  const { theme } = useContext(ThemeContext);

  return (
    <div className="public-page">
      <header className="public-header">
        <Link to="/" className="public-brand">
          <span>MM</span>
          <strong>{theme.appName || "Money Master 2"}</strong>
        </Link>
        <nav>
          <a href="#recursos">Recursos</a>
          <a href="#dashboard">Dashboard</a>
          <Link className="btn btn-ghost" to="/login">
            Entrar
          </Link>
          <Link className="btn btn-primary" to="/register">
            Criar conta
          </Link>
        </nav>
      </header>

      <main className="hero-section">
        <section className="hero-copy">
          <span className="eyebrow">
            <AutoAwesomeIcon /> Controle financeiro por IA
          </span>
          <h1>Organize sua vida financeira conversando naturalmente.</h1>
          <p>
            Registre gastos, receitas, cofrinhos e acompanhe sua saúde financeira com dashboards claros, relatórios e um assistente preparado para
            entender sua rotina.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary btn-large" to="/register">
              Começar agora
            </Link>
            <Link className="btn btn-ghost btn-large" to="/login">
              Já tenho conta
            </Link>
          </div>
          <div className="trust-row">
            <span>
              <SecurityIcon /> Autenticação JWT
            </span>
            <span>
              <InsightsIcon /> Relatórios por período
            </span>
            <span>
              <SavingsIcon /> Cofrinhos com CDI
            </span>
          </div>
        </section>

        <section className="hero-card" id="dashboard">
          <div className="fake-window-bar">
            <span />
            <span />
            <span />
          </div>
          <div className="hero-dashboard-grid">
            <article>
              <small>Saldo atual</small>
              <strong>{formatMoney(8450.75)}</strong>
            </article>
            <article>
              <small>Entradas do mês</small>
              <strong>{formatMoney(6500)}</strong>
            </article>
            <article>
              <small>Saídas do mês</small>
              <strong>{formatMoney(3240.8)}</strong>
            </article>
          </div>
          <div className="hero-chat-bubble">
            <ChatBubbleOutlineOutlinedIcon />
            <span>gastei 35 reais com almoço hoje</span>
          </div>
          <div className="hero-result-card">
            <span>Transação registrada</span>
            <strong>Almoço, Alimentação, {formatMoney(35)}</strong>
          </div>
        </section>
      </main>

      <section className="feature-section" id="recursos">
        {[
          ["Chat financeiro", "Informe gastos e receitas com linguagem natural. A IA interpreta e usa ferramentas do backend."],
          ["Inserção manual", "Cadastre contas, categorias, transações e cofrinhos quando preferir usar formulários."],
          ["Cofrinhos", "Acompanhe objetivos, metas, rendimento acumulado e previsão diária por CDI."],
          ["Tema dinâmico", "Personalize cores, logo e textos da tela de login com prévia em tempo real."],
        ].map(([title, text]) => (
          <article className="feature-card" key={title}>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <footer className="public-footer">Desenvolvido por Kuntze Dev</footer>
    </div>
  );
}
