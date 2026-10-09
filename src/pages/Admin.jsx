import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTournament } from '../context/TournamentContext';
import { useAuth } from '../context/AuthContext';
import {
  Shield, Users, Calendar, CheckCircle, BarChart2,
  DollarSign, RotateCcw, RefreshCw, AlertTriangle,
  TrendingUp, TrendingDown, LogOut, KeyRound, Check, X, User
} from 'lucide-react';
import TeamsAdmin from '../components/AdminPanel/TeamsAdmin';
import FixturesAdmin from '../components/AdminPanel/FixturesAdmin';
import ResultsAdmin from '../components/AdminPanel/ResultsAdmin';
import ScorersAdmin from '../components/AdminPanel/ScorersAdmin';
import FinanceAdmin from '../components/AdminPanel/FinanceAdmin';
import AdminLogin from '../components/AdminLogin/AdminLogin';
import './Admin.css';

const TABS = [
  { key: 'teams', label: 'Teams & Squads', icon: Users, badgeKey: 'teams' },
  { key: 'fixtures', label: 'Fixtures & Schedule', icon: Calendar, badgeKey: 'fixtures' },
  { key: 'results', label: 'Match Results', icon: CheckCircle, badgeKey: 'results' },
  { key: 'scorers', label: 'Top Scorers', icon: BarChart2, badgeKey: 'scorers' },
  { key: 'finances', label: 'Finances & Budget', icon: DollarSign, badgeKey: 'finances' },
];

