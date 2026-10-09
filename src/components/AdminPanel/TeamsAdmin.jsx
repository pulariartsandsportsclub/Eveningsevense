import { useState } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { Plus, Pencil, Trash2, Check, X, Calendar, Zap } from 'lucide-react';

const BADGE_COLORS = ['#156637', '#A72D2D', '#C59317', '#D97706', '#0D9488', '#1D4ED8', '#7C3AED', '#854D0E', '#166534', '#991B1B'];
const EMPTY_FORM = { name: '', players: '', badge: '#156637', played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 };

export default function TeamsAdmin({ onTabChange }) {
  const { teams, addTeam, updateTeam, deleteTeam } = useTournament();
  const [form, setForm] = useState(EMPTY_FORM);
  const [opponent, setOpponent] = useState('auto');
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Team name is required';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const payload = {
      name: form.name.trim(),
      players: form.players.split(',').map(name => name.trim()).filter(Boolean),
      badge: form.badge,
      played: +form.played,
      won: +form.won,
      drawn: +form.drawn,
      lost: +form.lost,
      gf: +form.gf,
      ga: +form.ga,
      points: +form.points,
    };

    if (editId) {
      updateTeam(editId, payload);
      setEditId(null);
    } else {
      addTeam(payload, opponent);
    }
    setForm(EMPTY_FORM);
    setOpponent('auto');
    setErrors({});
  };

  const startEdit = (team) => {
    setEditId(team.id);
    setForm({
      name: team.name,
      players: (team.players || []).join(', '),
      badge: team.badge,
      played: team.played,
      won: team.won,
      drawn: team.drawn,
      lost: team.lost,
      gf: team.gf,
      ga: team.ga,
      points: team.points,
    });
    setErrors({});
  };

  const cancelEdit = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const f = (key) => ({
    value: form[key],
    onChange: (ev) => setForm(p => ({ ...p, [key]: ev.target.value })),
  });

  return (
    <div>
      {/* Notice about auto fixture creation */}
      <div style={{
        background: 'rgba(21, 102, 55, 0.08)',
        border: '1px solid rgba(21, 102, 55, 0.25)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        fontSize: '13px',
        color: 'var(--text-primary)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={16} style={{ color: 'var(--gold)', flexShrink: 0 }} />
          <span><strong>Knockout Format:</strong> Adding a team will automatically schedule their knockout fixture!</span>
        </div>
        {onTabChange && (
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            style={{ fontSize: '12px', flexShrink: 0 }}
            onClick={() => onTabChange('fixtures')}
          >
            <Calendar size={13} /> View Fixtures
          </button>
        )}
      </div>

      <div className="admin-form">
        <h3 className="admin-section-title">
          {editId ? <><Pencil size={15} /> Edit Knockout Team</> : <><Plus size={15} /> Add Knockout Team</>}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            <div className="form-group">
              <label className="form-label">Team Name *</label>
              <input className="form-input" placeholder="e.g. Malabar Strikers" {...f('name')} />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            {!editId && (
              <div className="form-group">
                <label className="form-label">Opponent for Fixture</label>
                <select
                  className="form-input"
                  value={opponent}
                  onChange={(e) => setOpponent(e.target.value)}
                >
                  <option value="auto">⚡ Auto-pair with available team (or TBD)</option>
                  <option value="TBD">⏳ Schedule with TBD opponent</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.name}>Pair against: {t.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Player Names</label>
            <input className="form-input" placeholder="Enter names separated by commas" {...f('players')} />
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Team Color</label>
            <div className="color-options">
              {BADGE_COLORS.map(c => (
                <div
                  key={c}
                  className={`color-dot ${form.badge === c ? 'color-dot--selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setForm(p => ({ ...p, badge: c }))}
                />
              ))}
            </div>
          </div>

          <div className="admin-form-grid-3">
            {['played', 'won', 'drawn', 'lost', 'gf', 'ga', 'points'].map(key => (
              <div key={key} className="form-group">
                <label className="form-label">{key.toUpperCase()}</label>
                <input className="form-input" type="number" min="0" {...f(key)} />
              </div>
            ))}
          </div>

          <div className="admin-form-actions">
            {editId && <button type="button" className="btn btn-ghost btn-sm" onClick={cancelEdit}><X size={14} /> Cancel</button>}
            <button type="submit" className="btn btn-primary btn-sm">
              {editId ? <><Check size={14} /> Save Team</> : <><Plus size={14} /> Add Team & Create Fixture</>}
            </button>
          </div>
        </form>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 className="admin-section-title" style={{ margin: 0 }}>{teams.length} Knockout Teams</h3>
        {onTabChange && (
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => onTabChange('fixtures')}
          >
            <Calendar size={13} /> Edit Fixtures →
          </button>
        )}
      </div>

      <div className="admin-list">
        {teams.map(team => (
          <div key={team.id} className="admin-list-item">
            <div className="color-dot" style={{ background: team.badge, flexShrink: 0 }} />
            <div className="admin-list-item-info">
              <span className="admin-list-item-name">{team.name}</span>
              <span className="admin-list-item-meta">{team.points} pts · {team.won}W {team.drawn}D {team.lost}L · Knockout Stage</span>
            </div>
            <div className="admin-list-actions">
              <button className="btn btn-ghost btn-sm" title="Edit Team" onClick={() => startEdit(team)}><Pencil size={13} /></button>
              <button className="btn btn-danger btn-sm" title="Delete Team" onClick={() => setConfirmDelete(team.id)}><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
        {teams.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No teams added yet.</p>}
      </div>

      {confirmDelete && (
        <div className="admin-overlay" style={{ zIndex: 10002 }}>
          <div className="confirm-dialog animate-scale">
            <h3>Delete Team?</h3>
            <p>This will remove this team and adjust any scheduled fixtures.</p>
            <div className="confirm-actions">
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => { deleteTeam(confirmDelete); setConfirmDelete(null); }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
