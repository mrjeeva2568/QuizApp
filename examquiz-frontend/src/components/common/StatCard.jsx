export function StatCard({ label, value, hint }) {
  return (
    <div className="card p-5">
      <p className="text-sm font-medium text-ink-500 dark:text-ink-400">{label}</p>
      <p className="mt-1 font-mono text-2xl font-semibold text-ink-900 dark:text-ink-50">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
    </div>
  );
}
