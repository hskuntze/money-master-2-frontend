import CloseIcon from "@mui/icons-material/Close";
import {
  CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { api } from "@/utils/requests";
import { guidedTourSteps, TourStep } from "./tourSteps";

type HighlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type GuidedTourProps = {
  open: boolean;
  onClose: () => void;
  onCompleted?: () => void;
  onSkipped?: () => void;
};

const sleep = (ms: number) =>
  new Promise((resolve) => window.setTimeout(resolve, ms));

function calculatePopupStyle(
  rect: HighlightRect | null,
  step: TourStep,
): CSSProperties {
  const margin = 18;
  const width = 340;

  if (!rect) {
    return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  }

  const preferred = step.preferredPosition || "bottom";
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let top = rect.top + rect.height + margin;
  let left = rect.left;

  if (preferred === "top") {
    top = rect.top - 325 - margin;
  }

  if (preferred === "left") {
    top = rect.top;
    left = rect.left - width - margin;
  }

  if (preferred === "right") {
    top = rect.top;
    left = rect.left + rect.width + margin;
  }

  if (left + width > viewportWidth - margin) {
    left = viewportWidth - width - margin;
  }

  if (left < margin) {
    left = margin;
  }

  if (top < margin) {
    top = rect.top + rect.height + margin;
  }

  if (top > viewportHeight - 240) {
    top = Math.max(margin, viewportHeight - 240);
  }

  return { top, left, width };
}

async function findElement(selector: string) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const element = document.querySelector(selector) as HTMLElement | null;

    if (element) {
      return element;
    }

    await sleep(150);
  }

  return null;
}

export default function GuidedTour({
  open,
  onClose,
  onCompleted,
  onSkipped,
}: GuidedTourProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<HighlightRect | null>(null);
  const [targetMissing, setTargetMissing] = useState(false);

  const highlightedElementRef = useRef<HTMLElement | null>(null);

  const step = guidedTourSteps[index];
  const isLast = index === guidedTourSteps.length - 1;

  const clearActiveHighlight = useCallback(() => {
    if (highlightedElementRef.current) {
      highlightedElementRef.current.classList.remove("tour-highlight-active");
      highlightedElementRef.current = null;
    }
  }, []);

  const applyActiveHighlight = useCallback(
    (element: HTMLElement) => {
      if (highlightedElementRef.current === element) {
        return;
      }

      clearActiveHighlight();

      element.classList.add("tour-highlight-active");
      highlightedElementRef.current = element;
    },
    [clearActiveHighlight],
  );

  const positionStyle = useMemo(
    () => calculatePopupStyle(rect, step),
    [rect, step],
  );

  const refreshTarget = useCallback(async () => {
    if (!open || !step) {
      clearActiveHighlight();
      return;
    }

    setTargetMissing(false);

    if (location.pathname !== step.route) {
      clearActiveHighlight();
      navigate(step.route);
      return;
    }

    const element = await findElement(step.selector);

    if (!element) {
      clearActiveHighlight();
      setRect(null);
      setTargetMissing(true);
      return;
    }

    applyActiveHighlight(element);

    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "center",
    });

    await sleep(220);

    const nextRect = element.getBoundingClientRect();

    setRect({
      top: nextRect.top,
      left: nextRect.left,
      width: nextRect.width,
      height: nextRect.height,
    });
  }, [
    applyActiveHighlight,
    clearActiveHighlight,
    location.pathname,
    navigate,
    open,
    step,
  ]);

  useEffect(() => {
    refreshTarget();
  }, [refreshTarget]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handler = () => {
      refreshTarget();
    };

    window.addEventListener("resize", handler);
    window.addEventListener("scroll", handler, true);

    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("scroll", handler, true);
    };
  }, [open, refreshTarget]);

  useEffect(() => {
    if (!open) {
      clearActiveHighlight();
      setIndex(0);
      setRect(null);
      setTargetMissing(false);
    }
  }, [clearActiveHighlight, open]);

  useEffect(() => {
    return () => {
      clearActiveHighlight();
    };
  }, [clearActiveHighlight]);

  const persistProgress = useCallback((stepId: string) => {
    api
      .updateTourState({ action: "PROGRESS", lastStepKey: stepId })
      .catch(() => undefined);
  }, []);

  const next = async () => {
    persistProgress(step.id);

    if (isLast) {
      try {
        await api.completeGuidedTour();
        toast.success("Tour concluído. Você pode reabri-lo pela Ajuda.");
      } catch {
        toast.warning(
          "Tour concluído localmente, mas não foi possível salvar o estado agora.",
        );
      }

      clearActiveHighlight();
      onCompleted?.();
      onClose();
      return;
    }

    setIndex((current) => current + 1);
  };

  const back = () => {
    setIndex((current) => Math.max(0, current - 1));
  };

  const skip = async () => {
    try {
      await api.skipGuidedTour();
    } catch {
      // Evita interromper a navegação por falha temporária de persistência.
    }

    clearActiveHighlight();
    onSkipped?.();
    onClose();
  };

  if (!open || !step) {
    return null;
  }

  return (
    <div className="tour-layer" aria-live="polite">
      <div className="tour-dim" />

      {rect && (
        <div
          className="tour-highlight"
          style={{
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
          }}
        />
      )}

      <section className="tour-card" style={positionStyle}>
        <div className="tour-card-header">
          <button
            type="button"
            className="tour-close"
            onClick={skip}
            aria-label="Pular tour"
          >
            <CloseIcon />
          </button>

          <small>
            Passo {index + 1} de {guidedTourSteps.length}
          </small>
        </div>

        <h2>{step.title}</h2>

        <p>{step.description}</p>

        {targetMissing && (
          <span className="tour-warning">
            Não encontramos a área exata nesta tela. Você pode continuar o tour
            normalmente.
          </span>
        )}

        <div className="tour-progress">
          <span
            style={{
              width: `${((index + 1) / guidedTourSteps.length) * 100}%`,
            }}
          />
        </div>

        <div className="tour-actions">
          <button type="button" className="btn btn-ghost" onClick={skip}>
            Pular
          </button>

          <div>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={back}
              disabled={index === 0}
            >
              Voltar
            </button>

            <button type="button" className="btn btn-primary" onClick={next}>
              {isLast ? "Finalizar" : "Próximo"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
