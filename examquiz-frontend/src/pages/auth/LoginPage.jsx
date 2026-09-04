import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../../services/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { ROUTE_PATHS, getHomeRoute } from '../../routes/routePaths';
import { Spinner } from '../../components/common/Spinner';
import { FormField } from '../../components/common/FormField';
import { PasswordInput } from '../../components/common/PasswordInput';
import { validateEmail, validateLoginPassword, runValidators } from '../../utils/validators';

const VALIDATORS = {
  email: validateEmail,
  password: validateLoginPassword,
};

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
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
    setTouched({ email: true, password: true });
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const user = await login(form);
      navigate(getHomeRoute(user), { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err, 'Invalid email or password.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-ink-900 dark:text-ink-50">Welcome back</h2>
      <p className="mb-6 text-sm text-ink-500 dark:text-ink-400">Log in to continue.</p>

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
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={touched.password && errors.password ? 'true' : 'false'}
          />
        </FormField>

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting && <Spinner size="sm" className="border-white border-t-transparent" />}
          Log in
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500 dark:text-ink-400">
        Don&apos;t have an account?{' '}
        <Link to={ROUTE_PATHS.REGISTER} className="font-medium text-brand-600 hover:underline dark:text-brand-400">
          Register
        </Link>
      </p>
    </div>
  );
}
