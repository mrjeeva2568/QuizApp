import { Clock } from 'lucide-react';

/**
 * Displays a countdown. NOTE: this is a client-side pacing convenience, not
 * a backend-enforced time limit - QuizResponse carries no duration/timeLimit
 * field (the backend's quiz module has no concept of one). Hitting zero
 * triggers auto-submit via the onExpire callback passed to useCountdown by
 * the caller, but nothing here is validated server-side.
 */
export function QuizTimer({ secondsLeft }) {
  const isLow = secondsLeft <= 30;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div
      role="timer"
      aria-live="polite"
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-sm font-medium ${
        isLow
          ? 'bg-danger-50 text-danger-600 dark:bg-danger-500/10'
          : 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300'
      }`}
    >
      <Clock className="h-4 w-4" />
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  );
}
