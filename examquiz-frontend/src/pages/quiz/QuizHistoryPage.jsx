import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { quizService } from '../../services/quizService';
import { getErrorMessage } from '../../services/apiClient';
import { ScoreRing } from '../../components/common/ScoreRing';
import { Spinner } from '../../components/common/Spinner';
import { Pagination } from '../../components/common/Pagination';
import { ROUTE_PATHS } from '../../routes/routePaths';

const PAGE_SIZE = 10;

export function QuizHistoryPage() {
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    quizService
      .getHistory({ page, size: PAGE_SIZE })
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, 'Could not load your quiz history.'));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink-900 dark:text-ink-50">Quiz history</h1>
      <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Every quiz you&apos;ve attempted, newest first.</p>

      <div className="mt-6 card p-5">
        {error && <p className="text-sm text-danger-600">{error}</p>}

        {isLoading && (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        )}

        {!isLoading && data && data.content.length === 0 && (
          <p className="py-10 text-center text-sm text-ink-400">No quiz attempts yet.</p>
        )}

        {!isLoading && data && data.content.length > 0 && (
          <>
            <ul className="divide-y divide-ink-100 dark:divide-ink-800">
              {data.content.map((attempt) => {
                const percentage =
                  attempt.maxScore > 0 ? (attempt.score / attempt.maxScore) * 100 : null;
                return (
                  <li key={attempt.id} className="flex items-center justify-between gap-4 py-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink-900 dark:text-ink-50">{attempt.quizTitle}</p>
                      <p className="text-xs text-ink-400">
                        {attempt.correctAnswers}/{attempt.totalQuestions} correct
                        {attempt.submittedAt && (
                          <> &middot; {new Date(attempt.submittedAt).toLocaleDateString()}</>
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Link
                        to={ROUTE_PATHS.quizTake(attempt.quizId)}
                        className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
                      >
                        Retake
                      </Link>
                      <ScoreRing percentage={percentage} size={52} strokeWidth={5} />
                    </div>
                  </li>
                );
              })}
            </ul>

            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              isLast={data.last}
              onPrevious={() => setPage((p) => Math.max(0, p - 1))}
              onNext={() => setPage((p) => p + 1)}
              className="mt-4 border-t border-ink-100 pt-4 dark:border-ink-800"
            />
          </>
        )}
      </div>
    </div>
  );
}
