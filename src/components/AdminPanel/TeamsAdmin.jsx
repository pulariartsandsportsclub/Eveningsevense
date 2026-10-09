import { useState, useMemo } from 'react';
import { useTournament } from '../../context/TournamentContext';
import {
  Plus, Pencil, Trash2, Check, X, Calendar, Users,
  Shield, UserPlus, Search
} from 'lucide-react';
import './AdminPanel.css';

const BADGE_COLORS = [
  { name: 'Emerald Pitch', hex: '#156637', secondary: '#00E676' },
  { name: 'Kasavu Gold', hex: '#C59317', secondary: '#FFD700' },
  { name: 'Malabar Crimson', hex: '#A72D2D', secondary: '#EF4444' },
  { name: 'Champions Blue', hex: '#1D4ED8', secondary: '#3B82F6' },
  { name: 'Sevens Teal', hex: '#0D9488', secondary: '#14B8A6' },
  { name: 'Sunset Amber', hex: '#D97706', secondary: '#F59E0B' },
  { name: 'Royal Purple', hex: '#7C3AED', secondary: '#A855F7' },
  { name: 'Forest Dark', hex: '#166534', secondary: '#22C55E' },
  { name: 'Striker Scarlet', hex: '#991B1B', secondary: '#DC2626' },
  { name: 'Night Stadium', hex: '#1E293B', secondary: '#64748B' },
];

const EMPTY_FORM = {
  name: '',
  players: [],
  badge: '#156637',
};

