import { NavLink } from 'react-router-dom';
import { LayoutDashboard, History, Users, BarChart3, X, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';
import { ROUTE_PATHS } from '../../routes/routePaths';

const studentLinks = [
  { to: ROUTE_PATHS.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  { to: ROUTE_PATHS.QUIZ_GENERATE, label: 'Generate quiz', icon: Sparkles },
  { to: ROUTE_PATHS.QUIZ_HISTORY, label: 'Quiz history', icon: History },
];

const adminLinks = [
  { to: ROUTE_PATHS.ADMIN_DASHBOARD, label: 'Admin dashboard', icon: LayoutDashboard },
  { to: ROUTE_PATHS.ADMIN_STUDENTS, label: 'Students', icon: Users },
  { to: ROUTE_PATHS.ADMIN_ANALYTICS, label: 'Analytics', icon: BarChart3 },
];

function NavItem({ to, label, icon: Icon, onNavigate }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
            : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-ink-50'
        }`
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </NavLink>
  );
}

function NavLinks({ onNavigate }) {
  const { hasRole } = useAuth();
  const isAdmin = hasRole(ROLES.ADMIN);

  return (
    <nav className="flex flex-col gap-1">
      {!isAdmin && (
        <>
          <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-ink-400">
            Student
          </p>
          {studentLinks.map((link) => (
            <NavItem key={link.to} {...link} onNavigate={onNavigate} />
          ))}
        </>
      )}

      {isAdmin && (
        <>
          <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-ink-400">
            Admin
          </p>
          {adminLinks.map((link) => (
            <NavItem key={link.to} {...link} onNavigate={onNavigate} />
          ))}
        </>
      )}
    </nav>
  );
}

/**
 * Static column on md+ screens; a slide-in drawer with backdrop on mobile,
 * controlled by MainLayout's isSidebarOpen state (toggled from Navbar's
 * hamburger button). Without this, small screens had no navigation at all
 * beyond the browser back button.
 */
export function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Desktop: always visible, no overlay/backdrop needed */}
      <aside className="hidden w-60 shrink-0 border-r border-ink-100 bg-white px-3 py-6 dark:border-ink-800 dark:bg-ink-900 md:block">
        <NavLinks />
      </aside>

      {/* Mobile: drawer + backdrop, only in the DOM's interactive state when open */}
      <div
        className={`fixed inset-0 z-40 bg-ink-950/40 transition-opacity md:hidden ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white px-3 py-6 shadow-xl transition-transform dark:bg-ink-900 md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div className="mb-4 flex items-center justify-between px-1">
          <span className="font-display text-sm font-semibold text-ink-900 dark:text-ink-50">Menu</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-50 dark:text-ink-400 dark:hover:bg-ink-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <NavLinks onNavigate={onClose} />
      </aside>
    </>
  );
}
