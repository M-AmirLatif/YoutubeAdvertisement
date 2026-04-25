import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { BookOpen, ClipboardList, Clapperboard, Crown, ExternalLink, Gauge, Home, Instagram, LogOut, Menu, MessageCircle, ReceiptText, Send, UserCog, UsersRound, WalletCards, X } from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { branding } from '../config/branding.js';
import logo from '../assets/logo.png';
import banner from '../assets/banner.png';

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

const socialIconMap = {
  'whatsapp-group': MessageCircle,
  'whatsapp-channel': MessageCircle,
  instagram: Instagram,
  x: ExternalLink,
  telegram: Send
};

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [socialLinks, setSocialLinks] = useState([]);
  const currentLabel = useMemo(() => {
    const items = [...adminItems, ...navItems];
    return items.find((item) => item.to === location.pathname)?.label || 'Workspace';
  }, [location.pathname]);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let cancelled = false;

    async function loadSocialLinks() {
      if (!user) {
        setSocialLinks([]);
        return;
      }
      try {
        const response = await api('/users/social-settings');
        if (!cancelled) setSocialLinks(response.socialLinks || []);
      } catch {
        if (!cancelled) setSocialLinks([]);
      }
    }

    loadSocialLinks();
    return () => {
      cancelled = true;
    };
  }, [user]);

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
              <img src={logo} alt="YouTube Advertisement" className="brand-logo-image" />
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
        {!!socialLinks.length && (
          <section className="sidebar-social-section">
            <div className="sidebar-section-label">Social Accounts</div>
            <div className="sidebar-social-links">
              {socialLinks.map((item) => {
                const Icon = socialIconMap[item.platform] || ExternalLink;
                return (
                  <a
                    key={`${item.platform}-${item.url}`}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sidebar-social-link"
                  >
                    <span className="sidebar-social-icon"><Icon size={14} /></span>
                    <span className="sidebar-social-copy">
                      <strong>{item.name}</strong>
                      <small>Open link</small>
                    </span>
                    <ExternalLink size={12} />
                  </a>
                );
              })}
            </div>
          </section>
        )}
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
          <img src={banner} alt={`${currentLabel} banner`} className="shell-banner-image" />
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
