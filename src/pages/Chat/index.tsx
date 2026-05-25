import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import SendIcon from "@mui/icons-material/Send";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { api } from "@/utils/requests";
import { getErrorMessage } from "@/utils/formatters";

const CHAT_CONVERSATION_STORAGE_KEY = "money-master-ai-conversation-id";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  at: Date;
};

const welcomeMessage: ChatMessage = {
  role: "assistant",
  content:
    "Olá. Sou seu assistente financeiro. Posso registrar gastos do dia, compras parceladas, receitas, cofrinhos e ajudar a organizar seu planejamento mensal.",
  at: new Date(),
};

const suggestions = [
  "Registre uma compra parcelada de 6x de R$ 60,15 do Curso de Mandarim",
  "Gastei 35 reais com almoço hoje",
  "Recebi meu salário hoje",
  "Quais contas do ciclo atual ainda estão pendentes?",
  "Atualize os rendimentos dos meus cofrinhos com os saldos reais de hoje",
  "Me dê uma dica para melhorar meu planejamento mensal considerando meu perfil",
];

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [conversationId, setConversationId] = useState<string | null>(() =>
    sessionStorage.getItem(CHAT_CONVERSATION_STORAGE_KEY),
  );
  const [loading, setLoading] = useState(false);

  const hasConversation = useMemo(
    () => messages.some((item) => item.role === "user"),
    [messages],
  );

  useEffect(() => {
    if (conversationId) {
      sessionStorage.setItem(CHAT_CONVERSATION_STORAGE_KEY, conversationId);
    }
  }, [conversationId]);

  async function send(content = message) {
    const trimmed = content.trim();
    if (!trimmed || loading) return;
    const userMessage: ChatMessage = {
      role: "user",
      content: trimmed,
      at: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setLoading(true);
    try {
      const response = await api.chat(trimmed, conversationId);
      if (response.data.conversationId) {
        setConversationId(response.data.conversationId);
      }
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.data.answer,
          at: new Date(response.data.answeredAt),
        },
      ]);
    } catch (error) {
      toast.error(
        getErrorMessage(error, "A IA não conseguiu processar a mensagem."),
      );
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Não consegui processar sua mensagem agora. Verifique a configuração da OpenAI no backend e tente novamente.",
          at: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function startNewConversation() {
    sessionStorage.removeItem(CHAT_CONVERSATION_STORAGE_KEY);
    setConversationId(null);
    setMessages([{ ...welcomeMessage, at: new Date() }]);
    setMessage("");
  }

  return (
    <div className="page-stack chat-page">
      <section className="page-hero compact">
        <div>
          <span className="eyebrow">
            <AutoAwesomeIcon /> Chat financeiro
          </span>
          <h1>Converse com sua IA financeira</h1>
          <p>
            O chat considera seu ciclo mensal, perfil financeiro, compras
            parceladas e comandos estruturados do backend para consultar,
            validar e executar alterações.
          </p>
        </div>
        <button
          className="btn btn-ghost"
          type="button"
          onClick={startNewConversation}
          disabled={loading || !hasConversation}
        >
          <DeleteOutlineOutlinedIcon /> Nova conversa
        </button>
      </section>

      <section className="chat-shell panel">
        <div className="chat-messages">
          {messages.map((item, index) => (
            <div
              className={`chat-message ${item.role}`}
              key={`${item.role}-${index}-${item.at.toISOString()}`}
            >
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
        </div>

        <div className="suggestions">
          {suggestions.map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => send(item)}
              disabled={loading}
            >
              {item}
            </button>
          ))}
        </div>

        <form
          className="chat-input"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Ex.: gastei R$ 39,90 no McDonald’s hoje ou comprei um curso em 6x de R$ 60,15"
            disabled={loading}
            rows={3}
          />
          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading || !message.trim()}
          >
            <SendIcon /> Enviar
          </button>
        </form>
      </section>
    </div>
  );
}
