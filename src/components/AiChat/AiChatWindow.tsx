import "./AiChat.css";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import HelpOutlineIcon from "@mui/icons-material/HelpOutlineOutlined";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import SendIcon from "@mui/icons-material/Send";
import { FormEvent, useEffect, useRef } from "react";
import { AI_CHAT_GUIDE_PDF_URL, AI_CHAT_QUICK_SUGGESTIONS } from "./aiChatGuideContent";
import { useAiChat } from "./useAiChat";

type AiChatWindowProps = {
  className?: string;
  conversationStorageKey?: string;
  description?: string;
  onClose?: () => void;
  onOpenFullChat?: () => void;
  onOpenGuide?: () => void;
  showFullChatButton?: boolean;
  title?: string;
  variant?: "page" | "floating";
};

export default function AiChatWindow({
  className = "",
  conversationStorageKey,
  description = "Escreva naturalmente. Quanto mais específico for o pedido, melhor será a resposta.",
  onClose,
  onOpenFullChat,
  onOpenGuide,
  showFullChatButton = false,
  title = "Money Master IA",
  variant = "page",
}: AiChatWindowProps) {
  const { draft, hasConversation, loading, messages, send, setDraft, startNewConversation } = useAiChat({ conversationStorageKey });
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages.length, loading]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    send();
  }

  return (
    <section className={`panel ai-chat-window ai-chat-window-${variant} ${className}`.trim()}>
      <header className="ai-chat-window-header">
        <div>
          <span className="eyebrow">
            <AutoAwesomeIcon /> Chat financeiro
          </span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>

        <div className="ai-chat-window-actions">
          {onOpenGuide && (
            <button type="button" className="btn btn-ghost" onClick={onOpenGuide} title="Ver guia de uso">
              <HelpOutlineIcon />
              <span>Guia</span>
            </button>
          )}

          <a className="btn btn-ghost" href={AI_CHAT_GUIDE_PDF_URL} download title="Baixar guia em PDF">
            <PictureAsPdfIcon />
            <span>PDF</span>
          </a>

          {showFullChatButton && onOpenFullChat && (
            <button type="button" className="btn btn-ghost" onClick={onOpenFullChat} title="Abrir chat completo">
              <OpenInFullIcon />
              <span>Abrir</span>
            </button>
          )}

          <button
            className="btn btn-ghost"
            type="button"
            onClick={startNewConversation}
            disabled={loading || !hasConversation}
            title="Iniciar nova conversa"
          >
            <DeleteOutlineOutlinedIcon />
            <span>Nova</span>
          </button>

          {onClose && (
            <button type="button" className="ai-chat-icon-button" onClick={onClose} aria-label="Fechar mini chat" title="Fechar">
              <CloseIcon />
            </button>
          )}
        </div>
      </header>

      {!hasConversation && (
        <div className="ai-chat-discovery-card">
          <strong>Você pode começar com perguntas simples:</strong>
          <div className="ai-chat-discovery-examples">
            <button type="button" onClick={() => send("Cadastre um gasto de R$ 45,90 com mercado hoje")}>
              Cadastre um gasto de R$ 45,90 com mercado hoje
            </button>
            <button type="button" onClick={() => send("Quanto ainda tenho disponível neste ciclo?")}>
              Quanto ainda tenho disponível neste ciclo?
            </button>
          </div>
          <small>Exemplo ruim: “paguei”. Exemplo melhor: “Paguei a conta de internet de R$ 120,00 hoje”.</small>
        </div>
      )}

      <div className="chat-messages ai-chat-messages">
        {messages.map((item) => (
          <div className={`chat-message ${item.role}`} key={item.id}>
            <span>{item.role === "user" ? "Você" : "Money Master IA"}</span>
            <p>{item.content}</p>
          </div>
        ))}

        {loading && (
          <div className="chat-message assistant">
            <span>Money Master IA</span>
            <p>Processando...</p>
          </div>
        )}

        <div ref={messagesEndRef} aria-hidden="true" />
      </div>

      {/* <div className="suggestions ai-chat-suggestions">
        {AI_CHAT_QUICK_SUGGESTIONS.map((item) => (
          <button
            type="button"
            key={item}
            onClick={() => send(item)}
            disabled={loading}
          >
            {item}
          </button>
        ))}
      </div> */}

      <form className="chat-input ai-chat-input" onSubmit={handleSubmit}>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              send();
            }
          }}
          placeholder="Ex.: gastei R$ 39,90 no McDonald’s hoje ou comprei um curso em 6x de R$ 60,15"
          disabled={loading}
          rows={variant === "floating" ? 2 : 3}
        />
        <button className="btn btn-primary" type="submit" disabled={loading || !draft.trim()}>
          <SendIcon /> Enviar
        </button>
      </form>
    </section>
  );
}
