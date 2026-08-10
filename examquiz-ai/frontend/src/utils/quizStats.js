/**
 * Pure functions that turn a list of QuizAttemptSummaryResponse (from
 * GET /api/quizzes/history) into everything the dashboard displays. Kept
 * dependency-free (no fetching, no React) so it's trivial to reason about
 * and reuse.
 *
 * IMPORTANT SCOPE NOTE: the backend's QuizAttemptSummaryResponse does not
 * carry a quiz "subject" field (only quizTitle - see QuizAttempt entity;
 * subject lives on the Quiz document and isn't denormalized onto attempts).
 * There is also no student-scoped "my topic analytics" endpoint - the
 * platform-wide subject breakdown in AdminAnalyticsPage is admin-only.
 * So "topics" here are grouped by quizTitle, the finest-grained
 * self-describing label actually available on attempt history without an
 * N+1 fetch per attempt. This is documented rather than silently assumed -
 * if true subject-level grouping is needed later, the clean fix is a
 * dedicated backend endpoint that joins quizAttempts -> quizzes server-side
 * (the admin analytics module already has that exact aggregation pattern).
 */

const MIN_TOPICS_FOR_RANKING = 1;
const TOPIC_LIST_SIZE = 3;

function percentageOf(attempt) {
  if (!attempt.maxScore || attempt.maxScore <= 0) return null;
  return (attempt.score / attempt.maxScore) * 100;
}

/**
 * @param {Array} attempts - newest-first, as returned by the history endpoint
 * @param {number} totalElements - true total attempt count across all pages
 *   (from PageResponse), used for the "Total Quizzes" stat even when fewer
 *   attempts were fetched for the other computations.
 */
export function computeDashboardStats(attempts, totalElements) {
  const withPercentage = attempts
    .map((attempt) => ({ ...attempt, percentage: percentageOf(attempt) }))
    .filter((attempt) => attempt.percentage !== null);

  const averageScorePercentage =
    withPercentage.length > 0
      ? round1(withPercentage.reduce((sum, a) => sum + a.percentage, 0) / withPercentage.length)
      : null;

  const bestScorePercentage =
    withPercentage.length > 0 ? round1(Math.max(...withPercentage.map((a) => a.percentage))) : null;

  const recentAttempts = attempts.slice(0, 5);

  // Chronological (oldest -> newest) for the trend line. Sorted explicitly by
  // submittedAt rather than just reversing input order - the history endpoint
  // does return newest-first, but computing this defensively means the
  // function's correctness doesn't silently depend on that invariant holding
  // for every future caller.
  const scoreTrend = [...withPercentage]
    .filter((a) => a.submittedAt)
    .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt))
    .map((a) => ({
      id: a.id,
      label: shortDate(a.submittedAt),
      percentage: round1(a.percentage),
    }));

  const topics = computeTopicStats(attempts);
  // averagePercentage is null for topics where every attempt had maxScore 0
  // (nothing to score) - excluding those from ranking, not just requiring an
  // attempt count, since a null average sorted against real numbers via
  // subtraction produces NaN and undefined ordering.
  const rankable = topics.filter(
    (t) => t.attemptsCount >= MIN_TOPICS_FOR_RANKING && t.averagePercentage !== null
  );
  const weakTopics = [...rankable].sort((a, b) => a.averagePercentage - b.averagePercentage).slice(0, TOPIC_LIST_SIZE);
  const strongTopics = [...rankable]
    .sort((a, b) => b.averagePercentage - a.averagePercentage)
    .slice(0, TOPIC_LIST_SIZE);

  return {
    totalQuizzes: totalElements,
    averageScorePercentage,
    bestScorePercentage,
    recentAttempts,
    scoreTrend,
    topics,
    weakTopics,
    strongTopics,
  };
}

function computeTopicStats(attempts) {
  const byTopic = new Map();

  for (const attempt of attempts) {
    const key = attempt.quizTitle || 'Untitled quiz';
    const percentage = percentageOf(attempt);
    if (!byTopic.has(key)) byTopic.set(key, []);
    byTopic.get(key).push({ ...attempt, percentage });
  }

  const topics = [];
  for (const [topic, topicAttempts] of byTopic.entries()) {
    const valid = topicAttempts.filter((a) => a.percentage !== null);
    // Chronological within the topic to determine latest/previous for trend.
    const chronological = [...topicAttempts].reverse();
    const latest = chronological.at(-1);
    const previous = chronological.length >= 2 ? chronological.at(-2) : null;

    let trend = null;
    if (latest?.percentage != null && previous?.percentage != null) {
      if (latest.percentage > previous.percentage) trend = 'up';
      else if (latest.percentage < previous.percentage) trend = 'down';
      else trend = 'flat';
    }

    topics.push({
      topic,
      attemptsCount: topicAttempts.length,
      averagePercentage:
        valid.length > 0 ? round1(valid.reduce((sum, a) => sum + a.percentage, 0) / valid.length) : null,
      latestPercentage: latest?.percentage != null ? round1(latest.percentage) : null,
      trend,
    });
  }

  return topics.sort((a, b) => b.attemptsCount - a.attemptsCount);
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function shortDate(isoString) {
  return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
