import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROUTE_PATHS } from './routePaths';
import { ROLES } from '../utils/constants';

/**
 * Guards the /admin/** route tree. Assumes it's always nested inside
 * <ProtectedRoute/> (so authentication is already established) - this only
 * adds the role check on top, redirecting an authenticated non-admin to
 * /unauthorized rather than back to /login (they ARE logged in, just not
 * allowed here).
 */
export function AdminRoute() {
  const { hasRole } = useAuth();

  if (!hasRole(ROLES.ADMIN)) {
    return <Navigate to={ROUTE_PATHS.UNAUTHORIZED} replace />;
  }

  return <Outlet />;
}
