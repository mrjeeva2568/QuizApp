import { Link } from 'react-router-dom';
import { Sparkles, History } from 'lucide-react';
import { ROUTE_PATHS } from '../../routes/routePaths';

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Link
        to={ROUTE_PATHS.QUIZ_GENERATE}
        className="card flex items-center gap-4 p-5 transition-colors hover:border-brand-300 dark:hover:border-brand-700"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <p className="font-medium text-ink-900 dark:text-ink-50">Generate a new quiz</p>
          <p className="text-xs text-ink-400">Pick a topic and let the AI agent build it</p>
        </div>
      </Link>

      <Link
        to={ROUTE_PATHS.QUIZ_HISTORY}
        className="card flex items-center gap-4 p-5 transition-colors hover:border-brand-300 dark:hover:border-brand-700"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300">
          <History className="h-5 w-5" />
        </span>
        <div>
          <p className="font-medium text-ink-900 dark:text-ink-50">View full history</p>
          <p className="text-xs text-ink-400">Every quiz you&apos;ve attempted</p>
        </div>
      </Link>
    </div>
  );
}
