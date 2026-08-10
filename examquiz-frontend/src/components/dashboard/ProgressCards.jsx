import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { ScoreRing } from '../common/ScoreRing';

const TREND_CONFIG = {
  up: { Icon: TrendingUp, className: 'text-success-600 bg-success-50 dark:bg-success-500/10', label: 'Improving' },
  down: { Icon: TrendingDown, className: 'text-danger-600 bg-danger-50 dark:bg-danger-500/10', label: 'Declining' },
  flat: { Icon: Minus, className: 'text-ink-500 bg-ink-100 dark:bg-ink-800', label: 'Steady' },
};

/**
 * One card per topic (quiz title) showing latest score and whether the most
 * recent attempt improved on the one before it - distinct from the
 * weak/strong lists, which rank by average rather than by trend.
 */
export function ProgressCards({ topics }) {
  if (topics.length === 0) {
    return (
      <div className="card p-5">
        <p className="py-6 text-center text-sm text-ink-400">
          Attempt a few quizzes to see your progress by topic here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {topics.map((topic) => {
        const trend = topic.trend ? TREND_CONFIG[topic.trend] : null;
        return (
          <div key={topic.topic} className="card flex items-center gap-4 p-4">
            <ScoreRing percentage={topic.latestPercentage} size={52} strokeWidth={5} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink-900 dark:text-ink-50" title={topic.topic}>
                {topic.topic}
              </p>
              <p className="text-xs text-ink-400">
                {topic.attemptsCount} {topic.attemptsCount === 1 ? 'attempt' : 'attempts'}
              </p>
              {trend && (
                <span
                  className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${trend.className}`}
                >
                  <trend.Icon className="h-3 w-3" />
                  {trend.label}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
