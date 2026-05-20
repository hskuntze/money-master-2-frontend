export default function ProgressBar({ value, label }: { value: number; label?: string }) {
  const safe = Math.max(0, Math.min(100, Number(value || 0)));
  return (
    <div className="progress-wrap" aria-label={label || `Progresso ${safe}%`}>
      <div className="progress-track">
        <span className="progress-fill" style={{ width: `${safe}%` }} />
      </div>
      {label && <small>{label}</small>}
    </div>
  );
}
