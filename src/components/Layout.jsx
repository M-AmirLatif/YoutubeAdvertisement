import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { BookOpen, ClipboardList, Clapperboard, Crown, Gauge, Home, LogOut, Menu, ReceiptText, UserCog, UsersRound, WalletCards, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { branding } from '../config/branding.js';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/deposit', label: 'Deposit', icon: WalletCards },
  { to: '/tasks', label: 'Tasks & Surveys', icon: ClipboardList },
  { to: '/courses', label: 'Course', icon: BookOpen },
  { to: '/withdraw', label: 'Withdraw', icon: ReceiptText },
  { to: '/team', label: 'My Team', icon: UsersRound },
  { to: '/profile', label: 'Profile', icon: UserCog }
];

const adminItems = [
  { to: '/admin', label: 'Admin', icon: Gauge },
  { to: '/admin/videos', label: 'Tasks / Videos', icon: Clapperboard },
  { to: '/admin/courses', label: 'Course Setup', icon: BookOpen },
  { to: '/admin/users', label: 'Users', icon: UsersRound },
  { to: '/admin/transactions', label: 'Requests', icon: WalletCards },
  { to: '/admin/task-history', label: 'Task History', icon: ClipboardList },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: ClipboardList }
];

const pageDescriptions = {
  '/dashboard': 'Overview of earnings, activity, and task momentum.',
  '/deposit': 'Choose a plan and submit your payment details cleanly.',
  '/tasks': 'Complete available tasks and track your progress.',
  '/courses': 'Access training content and helpful learning resources.',
  '/withdraw': 'Review balance details and submit payout requests.',
  '/team': 'See referrals, team growth, and member activity.',
  '/profile': 'Manage account details and security settings.',
  '/admin': 'Monitor platform totals and core admin metrics.',
  '/admin/videos': 'Create, edit, and manage all user-facing tasks.',
  '/admin/courses': 'Organize course content and supporting links.',
  '/admin/users': 'Review user balances, status, and controls.',
  '/admin/transactions': 'Handle deposits, withdrawals, and request status.',
  '/admin/task-history': 'Inspect task completion and reward history.',
  '/admin/audit-logs': 'Review admin activity and important platform events.'
};

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const currentLabel = useMemo(() => {
    const items = [...adminItems, ...navItems];
    return items.find((item) => item.to === location.pathname)?.label || 'Workspace';
  }, [location.pathname]);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);
  const currentDescription = pageDescriptions[location.pathname] || 'Navigate and manage your workspace with a cleaner flow.';

  return (
    <div className="app-shell">
      <button
        type="button"
        className={`sidebar-backdrop ${mobileSidebarOpen ? 'visible' : ''}`}
        aria-label="Close navigation"
        onClick={() => setMobileSidebarOpen(false)}
      />
      <aside className={`sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark-wrap">
            <div className="sidebar-logo-mark">
              <strong>{branding.shortName}</strong>
            </div>
            <div className="sidebar-brand-copy">
              <strong>{branding.appName}</strong>
              <span>{branding.authTagline}</span>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-close"
            aria-label="Close navigation"
            onClick={() => setMobileSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>
        <nav>
          {user?.role === 'admin' && (
            <>
              <div className="nav-divider">Admin panel</div>
              {adminItems.map((item) => (
                <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => setMobileSidebarOpen(false)}>
                  <item.icon size={19} />
                  {item.label}
                </NavLink>
              ))}
              <div className="nav-divider">User</div>
            </>
          )}
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => setMobileSidebarOpen(false)}>
              <item.icon size={19} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button className="logout" onClick={() => {
          setMobileSidebarOpen(false);
          logout();
        }}>
          <LogOut size={18} />
          Log out
        </button>
      </aside>
      <main>
        <header className="shell-header">
          <div className="shell-header-main">
            <div className="shell-header-brand-copy">
              <span className="shell-header-eyebrow">Platform Workspace</span>
              <strong>YouTube Automation</strong>
            </div>
            <div className="shell-header-copy">
              <h1>{currentLabel}</h1>
              <p>{currentDescription}</p>
            </div>
          </div>
        </header>
        <header className="mobile-appbar">
          <button
            type="button"
            className="mobile-menu-button"
            aria-label="Open navigation"
            aria-expanded={mobileSidebarOpen}
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="mobile-appbar-copy">
            <strong>{currentLabel}</strong>
            <span>{branding.shortName}</span>
          </div>
        </header>
        {isDashboard && (
          <header className="topbar dashboard-hero">
            <div>
              <h1>Dashboard</h1>
              <p>Welcome back, {user?.username || 'Member'}!</p>
            </div>
            <div className="topbar-actions">
              <Link className="survey-button primary-action" to="/tasks"><Clapperboard size={22} fill="currentColor" />Start Task</Link>
              <Link className="survey-button green" to="/tasks"><Crown size={18} fill="currentColor" />Free Video Tasks</Link>
            </div>
          </header>
        )}
        <Outlet />
      </main>
    </div>
  );
}
