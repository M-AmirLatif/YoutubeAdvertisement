import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ClipboardList, Clapperboard, Crown, Gauge, Home, LogOut, ReceiptText, UserCog, UsersRound, WalletCards, BookOpen } from 'lucide-react';
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

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">
            <strong>{branding.shortName}</strong>
          </div>
          <span>{branding.authTagline}</span>
        </div>
        <nav>
          {user?.role === 'admin' && (
            <>
              <div className="nav-divider">Admin panel</div>
              {adminItems.map((item) => (
                <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'active' : '')}>
                  <item.icon size={19} />
                  {item.label}
                </NavLink>
              ))}
              <div className="nav-divider">User</div>
            </>
          )}
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'active' : '')}>
              <item.icon size={19} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button className="logout" onClick={logout}>
          <LogOut size={18} />
          Log out
        </button>
      </aside>
      <main>
        {isDashboard && (
          <header className="topbar">
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
