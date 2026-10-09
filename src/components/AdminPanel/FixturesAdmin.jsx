import { useState } from 'react';
import { useTournament } from '../../context/TournamentContext';
import {
  Plus, Pencil, Trash2, Check, X, Calendar, Clock, MapPin,
  ArrowLeftRight, Trophy, AlertTriangle, CalendarDays,
  Shuffle, Zap
} from 'lucide-react';
import { getProgressionTarget, getMatchWinner } from '../../utils/bracketProgression';
import './AdminPanel.css';

const EMPTY_FORM = {
  round: 'Quarter-Final 1',
  homeTeam: '',
  awayTeam: '',
  date: new Date().toISOString().split('T')[0],
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
  'Round of 16 1',
  'Round of 16 2',
  'Round of 16 3',
  'Round of 16 4',
  'Round of 16 5',
  'Round of 16 6',
  'Round of 16 7',
  'Round of 16 8',
  'Round of 16',
  'Quarter-Final 1',
  'Quarter-Final 2',
  'Quarter-Final 3',
  'Quarter-Final 4',
  'Quarter-Final',
  'Semi-Final 1',
  'Semi-Final 2',
  'Semi-Final',
  'Third Place Playoff',
  'Final',
];

const KERALA_VENUES = [
  'EMS Stadium, Kozhikode',
  'Jawaharlal Nehru Stadium, Kochi',
  'Malappuram Sevens Ground',
  'Chandrasekharan Nair Stadium, Trivandrum',
  'Kottappuram Ground, Palakkad',
];

const QUICK_POSTPONE_REASONS = [
  '🌧️ Heavy Rain / Pitch Waterlogged',
  '🏟️ Ground Maintenance',
  '⚡ Adverse Weather Conditions',
  '⏰ Rescheduled Kickoff Time',
];

