import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, XCircle, MinusCircle, Lightbulb, RotateCcw, LayoutDashboard } from 'lucide-react';
import { ScoreRing } from '../common/ScoreRing';
import { ROUTE_PATHS } from '../../routes/routePaths';
import { isAnswered } from '../../utils/quizAnswers';
import { getGrade, getResultBreakdown, getRecommendations } from '../../utils/resultInsights';

const REVIEW_FILTERS = [
  { key: 'all', label: 'All questions' },
  { key: 'wrong', label: 'Wrong' },
  { key: 'skipped', label: 'Skipped' },
];

function answerStatus(answer) {
  if (!isAnswered(answer)) return 'skipped';
  return answer.correct ? 'correct' : 'wrong';
}

/**
 * Shown only after POST /api/quizzes/{id}/submit succeeds. QuizAttemptResponse
 * carries grading results (correctness, points, correctOptionIds/correctAnswerText)
 * keyed by id only - no question/option text - so this cross-references
 * `quiz` (the QuizResponse already held by the parent from before submission)
 * to render actual text. Safe specifically because it only ever renders
 * after `attempt` exists, i.e. after the backend has confirmed grading
 * happened - never before, per the "no answer key before submission" rule
 * the backend itself enforces.
 */
export function QuizResultSummary({ quiz, attempt, onRetry }) {
  const [reviewFilter, setReviewFilter] = useState('all');

  const questionsById = new Map(quiz.questions.map((q) => [q.id, q]));
  const percentage = attempt.maxScore > 0 ? (attempt.score / attempt.maxScore) * 100 : null;
  const grade = getGrade(percentage);
  const breakdown = getResultBreakdown(attempt, isAnswered);
  const recommendations = getRecommendations({ percentage, wrong: breakdown.wrong, skipped: breakdown.skipped });

  const visibleAnswers =
    reviewFilter === 'all' ? attempt.answers : attempt.answers.filter((a) => answerStatus(a) === reviewFilter);

  return (
    <div className="space-y-6">
      {/* Score + Grade + Performance message */}
      <div className="card flex flex-col items-center gap-5 p-6 text-center sm:flex-row sm:text-left">
        <ScoreRing percentage={percentage} size={96} strokeWidth={8} />
        <div>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h1 className="font-display text-xl font-semibold text-ink-900 dark:text-ink-50">{attempt.quizTitle}</h1>
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 font-mono text-sm font-bold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
              {grade.letter}
            </span>
          </div>
          <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-ink-400">{grade.label}</p>
          <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">{grade.message}</p>
        </div>
      </div>

      {/* Score / Percentage / Correct / Wrong / Skipped */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <ResultStat label="Score" value={`${attempt.score}/${attempt.maxScore}`} />
        <ResultStat label="Percentage" value={percentage != null ? `${Math.round(percentage)}%` : '—'} />
        <ResultStat label="Correct" value={breakdown.correct} tone="success" />
        <ResultStat label="Wrong" value={breakdown.wrong} tone="danger" />
        <ResultStat label="Skipped" value={breakdown.skipped} tone="neutral" />
      </div>

      {/* Recommendations */}
      <div className="card p-5">
        <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-ink-900 dark:text-ink-50">
          <Lightbulb className="h-4 w-4 text-accent-500" />
          Recommendations
        </h2>
        <ul className="space-y-2">
          {recommendations.map((rec) => (
            <li key={rec.id} className="flex gap-2 text-sm text-ink-600 dark:text-ink-300">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
              {rec.text}
            </li>
          ))}
        </ul>
      </div>

      {/* Question Review */}
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-base font-semibold text-ink-900 dark:text-ink-50">Question review</h2>
          <div className="flex gap-1 rounded-lg bg-ink-100 p-1 dark:bg-ink-800">
            {REVIEW_FILTERS.map((filterOption) => (
              <button
                key={filterOption.key}
                type="button"
                onClick={() => setReviewFilter(filterOption.key)}
                aria-pressed={reviewFilter === filterOption.key}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  reviewFilter === filterOption.key
                    ? 'bg-white text-ink-900 shadow-sm dark:bg-ink-700 dark:text-ink-50'
                    : 'text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-100'
                }`}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>

        {visibleAnswers.length === 0 ? (
          <div className="card p-8 text-center text-sm text-ink-400">
            No questions match this filter.
          </div>
        ) : (
          <div className="space-y-4">
            {visibleAnswers.map((answer) => {
              const question = questionsById.get(answer.questionId);
              if (!question) return null;
              const status = answerStatus(answer);
              const originalIndex = attempt.answers.indexOf(answer);

              return (
                <div
                  key={answer.questionId}
                  className={`card border-l-4 p-5 ${
                    status === 'correct'
                      ? 'border-l-success-500'
                      : status === 'wrong'
                        ? 'border-l-danger-500'
                        : 'border-l-ink-300 dark:border-l-ink-600'
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-ink-400">Question {originalIndex + 1}</span>
                    <StatusBadge status={status} />
                  </div>

                  <p className="mb-3 text-sm font-medium text-ink-900 dark:text-ink-50">{question.questionText}</p>

                  {question.questionType === 'SHORT_ANSWER' ? (
                    <div className="space-y-1 text-sm">
                      <p className="text-ink-600 dark:text-ink-300">
                        Your answer: <span className="font-medium">{answer.textAnswer || '(no answer)'}</span>
                      </p>
                      {status !== 'correct' && answer.correctAnswerText && (
                        <p className="text-success-600">
                          Correct answer: <span className="font-medium">{answer.correctAnswerText}</span>
                        </p>
                      )}
                    </div>
                  ) : (
                    <ul className="space-y-1.5 text-sm">
                      {question.options.map((option) => {
                        const wasSelected = answer.selectedOptionIds?.includes(option.id);
                        const isCorrectOption = answer.correctOptionIds?.includes(option.id);
                        return (
                          <li
                            key={option.id}
                            className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 ${
                              isCorrectOption
                                ? 'bg-success-50 text-success-700 dark:bg-success-500/10'
                                : wasSelected
                                  ? 'bg-danger-50 text-danger-700 dark:bg-danger-500/10'
                                  : 'text-ink-500 dark:text-ink-400'
                            }`}
                          >
                            {isCorrectOption ? (
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                            ) : wasSelected ? (
                              <XCircle className="h-3.5 w-3.5 shrink-0" />
                            ) : (
                              <span className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            )}
                            <span className="min-w-0 flex-1">{option.text}</span>
                            {wasSelected && <span className="shrink-0 text-xs">your answer</span>}
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {answer.explanation && (
                    <p className="mt-3 rounded-md bg-ink-50 px-3 py-2 text-xs text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                      <strong>Explanation:</strong> {answer.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Retry Quiz / Dashboard */}
      <div className="flex flex-wrap items-center gap-3 border-t border-ink-100 pt-6 dark:border-ink-800">
        <button type="button" onClick={onRetry} className="btn-primary">
          <RotateCcw className="h-4 w-4" />
          Retry this quiz
        </button>
        <Link to={ROUTE_PATHS.DASHBOARD} className="btn-secondary">
          <LayoutDashboard className="h-4 w-4" />
          Back to dashboard
        </Link>
        <Link
          to={ROUTE_PATHS.QUIZ_GENERATE}
          className="ml-auto text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
        >
          Generate a new quiz
        </Link>
        <Link
          to={ROUTE_PATHS.QUIZ_HISTORY}
          className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
        >
          View history
        </Link>
      </div>
    </div>
  );
}

function ResultStat({ label, value, tone = 'default' }) {
  const toneClass =
    tone === 'success'
      ? 'text-success-600'
      : tone === 'danger'
        ? 'text-danger-600'
        : tone === 'neutral'
          ? 'text-ink-500 dark:text-ink-400'
          : 'text-ink-900 dark:text-ink-50';

  return (
    <div className="card p-4 text-center">
      <p className="text-xs font-medium text-ink-500 dark:text-ink-400">{label}</p>
      <p className={`mt-1 font-mono text-xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const config = {
    correct: { Icon: CheckCircle2, label: 'Correct', className: 'text-success-600' },
    wrong: { Icon: XCircle, label: 'Wrong', className: 'text-danger-600' },
    skipped: { Icon: MinusCircle, label: 'Skipped', className: 'text-ink-500 dark:text-ink-400' },
  }[status];

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${config.className}`}>
      <config.Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}
