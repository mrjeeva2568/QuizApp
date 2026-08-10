import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { quizService } from '../../services/quizService';
import { getErrorMessage } from '../../services/apiClient';
import { useCountdown } from '../../hooks/useCountdown';
import { isAnswered } from '../../utils/quizAnswers';
import { Spinner } from '../../components/common/Spinner';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ProgressBar } from '../../components/quiz/ProgressBar';
import { QuizTimer } from '../../components/quiz/QuizTimer';
import { QuestionCard } from '../../components/quiz/QuestionCard';
import { QuestionPalette } from '../../components/quiz/QuestionPalette';
import { QuizResultSummary } from '../../components/quiz/QuizResultSummary';

// Client-side pacing convenience only - see QuizTimer's docstring. Not a
// backend-enforced limit; the backend's QuizResponse has no duration field.
const SECONDS_PER_QUESTION = 60;

export function QuizScreenPage() {
  const { id } = useParams();

  const [quiz, setQuiz] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [attemptKey, setAttemptKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError('');
    quizService
      .getQuiz(id)
      .then((data) => {
        if (!cancelled) setQuiz(data);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(getErrorMessage(err, 'Could not load this quiz.'));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (loadError) {
    return (
      <p role="alert" className="text-sm text-danger-600">
        {loadError}
      </p>
    );
  }

  if (!quiz) return null;

  // attemptKey forces a full remount of QuizTakingFlow on retry - navigating
  // to the same /quizzes/:id/take URL wouldn't remount anything (React
  // Router doesn't treat identical locations as new navigations), so
  // "Retry this quiz" needs an explicit reset mechanism instead. Changing
  // `key` is the standard React way to force a subtree to fully reset
  // (fresh answers, fresh timer, fresh currentIndex, no leftover result).
  return <QuizTakingFlow key={`${quiz.id}-${attemptKey}`} quiz={quiz} onRetry={() => setAttemptKey((k) => k + 1)} />;
}

function QuizTakingFlow({ quiz, onRetry }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState(null);

  const totalSeconds = quiz.totalQuestions * SECONDS_PER_QUESTION;

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const payload = {
        answers: quiz.questions.map((q) => ({
          questionId: q.id,
          selectedOptionIds: answers[q.id]?.selectedOptionIds || [],
          textAnswer: answers[q.id]?.textAnswer || '',
        })),
      };
      const attemptResult = await quizService.submitQuiz(quiz.id, payload);
      setResult(attemptResult);
    } catch (err) {
      setSubmitError(getErrorMessage(err, 'Could not submit your quiz. Please try again.'));
    } finally {
      setIsSubmitting(false);
      setConfirmOpen(false);
    }
  }, [quiz, answers]);

  // Called unconditionally on every render, before any early return below -
  // required by the Rules of Hooks. autoStart flips to false once `result`
  // is set, which stops the interval from scheduling further ticks.
  const secondsLeft = useCountdown(totalSeconds, {
    onExpire: () => {
      if (!result) handleSubmit();
    },
    autoStart: !result,
  });

  if (result) {
    return <QuizResultSummary quiz={quiz} attempt={result} onRetry={onRetry} />;
  }

  const question = quiz.questions[currentIndex];
  const answeredCount = quiz.questions.filter((q) => isAnswered(answers[q.id])).length;
  const unansweredCount = quiz.totalQuestions - answeredCount;
  const isLast = currentIndex === quiz.questions.length - 1;

  function updateAnswer(value) {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  }

  function goNext() {
    setCurrentIndex((i) => Math.min(i + 1, quiz.questions.length - 1));
  }

  function goPrevious() {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink-900 dark:text-ink-50">{quiz.title}</h1>
          {quiz.subject && <p className="text-xs text-ink-400">{quiz.subject}</p>}
        </div>
        <QuizTimer secondsLeft={secondsLeft} />
      </div>

      <ProgressBar current={currentIndex + 1} total={quiz.totalQuestions} answeredCount={answeredCount} />

      <QuestionPalette
        questions={quiz.questions}
        answers={answers}
        currentIndex={currentIndex}
        onJump={setCurrentIndex}
      />

      {submitError && (
        <div
          role="alert"
          className="rounded-lg border border-danger-500/30 bg-danger-50 px-3 py-2 text-sm text-danger-600 dark:bg-danger-500/10"
        >
          {submitError}
        </div>
      )}

      <QuestionCard question={question} value={answers[question.id]} onChange={updateAnswer} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={goPrevious}
          disabled={currentIndex === 0}
          className="btn-secondary w-full sm:w-auto"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </button>

        {isLast ? (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={isSubmitting}
            className="btn-primary w-full sm:w-auto"
          >
            {isSubmitting && <Spinner size="sm" className="border-white border-t-transparent" />}
            Submit quiz
          </button>
        ) : (
          <button type="button" onClick={goNext} className="btn-primary w-full sm:w-auto">
            Next <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {!isLast && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="text-sm font-medium text-ink-500 underline-offset-2 hover:underline dark:text-ink-400"
          >
            Submit early ({unansweredCount > 0 ? `${unansweredCount} unanswered` : 'all answered'})
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Submit quiz?"
        message={
          unansweredCount > 0
            ? `You have ${unansweredCount} unanswered question${unansweredCount === 1 ? '' : 's'}. Submit anyway?`
            : "Ready to submit? You won't be able to change your answers afterward."
        }
        confirmLabel="Submit"
        onConfirm={handleSubmit}
        onCancel={() => setConfirmOpen(false)}
        tone={unansweredCount > 0 ? 'danger' : 'primary'}
      />
    </div>
  );
}