export default function FixturesAdmin() {
  const { fixtures = [], teams = [], addFixture, updateFixture, deleteFixture, autoGenerateFixtures } = useTournament();
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [filterRound, setFilterRound] = useState('all');
  const [showGenModal, setShowGenModal] = useState(false);
  const [genConfig, setGenConfig] = useState({
    bracketSize: 16,
    assignmentMode: 'auto',
    shuffle: false,
    replaceExisting: true,
    startDate: new Date().toISOString().split('T')[0],
    venue: 'EMS Stadium, Kozhikode',
    time: '16:30',
  });

  const teamNames = teams.map(t => t.name);

  const getTeamColor = (name) => {
    const t = teams.find(team => team.name === name);
    return t?.badge || '#156637';
  };

  const getTeamBadgeLabel = (name) => {
    if (!name || name === 'TBD') return '?';
    const idx = teams.findIndex(t => t.name.toLowerCase() === name.toLowerCase());
    return idx !== -1 ? (idx + 1) : name.charAt(0);
  };

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
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    const payload = {
      round: form.round || 'Quarter-Final',
      homeTeam: form.homeTeam,
      awayTeam: form.awayTeam,
      date: form.date,
      time: form.time || '16:30',
      venue: form.venue.trim(),
      status: form.status || 'upcoming',
      homeScore: form.status === 'completed' || form.status === 'live' ? Number(form.homeScore) : undefined,
      awayScore: form.status === 'completed' || form.status === 'live' ? Number(form.awayScore) : undefined,
      homePenalty: form.status === 'completed' && form.homePenalty !== '' ? Number(form.homePenalty) : undefined,
      awayPenalty: form.status === 'completed' && form.awayPenalty !== '' ? Number(form.awayPenalty) : undefined,
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
    window.scrollTo({ top: 180, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const handleSwapTeams = () => {
    setForm(prev => ({
      ...prev,
      homeTeam: prev.awayTeam,
      awayTeam: prev.homeTeam,
      homeScore: prev.awayScore,
      awayScore: prev.homeScore,
      homePenalty: prev.awayPenalty,
      awayPenalty: prev.homePenalty,
    }));
  };

  const setQuickDate = (daysAhead) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    setForm(prev => ({ ...prev, date: d.toISOString().split('T')[0] }));
  };

  const f = (key) => ({
    value: form[key],
    onChange: (ev) => setForm(p => ({ ...p, [key]: ev.target.value })),
  });

  const sortedFixtures = [...fixtures].sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

  const displayedFixtures = sortedFixtures.filter(f => {
    if (filterRound === 'all') return true;
    return (f.round || '').toLowerCase().includes(filterRound.toLowerCase());
  });

  return (
    <div className="admin-submodule">
      {/* ===== TOURNAMENT BRACKET GENERATOR HERO TOOLBAR ===== */}
      <div className="auto-assign-card">
        <div className="auto-assign-info">
          <div className="auto-assign-icon" style={{ background: 'linear-gradient(135deg, #009b62 0%, #007046 100%)' }}>
            <Trophy size={20} color="#FFFFFF" />
          </div>
          <div>
            <h4>Tournament Bracket & Fixtures Generator (ടൂർണമെന്റ് ബ്രാക്കറ്റ് ജനറേറ്റർ)</h4>
            <p>
              Select your tournament scale (<strong>16, 8, 4, or 2 Teams</strong>) and choose between <strong>Automated System Draw</strong> or <strong>Manual Matchup Assignment</strong>.
            </p>
          </div>
        </div>

        <div className="auto-assign-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowGenModal(true)}
            style={{ minWidth: '240px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Zap size={15} />
            <span>⚡ Setup Tournament Bracket</span>
          </button>
        </div>
      </div>

      {/* ===== INTERACTIVE BRACKET GENERATOR MODAL ===== */}
      {showGenModal && (
        <div className="admin-modal-overlay animate-fade-in" onClick={() => setShowGenModal(false)}>
          <div className="bracket-generator-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-icon" style={{ background: 'linear-gradient(135deg, #009b62 0%, #007046 100%)' }}>
                <Trophy size={20} color="#FFFFFF" />
              </div>
              <div className="modal-header-text">
                <h3>Tournament Bracket & Fixture Generator</h3>
                <p>സമ്പൂർണ്ണ ടൂർണമെന്റ് ബ്രാക്കറ്റും മാച്ച് ഫിക്സ്ചറുകളും സജ്ജീകരിക്കുക</p>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setShowGenModal(false)} title="Close">
                <X size={16} />
              </button>
            </div>

            <div className="generator-modal-body">
              {/* Step 1: Tournament Scale / Total Teams */}
              <div className="gen-step-block">
                <label className="gen-step-label">
                  <span className="step-num">1</span>
                  <span>Total Participating Teams (ആകെ എത്ര ടീമുകളാണ് കളിക്കുന്നത്?)</span>
                </label>
                <div className="bracket-scale-grid">
                  {[
                    {
                      size: 16,
                      label: '16 Teams',
                      malayalam: 'റൗണ്ട് ഓഫ് 16',
                      matches: '8 Matches in Round 1',
                      totalMatches: '15 Matches Total',
                      desc: 'Round of 16 (8) → Quarters (4) → Semis (2) → Final (1)',
                    },
                    {
                      size: 8,
                      label: '8 Teams',
                      malayalam: 'ക്വാർട്ടർ ഫൈനൽ',
                      matches: '4 Matches in Round 1',
                      totalMatches: '7 Matches Total',
                      desc: 'Quarter-Finals (4) → Semis (2) → Final (1)',
                    },
                    {
                      size: 4,
                      label: '4 Teams',
                      malayalam: 'സെമി ഫൈനൽ',
                      matches: '2 Matches in Round 1',
                      totalMatches: '3 Matches Total',
                      desc: 'Semi-Finals (2) → Final (1)',
                    },
                    {
                      size: 2,
                      label: '2 Teams',
                      malayalam: 'ഗ്രാൻഡ് ഫൈനൽ',
                      matches: '1 Match',
                      totalMatches: '1 Match Total',
                      desc: 'Championship Final Match',
                    },
                  ].map((opt) => (
                    <div
                      key={opt.size}
                      className={`scale-option-card ${genConfig.bracketSize === opt.size ? 'scale-option-card--active' : ''}`}
                      onClick={() => setGenConfig(p => ({ ...p, bracketSize: opt.size }))}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="scale-card-top">
                        <span className="scale-size-badge">{opt.label}</span>
                        <span className="scale-match-badge">{opt.matches}</span>
                      </div>
                      <div className="scale-card-title">{opt.malayalam}</div>
                      <p className="scale-card-desc">{opt.desc}</p>
                      <div className="scale-card-total">{opt.totalMatches}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 2: Matchup Assignment Mode */}
              <div className="gen-step-block">
                <label className="gen-step-label">
                  <span className="step-num">2</span>
                  <span>Team Matchup Assignment (ടീമുകളെ എങ്ങനെ അസൈൻ ചെയ്യണം?)</span>
                </label>
                <div className="assignment-mode-grid">
                  <div
                    className={`mode-option-card ${genConfig.assignmentMode === 'auto' ? 'mode-option-card--active' : ''}`}
                    onClick={() => setGenConfig(p => ({ ...p, assignmentMode: 'auto' }))}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="mode-card-header">
                      <div className="mode-radio-circle">
                        {genConfig.assignmentMode === 'auto' && <span className="mode-radio-inner" />}
                      </div>
                      <strong>⚡ Auto-Assign Registered Teams</strong>
                    </div>
                    <p className="mode-card-desc">
                      സിസ്റ്റം രജിസ്റ്റർ ചെയ്ത ക്ലബ്ബുകളെ ({teams.length} ക്ലബ്ബുകൾ ലഭ്യമാണ്) ആദ്യ റൗണ്ട് മത്സരങ്ങളിലേക്ക് ഓട്ടോമാറ്റിക്കായി ക്രമീകരിക്കും.
                    </p>
                    {genConfig.assignmentMode === 'auto' && (
                      <label className="mode-shuffle-toggle" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={genConfig.shuffle}
                          onChange={e => setGenConfig(p => ({ ...p, shuffle: e.target.checked }))}
                        />
                        <span>🎲 Shuffle / Random Draw (റാൻഡം ഡ്രോ ക്രമീകരിക്കുക)</span>
                      </label>
                    )}
                  </div>

                  <div
                    className={`mode-option-card ${genConfig.assignmentMode === 'manual' ? 'mode-option-card--active' : ''}`}
                    onClick={() => setGenConfig(p => ({ ...p, assignmentMode: 'manual' }))}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="mode-card-header">
                      <div className="mode-radio-circle">
                        {genConfig.assignmentMode === 'manual' && <span className="mode-radio-inner" />}
                      </div>
                      <strong>✍️ Manual Team Selection (ബ്ലാങ്ക് സ്ലോട്ടുകൾ)</strong>
                    </div>
                    <p className="mode-card-desc">
                      മുഴുവൻ മാച്ചുകളും ശൂന്യമായ (TBD) സ്ലോട്ടുകളോടെ നിർമ്മിക്കും. ഓരോ മത്സരത്തിലും ഏത് ടീം കളിക്കണമെന്ന് ഡ്രോപ്ഡൗണിലൂടെ നിങ്ങൾക്ക് മാനുവലായി തെരഞ്ഞെടുക്കാം.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3: Schedule Defaults */}
              <div className="gen-step-block">
                <label className="gen-step-label">
                  <span className="step-num">3</span>
                  <span>Match Schedule & Venue Defaults (തീയതിയും സ്റ്റേഡിയവും)</span>
                </label>
                <div className="form-grid-3">
                  <div className="form-group">
                    <label className="form-sublabel">Tournament Start Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={genConfig.startDate}
                      onChange={e => setGenConfig(p => ({ ...p, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-sublabel">Kickoff Time</label>
                    <input
                      type="time"
                      className="form-input"
                      value={genConfig.time}
                      onChange={e => setGenConfig(p => ({ ...p, time: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-sublabel">Stadium Venue</label>
                    <input
                      className="form-input"
                      value={genConfig.venue}
                      onChange={e => setGenConfig(p => ({ ...p, venue: e.target.value }))}
                      list="modal-venues"
                    />
                    <datalist id="modal-venues">
                      {KERALA_VENUES.map(v => <option key={v} value={v} />)}
                    </datalist>
                  </div>
                </div>

                <div className="replace-toggle-box">
                  <label className="replace-checkbox-label">
                    <input
                      type="checkbox"
                      checked={genConfig.replaceExisting}
                      onChange={e => setGenConfig(p => ({ ...p, replaceExisting: e.target.checked }))}
                    />
                    <span>Replace existing fixtures (പഴയ ഫിക്സ്ചറുകൾ ഒഴിവാക്കി പുതിയ ബ്രാക്കറ്റ് സജ്ജമാക്കുക)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="modal-actions-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setShowGenModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary football-cta-btn"
                style={{ minWidth: '280px' }}
                onClick={() => {
                  autoGenerateFixtures({
                    bracketSize: Number(genConfig.bracketSize),
                    assignmentMode: genConfig.assignmentMode,
                    shuffle: genConfig.shuffle,
                    replaceExisting: genConfig.replaceExisting,
                    startDate: genConfig.startDate,
                    defaultVenue: genConfig.venue,
                    defaultTime: genConfig.time,
                  });
                  setShowGenModal(false);
                }}
              >
                <Trophy size={16} />
                <span>Generate {genConfig.bracketSize} Teams Tournament Tree</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== FIXTURE / MATCHUP EDITOR CARD ===== */}
      <div className={`admin-editor-panel ${editId ? 'editor-panel--editing' : ''}`}>
        <div className="editor-panel-header">
          <div className="panel-title-group">
            <div className="header-crest-icon" style={{ background: 'linear-gradient(135deg, #00E676 0%, #008753 100%)' }}>
              <Calendar size={18} color="#ffffff" />
            </div>
            <div>
              <span className="matchday-dossier-tag">⚡ Official Matchday Scheduler</span>
              <h3>{editId ? 'Edit Matchup Details' : 'Manual Matchup & Bracket Scheduler'}</h3>
            </div>
          </div>

          {editId && (
            <button type="button" className="btn btn-sm btn-ghost" onClick={cancelEdit}>
              <X size={14} /> Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="admin-editor-form">
          {/* Round and Status Row */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">
                Knockout Round <span className="req-star">*</span>
              </label>
              <select className="form-input" {...f('round')}>
                {KNOCKOUT_ROUNDS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>

              {(() => {
                const target = getProgressionTarget(form, fixtures);
                if (!target) return null;
                return (
                  <div className="progression-hint-badge">
                    <Zap size={13} style={{ color: '#009b62' }} />
                    <span>Winner automatically advances to: <strong>{target.description}</strong></span>
                  </div>
                );
              })()}
            </div>

            <div className="form-group">
              <label className="form-label">Match Status</label>
              <div className="status-pill-selector">
                {[
                  { key: 'upcoming', label: 'Upcoming', color: '#1D4ED8' },
                  { key: 'live', label: 'Live Now', color: '#DC2626' },
                  { key: 'completed', label: 'Completed (FT)', color: '#156637' },
                  { key: 'postponed', label: 'Postponed', color: '#D97706' },
                ].map(s => (
                  <button
                    key={s.key}
                    type="button"
                    className={`status-select-btn ${form.status === s.key ? 'status-select-btn--active' : ''}`}
                    style={{ '--status-color': s.color }}
                    onClick={() => setForm(p => ({ ...p, status: s.key }))}
                  >
                    {s.key === 'live' && <span className="live-pulse-dot" />}
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Matchup Arena (Pick Home Team vs Away Team) */}
          <div className="matchup-arena-box">
            <div className="arena-team-col">
              <label className="form-label">
                Home Club <span className="req-star">*</span>
              </label>
              <div className="team-select-wrapper">
                <span className="team-color-indicator" style={{ background: getTeamColor(form.homeTeam) }} />
                <select className={`form-input ${errors.homeTeam ? 'input-error' : ''}`} {...f('homeTeam')}>
                  <option value="">Select Home Team…</option>
                  <option value="TBD">⏳ TBD (To Be Decided)</option>
                  {teamNames.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              {errors.homeTeam && <span className="form-error-msg">{errors.homeTeam}</span>}
            </div>

            <button
              type="button"
              className="arena-swap-btn"
              title="Swap Home / Away Teams"
              onClick={handleSwapTeams}
            >
              <ArrowLeftRight size={16} />
              <span className="vs-tag">VS</span>
            </button>

            <div className="arena-team-col">
              <label className="form-label">
                Away Club <span className="req-star">*</span>
              </label>
              <div className="team-select-wrapper">
                <span className="team-color-indicator" style={{ background: getTeamColor(form.awayTeam) }} />
                <select className={`form-input ${errors.awayTeam ? 'input-error' : ''}`} {...f('awayTeam')}>
                  <option value="">Select Away Team…</option>
                  <option value="TBD">⏳ TBD (To Be Decided)</option>
                  {teamNames.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              {errors.awayTeam && <span className="form-error-msg">{errors.awayTeam}</span>}
            </div>
          </div>

          {/* Scores Entry (when Completed or Live) */}
          {(form.status === 'completed' || form.status === 'live') && (
            <div className="scores-inline-box animate-scale">
              <div className="scores-inline-header">
                <Trophy size={16} className="text-gold" />
                <span>{form.status === 'completed' ? 'Final Score (Regular Time)' : 'Live Score'}</span>
              </div>
              <div className="scores-inputs-row">
                <div className="score-input-wrap">
                  <span className="score-team-label">{form.homeTeam || 'Home'}</span>
                  <input
                    type="number"
                    min="0"
                    className="score-number-input"
                    placeholder="0"
                    {...f('homeScore')}
                  />
                </div>

                <span className="score-dash">—</span>

                <div className="score-input-wrap">
                  <span className="score-team-label">{form.awayTeam || 'Away'}</span>
                  <input
                    type="number"
                    min="0"
                    className="score-number-input"
                    placeholder="0"
                    {...f('awayScore')}
                  />
                </div>
              </div>

              {/* Penalty Shootout Entry if Scores are equal in Completed mode */}
              {form.status === 'completed' && form.homeScore !== '' && form.awayScore !== '' && form.homeScore === form.awayScore && (
                <div className="penalty-inline-box animate-scale">
                  <div className="penalty-title">
                    ⚡ Knockout Tie: Penalty Shootout Scores
                  </div>
                  <div className="penalty-inputs-row">
                    <input
                      type="number"
                      min="0"
                      className="penalty-number-input"
                      placeholder="Pens"
                      {...f('homePenalty')}
                    />
                    <span className="score-dash">Pens</span>
                    <input
                      type="number"
                      min="0"
                      className="penalty-number-input"
                      placeholder="Pens"
                      {...f('awayPenalty')}
                    />
                  </div>
                  {errors.penalty && <span className="form-error-msg">{errors.penalty}</span>}
                </div>
              )}
            </div>
          )}

          {/* Postponement Reason */}
          {form.status === 'postponed' && (
            <div className="postponed-inline-box animate-scale">
              <div className="postponed-title">
                <AlertTriangle size={15} />
                <span>Postponement Reason</span>
              </div>
              <input
                className="form-input"
                placeholder="e.g. 🌧️ Heavy Rain / Waterlogged ground"
                {...f('postponedReason')}
              />
              <div className="postpone-quick-chips">
                {QUICK_POSTPONE_REASONS.map(r => (
                  <button
                    key={r}
                    type="button"
                    className="chip-btn"
                    onClick={() => setForm(p => ({ ...p, postponedReason: r }))}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date & Time Grid */}
          <div className="form-grid-2">
            <div className="form-group">
              <div className="label-with-quick-dates">
                <label className="form-label">
                  Match Date <span className="req-star">*</span>
                </label>
                <div className="quick-date-chips">
                  <button type="button" className="quick-date-btn" onClick={() => setQuickDate(0)}>Today</button>
                  <button type="button" className="quick-date-btn" onClick={() => setQuickDate(1)}>Tomorrow</button>
                  <button type="button" className="quick-date-btn" onClick={() => setQuickDate(7)}>+7 Days</button>
                </div>
              </div>
              <div className="input-with-icon">
                <Calendar size={15} className="input-icon" />
                <input type="date" className={`form-input ${errors.date ? 'input-error' : ''}`} {...f('date')} />
              </div>
              {errors.date && <span className="form-error-msg">{errors.date}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Kickoff Time</label>
              <div className="input-with-icon">
                <Clock size={15} className="input-icon" />
                <input type="time" className="form-input" {...f('time')} />
              </div>
            </div>
          </div>

          {/* Venue & Stadium */}
          <div className="form-group">
            <label className="form-label">
              Stadium / Venue <span className="req-star">*</span>
            </label>
            <div className="input-with-icon">
              <MapPin size={15} className="input-icon" />
              <input
                className={`form-input ${errors.venue ? 'input-error' : ''}`}
                placeholder="e.g. EMS Stadium, Kozhikode"
                list="fixture-venues"
                {...f('venue')}
              />
            </div>
            <datalist id="fixture-venues">
              {KERALA_VENUES.map(v => <option key={v} value={v} />)}
            </datalist>
            <div className="venue-quick-chips">
              {KERALA_VENUES.slice(0, 3).map(v => (
                <button
                  key={v}
                  type="button"
                  className="chip-btn"
                  onClick={() => setForm(p => ({ ...p, venue: v }))}
                >
                  📍 {v.split(',')[0]}
                </button>
              ))}
            </div>
            {errors.venue && <span className="form-error-msg">{errors.venue}</span>}
          </div>

          {/* Submit Actions */}
          <div className="editor-form-actions">
            {editId && (
              <button type="button" className="btn btn-ghost" onClick={cancelEdit}>
                <X size={14} /> Cancel
              </button>
            )}
            <button type="submit" className="btn btn-primary football-cta-btn" style={{ minWidth: '220px' }}>
              {editId ? (
                <>
                  <Check size={16} /> Save Fixture Changes
                </>
              ) : (
                <>
                  <Plus size={16} /> Save Scheduled Matchup
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ===== FIXTURES LIST SECTION ===== */}
      <div className="admin-list-section">
        <div className="section-header-row">
          <div className="section-title-wrap">
            <CalendarDays size={18} className="text-primary" />
            <h3>Scheduled Tournament Fixtures</h3>
            <span className="badge-count-pill">{fixtures.length} Matches</span>
          </div>

          {/* Round Filter Tabs */}
          <div className="round-filter-pills">
            <button
              type="button"
              className={`filter-pill ${filterRound === 'all' ? 'filter-pill--active' : ''}`}
              onClick={() => setFilterRound('all')}
            >
              All Matches ({fixtures.length})
            </button>
            <button
              type="button"
              className={`filter-pill ${filterRound === '16' ? 'filter-pill--active' : ''}`}
              onClick={() => setFilterRound('16')}
            >
              Round of 16 ({fixtures.filter(f => (f.round || '').toLowerCase().includes('16')).length})
            </button>
            <button
              type="button"
              className={`filter-pill ${filterRound === 'Quarter' ? 'filter-pill--active' : ''}`}
              onClick={() => setFilterRound('Quarter')}
            >
              Quarters ({fixtures.filter(f => (f.round || '').includes('Quarter')).length})
            </button>
            <button
              type="button"
              className={`filter-pill ${filterRound === 'Semi' ? 'filter-pill--active' : ''}`}
              onClick={() => setFilterRound('Semi')}
            >
              Semis ({fixtures.filter(f => (f.round || '').includes('Semi')).length})
            </button>
            <button
              type="button"
              className={`filter-pill ${filterRound === 'Final' ? 'filter-pill--active' : ''}`}
              onClick={() => setFilterRound('Final')}
            >
              Finals ({fixtures.filter(f => (f.round || '').includes('Final')).length})
            </button>
          </div>
        </div>

        {displayedFixtures.length === 0 ? (
          <div className="admin-empty-state">
            <div className="empty-icon-wrap">
              <Calendar size={36} />
            </div>
            <h4>No Fixtures Scheduled Yet</h4>
            <p>Use the manual matchup scheduler above or click "⚡ Auto-Assign Teams" to generate fixtures automatically.</p>
          </div>
        ) : (
          <div className="fixtures-cards-grid">
            {displayedFixtures.map(fix => {
              const isCompleted = fix.status === 'completed';
              const isLive = fix.status === 'live';
              const isPostponed = fix.status === 'postponed';

              return (
                <div
                  key={fix.id}
                  className={`fixture-card-item fixture-status--${fix.status}`}
                >
                  <div className="fixture-card-top-row">
                    <span className="fixture-round-tag">
                      <Trophy size={11} /> {fix.round || 'Knockout Match'}
                    </span>

                    <span className={`fixture-status-badge badge-${fix.status}`}>
                      {isLive && <span className="live-pulse-dot" />}
                      {fix.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Matchup Display */}
                  <div className="fixture-matchup-row">
                    <div className="team-side home-side">
                      <span className="team-badge-circle" style={{ background: getTeamColor(fix.homeTeam) }}>
                        {getTeamBadgeLabel(fix.homeTeam)}
                      </span>
                      <span className="team-display-name">{fix.homeTeam}</span>
                    </div>

                    <div className="score-center-col">
                      {isCompleted ? (
                        <div className="final-score-pill">
                          <span>{fix.homeScore}</span>
                          <span className="colon">:</span>
                          <span>{fix.awayScore}</span>
                          {fix.homePenalty !== undefined && fix.awayPenalty !== undefined && (
                            <span className="pens-score-sub">({fix.homePenalty} - {fix.awayPenalty} P)</span>
                          )}
                        </div>
                      ) : isLive ? (
                        <div className="live-score-pill">
                          <span>{fix.homeScore || 0}</span>
                          <span className="colon">:</span>
                          <span>{fix.awayScore || 0}</span>
                        </div>
                      ) : (
                        <span className="vs-pill">VS</span>
                      )}
                    </div>

                    <div className="team-side away-side">
                      <span className="team-display-name">{fix.awayTeam}</span>
                      <span className="team-badge-circle" style={{ background: getTeamColor(fix.awayTeam) }}>
                        {getTeamBadgeLabel(fix.awayTeam)}
                      </span>
                    </div>
                  </div>

                  {/* Knockout Winner Progression Badge */}
                  {(() => {
                    const winner = getMatchWinner(fix);
                    const target = getProgressionTarget(fix, fixtures);

                    if (winner && target) {
                      return (
                        <div className="fixture-progression-pill fixture-progression--advanced">
                          <Trophy size={12} style={{ color: '#e99e11' }} />
                          <span>Winner: <strong>{winner}</strong> (Advanced to {target.targetRoundLabel})</span>
                        </div>
                      );
                    }

                    if (target && !isCompleted) {
                      return (
                        <div className="fixture-progression-pill">
                          <Zap size={12} style={{ color: '#009b62' }} />
                          <span>Winner advances to: <strong>{target.description}</strong></span>
                        </div>
                      );
                    }

                    return null;
                  })()}

                  {/* Postponed Warning Note */}
                  {isPostponed && (
                    <div className="postponed-card-notice">
                      ⚠️ {fix.postponedReason || 'Match postponed by committee'}
                    </div>
                  )}

                  {/* Match Meta Footer */}
                  <div className="fixture-card-footer">
                    <div className="fixture-meta-chips">
                      <span className="meta-chip">
                        <Calendar size={12} /> {fix.date}
                      </span>
                      <span className="meta-chip">
                        <Clock size={12} /> {fix.time}
                      </span>
                      <span className="meta-chip">
                        <MapPin size={12} /> {fix.venue}
                      </span>
                    </div>

                    <div className="fixture-actions-group">
                      {(fix.homeTeam === 'TBD' || fix.awayTeam === 'TBD') && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline"
                          onClick={() => startEdit(fix)}
                          style={{ borderColor: 'var(--primary)', color: 'var(--primary)', fontWeight: 800, fontSize: '11px', padding: '4px 10px' }}
                          title="Assign participating clubs to this matchup"
                        >
                          ✍️ Assign Clubs
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        onClick={() => startEdit(fix)}
                        title="Edit match details"
                      >
                        <Pencil size={13} /> Edit
                      </button>
                      <button
                        type="button"
                        className="btn-icon-sm btn-icon-danger"
                        onClick={() => setConfirmDelete(fix.id)}
                        title="Delete match"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
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
            <h3>Delete Fixture?</h3>
            <p>
              This will permanently remove this scheduled knockout match from the tournament calendar.
            </p>
            <div className="dialog-actions">
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  deleteFixture(confirmDelete);
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
