import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AiChatGuideModal from "./AiChatGuideModal";
import AiChatWindow from "./AiChatWindow";
import { AI_FLOATING_CHAT_CONVERSATION_STORAGE_KEY } from "./aiChatGuideContent";

export default function FloatingAiChat() {
  const [open, setOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <div className="floating-ai-chat" aria-live="polite">
        {open ? (
          <AiChatWindow
            conversationStorageKey={AI_FLOATING_CHAT_CONVERSATION_STORAGE_KEY}
            description="Use o mini chat sem sair da tela atual."
            onClose={() => setOpen(false)}
            onOpenFullChat={() => {
              setOpen(false);
              navigate("/app/chat");
            }}
            onOpenGuide={() => setGuideOpen(true)}
            showFullChatButton
            title="Mini Chat IA"
            variant="floating"
          />
        ) : (
          <button
            type="button"
            className="floating-ai-chat-toggle"
            onClick={() => setOpen(true)}
            aria-label="Abrir mini chat da IA"
          >
            <span>
              <AutoAwesomeIcon />
            </span>
            <ChatBubbleOutlineIcon />
          </button>
        )}
      </div>

      <AiChatGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  );
}
