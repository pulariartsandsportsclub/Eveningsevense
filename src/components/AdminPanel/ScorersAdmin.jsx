import { useState } from 'react';
import { useTournament } from '../../context/TournamentContext';
import {
  Plus, Pencil, Trash2, Check, X, Trophy,
  User, Shield, Award
} from 'lucide-react';
import './AdminPanel.css';

const BADGE_COLORS = [
  { name: 'Emerald Green', hex: '#156637' },
  { name: 'Kasavu Gold', hex: '#C59317' },
  { name: 'Malabar Crimson', hex: '#A72D2D' },
  { name: 'Royal Blue', hex: '#1D4ED8' },
  { name: 'Teal Green', hex: '#0D9488' },
  { name: 'Amber Orange', hex: '#D97706' },
  { name: 'Deep Purple', hex: '#7C3AED' },
  { name: 'Forest Green', hex: '#166534' },
  { name: 'Burgundy Red', hex: '#991B1B' },
  { name: 'Slate Dark', hex: '#1E293B' },
];

const EMPTY_FORM = {
  name: '',
  team: '',
  teamBadge: '#156637',
  goals: 0,
  assists: 0,
};

export default function ScorersAdmin() {
  const { scorers = [], teams = [], addScorer, updateScorer, deleteScorer } = useTournament();
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);

  const teamNames = teams.map(t => t.name);

  const handleTeamChange = (teamName) => {
    const team = teams.find(t => t.name === teamName);
    setForm(p => ({
      ...p,
      team: teamName,
      teamBadge: team?.badge || '#156637',
    }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Player name is required';
    if (!form.team) e.team = 'Club is required';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    const payload = {
      name: form.name.trim(),
      team: form.team,
      teamBadge: form.teamBadge,
      goals: Number(form.goals) || 0,
      assists: Number(form.assists) || 0,
    };

    if (editId) {
      updateScorer(editId, payload);
      setEditId(null);
    } else {
      addScorer(payload);
    }
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const startEdit = (s) => {
    setEditId(s.id);
    setForm({
      name: s.name,
      team: s.team,
      teamBadge: s.teamBadge || '#156637',
      goals: s.goals || 0,
      assists: s.assists || 0,
    });
    setErrors({});
    window.scrollTo({ top: 180, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const quickIncrementGoal = (s) => {
    updateScorer(s.id, {
      ...s,
      goals: (Number(s.goals) || 0) + 1,
    });
  };

  const quickIncrementAssist = (s) => {
    updateScorer(s.id, {
      ...s,
      assists: (Number(s.assists) || 0) + 1,
    });
  };

  const sortedScorers = [...scorers].sort((a, b) => (b.goals || 0) - (a.goals || 0) || (b.assists || 0) - (a.assists || 0));

  const fv = (key, val) => setForm(p => ({ ...p, [key]: val }));

  return (
    <div className="admin-submodule">
      {/* ===== SCORER EDITOR CARD ===== */}
      <div className={`admin-editor-panel ${editId ? 'editor-panel--editing' : ''}`}>
        <div className="editor-panel-header">
          <div className="panel-title-group">
            <div className="header-crest-icon" style={{ background: 'linear-gradient(135deg, #FFD700 0%, #D97706 100%)' }}>
              <Trophy size={18} color="#ffffff" />
            </div>
            <div>
              <span className="matchday-dossier-tag" style={{ color: '#FFD700' }}>🏆 Golden Boot & Top Scorer Dossier</span>
              <h3>{editId ? 'Edit Player Statistics' : 'Register Top Scorer / Playmaker'}</h3>
            </div>
          </div>

          {editId && (
            <button type="button" className="btn btn-sm btn-ghost" onClick={cancelEdit}>
              <X size={14} /> Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="admin-editor-form">
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">
                Player Full Name <span className="req-star">*</span>
              </label>
              <div className="input-with-icon">
                <User size={15} className="input-icon" />
                <input
                  className={`form-input ${errors.name ? 'input-error' : ''}`}
                  placeholder="e.g. Ashiq Kuruniyan"
                  value={form.name}
                  onChange={e => fv('name', e.target.value)}
                />
              </div>
              {errors.name && <span className="form-error-msg">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">
                Club / Team <span className="req-star">*</span>
              </label>
              <div className="team-select-wrapper">
                <span className="team-color-indicator" style={{ background: form.teamBadge }} />
                <select
                  className={`form-input ${errors.team ? 'input-error' : ''}`}
                  value={form.team}
                  onChange={e => handleTeamChange(e.target.value)}
                >
                  <option value="">Select player's club…</option>
                  {teamNames.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              {errors.team && <span className="form-error-msg">{errors.team}</span>}
            </div>
          </div>

          {/* Goals & Assists Steppers */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">⚽ Goals Scored</label>
              <div className="score-dial-control">
                <button
                  type="button"
                  className="score-dial-btn"
                  onClick={() => fv('goals', Math.max(0, (Number(form.goals) || 0) - 1))}
                >
                  -
                </button>
                <input
                  type="number"
                  min="0"
                  className="score-dial-input"
                  value={form.goals}
                  onChange={e => fv('goals', e.target.value)}
                />
                <button
                  type="button"
                  className="score-dial-btn"
                  onClick={() => fv('goals', (Number(form.goals) || 0) + 1)}
                >
                  +
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">🎯 Assists</label>
              <div className="score-dial-control">
                <button
                  type="button"
                  className="score-dial-btn"
                  onClick={() => fv('assists', Math.max(0, (Number(form.assists) || 0) - 1))}
                >
                  -
                </button>
                <input
                  type="number"
                  min="0"
                  className="score-dial-input"
                  value={form.assists}
                  onChange={e => fv('assists', e.target.value)}
                />
                <button
                  type="button"
                  className="score-dial-btn"
                  onClick={() => fv('assists', (Number(form.assists) || 0) + 1)}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Custom Badge Color */}
          <div className="form-group">
            <label className="form-label">Club Accent Color</label>
            <div className="color-swatch-picker">
              {BADGE_COLORS.map(c => (
                <button
                  key={c.hex}
                  type="button"
                  title={c.name}
                  className={`swatch-btn ${form.teamBadge === c.hex ? 'swatch-btn--active' : ''}`}
                  style={{ background: c.hex }}
                  onClick={() => fv('teamBadge', c.hex)}
                >
                  {form.teamBadge === c.hex && <Check size={13} color="#FFFFFF" />}
                </button>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="editor-form-actions">
            {editId && (
              <button type="button" className="btn btn-ghost" onClick={cancelEdit}>
                <X size={14} /> Cancel
              </button>
            )}
            <button type="submit" className="btn btn-primary football-cta-btn" style={{ minWidth: '220px' }}>
              {editId ? (
                <>
                  <Check size={16} /> Update Player Tally
                </>
              ) : (
                <>
                  <Plus size={16} /> Add to Golden Boot Race
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ===== LEADERBOARD GRID SECTION ===== */}
      <div className="admin-list-section">
        <div className="section-header-row">
          <div className="section-title-wrap">
            <Award size={18} className="text-primary" />
            <h3>Golden Boot Leaderboard</h3>
            <span className="badge-count-pill">{scorers.length} Players</span>
          </div>
        </div>

        {sortedScorers.length === 0 ? (
          <div className="admin-empty-state">
            <div className="empty-icon-wrap">
              <Trophy size={36} />
            </div>
            <h4>No Scorers Recorded</h4>
            <p>Add goalscorers above or record them directly in the Match Results tab!</p>
          </div>
        ) : (
          <div className="scorers-cards-grid">
            {sortedScorers.map((s, idx) => {
              const rank = idx + 1;
              const isPodium = rank <= 3;
              const rankLabel = rank === 1 ? '🥇 #1 Golden Boot' : rank === 2 ? '🥈 #2 Silver' : rank === 3 ? '🥉 #3 Bronze' : `#${rank}`;

              return (
                <div
                  key={s.id}
                  className={`scorer-card-item ${isPodium ? `scorer-podium-${rank}` : ''}`}
                >
                  <div className="scorer-card-header">
                    <div className="scorer-rank-pill">
                      {rankLabel}
                    </div>

                    <div className="scorer-actions-top">
                      <button
                        type="button"
                        className="btn-icon-sm"
                        title="Edit player statistics"
                        onClick={() => startEdit(s)}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        className="btn-icon-sm btn-icon-danger"
                        title="Delete entry"
                        onClick={() => setConfirmDelete(s.id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="scorer-main-info">
                    <div className="scorer-avatar" style={{ background: s.teamBadge || '#156637' }}>
                      <span>{s.name ? s.name.charAt(0).toUpperCase() : 'P'}</span>
                    </div>

                    <div className="scorer-details">
                      <h4 className="scorer-name">{s.name}</h4>
                      <div className="scorer-team-pill">
                        <Shield size={11} style={{ color: s.teamBadge }} />
                        <span>{s.team}</span>
                      </div>
                    </div>
                  </div>

                  {/* Goal & Assist Counters Display */}
                  <div className="scorer-tallies-row">
                    <div className="tally-box tally-goals">
                      <span className="tally-icon">⚽</span>
                      <div className="tally-num-wrap">
                        <span className="tally-num">{s.goals || 0}</span>
                        <span className="tally-label">Goals</span>
                      </div>
                    </div>

                    <div className="tally-box tally-assists">
                      <span className="tally-icon">🎯</span>
                      <div className="tally-num-wrap">
                        <span className="tally-num">{s.assists || 0}</span>
                        <span className="tally-label">Assists</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Increment Strip */}
                  <div className="scorer-quick-stepper-strip">
                    <button
                      type="button"
                      className="quick-inc-btn"
                      onClick={() => quickIncrementGoal(s)}
                      title="Add 1 Goal"
                    >
                      +1 ⚽ Goal
                    </button>
                    <button
                      type="button"
                      className="quick-inc-btn"
                      onClick={() => quickIncrementAssist(s)}
                      title="Add 1 Assist"
                    >
                      +1 🎯 Assist
                    </button>
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
            <h3>Delete Scorer Entry?</h3>
            <p>
              This will permanently remove this player from the Golden Boot leaderboard.
            </p>
            <div className="dialog-actions">
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  deleteScorer(confirmDelete);
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
