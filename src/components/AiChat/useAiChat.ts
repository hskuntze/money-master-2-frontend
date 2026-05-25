import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/utils/formatters";
import { api } from "@/utils/requests";
import { AI_CHAT_CONVERSATION_STORAGE_KEY } from "./aiChatGuideContent";

export type AiChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  at: Date;
};

type UseAiChatOptions = {
  conversationStorageKey?: string;
};

const welcomeText =
  "Olá. Sou seu assistente financeiro. Posso registrar gastos do dia, compras parceladas, receitas, cofrinhos e ajudar a organizar seu planejamento mensal.";

function createMessage(role: AiChatMessage["role"], content: string, at = new Date()) {
  return {
    id: `${role}-${at.getTime()}-${Math.random().toString(36).slice(2)}`,
    role,
    content,
    at,
  };
}

function createWelcomeMessage() {
  return createMessage("assistant", welcomeText);
}

export function useAiChat({
  conversationStorageKey = AI_CHAT_CONVERSATION_STORAGE_KEY,
}: UseAiChatOptions = {}) {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<AiChatMessage[]>(() => [
    createWelcomeMessage(),
  ]);
  const [conversationId, setConversationId] = useState<string | null>(() =>
    sessionStorage.getItem(conversationStorageKey),
  );
  const [loading, setLoading] = useState(false);

  const hasConversation = useMemo(
    () => messages.some((item) => item.role === "user"),
    [messages],
  );

  useEffect(() => {
    if (conversationId) {
      sessionStorage.setItem(conversationStorageKey, conversationId);
    }
  }, [conversationId, conversationStorageKey]);

  const send = useCallback(
    async (content = draft) => {
      const trimmed = content.trim();
      if (!trimmed || loading) return;

      setMessages((prev) => [...prev, createMessage("user", trimmed)]);
      setDraft("");
      setLoading(true);

      try {
        const response = await api.chat(trimmed, conversationId);
        if (response.data.conversationId) {
          setConversationId(response.data.conversationId);
        }
        setMessages((prev) => [
          ...prev,
          createMessage(
            "assistant",
            response.data.answer,
            new Date(response.data.answeredAt),
          ),
        ]);
      } catch (error) {
        toast.error(
          getErrorMessage(error, "A IA não conseguiu processar a mensagem."),
        );
        setMessages((prev) => [
          ...prev,
          createMessage(
            "assistant",
            "Não consegui processar sua mensagem agora. Verifique a configuração da OpenAI no backend e tente novamente.",
          ),
        ]);
      } finally {
        setLoading(false);
      }
    },
    [conversationId, draft, loading],
  );

  const startNewConversation = useCallback(() => {
    sessionStorage.removeItem(conversationStorageKey);
    setConversationId(null);
    setMessages([createWelcomeMessage()]);
    setDraft("");
  }, [conversationStorageKey]);

  return {
    draft,
    hasConversation,
    loading,
    messages,
    send,
    setDraft,
    startNewConversation,
  };
}
