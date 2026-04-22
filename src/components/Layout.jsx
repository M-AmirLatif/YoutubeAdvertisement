import { NavLink, Outlet } from 'react-router-dom';
import { BarChart3, ClipboardList, Clapperboard, Gauge, LogOut, UserRound, UsersRound, WalletCards } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { branding } from '../config/branding.js';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { to: '/tasks', label: 'Tasks', icon: Clapperboard },
  { to: '/deposit', label: 'Deposit', icon: WalletCards },
  { to: '/profile', label: 'Profile', icon: UserRound }
];

const adminItems = [
  { to: '/admin', label: 'Admin', icon: Gauge },
  { to: '/admin/videos', label: 'Video Links', icon: Clapperboard },
  { to: '/admin/users', label: 'Users', icon: UsersRound },
  { to: '/admin/transactions', label: 'Requests', icon: WalletCards },
  { to: '/admin/task-history', label: 'Task History', icon: ClipboardList },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: ClipboardList }
];

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">{branding.shortName}</div>
          <div>
            <strong>{branding.appName}</strong>
            <span>{branding.tagline}</span>
          </div>
        </div>
        <nav>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'active' : '')}>
              <item.icon size={19} />
              {item.label}
            </NavLink>
          ))}
          {user?.role === 'admin' && (
            <>
              <div className="nav-divider">Admin panel</div>
              {adminItems.map((item) => (
                <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'active' : '')}>
                  <item.icon size={19} />
                  {item.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>
        <button className="logout" onClick={logout}>
          <LogOut size={18} />
          Log out
        </button>
      </aside>
      <main>
        <header className="topbar">
          <div>
            <span className="eyebrow">Welcome back</span>
            <h1>{user?.username || 'Member'}</h1>
          </div>
          <div className="avatar">{(user?.username || 'U').slice(0, 1).toUpperCase()}</div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
