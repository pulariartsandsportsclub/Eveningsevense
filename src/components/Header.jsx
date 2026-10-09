import { NavLink } from 'react-router-dom';
import { Trophy, Users, Calendar, CheckCircle, BarChart2 } from 'lucide-react';
import './Header.css';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: Trophy, end: true },
  { to: '/teams', label: 'Teams', icon: Users },
  { to: '/fixtures', label: 'Fixtures', icon: Calendar },
  { to: '/results', label: 'Results', icon: CheckCircle },
  { to: '/leaderboard', label: 'Leaderboard', icon: BarChart2 },
];

export default function Header() {
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

          <nav className="header-nav">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* Mobile Native-Style Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `mobile-nav-item ${isActive ? 'mobile-nav-item--active' : ''}`}
          >
            <div className="mobile-nav-icon-wrap">
              <Icon size={19} />
            </div>
            <span className="mobile-nav-label">{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
