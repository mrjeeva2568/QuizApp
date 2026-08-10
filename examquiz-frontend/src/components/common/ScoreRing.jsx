/**
 * The app's signature visual element: a circular score gauge used anywhere a
 * percentage needs to read at a glance (dashboards, quiz results, student
 * rows). Deliberately not a generic bar/number-card - a quiz platform is
 * fundamentally about "how much did you get right", and a ring makes that
 * legible in one shape rather than a color-coded number alone.
 */
export function ScoreRing({ percentage, size = 64, strokeWidth = 6, label }) {
  const value = typeof percentage === 'number' ? Math.max(0, Math.min(100, percentage)) : null;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = value === null ? circumference : circumference - (value / 100) * circumference;

  const colorClass =
    value === null
      ? 'text-ink-300 dark:text-ink-600'
      : value >= 80
        ? 'text-success-500'
        : value >= 50
          ? 'text-accent-500'
          : 'text-danger-500';

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-ink-100 dark:stroke-ink-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`transition-[stroke-dashoffset] duration-500 ${colorClass}`}
          stroke="currentColor"
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          transform={`rotate(90 ${size / 2} ${size / 2})`}
          className="fill-ink-900 font-mono text-xs font-semibold dark:fill-ink-50"
        >
          {value === null ? '—' : `${Math.round(value)}%`}
        </text>
      </svg>
      {label && <span className="text-xs text-ink-500 dark:text-ink-400">{label}</span>}
    </div>
  );
}
