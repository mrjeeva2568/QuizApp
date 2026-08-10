/**
 * Horizontal bar list - same visual pattern as AdminAnalyticsPage's bars,
 * pulled out here so the dashboard's topic-performance chart and any future
 * admin refactor can share one implementation.
 */
export function BarChart({ data, valueFormatter = (v) => v }) {
  if (!data || data.length === 0) {
    return <p className="py-6 text-center text-sm text-ink-400">Not enough data yet.</p>;
  }

  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="space-y-2.5">
      {data.map((row) => {
        const width = max > 0 ? Math.max((row.value / max) * 100, row.value > 0 ? 4 : 0) : 0;
        return (
          <div key={row.label} className="flex items-center gap-3 text-sm">
            <span className="w-24 shrink-0 truncate text-ink-500 dark:text-ink-400" title={row.label}>
              {row.label}
            </span>
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
              <div className={`h-full rounded-full ${row.colorClass || 'bg-brand-500'}`} style={{ width: `${width}%` }} />
            </div>
            <span className="w-12 shrink-0 text-right font-mono text-ink-600 dark:text-ink-300">
              {valueFormatter(row.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
