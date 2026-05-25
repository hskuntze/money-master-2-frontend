import CloseIcon from "@mui/icons-material/Close";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import {
  AI_CHAT_COMMAND_GROUPS,
  AI_CHAT_GUIDE_PDF_URL,
  AI_CHAT_WRITING_TIPS,
} from "./aiChatGuideContent";

type AiChatGuideModalProps = {
  onClose: () => void;
  open: boolean;
};

export default function AiChatGuideModal({ onClose, open }: AiChatGuideModalProps) {
  if (!open) return null;

  return (
    <div
      className="modal-backdrop ai-guide-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-guide-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="modal-card ai-guide-modal">
        <header className="ai-guide-header">
          <div>
            <span className="eyebrow">Manual do Chat IA</span>
            <h2 id="ai-guide-title">Como usar a IA do Money Master</h2>
            <p>
              O assistente entende linguagem natural, mas trabalha melhor quando
              você informa valor, data, descrição e se deseja consultar ou
              alterar dados.
            </p>
          </div>
          <button
            type="button"
            className="ai-chat-icon-button"
            onClick={onClose}
            aria-label="Fechar guia"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="ai-guide-actions">
          <a className="btn btn-primary" href={AI_CHAT_GUIDE_PDF_URL} download>
            <PictureAsPdfIcon /> Baixar guia em PDF
          </a>
        </div>

        <div className="ai-guide-summary-grid">
          <article>
            <strong>Consultas</strong>
            <p>
              Perguntas que apenas mostram informações, como saldo do ciclo,
              contas pendentes, relatórios e resumo de cofrinhos.
            </p>
          </article>
          <article>
            <strong>Operações</strong>
            <p>
              Pedidos que alteram dados, como cadastrar gasto, registrar receita,
              pagar conta, criar compra parcelada ou movimentar cofrinho.
            </p>
          </article>
          <article>
            <strong>Confirmações</strong>
            <p>
              Quando houver ambiguidade ou alteração em lote, a IA pode gerar uma
              prévia e pedir confirmação antes de executar.
            </p>
          </article>
        </div>

        <section className="ai-guide-tips">
          <h3>Como escrever comandos melhores</h3>
          <ul>
            {AI_CHAT_WRITING_TIPS.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </section>

        <section className="ai-guide-command-list">
          {AI_CHAT_COMMAND_GROUPS.map((group) => (
            <article className="ai-guide-card" key={group.title}>
              <h3>{group.title}</h3>
              <p>{group.description}</p>
              <strong>Exemplos</strong>
              <ul>
                {group.examples.map((example) => (
                  <li key={example}>{example}</li>
                ))}
              </ul>
              <strong>Palavras-chave úteis</strong>
              <div className="ai-guide-keywords">
                {group.keywords.map((keyword) => (
                  <span key={keyword}>{keyword}</span>
                ))}
              </div>
            </article>
          ))}
        </section>
      </section>
    </div>
  );
}
