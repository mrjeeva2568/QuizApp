const TYPE_LABELS = {
  MULTIPLE_CHOICE: 'Select all that apply',
  TRUE_FALSE: 'True or false',
  SHORT_ANSWER: 'Short answer',
};

/**
 * Renders one question with its type-appropriate input, reading
 * `question.questionType` per-question (not the quiz's overall type, which
 * can be MIXED) - QuizQuestionPublicResponse carries its own type per the
 * backend contract.
 *
 * MULTIPLE_CHOICE renders as checkboxes (multi-select), not radio buttons:
 * the backend's grading (QuizServiceImpl#gradeAnswer) requires an exact-set
 * match against correctOptionIds, which could legitimately contain more
 * than one id for a "select all that apply" question. Restricting to
 * single-select here would make such a question structurally impossible to
 * answer correctly. TRUE_FALSE is genuinely single-select (exactly one of
 * two options is true), so it renders as a radio group.
 */
export function QuestionCard({ question, value, onChange }) {
  const selectedOptionIds = value?.selectedOptionIds || [];
  const textAnswer = value?.textAnswer || '';
  const isRadio = question.questionType === 'TRUE_FALSE';
  const isOptionBased = question.questionType === 'MULTIPLE_CHOICE' || isRadio;

  function toggleOption(optionId) {
    if (isRadio) {
      onChange({ selectedOptionIds: [optionId], textAnswer: '' });
      return;
    }
    const next = selectedOptionIds.includes(optionId)
      ? selectedOptionIds.filter((id) => id !== optionId)
      : [...selectedOptionIds, optionId];
    onChange({ selectedOptionIds: next, textAnswer: '' });
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
        <div role={isRadio ? 'radiogroup' : 'group'} aria-label="Answer options" className="space-y-2">
          {question.options.map((option) => {
            const selected = selectedOptionIds.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                role={isRadio ? 'radio' : undefined}
                aria-checked={isRadio ? selected : undefined}
                aria-pressed={!isRadio ? selected : undefined}
                onClick={() => toggleOption(option.id)}
                className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                  selected
                    ? 'border-brand-500 bg-brand-50 text-brand-800 dark:border-brand-600 dark:bg-brand-900/30 dark:text-brand-200'
                    : 'border-ink-200 text-ink-700 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-200 dark:hover:bg-ink-800'
                }`}
              >
                <span
                  className={`grid h-4 w-4 shrink-0 place-items-center border ${isRadio ? 'rounded-full' : 'rounded'} ${
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
