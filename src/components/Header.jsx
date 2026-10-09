import { NavLink } from 'react-router-dom';
import { Trophy, Users, Calendar, CheckCircle, BarChart2, Settings, Database, RefreshCw } from 'lucide-react';
import { useTournament } from '../context/TournamentContext';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: Trophy, end: true },
  { to: '/teams', label: 'Teams', icon: Users },
  { to: '/fixtures', label: 'Fixtures', icon: Calendar },
  { to: '/results', label: 'Results', icon: CheckCircle },
  { to: '/leaderboard', label: 'Leaderboard', icon: BarChart2 },
  { to: '/admin', label: 'Admin', icon: Settings },
];

export default function Header() {
  const { dbStatus, refreshDb } = useTournament();
  const { isAuthenticated } = useAuth();

  const getStatusText = () => {
    switch (dbStatus) {
      case 'connected': return 'Neon DB Live';
      case 'syncing': return 'Syncing...';
      case 'connecting': return 'Connecting...';
      default: return 'Offline Mode';
    }
  };

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
            {/* Database Live Status Badge */}
            <button
              type="button"
              className={`db-status-badge db-status-${dbStatus}`}
              onClick={refreshDb}
              title={`Neon PostgreSQL: ${getStatusText()} (Click to Sync)`}
            >
              <Database size={13} className="db-icon" />
              <span className="db-pulse-dot" />
              <span className="db-status-label">{getStatusText()}</span>
              {dbStatus === 'syncing' ? (
                <RefreshCw size={11} className="db-sync-spin" />
              ) : null}
            </button>

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
                  {to === '/admin' && isAuthenticated && (
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
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `mobile-nav-item ${isActive ? 'mobile-nav-item--active' : ''}`}
          >
            <div className="mobile-nav-icon-wrap" style={{ position: 'relative' }}>
              <Icon size={19} />
              {to === '/admin' && isAuthenticated && (
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
