import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

export default function MetricCard({
  title,
  value,
  tone = "neutral",
  subtitle,
}: {
  title: string;
  value: string;
  tone?: "neutral" | "positive" | "negative" | "primary";
  subtitle?: string;
}) {
  return (
    <article className={`metric-card metric-${tone}`}>
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
        {subtitle && <small>{subtitle}</small>}
      </div>
      <div className="metric-icon">{tone === "negative" ? <TrendingDownIcon /> : <TrendingUpIcon />}</div>
    </article>
  );
}
