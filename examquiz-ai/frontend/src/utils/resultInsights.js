/**
 * Pure functions turning a graded QuizAttemptResponse into the presentation
 * data QuizResultSummary needs: letter grade, performance message, and
 * contextual recommendations. No React, no fetching - kept separate from
 * the component so the grading bands/thresholds are easy to see and test
 * in one place.
 */

const GRADE_BANDS = [
  { min: 90, letter: 'A', label: 'Excellent', message: "Outstanding! You've mastered this material." },
  { min: 80, letter: 'B', label: 'Good', message: 'Great job — you have a solid understanding.' },
  { min: 70, letter: 'C', label: 'Satisfactory', message: 'Good effort! A bit more practice will help you excel.' },
  { min: 60, letter: 'D', label: 'Needs improvement', message: "You're building understanding — keep practicing." },
  { min: 0, letter: 'F', label: 'Needs review', message: "Don't worry — review the material below and try again." },
];

/**
 * @param {number|null} percentage - null when the attempt couldn't be scored
 *   (e.g. maxScore was 0), in which case there's no meaningful grade.
 */
export function getGrade(percentage) {
  if (percentage == null) {
    return { letter: '—', label: 'Not scored', message: 'This quiz could not be scored.' };
  }
  return GRADE_BANDS.find((band) => percentage >= band.min) || GRADE_BANDS.at(-1);
}

/**
 * Splits total questions into correct / wrong / skipped. "Wrong" and
 * "skipped" are both graded as incorrect by the backend (it has no separate
 * concept of "unattempted"), so the split happens here, client-side, using
 * whether an answer has any recorded content at all.
 */
export function getResultBreakdown(attempt, isAnsweredFn) {
  const total = attempt.totalQuestions;
  const correct = attempt.correctAnswers;
  const skipped = attempt.answers.filter((answer) => !isAnsweredFn(answer)).length;
  const wrong = Math.max(total - correct - skipped, 0);
  return { total, correct, wrong, skipped };
}

export function getRecommendations({ percentage, wrong, skipped }) {
  const recommendations = [];

  if (skipped > 0) {
    recommendations.push({
      id: 'skipped',
      text: `You skipped ${skipped} question${skipped === 1 ? '' : 's'}. Attempting every question — even a guess — gives you a better chance to score.`,
    });
  }

  if (wrong > 0) {
    recommendations.push({
      id: 'wrong',
      text: `Review the ${wrong} question${wrong === 1 ? '' : 's'} you got wrong below to reinforce those concepts.`,
    });
  }

  if (percentage != null && percentage < 70) {
    recommendations.push({
      id: 'practice-more',
      text: 'Consider practicing this topic again before moving on — repetition helps concepts stick.',
    });
  } else if (percentage != null && percentage >= 90) {
    recommendations.push({
      id: 'level-up',
      text: "You've got this topic down. Try a harder difficulty or a new topic to keep challenging yourself.",
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({ id: 'default', text: 'Keep up the consistent practice!' });
  }

  return recommendations;
}
