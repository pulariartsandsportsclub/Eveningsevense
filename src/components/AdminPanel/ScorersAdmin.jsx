import { useState } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';

const BADGE_COLORS = ['#156637', '#A72D2D', '#C59317', '#D97706', '#0D9488', '#1D4ED8', '#7C3AED', '#854D0E', '#166534', '#991B1B'];
const EMPTY_FORM = { name: '', team: '', teamBadge: '#156637', goals: 0, assists: 0 };

export default function ScorersAdmin() {
  const { scorers, teams, addScorer, updateScorer, deleteScorer } = useTournament();
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);

  const teamNames = teams.map(t => t.name);

  // Auto-fill badge color from team
  const handleTeamChange = (teamName) => {
    const team = teams.find(t => t.name === teamName);
    setForm(p => ({ ...p, team: teamName, teamBadge: team?.badge || '#156637' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.team) e.team = 'Team is required';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const payload = { ...form, goals: +form.goals, assists: +form.assists };
    if (editId) { updateScorer(editId, payload); setEditId(null); }
    else { addScorer(payload); }
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const startEdit = (s) => {
    setEditId(s.id);
    setForm({ name: s.name, team: s.team, teamBadge: s.teamBadge, goals: s.goals, assists: s.assists });
    setErrors({});
  };

  const cancelEdit = () => { setEditId(null); setForm(EMPTY_FORM); setErrors({}); };
  const fv = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const sorted = [...scorers].sort((a, b) => b.goals - a.goals);

  return (
    <div>
      <div className="admin-form">
        <h3 className="admin-section-title">
          {editId ? <><Pencil size={15} /> Edit Scorer</> : <><Plus size={15} /> Add Scorer</>}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            <div className="form-group">
              <label className="form-label">Player Name *</label>
              <input className="form-input" placeholder="e.g. A. Santos" value={form.name} onChange={e => fv('name', e.target.value)} />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Team *</label>
              <select className="form-input" value={form.team} onChange={e => handleTeamChange(e.target.value)}>
                <option value="">Select team…</option>
                {teamNames.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              {errors.team && <span className="form-error">{errors.team}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Goals</label>
              <input className="form-input" type="number" min="0" value={form.goals} onChange={e => fv('goals', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Assists</label>
              <input className="form-input" type="number" min="0" value={form.assists} onChange={e => fv('assists', e.target.value)} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Badge Color</label>
            <div className="color-options">
              {BADGE_COLORS.map(c => (
                <div
                  key={c}
                  className={`color-dot ${form.teamBadge === c ? 'color-dot--selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => fv('teamBadge', c)}
                />
              ))}
            </div>
          </div>

          <div className="admin-form-actions">
            {editId && <button type="button" className="btn btn-ghost btn-sm" onClick={cancelEdit}><X size={14} /> Cancel</button>}
            <button type="submit" className="btn btn-primary btn-sm">
              {editId ? <><Check size={14} /> Save</> : <><Plus size={14} /> Add Scorer</>}
            </button>
          </div>
        </form>
      </div>

      <h3 className="admin-section-title">{scorers.length} Scorers</h3>
      <div className="admin-list">
        {sorted.map(s => (
          <div key={s.id} className="admin-list-item">
            <div className="color-dot" style={{ background: s.teamBadge, flexShrink: 0 }} />
            <div className="admin-list-item-info">
              <span className="admin-list-item-name">{s.name}</span>
              <span className="admin-list-item-meta">{s.team} · {s.goals} goals · {s.assists} assists</span>
            </div>
            <div className="admin-list-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => startEdit(s)}><Pencil size={13} /></button>
              <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(s.id)}><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
        {scorers.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No scorers added yet.</p>}
      </div>

      {confirmDelete && (
        <div className="admin-overlay" style={{ zIndex: 10002 }}>
          <div className="confirm-dialog animate-scale">
            <h3>Delete Scorer?</h3>
            <p>This will permanently remove this scorer entry.</p>
            <div className="confirm-actions">
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => { deleteScorer(confirmDelete); setConfirmDelete(null); }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
