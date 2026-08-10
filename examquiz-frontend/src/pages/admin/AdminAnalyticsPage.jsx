import { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { getErrorMessage } from '../../services/apiClient';
import { Spinner } from '../../components/common/Spinner';

function BarRow({ label, count, max }) {
  const width = max > 0 ? Math.max((count / max) * 100, count > 0 ? 4 : 0) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-16 shrink-0 font-mono text-ink-500 dark:text-ink-400">{label}</span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
        <div className="h-full rounded-full bg-brand-500" style={{ width: `${width}%` }} />
      </div>
      <span className="w-8 shrink-0 text-right font-mono text-ink-600 dark:text-ink-300">{count}</span>
    </div>
  );
}

export function AdminAnalyticsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    adminService
      .getAnalytics()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, 'Could not load analytics.'));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <p className="text-sm text-danger-600">{error}</p>;
  }

  if (!data) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  const maxBucketCount = Math.max(1, ...data.scoreDistribution.map((b) => b.count));
  const maxSubjectCount = Math.max(1, ...data.subjectBreakdown.map((s) => s.attemptCount));
  const maxDailyCount = Math.max(1, ...data.attemptsOverTime.map((d) => d.count));

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink-900 dark:text-ink-50">Analytics</h1>
      <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
        Platform-wide trends across all students and quizzes.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 font-display text-base font-semibold text-ink-900 dark:text-ink-50">
            Score distribution
          </h2>
          <div className="space-y-2.5">
            {data.scoreDistribution.map((bucket) => (
              <BarRow key={bucket.label} label={bucket.label} count={bucket.count} max={maxBucketCount} />
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="mb-4 font-display text-base font-semibold text-ink-900 dark:text-ink-50">
            Attempts by subject
          </h2>
          {data.subjectBreakdown.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-400">No data yet.</p>
          ) : (
            <div className="space-y-2.5">
              {data.subjectBreakdown.map((subject) => (
                <BarRow
                  key={subject.subject}
                  label={subject.subject}
                  count={subject.attemptCount}
                  max={maxSubjectCount}
                />
              ))}
            </div>
          )}
        </div>

        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-4 font-display text-base font-semibold text-ink-900 dark:text-ink-50">
            Attempts over the last 30 days
          </h2>
          {data.attemptsOverTime.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-400">No attempts in this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <div
                className="flex h-32 items-end gap-1"
                style={{ minWidth: `${Math.max(data.attemptsOverTime.length * 14, 100)}%` }}
              >
                {data.attemptsOverTime.map((day) => (
                  <div key={day.date} className="group relative flex-1">
                    <div
                      className="rounded-t bg-brand-500 transition-colors group-hover:bg-brand-600 group-active:bg-brand-600"
                      style={{ height: `${Math.max((day.count / maxDailyCount) * 100, day.count > 0 ? 6 : 2)}%` }}
                    />
                    <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-ink-900 px-1.5 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100 group-active:opacity-100">
                      {day.date}: {day.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-4 font-display text-base font-semibold text-ink-900 dark:text-ink-50">
            Top quizzes
          </h2>
          {data.topQuizzes.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-400">No attempts yet.</p>
          ) : (
            <ul className="divide-y divide-ink-100 dark:divide-ink-800">
              {data.topQuizzes.map((quiz) => (
                <li key={quiz.quizId} className="flex items-center justify-between py-3 text-sm">
                  <span className="font-medium text-ink-900 dark:text-ink-50">{quiz.quizTitle}</span>
                  <span className="font-mono text-ink-500 dark:text-ink-400">
                    {quiz.attemptCount} attempts
                    {quiz.averageScorePercentage != null && ` · ${Math.round(quiz.averageScorePercentage)}% avg`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
