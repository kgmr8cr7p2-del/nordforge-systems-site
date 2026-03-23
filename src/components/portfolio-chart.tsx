import { formatUsd } from "@/lib/money";
import type { PortfolioChartPoint } from "@/lib/portfolio";

function buildPath(points: PortfolioChartPoint[], width: number, height: number, padding: number) {
  if (points.length === 0) {
    return { line: "", area: "", min: 0, max: 0 };
  }

  const values = points.map((point) => point.totalValueCents);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = Math.max(max - min, 1);
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  const mapped = points.map((point, index) => {
    const x = padding + (index / Math.max(points.length - 1, 1)) * innerWidth;
    const y = padding + innerHeight - ((point.totalValueCents - min) / spread) * innerHeight;
    return { x, y };
  });

  const line = mapped
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");

  const first = mapped[0];
  const last = mapped[mapped.length - 1];
  const area = `${line} L ${last.x.toFixed(2)} ${(height - padding).toFixed(2)} L ${first.x.toFixed(2)} ${(height - padding).toFixed(2)} Z`;

  return { line, area, min, max };
}

export function PortfolioChart({
  points,
  currentLabel,
  changeCents,
  startLabel,
  endLabel
}: {
  points: PortfolioChartPoint[];
  currentLabel: string;
  changeCents: number;
  startLabel: string;
  endLabel: string;
}) {
  if (points.length === 0) {
    return (
      <div className="chart-empty">
        История начнет накапливаться после первых обновлений цен и добавленных предметов.
      </div>
    );
  }

  const width = 920;
  const height = 320;
  const padding = 26;
  const { line, area, min, max } = buildPath(points, width, height, padding);

  return (
    <div className="chart-card">
      <div className="chart-head">
        <div>
          <p className="eyebrow">График портфеля</p>
          <h2>{currentLabel}</h2>
          <p className={`chart-change ${changeCents >= 0 ? "positive" : "negative"}`}>
            {changeCents >= 0 ? "+" : ""}
            {formatUsd(changeCents)} за выбранный период
          </p>
        </div>
        <div className="chart-meta">
          <span>{formatUsd(min)}</span>
          <span>{formatUsd(max)}</span>
        </div>
      </div>

      <div className="chart-surface">
        <svg viewBox={`0 0 ${width} ${height}`} role="img">
          <defs>
            <linearGradient id="portfolio-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(111, 216, 255, 0.45)" />
              <stop offset="100%" stopColor="rgba(111, 216, 255, 0.02)" />
            </linearGradient>
          </defs>
          <path className="chart-area" d={area} fill="url(#portfolio-area)" />
          <path className="chart-line" d={line} />
        </svg>
      </div>

      <div className="chart-foot">
        <span>{startLabel}</span>
        <span>{endLabel}</span>
      </div>
    </div>
  );
}
