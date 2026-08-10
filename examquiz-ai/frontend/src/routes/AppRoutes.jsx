import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { MainLayout } from '../components/layout/MainLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminRoute } from './AdminRoute';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { QuizHistoryPage } from '../pages/quiz/QuizHistoryPage';
import { GenerateQuizPage } from '../pages/quiz/GenerateQuizPage';
import { QuizScreenPage } from '../pages/quiz/QuizScreenPage';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AdminStudentsPage } from '../pages/admin/AdminStudentsPage';
import { AdminAnalyticsPage } from '../pages/admin/AdminAnalyticsPage';
import { NotFoundPage } from '../pages/errors/NotFoundPage';
import { UnauthorizedPage } from '../pages/errors/UnauthorizedPage';
import { ROUTE_PATHS, getHomeRoute } from './routePaths';
import { useAuth } from '../hooks/useAuth';

/** Sends an authenticated user from "/" to the dashboard appropriate for their role. */
function IndexRedirect() {
  const { user } = useAuth();
  return <Navigate to={getHomeRoute(user)} replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Public: auth pages */}
      <Route element={<AuthLayout />}>
        <Route path={ROUTE_PATHS.LOGIN} element={<LoginPage />} />
        <Route path={ROUTE_PATHS.REGISTER} element={<RegisterPage />} />
      </Route>

      {/* Public: informational error pages */}
      <Route path={ROUTE_PATHS.UNAUTHORIZED} element={<UnauthorizedPage />} />

      {/* Protected: everything requiring authentication */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route index element={<IndexRedirect />} />

          {/* Student-facing (also viewable by admins) */}
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="quizzes/history" element={<QuizHistoryPage />} />
          <Route path="quizzes/generate" element={<GenerateQuizPage />} />
          <Route path="quizzes/:id/take" element={<QuizScreenPage />} />

          {/* Admin-only, nested inside AdminRoute for the role check */}
          <Route element={<AdminRoute />}>
            <Route path="admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="admin/students" element={<AdminStudentsPage />} />
            <Route path="admin/analytics" element={<AdminAnalyticsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
