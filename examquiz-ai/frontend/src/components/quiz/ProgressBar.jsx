export function ProgressBar({ current, total, answeredCount }) {
  const percentage = total > 0 ? (answeredCount / total) * 100 : 0;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs text-ink-500 dark:text-ink-400">
        <span>
          Question {current} of {total}
        </span>
        <span>
          {answeredCount}/{total} answered
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
        <div
          className="h-full rounded-full bg-brand-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
