import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SendIcon from "@mui/icons-material/Send";
import { useState } from "react";
import { toast } from "react-toastify";
import { api } from "@/utils/requests";
import { getErrorMessage } from "@/utils/formatters";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  at: Date;
};

const suggestions = [
  "Gastei 35 reais com almoço hoje",
  "Recebi meu salário hoje",
  "Paguei a conta de internet",
  "Guardei 200 reais no cofrinho Reserva do Itaú",
  "O cofrinho Reserva rendeu 1 real e 25 centavos hoje",
  "Quanto tenho guardado nos cofrinhos?",
];

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Olá. Sou seu assistente financeiro. Posso registrar gastos, receitas, consultar saldos e movimentar cofrinhos.",
      at: new Date(),
    },
  ]);
  const [loading, setLoading] = useState(false);

  async function send(content = message) {
    const trimmed = content.trim();
    if (!trimmed) return;
    const userMessage: ChatMessage = { role: "user", content: trimmed, at: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setLoading(true);
    try {
      const response = await api.chat(trimmed);
      setMessages((prev) => [...prev, { role: "assistant", content: response.data.answer, at: new Date(response.data.answeredAt) }]);
    } catch (error) {
      toast.error(getErrorMessage(error, "A IA não conseguiu processar a mensagem."));
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Não consegui processar sua mensagem agora. Verifique a configuração da OpenAI no backend e tente novamente.",
          at: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-stack chat-page">
      <section className="page-hero compact">
        <div>
          <span className="eyebrow">
            <AutoAwesomeIcon /> Chat financeiro
          </span>
          <h1>Converse com sua IA financeira</h1>
          <p>O chat usa tools do backend para registrar transações, criar categorias e movimentar cofrinhos.</p>
        </div>
      </section>

      <section className="chat-shell panel">
        <div className="chat-messages">
          {messages.map((item, index) => (
            <div className={`chat-message ${item.role}`} key={`${item.role}-${index}`}>
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
            <button type="button" key={item} onClick={() => send(item)}>
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
          <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ex.: gastei 150 reais com mercado hoje" />
          <button className="btn btn-primary" type="submit" disabled={loading}>
            <SendIcon /> Enviar
          </button>
        </form>
      </section>
    </div>
  );
}
