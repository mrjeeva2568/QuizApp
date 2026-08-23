const TYPE_LABELS = {
  MULTIPLE_CHOICE: 'Select one option',
  TRUE_FALSE: 'True or false',
  SHORT_ANSWER: 'Short answer',
};

/**
 * Renders one question with its type-appropriate input, reading
 * `question.questionType` per-question (not the quiz's overall type, which
 * can be MIXED) - QuizQuestionPublicResponse carries its own type per the
 * backend contract.
 *
 * Both MULTIPLE_CHOICE and TRUE_FALSE are single-select (radio-style) here.
 *
 * NOTE: the backend's grading (QuizServiceImpl#gradeAnswer) requires an
 * exact-set match between selectedOptionIds and correctOptionIds. Since this
 * UI now only ever sends a single selected id, any MULTIPLE_CHOICE question
 * that was generated with more than one correct option will become
 * unanswerable correctly. If your quiz-generation agent can produce
 * multi-answer MULTIPLE_CHOICE questions, either constrain it to always
 * generate exactly one correct option per MULTIPLE_CHOICE question, or keep
 * this UI change scoped to questions you know are single-answer.
 */
export function QuestionCard({ question, value, onChange }) {
  const selectedOptionIds = value?.selectedOptionIds || [];
  const textAnswer = value?.textAnswer || '';
  const isOptionBased = question.questionType === 'MULTIPLE_CHOICE' || question.questionType === 'TRUE_FALSE';

  function selectOption(optionId) {
    // Single-select: selecting a new option replaces any previous selection.
    onChange({ selectedOptionIds: [optionId], textAnswer: '' });
  }

  function handleTextChange(event) {
    onChange({ selectedOptionIds: [], textAnswer: event.target.value });
  }

  return (
    <div className="card p-5 sm:p-6">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-brand-600 dark:text-brand-400">
          {TYPE_LABELS[question.questionType] || 'Question'}
        </span>
        <span className="shrink-0 text-xs text-ink-400">
          {question.points} {question.points === 1 ? 'point' : 'points'}
        </span>
      </div>

      <p className="mb-5 text-base font-medium text-ink-900 dark:text-ink-50">{question.questionText}</p>

      {isOptionBased && (
        <div role="radiogroup" aria-label="Answer options" className="space-y-2">
          {question.options.map((option) => {
            const selected = selectedOptionIds.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => selectOption(option.id)}
                className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                  selected
                    ? 'border-brand-500 bg-brand-50 text-brand-800 dark:border-brand-600 dark:bg-brand-900/30 dark:text-brand-200'
                    : 'border-ink-200 text-ink-700 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-200 dark:hover:bg-ink-800'
                }`}
              >
                <span
                  className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
                    selected ? 'border-brand-600 bg-brand-600' : 'border-ink-300 dark:border-ink-600'
                  }`}
                  aria-hidden="true"
                >
                  {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </span>
                {option.text}
              </button>
            );
          })}
        </div>
      )}

      {question.questionType === 'SHORT_ANSWER' && (
        <textarea
          rows={3}
          className="input"
          placeholder="Type your answer"
          value={textAnswer}
          onChange={handleTextChange}
          aria-label="Your answer"
        />
      )}
    </div>
  );
}