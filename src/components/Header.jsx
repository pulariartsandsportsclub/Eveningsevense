import { NavLink } from 'react-router-dom';
import { Trophy, Users, Calendar, CheckCircle, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const PUBLIC_NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: Trophy, end: true },
  { to: '/teams', label: 'Teams', icon: Users },
  { to: '/fixtures', label: 'Fixtures', icon: Calendar },
  { to: '/results', label: 'Results', icon: CheckCircle },
];

const ADMIN_NAV_ITEM = { to: '/xyzabc', label: 'Admin', icon: Settings };

export default function Header() {
  const { isAuthenticated } = useAuth();

  // Show Admin button in navigation only if the administrator is currently logged in
  const navItems = isAuthenticated
    ? [...PUBLIC_NAV_ITEMS, ADMIN_NAV_ITEM]
    : PUBLIC_NAV_ITEMS;

  return (
    <>
      <header className="header">
        <div className="kasavu-header-strip" />
        <div className="header-inner">
          <NavLink to="/" className="header-brand">
            <img src="/pulari-logo.png" alt="Pulari Arts and Sports Club" className="brand-logo" />
            <div className="brand-text">
              <span className="brand-name">Sevense Football Tournament</span>
              <span className="brand-sub">Pulari Club • Estd 1985</span>
            </div>
          </NavLink>

          <div className="header-right">
            <nav className="header-nav">
              {navItems.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                  {to === '/xyzabc' && isAuthenticated && (
                    <span className="admin-active-indicator" title="Admin logged in" />
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Native-Style Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `mobile-nav-item ${isActive ? 'mobile-nav-item--active' : ''}`}
          >
            <div className="mobile-nav-icon-wrap" style={{ position: 'relative' }}>
              <Icon size={19} />
              {to === '/xyzabc' && isAuthenticated && (
                <span className="mobile-admin-active-dot" />
              )}
            </div>
            <span className="mobile-nav-label">{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
