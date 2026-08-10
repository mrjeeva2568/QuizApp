import { Link } from 'react-router-dom';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { ROUTE_PATHS } from '../../routes/routePaths';

/**
 * Renders either the "Weak topics" or "Strong topics" section - same shape,
 * different data and tone. Each row links to the generate-quiz form
 * pre-filled with that topic, so a weak topic is one click from a fresh
 * practice quiz on it.
 */
export function TopicsCard({ title, topics, tone }) {
  const isWeak = tone === 'weak';
  const Icon = isWeak ? TrendingDown : TrendingUp;
  const iconClass = isWeak ? 'text-danger-500' : 'text-success-500';

  return (
    <div className="card p-5">
      <h2 className="mb-4 flex items-center gap-2 font-display text-base font-semibold text-ink-900 dark:text-ink-50">
        <Icon className={`h-4 w-4 ${iconClass}`} />
        {title}
      </h2>

      {topics.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-400">Not enough data yet.</p>
      ) : (
        <ul className="space-y-3">
          {topics.map((topic) => (
            <li key={topic.topic} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink-900 dark:text-ink-50">{topic.topic}</p>
                <p className="text-xs text-ink-400">
                  {topic.averagePercentage}% avg &middot; {topic.attemptsCount}{' '}
                  {topic.attemptsCount === 1 ? 'attempt' : 'attempts'}
                </p>
              </div>
              <Link
                to={`${ROUTE_PATHS.QUIZ_GENERATE}?topic=${encodeURIComponent(topic.topic)}`}
                className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/30"
              >
                Practice
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
