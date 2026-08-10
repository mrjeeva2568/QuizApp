import { useCallback, useEffect, useState } from 'react';
import { quizService } from '../services/quizService';
import { getErrorMessage } from '../services/apiClient';
import { computeDashboardStats } from '../utils/quizStats';

// How many recent attempts feed the dashboard's computed stats (average,
// best score, weak/strong topics, trend chart). "Total Quizzes" is still
// accurate for a student with more history than this, since it comes from
// PageResponse.totalElements rather than this fetched page's length.
const HISTORY_SAMPLE_SIZE = 50;

export function useQuizStats() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(() => {
    setIsLoading(true);
    setError('');
    quizService
      .getHistory({ page: 0, size: HISTORY_SAMPLE_SIZE })
      .then((page) => {
        setStats(computeDashboardStats(page.content, page.totalElements));
      })
      .catch((err) => {
        setError(getErrorMessage(err, 'Could not load your quiz stats.'));
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { stats, error, isLoading, reload: load };
}
