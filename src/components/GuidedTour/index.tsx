import CloseIcon from "@mui/icons-material/Close";
import { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function calculatePopupStyle(rect: HighlightRect | null, step: TourStep): CSSProperties {
  const margin = 18;
  const width = Math.min(380, window.innerWidth - margin * 2);
  const estimatedHeight = 260;

  if (!rect) {
    return {
      top: "50%",
      left: "50%",
      width,
      transform: "translate(-50%, -50%)",
    };
  }

  const preferred = step.preferredPosition || "bottom";
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let top = rect.top + rect.height + margin;
  let left = rect.left + rect.width / 2 - width / 2;

  if (preferred === "top") {
    top = rect.top - estimatedHeight - margin;
  }

  if (preferred === "left") {
    top = rect.top + rect.height / 2 - estimatedHeight / 2;
    left = rect.left - width - margin;
  }

  if (preferred === "right") {
    top = rect.top + rect.height / 2 - estimatedHeight / 2;
    left = rect.left + rect.width + margin;
  }

  if (top < margin && preferred === "top") {
    top = rect.top + rect.height + margin;
  }

  if (top + estimatedHeight > viewportHeight - margin && preferred === "bottom") {
    top = rect.top - estimatedHeight - margin;
  }

  return {
    top: clamp(top, margin, Math.max(margin, viewportHeight - estimatedHeight - margin)),
    left: clamp(left, margin, Math.max(margin, viewportWidth - width - margin)),
    width,
  };
}

async function findElement(selector: string) {
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const element = document.querySelector(selector) as HTMLElement | null;

    if (element) {
      return element;
    }

    await sleep(150);
  }

  return null;
}

function scrimStyles(rect: HighlightRect | null): CSSProperties[] {
  if (!rect) {
    return [{ inset: 0 }];
  }

  const padding = 10;
  const top = Math.max(0, rect.top - padding);
  const left = Math.max(0, rect.left - padding);
  const right = Math.max(0, window.innerWidth - rect.left - rect.width - padding);
  const bottom = Math.max(0, window.innerHeight - rect.top - rect.height - padding);
  const width = rect.width + padding * 2;
  const height = rect.height + padding * 2;

  return [
    { top: 0, left: 0, right: 0, height: top },
    { top, left: 0, width: left, height },
    { top, right: 0, width: right, height },
    { left: 0, right: 0, bottom: 0, height: bottom },
  ];
}

export default function GuidedTour({ open, onClose, onCompleted, onSkipped }: GuidedTourProps) {
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

  const positionStyle = useMemo(() => calculatePopupStyle(rect, step), [rect, step]);

  const refreshTarget = useCallback(async () => {
    if (!open || !step) {
      clearActiveHighlight();
      return;
    }

    setTargetMissing(false);

    if (location.pathname !== step.route) {
      clearActiveHighlight();
      setRect(null);
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

    await sleep(240);

    const nextRect = element.getBoundingClientRect();

    setRect({
      top: nextRect.top,
      left: nextRect.left,
      width: nextRect.width,
      height: nextRect.height,
    });
  }, [applyActiveHighlight, clearActiveHighlight, location.pathname, navigate, open, step]);

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
    api.updateTourState({ action: "PROGRESS", lastStepKey: stepId }).catch(() => undefined);
  }, []);

  const next = async () => {
    persistProgress(step.id);

    if (isLast) {
      try {
        await api.completeGuidedTour();
        toast.success("Tour concluído. Você pode reabri-lo pela Ajuda.");
      } catch {
        toast.warning("Tour concluído localmente, mas não foi possível salvar o estado agora.");
      }

      clearActiveHighlight();
      onCompleted?.();
      onClose();
      return;
    }

    setRect(null);
    setIndex((current) => current + 1);
  };

  const back = () => {
    setRect(null);
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

  if (!open || !step || typeof document === "undefined") {
    return null;
  }

  const content = (
    <div className="tour-layer" aria-live="polite">
      {scrimStyles(rect).map((style, scrimIndex) => (
        <div
          // eslint-disable-next-line react/no-array-index-key
          key={scrimIndex}
          className={`tour-scrim ${rect ? "" : "tour-scrim-full"}`}
          style={style}
        />
      ))}

      {rect && (
        <div
          className="tour-highlight"
          style={{
            top: rect.top - 10,
            left: rect.left - 10,
            width: rect.width + 20,
            height: rect.height + 20,
          }}
        />
      )}

      <section className="tour-card" style={positionStyle}>
        <div className="tour-card-header">
          <button type="button" className="tour-close" onClick={skip} aria-label="Pular tour">
            <CloseIcon />
          </button>

          <small>
            Passo {index + 1} de {guidedTourSteps.length}
          </small>
        </div>

        <h2>{step.title}</h2>

        <p>{step.description}</p>

        {targetMissing && <span className="tour-warning">Não encontramos a área exata nesta tela. Você pode continuar o tour normalmente.</span>}

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
            <button type="button" className="btn btn-ghost" onClick={back} disabled={index === 0}>
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

  return createPortal(content, document.body);
}
