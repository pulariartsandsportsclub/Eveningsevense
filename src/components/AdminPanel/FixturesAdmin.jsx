import { useState } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { Plus, Pencil, Trash2, Check, X, Calendar } from 'lucide-react';

const EMPTY_FORM = {
  round: 'Quarter-Final',
  homeTeam: '',
  awayTeam: '',
  date: '',
  time: '16:30',
  venue: 'EMS Stadium, Kozhikode',
  status: 'upcoming',
  homeScore: '',
  awayScore: '',
  homePenalty: '',
  awayPenalty: '',
  postponedReason: '',
};


const KNOCKOUT_ROUNDS = [
  'Round of 16',
  'Quarter-Final',
  'Quarter-Final 1',
  'Quarter-Final 2',
  'Quarter-Final 3',
  'Quarter-Final 4',
  'Semi-Final 1',
  'Semi-Final 2',
  'Third Place Playoff',
  'Final',
];

const KERALA_VENUES = [
  'EMS Stadium, Kozhikode',
  'Jawaharlal Nehru Stadium, Kochi',
  'Malappuram Sevens Ground',
  'Chandrasekharan Nair Stadium, Trivandrum',
];

export default function FixturesAdmin() {
  const { fixtures, teams, addFixture, updateFixture, deleteFixture } = useTournament();
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);

  const teamNames = teams.map(t => t.name);

  const validate = () => {
    const e = {};
    if (!form.homeTeam) e.homeTeam = 'Home team is required';
    if (!form.awayTeam) e.awayTeam = 'Away team is required';
    if (form.homeTeam && form.awayTeam && form.homeTeam === form.awayTeam && form.homeTeam !== 'TBD') {
      e.awayTeam = 'Cannot play against self';
    }
    if (!form.date) e.date = 'Date is required';
    if (!form.venue.trim()) e.venue = 'Venue is required';
    if (form.status === 'completed') {
      if (form.homeScore === '' || form.awayScore === '') {
        e.score = 'Scores are required to complete match';
      } else if (parseInt(form.homeScore, 10) === parseInt(form.awayScore, 10)) {
        if (form.homePenalty === '' || form.awayPenalty === '') {
          e.penalty = 'Penalties are required for tied knockout matches';
        } else if (parseInt(form.homePenalty, 10) === parseInt(form.awayPenalty, 10)) {
          e.penalty = 'Penalties cannot end in a draw in knockout stage';
        }
      }
    }
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const payload = {
      round: form.round || 'Quarter-Final',
      homeTeam: form.homeTeam,
      awayTeam: form.awayTeam,
      date: form.date,
      time: form.time || '16:30',
      venue: form.venue.trim(),
      status: form.status || 'upcoming',
      homeScore: form.status === 'completed' || form.status === 'live' ? form.homeScore : undefined,
      awayScore: form.status === 'completed' || form.status === 'live' ? form.awayScore : undefined,
      homePenalty: form.status === 'completed' && form.homePenalty !== '' ? form.homePenalty : undefined,
      awayPenalty: form.status === 'completed' && form.awayPenalty !== '' ? form.awayPenalty : undefined,
      postponedReason: form.status === 'postponed' ? form.postponedReason : undefined,
    };

    if (editId) {
      updateFixture(editId, payload);
      setEditId(null);
    } else {
      addFixture(payload);
    }
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const startEdit = (fix) => {
    setEditId(fix.id);
    setForm({
      round: fix.round || 'Quarter-Final',
      homeTeam: fix.homeTeam,
      awayTeam: fix.awayTeam,
      date: fix.date,
      time: fix.time,
      venue: fix.venue,
      status: fix.status,
      homeScore: fix.homeScore !== undefined ? fix.homeScore : '',
      awayScore: fix.awayScore !== undefined ? fix.awayScore : '',
      homePenalty: fix.homePenalty !== undefined ? fix.homePenalty : '',
      awayPenalty: fix.awayPenalty !== undefined ? fix.awayPenalty : '',
      postponedReason: fix.postponedReason || '',
    });
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const sortedFixtures = [...fixtures].sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

  return (
    <div>
      <div className="admin-form" style={{ borderTop: editId ? '3px solid var(--gold)' : 'none' }}>
        <h3 className="admin-section-title">
          {editId ? <><Pencil size={15} style={{ color: 'var(--gold)' }} /> Edit Knockout Fixture</> : <><Plus size={15} /> Add Knockout Fixture</>}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            <div className="form-group">
              <label className="form-label">Knockout Round *</label>
              <select className="form-input" {...f('round')}>
                {KNOCKOUT_ROUNDS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" {...f('status')}>
                <option value="upcoming">Upcoming</option>
                <option value="live">Live Now</option>
                <option value="completed">Completed (FT)</option>
                <option value="postponed">Postponed</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Home Team *</label>
              <select className="form-input" {...f('homeTeam')}>
                <option value="">Select team…</option>
                <option value="TBD">TBD (To Be Decided)</option>
                {teamNames.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              {errors.homeTeam && <span className="form-error">{errors.homeTeam}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Away Team *</label>
              <select className="form-input" {...f('awayTeam')}>
                <option value="">Select team…</option>
                <option value="TBD">TBD (To Be Decided)</option>
                {teamNames.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              {errors.awayTeam && <span className="form-error">{errors.awayTeam}</span>}
            </div>

            {form.status === 'postponed' && (
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Postponement Reason</label>
                <input className="form-input" placeholder="e.g. Heavy Rain / Waterlogged Ground" {...f('postponedReason')} />
              </div>
            )}

            {(form.status === 'completed' || form.status === 'live') && (
              <>
                <div className="form-group">
                  <label className="form-label">Home Score *</label>
                  <input className="form-input" type="number" min="0" {...f('homeScore')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Away Score *</label>
                  <input className="form-input" type="number" min="0" {...f('awayScore')} />
                  {errors.score && <span className="form-error">{errors.score}</span>}
                </div>
              </>
            )}

            {form.status === 'completed' && form.homeScore !== '' && form.awayScore !== '' && form.homeScore === form.awayScore && (
              <>
                <div className="form-group">
                  <label className="form-label">Home Penalty Score *</label>
                  <input className="form-input" type="number" min="0" placeholder="e.g. 4" {...f('homePenalty')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Away Penalty Score *</label>
                  <input className="form-input" type="number" min="0" placeholder="e.g. 3" {...f('awayPenalty')} />
                  {errors.penalty && <span className="form-error">{errors.penalty}</span>}
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Date *</label>
              <input className="form-input" type="date" {...f('date')} />
              {errors.date && <span className="form-error">{errors.date}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Time</label>
              <input className="form-input" type="time" {...f('time')} />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Stadium / Venue *</label>
              <input className="form-input" placeholder="e.g. EMS Stadium, Kozhikode" list="venues-list" {...f('venue')} />
              <datalist id="venues-list">
                {KERALA_VENUES.map(v => <option key={v} value={v} />)}
              </datalist>
              {errors.venue && <span className="form-error">{errors.venue}</span>}
            </div>
          </div>

          <div className="admin-form-actions">
            {editId && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={cancelEdit}>
                <X size={14} /> Cancel
              </button>
            )}
            <button type="submit" className="btn btn-primary btn-sm">
              {editId ? <><Check size={14} /> Save Fixture Changes</> : <><Plus size={14} /> Add Fixture</>}
            </button>
          </div>
        </form>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 className="admin-section-title" style={{ margin: 0 }}>
          <Calendar size={16} /> {fixtures.length} Scheduled Knockout Matches
        </h3>
      </div>

      <div className="admin-list">
        {sortedFixtures.map(fix => (
          <div key={fix.id} className="admin-list-item" style={{ borderLeft: fix.status === 'live' ? '3px solid var(--danger)' : '3px solid var(--gold)' }}>
            <div className="admin-list-item-info">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span className="badge badge-upcoming" style={{ fontSize: '10px', padding: '2px 8px' }}>
                  {fix.round || 'Knockout Match'}
                </span>
                <span className={`badge badge-${fix.status}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                  {fix.status}
                </span>
              </div>
              <span className="admin-list-item-name" style={{ fontSize: '15px' }}>
                {fix.homeTeam} {fix.status === 'completed' && <span style={{color:'var(--gold)'}}>({fix.homeScore})</span>} <span style={{ color: 'var(--gold)', fontWeight: 800 }}>vs</span> {fix.awayTeam} {fix.status === 'completed' && <span style={{color:'var(--gold)'}}>({fix.awayScore})</span>}
              </span>
              <span className="admin-list-item-meta">
                📅 {fix.date} · ⏰ {fix.time} · 📍 {fix.venue}
              </span>
            </div>
            <div className="admin-list-actions">
              <button className="btn btn-ghost btn-sm" title="Edit Fixture" onClick={() => startEdit(fix)}>
                <Pencil size={13} /> Edit
              </button>
              <button className="btn btn-danger btn-sm" title="Delete Fixture" onClick={() => setConfirmDelete(fix.id)}>
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
        {fixtures.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            No fixtures scheduled yet. Add a team above and fixtures will be automatically created!
          </p>
        )}
      </div>

      {confirmDelete && (
        <div className="admin-overlay" style={{ zIndex: 10002 }}>
          <div className="confirm-dialog animate-scale">
            <h3>Delete Fixture?</h3>
            <p>This will permanently remove this scheduled match from the tournament.</p>
            <div className="confirm-actions">
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => { deleteFixture(confirmDelete); setConfirmDelete(null); }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
