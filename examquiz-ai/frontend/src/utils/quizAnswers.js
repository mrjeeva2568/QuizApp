/**
 * Whether a question has a usable answer recorded - shared by the progress
 * bar, question palette, and submit-confirmation logic so "answered" means
 * exactly the same thing everywhere.
 */
export function isAnswered(value) {
  if (!value) return false;
  if (Array.isArray(value.selectedOptionIds) && value.selectedOptionIds.length > 0) return true;
  if (typeof value.textAnswer === 'string' && value.textAnswer.trim().length > 0) return true;
  return false;
}