export default function TeamsAdmin({ onTabChange }) {
  const { teams = [], addTeam, updateTeam, deleteTeam } = useTournament();
  const [form, setForm] = useState(EMPTY_FORM);
  const [playerInput, setPlayerInput] = useState('');
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Club / Team name is required';
    return e;
  };

  const handleAddPlayer = () => {
    if (!playerInput.trim()) return;
    const names = playerInput
      .split(',')
      .map(p => p.trim())
      .filter(Boolean);

    setForm(prev => ({
      ...prev,
      players: [...prev.players, ...names.filter(n => !prev.players.includes(n))],
    }));
    setPlayerInput('');
  };

  const handlePlayerKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddPlayer();
    }
  };

  const removePlayer = (idxToRemove) => {
    setForm(prev => ({
      ...prev,
      players: prev.players.filter((_, idx) => idx !== idxToRemove),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    let finalPlayers = [...form.players];
    if (playerInput.trim()) {
      const extra = playerInput.split(',').map(p => p.trim()).filter(Boolean);
      finalPlayers = [...finalPlayers, ...extra.filter(n => !finalPlayers.includes(n))];
    }

    const payload = {
      name: form.name.trim(),
      players: finalPlayers,
      badge: form.badge,
    };

    if (editId) {
      updateTeam(editId, payload);
      setEditId(null);
    } else {
      addTeam(payload);
    }

    setForm(EMPTY_FORM);
    setPlayerInput('');
    setErrors({});
  };

  const startEdit = (team) => {
    setEditId(team.id);
    setForm({
      name: team.name,
      players: Array.isArray(team.players) ? [...team.players] : [],
      badge: team.badge || '#156637',
    });
    setPlayerInput('');
    setErrors({});
    window.scrollTo({ top: 140, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setPlayerInput('');
    setErrors({});
  };

  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) return teams;
    const q = searchQuery.toLowerCase();
    return teams.filter(t => {
      const matchName = (t.name || '').toLowerCase().includes(q);
      const matchPlayer = (t.players || []).some(p => p.toLowerCase().includes(q));
      return matchName || matchPlayer;
    });
  }, [teams, searchQuery]);

  return (
    <div className="teams-management-layout">
      {/* ===== LEFT COLUMN: TACTICAL SQUAD REGISTRATION FORM ===== */}
      <div className="teams-form-sidebar">
        <div className={`football-editor-card ${editId ? 'football-editor--editing' : ''}`}>
          {/* Tactical Card Header */}
          <div className="editor-card-header">
            <div className="header-crest-icon" style={{ background: form.badge, color: '#FFFFFF', fontWeight: 900, fontFamily: 'Space Grotesk, sans-serif', fontSize: '15px' }}>
              <span>{editId ? (teams.findIndex(t => t.id === editId) + 1) : (teams.length + 1)}</span>
            </div>
            <div className="header-text-block">
              <span className="matchday-dossier-tag">
                {editId ? `⚽ Editing Team #${teams.findIndex(t => t.id === editId) + 1}` : `⚽ Registering Team #${teams.length + 1}`}
              </span>
              <h3>{editId ? `Edit Team #${teams.findIndex(t => t.id === editId) + 1}` : `Register Team #${teams.length + 1}`}</h3>
            </div>

            {editId && (
              <button type="button" className="btn btn-sm btn-ghost" onClick={cancelEdit}>
                <X size={14} /> Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="football-card-form">
            {/* Club Name Input */}
            <div className="form-group">
              <label className="football-label">
                <span>Club / Team Name</span>
                <span className="req-star">*</span>
              </label>
              <input
                className={`football-input ${errors.name ? 'input-error' : ''}`}
                placeholder="e.g. Pulari Porur FC"
                value={form.name}
                onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                autoFocus={!editId}
              />
              {errors.name && <span className="football-error">{errors.name}</span>}
            </div>

            {/* Official Jersey Kit Color Picker */}
            <div className="form-group">
              <div className="label-with-count">
                <label className="football-label">
                  <span>Official Kit Color</span>
                </label>
                <span className="kit-name-badge" style={{ color: form.badge }}>
                  {BADGE_COLORS.find(c => c.hex === form.badge)?.name || form.badge}
                </span>
              </div>

              <div className="jersey-kits-picker">
                {BADGE_COLORS.map(c => (
                  <button
                    key={c.hex}
                    type="button"
                    title={c.name}
                    className={`kit-circle-btn ${form.badge === c.hex ? 'kit-circle--selected' : ''}`}
                    style={{ '--kit-color': c.hex }}
                    onClick={() => setForm(p => ({ ...p, badge: c.hex }))}
                  >
                    <span className="kit-inner-ring" style={{ background: c.hex }}>
                      {form.badge === c.hex && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Squad Members Roster */}
            <div className="form-group">
              <div className="label-with-count">
                <label className="football-label">
                  <span>Squad Players Roster</span>
                </label>
                <span className="squad-counter-tag">
                  ⚽ {form.players.length} Players
                </span>
              </div>

              <div className="squad-add-bar">
                <input
                  type="text"
                  className="football-input"
                  placeholder="Type player name & press Enter..."
                  value={playerInput}
                  onChange={(e) => setPlayerInput(e.target.value)}
                  onKeyDown={handlePlayerKeyDown}
                />
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleAddPlayer}
                  disabled={!playerInput.trim()}
                >
                  <UserPlus size={14} /> Add
                </button>
              </div>

              {/* Player Kit Badges Container */}
              {form.players.length > 0 && (
                <div className="kit-badges-flow">
                  {form.players.map((pName, idx) => (
                    <div key={idx} className="jersey-player-chip">
                      <span className="jersey-num" style={{ background: form.badge }}>
                        #{idx + 1}
                      </span>
                      <span className="player-display-name">{pName}</span>
                      <button
                        type="button"
                        className="player-chip-remove"
                        onClick={() => removePlayer(idx)}
                        title="Remove player"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form Submit Action */}
            <div className="football-form-submit">
              <button type="submit" className="btn btn-primary football-cta-btn">
                {editId ? (
                  <>
                    <Check size={16} /> Save Changes (Team #{teams.findIndex(t => t.id === editId) + 1})
                  </>
                ) : (
                  <>
                    <Plus size={16} /> Save Team #{teams.length + 1} to Tournament
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ===== RIGHT COLUMN: MATCHDAY REGISTERED CLUBS FEED ===== */}
      <div className="teams-list-main">
        {/* Header Ribbon */}
        <div className="matchday-list-ribbon">
          <div className="ribbon-title-box">
            <div className="ribbon-crest-icon">
              <Users size={16} />
            </div>
            <div>
              <h3 className="ribbon-title">Tournament Roster</h3>
              <span className="ribbon-sub">{teams.length} Registered Clubs</span>
            </div>
          </div>

          <div className="ribbon-actions-box">
            {teams.length > 0 && (
              <div className="stadium-search-input">
                <Search size={14} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search clubs or players…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
                    <X size={12} />
                  </button>
                )}
              </div>
            )}

            {onTabChange && teams.length > 0 && (
              <button
                type="button"
                className="btn btn-sm btn-outline stadium-fixtures-btn"
                onClick={() => onTabChange('fixtures')}
              >
                <Calendar size={13} />
                <span>Go to Fixtures →</span>
              </button>
            )}
          </div>
        </div>

        {/* Empty State or Club Cards */}
        {teams.length === 0 ? (
          <div className="football-empty-pitch">
            <div className="pitch-center-circle">
              <Shield size={38} />
            </div>
            <h4>Empty Tournament Draw</h4>
            <p>Use the team registration dossier on the left to register your tournament clubs and player rosters.</p>
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="football-empty-pitch" style={{ minHeight: 180 }}>
            <p>No clubs matching "{searchQuery}".</p>
            <button className="btn btn-sm btn-ghost" onClick={() => setSearchQuery('')}>
              Clear Search
            </button>
          </div>
        ) : (
          <div className="club-cards-flow">
            {filteredTeams.map((team, idx) => {
              const teamIndex = teams.findIndex(t => t.id === team.id);
              const teamNumber = teamIndex !== -1 ? teamIndex + 1 : idx + 1;
              const playersCount = Array.isArray(team.players) ? team.players.length : 0;
              const playersList = Array.isArray(team.players) ? team.players : [];

              return (
                <div
                  key={team.id}
                  className="football-club-badge-card"
                  style={{ '--club-theme': team.badge || '#156637' }}
                >
                  <div className="card-jersey-strip" style={{ background: team.badge || '#156637' }} />

                  <div className="club-card-inner">
                    <div className="club-headline-row">
                      <div className="club-crest-identity">
                        <div className="club-3d-crest" style={{ background: team.badge || '#156637' }} title={`Team #${teamNumber}`}>
                          <span>{teamNumber}</span>
                        </div>
                        <div className="club-naming-col">
                          <div className="team-count-order-tag">
                            TEAM #{teamNumber}
                          </div>
                          <h4 className="club-official-name">{team.name}</h4>
                          <div className="squad-status-row">
                            <span className={`squad-tag ${playersCount === 0 ? 'squad-tag--unfilled' : ''}`}>
                              {playersCount === 0 ? '⚠️ 0 Squad Registered' : `⚽ ${playersCount} Players in Squad`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="club-card-tools">
                        {onTabChange && (
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost schedule-shortcut-btn"
                            onClick={() => onTabChange('fixtures')}
                            title="Schedule a knockout fixture for this club"
                          >
                            <Calendar size={13} />
                            <span>Schedule</span>
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn-icon-sm"
                          onClick={() => startEdit(team)}
                          title="Edit Club Roster"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon-sm btn-icon-danger"
                          onClick={() => setConfirmDelete(team.id)}
                          title="Delete Club"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Squad Members Roster */}
                    {playersList.length > 0 ? (
                      <div className="club-squad-chips-wrap">
                        {playersList.map((p, i) => (
                          <span key={i} className="club-player-pill">
                            <span className="kit-num">#{i + 1}</span>
                            <span className="kit-name">{p}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="squad-quick-prompt">
                        <button
                          type="button"
                          className="add-players-cta"
                          onClick={() => startEdit(team)}
                        >
                          <Plus size={13} /> Add Squad Members to {team.name}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      {confirmDelete && (
        <div className="admin-dialog-overlay" onClick={(e) => e.target === e.currentTarget && setConfirmDelete(null)}>
          <div className="admin-confirm-dialog animate-scale">
            <div className="dialog-warn-icon">
              <Trash2 size={24} />
            </div>
            <h3>Delete Club Roster?</h3>
            <p>
              This will remove this club from the tournament database.
            </p>
            <div className="dialog-actions">
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  deleteTeam(confirmDelete);
                  setConfirmDelete(null);
                }}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
