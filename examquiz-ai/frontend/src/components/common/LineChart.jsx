/**
 * Minimal, dependency-free SVG line/area chart. Built by hand rather than
 * pulling in a charting library, to avoid an unverified React-19
 * peer-dependency risk for what's fundamentally a simple trend line - and to
 * stay visually consistent with the hand-rolled bars already used on
 * AdminAnalyticsPage.
 */
export function LineChart({ points, height = 160, valueSuffix = '%' }) {
  if (!points || points.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-ink-400">
        Not enough data yet.
      </div>
    );
  }

  const width = 100; // percentage-based viewBox; scales via the SVG's own width
  const paddingY = 12;
  const values = points.map((p) => p.percentage);
  const max = Math.max(100, ...values);
  const min = Math.min(0, ...values);
  const range = max - min || 1;

  const toX = (index) => (points.length === 1 ? width / 2 : (index / (points.length - 1)) * width);
  const toY = (value) => paddingY + (1 - (value - min) / range) * (height - paddingY * 2);

  const linePoints = points.map((p, i) => `${toX(i)},${toY(p.percentage)}`).join(' ');
  const areaPoints = `0,${height} ${linePoints} ${width},${height}`;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-40 w-full overflow-visible">
        <polygon points={areaPoints} className="fill-brand-500/10" />
        <polyline
          points={linePoints}
          fill="none"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          className="stroke-brand-500"
        />
        {points.map((p, i) => (
          <circle
            key={p.id || i}
            cx={toX(i)}
            cy={toY(p.percentage)}
            r="2.5"
            vectorEffect="non-scaling-stroke"
            className="fill-brand-600 dark:fill-brand-400"
          >
            <title>
              {p.label ? `${p.label}: ` : ''}
              {p.percentage}
              {valueSuffix}
            </title>
          </circle>
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-ink-400">
        <span>{points[0]?.label}</span>
        {points.length > 1 && <span>{points.at(-1)?.label}</span>}
      </div>
    </div>
  );
}
