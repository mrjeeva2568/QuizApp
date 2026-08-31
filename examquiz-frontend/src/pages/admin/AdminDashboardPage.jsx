import { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { getErrorMessage } from '../../services/apiClient';
import { StatCard } from '../../components/common/StatCard';
import { ScoreRing } from '../../components/common/ScoreRing';
import { Spinner } from '../../components/common/Spinner';

export function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    adminService
      .getDashboard()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, 'Could not load the dashboard.'));
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

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink-900 dark:text-ink-50">Admin dashboard</h1>
      <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Platform overview at a glance.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Total students" value={data.totalStudents} />
        <StatCard label="Quizzes generated" value={data.totalQuizzesGenerated} />
        <StatCard label="Total attempts" value={data.totalAttempts} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card flex flex-col items-center justify-center gap-2 p-6">
          <p className="text-sm font-medium text-ink-500 dark:text-ink-400">Platform average score</p>
          <ScoreRing percentage={data.averageScorePercentage} size={96} strokeWidth={8} />
        </div>

        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-4 font-display text-base font-semibold text-ink-900 dark:text-ink-50">
            Recent activity
          </h2>
          {data.recentActivity.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-400">No attempts yet.</p>
          ) : (
            <ul className="divide-y divide-ink-100 dark:divide-ink-800">
              {data.recentActivity.map((item) => (
                <li key={item.attemptId} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-900 dark:text-ink-50">
                      {item.studentName}
                    </p>
                    <p className="truncate text-xs text-ink-400">{item.quizTitle}</p>
                  </div>
                  <p className="shrink-0 font-mono text-sm text-ink-600 dark:text-ink-300">
                    {item.score}/{item.maxScore}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
