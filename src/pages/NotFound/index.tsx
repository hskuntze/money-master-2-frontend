import { Link } from "react-router-dom";

export default function NotFound({ type }: { type?: "denied" }) {
  return (
    <div className="not-found-page">
      <div className="empty-state elevated">
        <strong>{type === "denied" ? "Acesso negado" : "Página não encontrada"}</strong>
        <p>{type === "denied" ? "Seu usuário não possui permissão para acessar este recurso." : "A rota acessada não existe no Money Master 2."}</p>
        <Link className="btn btn-primary" to="/app/dashboard">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
