import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { quizService } from '../../services/quizService';
import { getErrorMessage } from '../../services/apiClient';
import { DIFFICULTY_LEVELS, QUESTION_TYPES } from '../../utils/constants';
import { ROUTE_PATHS } from '../../routes/routePaths';
import {
  validateTopic,
  validateRequiredSelect,
  validateNumberOfQuestions,
  runValidators,
} from '../../utils/validators';
import { FormField } from '../../components/common/FormField';
import { Spinner } from '../../components/common/Spinner';

const VALIDATORS = {
  topic: validateTopic,
  difficulty: validateRequiredSelect('Difficulty'),
  questionType: validateRequiredSelect('Question type'),
  numberOfQuestions: validateNumberOfQuestions,
};

export function GenerateQuizPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({
    topic: searchParams.get('topic') || '',
    subject: '',
    difficulty: 'MEDIUM',
    questionType: 'MULTIPLE_CHOICE',
    numberOfQuestions: 5,
    additionalInstructions: '',
  });
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: VALIDATORS[name](value) }));
    }
  }

  function handleBlur(event) {
    const { name, value } = event.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: VALIDATORS[name](value) }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError('');

    const validationErrors = runValidators(VALIDATORS, form);
    setErrors(validationErrors);
    setTouched({ topic: true, difficulty: true, questionType: true, numberOfQuestions: true });
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const quiz = await quizService.generateQuiz({
        ...form,
        numberOfQuestions: Number(form.numberOfQuestions),
      });
      // Straight into the quiz screen - "setup" and "taking" are one
      // continuous flow, not setup-then-dead-end-preview.
      navigate(ROUTE_PATHS.quizTake(quiz.id), { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err, 'Could not generate a quiz right now. Please try again.'));
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink-900 dark:text-ink-50">Generate a quiz</h1>
      <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
        Describe what you want to practice — the AI agent builds the questions.
      </p>

      {serverError && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-danger-500/30 bg-danger-50 px-3 py-2 text-sm text-danger-600 dark:bg-danger-500/10"
        >
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="card mt-6 space-y-4 p-5 sm:p-6">
        <FormField
          id="topic"
          name="topic"
          type="text"
          label="Topic"
          placeholder="e.g. Photosynthesis"
          value={form.topic}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.topic}
          touched={touched.topic}
        />

        <FormField
          id="subject"
          name="subject"
          type="text"
          label="Subject (optional)"
          placeholder="e.g. Biology"
          value={form.subject}
          onChange={handleChange}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField id="difficulty" label="Difficulty" error={errors.difficulty} touched={touched.difficulty}>
            <select
              id="difficulty"
              name="difficulty"
              className="input"
              value={form.difficulty}
              onChange={handleChange}
              onBlur={handleBlur}
            >
              {DIFFICULTY_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level.charAt(0) + level.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </FormField>

          <FormField id="questionType" label="Question type" error={errors.questionType} touched={touched.questionType}>
            <select
              id="questionType"
              name="questionType"
              className="input"
              value={form.questionType}
              onChange={handleChange}
              onBlur={handleBlur}
            >
              {QUESTION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField
          id="numberOfQuestions"
          name="numberOfQuestions"
          type="number"
          min={1}
          max={100}
          label="Number of questions"
          value={form.numberOfQuestions}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.numberOfQuestions}
          touched={touched.numberOfQuestions}
        />

        <div>
          <label htmlFor="additionalInstructions" className="label">
            Additional instructions (optional)
          </label>
          <textarea
            id="additionalInstructions"
            name="additionalInstructions"
            rows={3}
            className="input"
            placeholder="e.g. focus on practical examples"
            value={form.additionalInstructions}
            onChange={handleChange}
          />
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full sm:w-auto">
          {isSubmitting ? (
            <Spinner size="sm" className="border-white border-t-transparent" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Generate quiz
        </button>
      </form>
    </div>
  );
}
