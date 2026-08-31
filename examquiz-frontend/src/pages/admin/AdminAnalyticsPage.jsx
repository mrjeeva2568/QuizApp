import { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { getErrorMessage } from '../../services/apiClient';
import { Spinner } from '../../components/common/Spinner';

function BarRow({ label, count, max }) {
  const width = max > 0 ? Math.max((count / max) * 100, count > 0 ? 4 : 0) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-24 shrink-0 truncate font-mono text-ink-500 dark:text-ink-400" title={label}>
        {label}
      </span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
        <div className="h-full rounded-full bg-brand-500" style={{ width: `${width}%` }} />
      </div>
      <span className="w-8 shrink-0 text-right font-mono text-ink-600 dark:text-ink-300">{count}</span>
    </div>
  );
}

function AttemptsChart({ days }) {
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const peak = Math.max(0, ...days.map((day) => day.count));
  const average = days.length ? total / days.length : 0;
  const scale = Math.max(1, peak);
  const tickStep = Math.max(1, Math.ceil(scale / 2));
  const ticks = [scale, tickStep, 0].filter((tick, index, values) => values.indexOf(tick) === index);
  const labelStep = Math.max(1, Math.ceil(days.length / 6));

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-ink-400 dark:text-ink-500">Daily volume</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-3xl font-semibold text-ink-900 dark:text-ink-50">{total}</span>
            <span className="text-sm text-ink-500 dark:text-ink-400">total attempts</span>
          </div>
        </div>
        <div className="flex gap-5 text-right text-xs text-ink-500 dark:text-ink-400">
          <div>
            <p className="uppercase tracking-[0.12em]">Peak day</p>
            <p className="mt-1 font-mono text-sm font-semibold text-ink-800 dark:text-ink-200">{peak}</p>
          </div>
          <div>
            <p className="uppercase tracking-[0.12em]">Daily average</p>
            <p className="mt-1 font-mono text-sm font-semibold text-ink-800 dark:text-ink-200">{average.toFixed(1)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3">
        <div className="relative h-52 text-right text-[10px] font-mono text-ink-400 dark:text-ink-500">
          {ticks.map((tick) => (
            <span
              key={tick}
              className="absolute right-0 -translate-y-1/2"
              style={{ top: `${100 - (tick / scale) * 100}%` }}
            >
              {tick}
            </span>
          ))}
        </div>
        <div>
          <div className="relative h-52 border-b border-ink-200 dark:border-ink-700">
            <div className="pointer-events-none absolute inset-0">
              {ticks.map((tick) => (
                <div
                  key={tick}
                  className="absolute inset-x-0 border-t border-dashed border-ink-100 dark:border-ink-800"
                  style={{ top: `${100 - (tick / scale) * 100}%` }}
                />
              ))}
            </div>
            <div className="relative z-10 flex h-full items-end gap-1 sm:gap-2">
              {days.map((day, index) => {
                const date = new Date(`${day.date}T00:00:00`);
                const dateLabel = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                const showLabel = index === 0 || index === days.length - 1 || index % labelStep === 0;
                return (
                  <div key={day.date} className="group relative flex h-full min-w-0 flex-1 items-end">
                    <div
                      className="w-full rounded-t-sm bg-brand-500/80 transition-all duration-200 group-hover:bg-brand-500 group-hover:shadow-[0_0_0_2px_rgba(20,184,166,0.18)]"
                      style={{ height: `${day.count ? Math.max((day.count / scale) * 100, 3) : 1}%` }}
                      title={`${dateLabel}: ${day.count} attempts`}
                    />
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                      {dateLabel} · {day.count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="relative mt-2 h-5 text-[10px] text-ink-400 dark:text-ink-500">
            {days.map((day, index) => {
              if (!(index === 0 || index === days.length - 1 || index % labelStep === 0)) return null;
              const date = new Date(`${day.date}T00:00:00`);
              return (
                <span
                  key={day.date}
                  className="absolute -translate-x-1/2 whitespace-nowrap first:-translate-x-0 last:-translate-x-full"
                  style={{ left: `${(index / Math.max(days.length - 1, 1)) * 100}%` }}
                >
                  {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              );
            })}
          </div>
        </div>
      </div>
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
          <h2 className="font-display text-base font-semibold text-ink-900 dark:text-ink-50">
            Attempts over the last 30 days
          </h2>
          {data.attemptsOverTime.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-400">No attempts in this period.</p>
          ) : (
            <AttemptsChart days={data.attemptsOverTime} />
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
                <li key={quiz.quizId} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <span className="min-w-0 truncate font-medium text-ink-900 dark:text-ink-50" title={quiz.quizTitle}>
                    {quiz.quizTitle}
                  </span>
                  <span className="shrink-0 font-mono text-ink-500 dark:text-ink-400">
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
