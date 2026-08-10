import { Link } from 'react-router-dom';
import { ROUTE_PATHS } from '../../routes/routePaths';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-4 text-center dark:bg-paper-dark">
      <p className="font-mono text-sm font-medium text-brand-600 dark:text-brand-400">404</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900 dark:text-ink-50">
        Page not found
      </h1>
      <p className="mt-2 max-w-sm text-sm text-ink-500 dark:text-ink-400">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Link to={ROUTE_PATHS.DASHBOARD} className="btn-primary mt-6">
        Back to dashboard
      </Link>
    </div>
  );
}