export default function Admin() {
  const { user, isAuthenticated, logout, changePassword } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'teams';

  const { teams = [], fixtures = [], results = [], scorers = [], finances = [], dbStatus, refreshDb, resetData } = useTournament();
  const [confirmReset, setConfirmReset] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Change Password Form State
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passMsg, setPassMsg] = useState(null);
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);

  // If not logged in, render the login authentication screen
  if (!isAuthenticated) {
    return (
      <div className="page admin-page">
        <AdminLogin />
      </div>
    );
  }

  const setActiveTab = (tabKey) => {
    setSearchParams({ tab: tabKey });
  };

  const completedMatches = fixtures.filter(f => f.status === 'completed').length;

  const totalIncome = finances
    .filter(f => f.type === 'income')
    .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

  const totalExpense = finances
    .filter(f => f.type === 'expense')
    .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

  const netBalance = totalIncome - totalExpense;

  const getBadgeCount = (key) => {
    switch (key) {
      case 'teams': return teams.length;
      case 'fixtures': return fixtures.length;
      case 'results': return results.length;
      case 'scorers': return scorers.length;
      case 'finances': return finances.length;
      default: return null;
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassMsg(null);
    if (!currentPass || !newPass) return;
    if (newPass !== confirmPass) {
      setPassMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (newPass.length < 4) {
      setPassMsg({ type: 'error', text: 'Password must be at least 4 characters long' });
      return;
    }

    setIsUpdatingPass(true);
    const res = await changePassword(currentPass, newPass);
    setIsUpdatingPass(false);

    if (res.success) {
      setPassMsg({ type: 'success', text: 'Admin password updated successfully in Neon DB!' });
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
      setTimeout(() => setIsPasswordModalOpen(false), 1800);
    } else {
      setPassMsg({ type: 'error', text: res.error || 'Failed to update password' });
    }
  };

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'teams':
        return <TeamsAdmin onTabChange={setActiveTab} />;
      case 'fixtures':
        return <FixturesAdmin onTabChange={setActiveTab} />;
      case 'results':
        return <ResultsAdmin onTabChange={setActiveTab} />;
      case 'scorers':
        return <ScorersAdmin onTabChange={setActiveTab} />;
      case 'finances':
        return <FinanceAdmin onTabChange={setActiveTab} />;
      default:
        return <TeamsAdmin onTabChange={setActiveTab} />;
    }
  };

  return (
    <div className="page admin-page">
      {/* ===== HERO HEADER ===== */}
      <div className="admin-hero">
        <div className="admin-hero-left">
          <div className="admin-hero-badge-row">
            <div className="admin-hero-badge">
              <Shield size={14} />
              <span>Tournament Management Console</span>
            </div>

            {/* Admin User Profile Tag */}
            <div className="admin-user-pill">
              <User size={13} />
              <span>{user?.displayName || user?.username || 'Admin'}</span>
              <span className="admin-role-tag">{user?.role || 'Superadmin'}</span>
            </div>
          </div>

          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">
            Configure club rosters, schedule knockout fixtures, record scores with auto-progression, and manage all tournament finances.
          </p>
        </div>

        <div className="admin-hero-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setIsPasswordModalOpen(true)}
            title="Change Admin Password"
          >
            <KeyRound size={15} />
            <span>Password</span>
          </button>

          <button
            type="button"
            className="btn btn-outline"
            onClick={refreshDb}
            title="Sync with Neon Postgres"
          >
            <RefreshCw size={15} className={dbStatus === 'syncing' ? 'spin' : ''} />
            <span>Sync DB</span>
          </button>

          <button
            type="button"
            className="btn btn-outline btn-danger-outline"
            onClick={() => setConfirmReset(true)}
            title="Reset tournament data to seed defaults"
          >
            <RotateCcw size={15} />
            <span>Clear Data</span>
          </button>

          <button
            type="button"
            className="btn btn-outline btn-logout"
            onClick={logout}
            title="Sign out from admin session"
          >
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* ===== VITAL OVERVIEW METRICS RIBBON ===== */}
      <div className="admin-metrics-ribbon">
        <div className="admin-metric-pill">
          <div className="metric-icon-wrap" style={{ background: 'rgba(0, 155, 98, 0.1)', color: '#008753' }}>
            <Users size={16} />
          </div>
          <div className="metric-info">
            <span className="metric-num">{teams.length}</span>
            <span className="metric-label">Registered Clubs</span>
          </div>
        </div>

        <div className="admin-metric-pill">
          <div className="metric-icon-wrap" style={{ background: 'rgba(21, 102, 55, 0.1)', color: 'var(--primary)' }}>
            <Calendar size={16} />
          </div>
          <div className="metric-info">
            <span className="metric-num">{completedMatches}/{fixtures.length}</span>
            <span className="metric-label">Matches Completed</span>
          </div>
        </div>

        <div className="admin-metric-pill">
          <div className="metric-icon-wrap" style={{ background: 'rgba(229, 142, 38, 0.1)', color: '#b86a07' }}>
            <TrendingUp size={16} />
          </div>
          <div className="metric-info">
            <span className="metric-num">₹{totalIncome.toLocaleString('en-IN')}</span>
            <span className="metric-label">Total Income</span>
          </div>
        </div>

        <div className="admin-metric-pill">
          <div className="metric-icon-wrap" style={{ background: 'rgba(229, 62, 62, 0.1)', color: '#c53030' }}>
            <TrendingDown size={16} />
          </div>
          <div className="metric-info">
            <span className="metric-num">₹{totalExpense.toLocaleString('en-IN')}</span>
            <span className="metric-label">Total Expenses</span>
          </div>
        </div>

        <div className="admin-metric-pill">
          <div className="metric-icon-wrap" style={{ background: netBalance >= 0 ? 'rgba(0, 155, 98, 0.1)' : 'rgba(229, 62, 62, 0.1)', color: netBalance >= 0 ? '#008753' : '#c53030' }}>
            <DollarSign size={16} />
          </div>
          <div className="metric-info">
            <span className="metric-num" style={{ color: netBalance >= 0 ? '#008753' : '#c53030' }}>
              ₹{netBalance.toLocaleString('en-IN')}
            </span>
            <span className="metric-label">Net Balance</span>
          </div>
        </div>
      </div>

      {/* ===== ADMIN NAVIGATION TABS ===== */}
      <div className="admin-tabs-nav-container">
        <div className="admin-tabs-nav">
          {TABS.map(({ key, label, icon: Icon, badgeKey }) => {
            const count = getBadgeCount(badgeKey);
            const isActive = activeTab === key;

            return (
              <button
                key={key}
                type="button"
                className={`admin-nav-tab ${isActive ? 'admin-nav-tab--active' : ''}`}
                onClick={() => setActiveTab(key)}
              >
                <Icon size={17} />
                <span>{label}</span>
                {count !== null && (
                  <span className={`tab-count-badge ${isActive ? 'badge-active' : ''}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== TAB CONTENT WORKSPACE ===== */}
      <div className="admin-tab-workspace">
        {renderActiveTabContent()}
      </div>

      {/* ===== CHANGE PASSWORD MODAL ===== */}
      {isPasswordModalOpen && (
        <div className="admin-dialog-overlay" onClick={(e) => e.target === e.currentTarget && setIsPasswordModalOpen(false)}>
          <div className="admin-password-modal animate-scale">
            <div className="password-modal-header">
              <div className="modal-title-wrap">
                <KeyRound size={18} />
                <h3>Change Admin Password</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setIsPasswordModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="password-modal-form">
              {passMsg && (
                <div className={`password-alert ${passMsg.type}`}>
                  {passMsg.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
                  <span>{passMsg.text}</span>
                </div>
              )}

              <div className="form-group">
                <label>Current Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Enter current password"
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>New Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Enter new password (min 4 characters)"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter new password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsPasswordModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isUpdatingPass || !currentPass || !newPass}
                >
                  {isUpdatingPass ? 'Updating...' : 'Save New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== CONFIRM RESET DIALOG ===== */}
      {confirmReset && (
        <div className="admin-dialog-overlay" onClick={(e) => e.target === e.currentTarget && setConfirmReset(false)}>
          <div className="admin-confirm-dialog animate-scale">
            <div className="dialog-warn-icon">
              <AlertTriangle size={28} />
            </div>
            <h3>Wipe All Tournament Data & Finances?</h3>
            <p>
              This will clear all teams, knockout matches, scores, scorers, and finances from your Neon PostgreSQL database.
            </p>
            <div className="dialog-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setConfirmReset(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  resetData();
                  setConfirmReset(false);
                }}
              >
                Confirm Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
