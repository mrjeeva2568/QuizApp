import { Link } from 'react-router-dom';
import { Moon, Sun, LogOut, User as UserIcon, Menu } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { ROUTE_PATHS } from '../../routes/routePaths';

export function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/90 backdrop-blur dark:border-ink-800 dark:bg-ink-900/90">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
            className="-ml-1.5 rounded-lg p-2 text-ink-500 hover:bg-ink-50 hover:text-ink-800 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-100 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link to={ROUTE_PATHS.DASHBOARD} className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 font-display text-base font-semibold text-white">
              E
            </span>
            <span className="font-display text-lg font-semibold text-ink-900 dark:text-ink-50">
              ExamQuiz <span className="text-brand-600 dark:text-brand-400">AI</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            className="rounded-lg p-2 text-ink-500 hover:bg-ink-50 hover:text-ink-800 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-100"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <div className="mx-1 hidden items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-ink-600 dark:text-ink-300 sm:flex">
            <UserIcon className="h-4 w-4" />
            <span className="font-medium">{user?.fullName}</span>
            {user?.roles?.includes('ADMIN') && (
              <span className="rounded-full bg-accent-100 px-2 py-0.5 text-xs font-semibold text-accent-700 dark:bg-accent-900/40 dark:text-accent-300">
                Admin
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50 hover:text-danger-600 dark:text-ink-300 dark:hover:bg-ink-800"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
