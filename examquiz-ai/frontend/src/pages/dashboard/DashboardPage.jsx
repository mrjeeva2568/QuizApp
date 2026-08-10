import { useAuth } from '../../hooks/useAuth';
import { useQuizStats } from '../../hooks/useQuizStats';
import { WelcomeBanner } from '../../components/dashboard/WelcomeBanner';
import { QuickActions } from '../../components/dashboard/QuickActions';
import { RecentAttemptsCard } from '../../components/dashboard/RecentAttemptsCard';
import { TopicsCard } from '../../components/dashboard/TopicsCard';
import { ProgressCards } from '../../components/dashboard/ProgressCards';
import { StatCard } from '../../components/common/StatCard';
import { Spinner } from '../../components/common/Spinner';
import { LineChart } from '../../components/common/LineChart';
import { BarChart } from '../../components/common/BarChart';

export function DashboardPage() {
  const { user } = useAuth();
  const { stats, error, isLoading } = useQuizStats();

  return (
    <div className="space-y-6">
      <WelcomeBanner name={user?.fullName} />

      <QuickActions />

      {error && (
        <div role="alert" className="rounded-lg border border-danger-500/30 bg-danger-50 px-3 py-2 text-sm text-danger-600 dark:bg-danger-500/10">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {!isLoading && stats && (
        <>
          {/* Total Quizzes / Average Score / Best Score */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Total quizzes" value={stats.totalQuizzes} />
            <StatCard
              label="Average score"
              value={stats.averageScorePercentage != null ? `${stats.averageScorePercentage}%` : '—'}
            />
            <StatCard
              label="Best score"
              value={stats.bestScorePercentage != null ? `${stats.bestScorePercentage}%` : '—'}
            />
          </div>

          {/* Progress cards - per-topic trend */}
          <div>
            <h2 className="mb-3 font-display text-base font-semibold text-ink-900 dark:text-ink-50">
              Progress by topic
            </h2>
            <ProgressCards topics={stats.topics} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="card p-5">
              <h2 className="mb-4 font-display text-base font-semibold text-ink-900 dark:text-ink-50">
                Score trend
              </h2>
              <LineChart points={stats.scoreTrend} />
            </div>

            <div className="card p-5">
              <h2 className="mb-4 font-display text-base font-semibold text-ink-900 dark:text-ink-50">
                Average score by topic
              </h2>
              <BarChart
                data={stats.topics
                  .filter((t) => t.averagePercentage != null)
                  .slice(0, 8)
                  .map((t) => ({ label: t.topic, value: t.averagePercentage }))}
                valueFormatter={(v) => `${v}%`}
              />
            </div>
          </div>

          {/* Recent attempts + weak/strong topics */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <RecentAttemptsCard attempts={stats.recentAttempts} />
            <TopicsCard title="Weak topics" tone="weak" topics={stats.weakTopics} />
            <TopicsCard title="Strong topics" tone="strong" topics={stats.strongTopics} />
          </div>
        </>
      )}
    </div>
  );
}
