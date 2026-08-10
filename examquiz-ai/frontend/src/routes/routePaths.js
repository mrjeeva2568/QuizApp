import { ROLES } from '../utils/constants';

export const ROUTE_PATHS = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  QUIZ_HISTORY: '/quizzes/history',
  QUIZ_GENERATE: '/quizzes/generate',
  QUIZ_TAKE: '/quizzes/:id/take',
  quizTake: (id) => `/quizzes/${id}/take`,
  QUIZ_DETAIL: '/quizzes/:id',
  quizDetail: (id) => `/quizzes/${id}`,
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_STUDENTS: '/admin/students',
  ADMIN_ANALYTICS: '/admin/analytics',
  UNAUTHORIZED: '/unauthorized',
};

/**
 * Where a user lands after login / on "/" - admins go straight to their
 * dashboard rather than the student one, since the student dashboard isn't
 * meaningful for an account with no quiz attempts of its own.
 */
export function getHomeRoute(user) {
  if (user?.roles?.includes(ROLES.ADMIN)) {
    return ROUTE_PATHS.ADMIN_DASHBOARD;
  }
  return ROUTE_PATHS.DASHBOARD;
}
