import { useState } from 'react';
import { X, Users, Calendar, CheckCircle, BarChart2, Settings, RotateCcw } from 'lucide-react';
import { useTournament } from '../../context/TournamentContext';
import TeamsAdmin from './TeamsAdmin';
import FixturesAdmin from './FixturesAdmin';
import ResultsAdmin from './ResultsAdmin';
import ScorersAdmin from './ScorersAdmin';
import './AdminPanel.css';

const TABS = [
  { key: 'teams', label: 'Teams', icon: Users },
  { key: 'fixtures', label: 'Fixtures', icon: Calendar },
  { key: 'results', label: 'Results', icon: CheckCircle },
  { key: 'scorers', label: 'Scorers', icon: BarChart2 },
];

export default function AdminPanel() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('teams');
  const [confirmReset, setConfirmReset] = useState(false);
  const { resetData } = useTournament();

  const ActiveComponent = {
    teams: TeamsAdmin,
    fixtures: FixturesAdmin,
    results: ResultsAdmin,
    scorers: ScorersAdmin,
  }[activeTab];

  return (
    <>
      {/* Floating trigger button */}
      <button className="admin-fab" onClick={() => setOpen(true)} title="Open Admin Panel">
        <Settings size={20} />
        <span>Admin</span>
      </button>

      {/* Overlay */}
      {open && (
        <div className="admin-overlay" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="admin-modal animate-scale">
            {/* Modal Header */}
            <div className="admin-modal-header">
              <div className="admin-modal-title">
                <Settings size={18} />
                <h2>Tournament Admin</h2>
              </div>
              <div className="admin-modal-actions">
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => setConfirmReset(true)}
                  title="Reset to sample data"
                >
                  <RotateCcw size={14} />
                  Reset Data
                </button>
                <button className="admin-close" onClick={() => setOpen(false)}>
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="admin-tabs">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  className={`admin-tab ${activeTab === key ? 'admin-tab--active' : ''}`}
                  onClick={() => setActiveTab(key)}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="admin-content">
              <ActiveComponent onTabChange={setActiveTab} />
            </div>
          </div>
        </div>
      )}

      {/* Confirm Reset Dialog */}
      {confirmReset && (
        <div className="admin-overlay" style={{ zIndex: 10001 }}>
          <div className="confirm-dialog animate-scale">
            <h3>Reset all data?</h3>
            <p>This will replace all data with the sample dataset. This action cannot be undone.</p>
            <div className="confirm-actions">
              <button className="btn btn-ghost" onClick={() => setConfirmReset(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => { resetData(); setConfirmReset(false); }}>
                Reset Data
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
