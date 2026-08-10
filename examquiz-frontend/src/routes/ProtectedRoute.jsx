import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROUTE_PATHS } from './routePaths';
import { Spinner } from '../components/common/Spinner';

/**
 * Guards any route tree requiring authentication. While the initial /me
 * check is in flight, renders a spinner rather than redirecting - avoids a
 * flash-redirect-to-login on every page refresh for an already-logged-in user.
 */
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper dark:bg-paper-dark">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTE_PATHS.LOGIN} state={{ from: location }} replace />;
  }

  return <Outlet />;
}
