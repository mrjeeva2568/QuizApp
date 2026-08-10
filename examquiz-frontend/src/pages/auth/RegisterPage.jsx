import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../../services/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { ROUTE_PATHS, getHomeRoute } from '../../routes/routePaths';
import { Spinner } from '../../components/common/Spinner';
import { FormField } from '../../components/common/FormField';
import { PasswordInput } from '../../components/common/PasswordInput';
import { PasswordRulesList } from '../../components/common/PasswordRulesList';
import {
  validateFullName,
  validateEmail,
  validateNewPassword,
  validateConfirmPassword,
  runValidators,
} from '../../utils/validators';

const VALIDATORS = {
  fullName: validateFullName,
  email: validateEmail,
  password: validateNewPassword,
  confirmPassword: (value, values) => validateConfirmPassword(values.password, value),
};

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    const nextForm = { ...form, [name]: value };
    setForm(nextForm);

    // Re-validate any already-touched field, including confirmPassword when
    // password itself changes (otherwise a stale "match" could linger).
    setErrors((prev) => {
      const next = { ...prev };
      if (touched[name]) next[name] = VALIDATORS[name](value, nextForm);
      if (name === 'password' && touched.confirmPassword) {
        next.confirmPassword = VALIDATORS.confirmPassword(nextForm.confirmPassword, nextForm);
      }
      return next;
    });
  }

  function handleBlur(event) {
    const { name, value } = event.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: VALIDATORS[name](value, form) }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError('');

    const validationErrors = runValidators(VALIDATORS, form);
    setErrors(validationErrors);
    setTouched({ fullName: true, email: true, password: true, confirmPassword: true });
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const { confirmPassword, ...payload } = form;
      void confirmPassword; // never sent to the backend
      const user = await register(payload);
      navigate(getHomeRoute(user), { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err, 'Could not create your account.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-ink-900 dark:text-ink-50">Create your account</h2>
      <p className="mb-6 text-sm text-ink-500 dark:text-ink-400">
        Registration creates a student account.
      </p>

      {serverError && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-danger-500/30 bg-danger-50 px-3 py-2 text-sm text-danger-600 dark:bg-danger-500/10"
        >
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField
          id="fullName"
          name="fullName"
          type="text"
          label="Full name"
          autoComplete="name"
          value={form.fullName}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.fullName}
          touched={touched.fullName}
        />

        <FormField
          id="email"
          name="email"
          type="email"
          label="Email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.email}
          touched={touched.email}
        />

        <FormField id="password" label="Password" error={errors.password} touched={touched.password}>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={touched.password && errors.password ? 'true' : 'false'}
          />
          <PasswordRulesList password={form.password} />
        </FormField>

        <FormField
          id="confirmPassword"
          label="Confirm password"
          error={errors.confirmPassword}
          touched={touched.confirmPassword}
        >
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={touched.confirmPassword && errors.confirmPassword ? 'true' : 'false'}
          />
        </FormField>

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting && <Spinner size="sm" className="border-white border-t-transparent" />}
          Create account
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500 dark:text-ink-400">
        Already have an account?{' '}
        <Link to={ROUTE_PATHS.LOGIN} className="font-medium text-brand-600 hover:underline dark:text-brand-400">
          Log in
        </Link>
      </p>
    </div>
  );
}
