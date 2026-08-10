const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Mirrors the backend's RegisterRequest password @Pattern exactly, so a client
// never submits something the server is guaranteed to reject.
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

export function validateEmail(value) {
  if (!value?.trim()) return 'Email is required';
  if (!EMAIL_PATTERN.test(value.trim())) return 'Enter a valid email address';
  return '';
}

export function validateFullName(value) {
  if (!value?.trim()) return 'Full name is required';
  if (value.trim().length < 2) return 'Full name must be at least 2 characters';
  if (value.trim().length > 100) return 'Full name must be under 100 characters';
  return '';
}

export function validateLoginPassword(value) {
  if (!value) return 'Password is required';
  return '';
}

/**
 * Matches the backend's password policy: 8-64 characters, at least one
 * uppercase letter, one lowercase letter, and one digit.
 */
export function validateNewPassword(value) {
  if (!value) return 'Password is required';
  if (value.length < 8) return 'Must be at least 8 characters';
  if (value.length > 64) return 'Must be under 64 characters';
  if (!PASSWORD_PATTERN.test(value)) {
    return 'Must include an uppercase letter, a lowercase letter, and a digit';
  }
  return '';
}

export function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword) return 'Confirm your password';
  if (password !== confirmPassword) return 'Passwords do not match';
  return '';
}

/**
 * Individual checklist items for the live password-strength indicator on
 * RegisterPage - each rule mirrors one clause of the backend's regex, so the
 * UI can show exactly which requirement is still unmet rather than a single
 * pass/fail message.
 */
export function getPasswordRules(value) {
  return [
    { key: 'length', label: 'At least 8 characters', met: value.length >= 8 },
    { key: 'lower', label: 'One lowercase letter', met: /[a-z]/.test(value) },
    { key: 'upper', label: 'One uppercase letter', met: /[A-Z]/.test(value) },
    { key: 'digit', label: 'One digit', met: /\d/.test(value) },
  ];
}

export function validateTopic(value) {
  if (!value?.trim()) return 'Topic is required';
  return '';
}

export function validateRequiredSelect(label) {
  return (value) => (!value ? `${label} is required` : '');
}

export function validateNumberOfQuestions(value) {
  const n = Number(value);
  if (!value || Number.isNaN(n)) return 'Number of questions is required';
  if (!Number.isInteger(n) || n < 1) return 'Must be at least 1';
  if (n > 100) return 'Must be 100 or fewer';
  return '';
}

/**
 * Runs a { field: validatorFn } map against a values object and returns only
 * the non-empty error messages, keyed by field.
 */
export function runValidators(validators, values) {
  const errors = {};
  for (const [field, validate] of Object.entries(validators)) {
    const message = validate(values[field], values);
    if (message) errors[field] = message;
  }
  return errors;
}
