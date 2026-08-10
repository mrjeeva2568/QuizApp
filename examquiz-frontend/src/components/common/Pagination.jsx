export function Pagination({ page, totalPages, isLast, onPrevious, onNext, className = '' }) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <button type="button" className="btn-secondary" disabled={page === 0} onClick={onPrevious}>
        Previous
      </button>
      <span className="text-sm text-ink-500 dark:text-ink-400">
        Page {page + 1} of {Math.max(totalPages, 1)}
      </span>
      <button type="button" className="btn-secondary" disabled={isLast} onClick={onNext}>
        Next
      </button>
    </div>
  );
}
