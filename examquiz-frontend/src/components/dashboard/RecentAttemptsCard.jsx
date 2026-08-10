import { Link } from 'react-router-dom';
import { ScoreRing } from '../common/ScoreRing';
import { ROUTE_PATHS } from '../../routes/routePaths';

export function RecentAttemptsCard({ attempts }) {
  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-ink-900 dark:text-ink-50">
          Recent attempts
        </h2>
        <Link
          to={ROUTE_PATHS.QUIZ_HISTORY}
          className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
        >
          View all
        </Link>
      </div>

      {attempts.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-400">
          No quiz attempts yet. Generate your first quiz to get started.
        </p>
      ) : (
        <ul className="divide-y divide-ink-100 dark:divide-ink-800">
          {attempts.map((attempt) => {
            const percentage = attempt.maxScore > 0 ? (attempt.score / attempt.maxScore) * 100 : null;
            return (
              <li key={attempt.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink-900 dark:text-ink-50">{attempt.quizTitle}</p>
                  <p className="text-xs text-ink-400">
                    {attempt.correctAnswers}/{attempt.totalQuestions} correct
                  </p>
                </div>
                <ScoreRing percentage={percentage} size={48} strokeWidth={5} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
