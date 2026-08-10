import { isAnswered } from '../../utils/quizAnswers';

/**
 * Numbered question navigator ("question palette") - jump directly to any
 * question, with visual state for answered/unanswered/current. Complements
 * ProgressBar (which shows aggregate progress) with per-question detail.
 */
export function QuestionPalette({ questions, answers, currentIndex, onJump }) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Jump to question">
      {questions.map((q, index) => {
        const answered = isAnswered(answers[q.id]);
        const isCurrent = index === currentIndex;
        return (
          <button
            key={q.id}
            type="button"
            role="tab"
            aria-selected={isCurrent}
            aria-label={`Question ${index + 1}${answered ? ', answered' : ', unanswered'}`}
            onClick={() => onJump(index)}
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-semibold transition-colors ${
              isCurrent
                ? 'bg-brand-600 text-white'
                : answered
                  ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                  : 'bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400'
            }`}
          >
            {index + 1}
          </button>
        );
      })}
    </div>
  );
}
