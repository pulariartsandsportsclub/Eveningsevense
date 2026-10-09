import { useState, useMemo } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { 
  Trophy, Calendar, Clock, MapPin, Check, X, AlertTriangle, 
  HelpCircle, Plus, Trash2, Search, SlidersHorizontal, ArrowUpDown
} from 'lucide-react';

const COMMON_POSTPONE_REASONS = [
  '🌧️ Heavy Rain / Pitch Waterlogged',
  '🏟️ Ground Unavailability / Maintenance',
  '⏰ Rescheduled Kickoff Time',
  '⚡ Adverse Weather Conditions',
  '⚠️ Technical Ground Clearance Delay'
];

const KERALA_VENUES = [
  'EMS Stadium, Kozhikode',
  'Jawaharlal Nehru Stadium, Kochi',
  'Malappuram Sevens Ground',
  'Chandrasekharan Nair Stadium, Trivandrum',
];

export default function ResultsAdmin() {
  const { fixtures, updateFixture } = useTournament();
  const [editId, setEditId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'upcoming', 'live', 'completed', 'postponed'
  const [searchTerm, setSearchTerm] = useState('');
  
  // Detailed edit form state
  const [form, setForm] = useState({
    status: 'upcoming',
    homeScore: '',
    awayScore: '',
    homePenalty: '',
    awayPenalty: '',
    date: '',
    time: '',
    venue: '',
    postponedReason: '',
    scorers: [],
    newScorerName: '',
    newScorerTeam: '',
    newScorerGoals: 1,
  });

  // Only consider fixtures where teams are known (or at least one team defined)
  const playableFixtures = useMemo(() => {
    return fixtures.filter(f => f.homeTeam !== 'TBD' || f.awayTeam !== 'TBD');
  }, [fixtures]);

  // Sort with UPCOMING MATCHES FIRST, then LIVE, then POSTPONED, then COMPLETED
  const sortedFixtures = useMemo(() => {
    const statusWeight = {
      upcoming: 1,
      live: 2,
      postponed: 3,
      completed: 4,
    };

    return [...playableFixtures].sort((a, b) => {
      const weightA = statusWeight[a.status] || 5;
      const weightB = statusWeight[b.status] || 5;
      if (weightA !== weightB) {
        return weightA - weightB;
      }
      // Within same status, sort chronologically
      const dateA = new Date(`${a.date || '2026-10-01'}T${a.time || '00:00'}`);
      const dateB = new Date(`${b.date || '2026-10-01'}T${b.time || '00:00'}`);
      return dateA - dateB;
    });
  }, [playableFixtures]);

  // Filtered by selected tab and search term
  const displayedFixtures = useMemo(() => {
    return sortedFixtures.filter(f => {
      if (filterStatus !== 'all' && f.status !== filterStatus) {
        return false;
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchTeams = (f.homeTeam || '').toLowerCase().includes(query) || (f.awayTeam || '').toLowerCase().includes(query);
        const matchRound = (f.round || '').toLowerCase().includes(query);
        return matchTeams || matchRound;
      }
      return true;
    });
  }, [sortedFixtures, filterStatus, searchTerm]);

  const activeEditFixture = fixtures.find(f => f.id === editId);

  const startEdit = (fix) => {
    setEditId(fix.id);
    setForm({
      status: fix.status || 'upcoming',
      homeScore: fix.homeScore !== undefined ? fix.homeScore : (fix.status === 'completed' ? 0 : ''),
      awayScore: fix.awayScore !== undefined ? fix.awayScore : (fix.status === 'completed' ? 0 : ''),
      homePenalty: fix.homePenalty !== undefined ? fix.homePenalty : '',
      awayPenalty: fix.awayPenalty !== undefined ? fix.awayPenalty : '',
      date: fix.date || '',
      time: fix.time || '16:30',
      venue: fix.venue || 'EMS Stadium, Kozhikode',
      postponedReason: fix.postponedReason || '',
      scorers: fix.scorers ? [...fix.scorers] : [],
      newScorerName: '',
      newScorerTeam: fix.homeTeam !== 'TBD' ? fix.homeTeam : '',
      newScorerGoals: 1,
    });
    // Smooth scroll to top of editing section
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditId(null);
  };

  const addMatchScorer = () => {
    if (!form.newScorerName.trim()) {
      alert('Please enter player name');
      return;
    }
    const newScorer = {
      name: form.newScorerName.trim(),
      team: form.newScorerTeam || activeEditFixture?.homeTeam,
      goals: parseInt(form.newScorerGoals, 10) || 1,
    };
    setForm(prev => ({
      ...prev,
      scorers: [...prev.scorers, newScorer],
      newScorerName: '',
      newScorerGoals: 1,
    }));
  };

  const removeMatchScorer = (idx) => {
    setForm(prev => ({
      ...prev,
      scorers: prev.scorers.filter((_, i) => i !== idx),
    }));
  };

  const handleSave = () => {
    if (!editId) return;

    const hs = form.homeScore !== '' ? parseInt(form.homeScore, 10) : undefined;
    const as = form.awayScore !== '' ? parseInt(form.awayScore, 10) : undefined;

    // Validation for completed matches
    if (form.status === 'completed') {
      if (hs === undefined || isNaN(hs) || as === undefined || isNaN(as)) {
        alert('Please enter both regular time scores (e.g. 1 - 0) to mark match as Completed.');
        return;
      }

      // If tied in knockout, require penalties
      if (hs === as) {
        const hp = form.homePenalty !== '' ? parseInt(form.homePenalty, 10) : null;
        const ap = form.awayPenalty !== '' ? parseInt(form.awayPenalty, 10) : null;
        if (hp === null || ap === null || isNaN(hp) || isNaN(ap)) {
          alert('Tie detected! In knockout tournament, a tied match requires penalty shootout scores to advance a winner.');
          return;
        }
        if (hp === ap) {
          alert('Penalty shootout cannot end in a tie. One team must win the shootout to advance.');
          return;
        }
      }
    }

    // Validation for postponed matches
    if (form.status === 'postponed' && !form.postponedReason.trim()) {
      // Set default note if left blank
      form.postponedReason = 'Match postponed by tournament committee';
    }

    const payload = {
      status: form.status,
      date: form.date,
      time: form.time,
      venue: form.venue,
      homeScore: form.status === 'completed' || form.status === 'live' ? hs : undefined,
      awayScore: form.status === 'completed' || form.status === 'live' ? as : undefined,
      homePenalty: form.status === 'completed' && form.homePenalty !== '' ? parseInt(form.homePenalty, 10) : undefined,
      awayPenalty: form.status === 'completed' && form.awayPenalty !== '' ? parseInt(form.awayPenalty, 10) : undefined,
      postponedReason: form.status === 'postponed' ? form.postponedReason.trim() : undefined,
      scorers: form.scorers,
      newScorers: form.scorers, // Sent to sync into leaderboard
    };

    updateFixture(editId, payload);
    setEditId(null);
  };

  const quickPostpone = (fix) => {
    const reason = prompt(`Enter reason for postponing ${fix.homeTeam} vs ${fix.awayTeam}:`, '🌧️ Heavy Rain / Pitch Unfit');
    if (reason !== null) {
      updateFixture(fix.id, {
        status: 'postponed',
        postponedReason: reason.trim() || 'Match postponed',
      });
    }
  };

  // Helper for steppers
  const adjustScore = (field, delta) => {
    setForm(prev => {
      const current = parseInt(prev[field], 10) || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [field]: next };
    });
  };

  const isTie = form.homeScore !== '' && form.awayScore !== '' && parseInt(form.homeScore, 10) === parseInt(form.awayScore, 10);
  const hpNum = parseInt(form.homePenalty, 10);
  const apNum = parseInt(form.awayPenalty, 10);
  const hasPenaltiesDecided = isTie && !isNaN(hpNum) && !isNaN(apNum) && hpNum !== apNum;

  return (
    <div>
      {/* Top Section Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h3 className="admin-section-title" style={{ margin: 0 }}>
            <Trophy size={16} /> Knockout Match Results & Scoring
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0 0' }}>
            Showing <strong>upcoming matches first</strong>. Detailed edit options for ties, penalty shootouts, and postponed matches.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <div className="quick-filter-pills" style={{ margin: 0 }}>
          <button 
            type="button" 
            className={`quick-filter-pill ${filterStatus === 'all' ? 'quick-filter-pill--active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All Matches (Upcoming First)
          </button>
          <button 
            type="button" 
            className={`quick-filter-pill ${filterStatus === 'upcoming' ? 'quick-filter-pill--active' : ''}`}
            onClick={() => setFilterStatus('upcoming')}
          >
            Upcoming ({sortedFixtures.filter(f => f.status === 'upcoming').length})
          </button>
          <button 
            type="button" 
            className={`quick-filter-pill ${filterStatus === 'postponed' ? 'quick-filter-pill--active' : ''}`}
            onClick={() => setFilterStatus('postponed')}
          >
            Postponed ({sortedFixtures.filter(f => f.status === 'postponed').length})
          </button>
          <button 
            type="button" 
            className={`quick-filter-pill ${filterStatus === 'completed' ? 'quick-filter-pill--active' : ''}`}
            onClick={() => setFilterStatus('completed')}
          >
            Completed ({sortedFixtures.filter(f => f.status === 'completed').length})
          </button>
        </div>

        <div style={{ position: 'relative', width: 220 }}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Search teams or round…" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '32px', fontSize: '13px', paddingRight: '8px' }}
          />
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>
      </div>

      {/* DETAILED EDIT SECTION MODAL/CARD */}
      {editId && activeEditFixture && (
        <div className="match-editor-card animate-scale">
          <div className="match-editor-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span className="badge badge-primary">{activeEditFixture.round}</span>
                <span className={`badge badge-${form.status}`}>{form.status}</span>
              </div>
              <div className="match-editor-teams">
                {activeEditFixture.homeTeam} <span style={{ color: 'var(--gold)' }}>vs</span> {activeEditFixture.awayTeam}
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={cancelEdit}>
              <X size={16} /> Close
            </button>
          </div>

          {/* Status selector */}
          <div className="admin-form-grid" style={{ marginBottom: 14 }}>
            <div className="form-group">
              <label className="form-label">Match Status *</label>
              <select 
                className="form-input" 
                value={form.status} 
                onChange={e => setForm({ ...form, status: e.target.value })}
              >
                <option value="upcoming">Scheduled / Upcoming</option>
                <option value="live">Live In Progress</option>
                <option value="completed">Completed (Full Time FT)</option>
                <option value="postponed">Postponed (Rescheduled / Delayed)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Stadium / Venue</label>
              <input 
                className="form-input" 
                value={form.venue} 
                list="venue-suggestions"
                onChange={e => setForm({ ...form, venue: e.target.value })} 
              />
              <datalist id="venue-suggestions">
                {KERALA_VENUES.map(v => <option key={v} value={v} />)}
              </datalist>
            </div>
          </div>

          <div className="admin-form-grid" style={{ marginBottom: 14 }}>
            <div className="form-group">
              <label className="form-label">Match Date</label>
              <input 
                type="date" 
                className="form-input" 
                value={form.date} 
                onChange={e => setForm({ ...form, date: e.target.value })} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Kickoff Time</label>
              <input 
                type="time" 
                className="form-input" 
                value={form.time} 
                onChange={e => setForm({ ...form, time: e.target.value })} 
              />
            </div>
          </div>

          {/* POSTPONED SECTION */}
          {form.status === 'postponed' && (
            <div className="postponed-section animate-scale">
              <div className="postponed-header">
                <AlertTriangle size={18} /> Postponed Match Details
              </div>
              <p style={{ fontSize: '13px', color: '#B45309', margin: '0 0 8px 0' }}>
                When postponed, this match is kept on hold and the bracket progression is paused until rescheduled and played.
              </p>
              <div className="form-group">
                <label className="form-label" style={{ color: '#B45309' }}>Reason / Explanation for Postponement *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Heavy Rain / Waterlogged pitch" 
                  value={form.postponedReason}
                  onChange={e => setForm({ ...form, postponedReason: e.target.value })}
                />
              </div>
              <div className="suggestion-chips">
                {COMMON_POSTPONE_REASONS.map(reason => (
                  <button 
                    key={reason} 
                    type="button" 
                    className="suggestion-chip"
                    onClick={() => setForm({ ...form, postponedReason: reason })}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* REGULAR SCORES SECTION (for completed or live) */}
          {(form.status === 'completed' || form.status === 'live') && (
            <div>
              <label className="form-label" style={{ textAlign: 'center', display: 'block', margin: '14px 0 6px 0' }}>
                {form.status === 'completed' ? 'Final Score (Regular Time)' : 'Live Match Score'}
              </label>

              <div className="score-box-container">
                <div className="team-score-input-group">
                  <span style={{ fontWeight: 700, fontSize: '15px' }}>{activeEditFixture.homeTeam}</span>
                  <div className="score-stepper">
                    <button type="button" className="score-stepper-btn" onClick={() => adjustScore('homeScore', -1)}>-</button>
                    <input 
                      type="number" 
                      min="0" 
                      className="score-stepper-input" 
                      value={form.homeScore} 
                      onChange={e => setForm({ ...form, homeScore: e.target.value })}
                    />
                    <button type="button" className="score-stepper-btn" onClick={() => adjustScore('homeScore', 1)}>+</button>
                  </div>
                </div>

                <div style={{ textAlign: 'center', color: 'var(--gold)', fontWeight: 900, fontSize: '20px' }}>
                  VS
                </div>

                <div className="team-score-input-group">
                  <span style={{ fontWeight: 700, fontSize: '15px' }}>{activeEditFixture.awayTeam}</span>
                  <div className="score-stepper">
                    <button type="button" className="score-stepper-btn" onClick={() => adjustScore('awayScore', -1)}>-</button>
                    <input 
                      type="number" 
                      min="0" 
                      className="score-stepper-input" 
                      value={form.awayScore} 
                      onChange={e => setForm({ ...form, awayScore: e.target.value })}
                    />
                    <button type="button" className="score-stepper-btn" onClick={() => adjustScore('awayScore', 1)}>+</button>
                  </div>
                </div>
              </div>

              {/* TIE & PENALTY SHOOTOUT SECTION */}
              {isTie && (
                <div className="penalty-section animate-scale">
                  <div className="penalty-header">
                    <Trophy size={18} /> ⚡ Tie Detected: Penalty Shootout Score Required
                  </div>
                  <p style={{ fontSize: '13px', color: '#7E22CE', margin: '0 0 12px 0' }}>
                    Knockout tournament rules require a penalty shootout when regular time ends in a draw. Enter the shootout score below to advance the winner:
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>{activeEditFixture.homeTeam} (Pens)</span>
                      <input 
                        type="number" 
                        min="0" 
                        placeholder="Pen"
                        className="form-input" 
                        style={{ width: 80, textAlign: 'center', fontWeight: 800, fontSize: '18px', borderColor: '#7E22CE' }} 
                        value={form.homePenalty} 
                        onChange={e => setForm({ ...form, homePenalty: e.target.value })}
                      />
                    </div>

                    <span style={{ fontWeight: 800, color: '#7E22CE', fontSize: '16px' }}>—</span>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>{activeEditFixture.awayTeam} (Pens)</span>
                      <input 
                        type="number" 
                        min="0" 
                        placeholder="Pen"
                        className="form-input" 
                        style={{ width: 80, textAlign: 'center', fontWeight: 800, fontSize: '18px', borderColor: '#7E22CE' }} 
                        value={form.awayPenalty} 
                        onChange={e => setForm({ ...form, awayPenalty: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Shootout Outcome Preview */}
                  {hasPenaltiesDecided && (
                    <div style={{ 
                      textAlign: 'center', 
                      marginTop: 12, 
                      padding: '8px 12px', 
                      background: 'rgba(147, 51, 234, 0.1)', 
                      borderRadius: '6px', 
                      color: '#6B21A8',
                      fontWeight: 700,
                      fontSize: '13px'
                    }}>
                      🏆 {hpNum > apNum ? activeEditFixture.homeTeam : activeEditFixture.awayTeam} wins on penalties ({hpNum} - {apNum}) and advances to next round!
                    </div>
                  )}
                </div>
              )}

              {/* GOAL SCORERS SECTION */}
              <div style={{ marginTop: 18, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                <label className="form-label">⚽ Goal Scorers (Optional)</label>
                <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                  <input 
                    type="text" 
                    placeholder="Player Name (e.g. Vinicius Jr)" 
                    className="form-input" 
                    style={{ flex: 2, minWidth: 160 }}
                    value={form.newScorerName}
                    onChange={e => setForm({ ...form, newScorerName: e.target.value })}
                  />
                  <select 
                    className="form-input" 
                    style={{ flex: 1.5, minWidth: 130 }}
                    value={form.newScorerTeam}
                    onChange={e => setForm({ ...form, newScorerTeam: e.target.value })}
                  >
                    <option value={activeEditFixture.homeTeam}>{activeEditFixture.homeTeam}</option>
                    <option value={activeEditFixture.awayTeam}>{activeEditFixture.awayTeam}</option>
                  </select>
                  <input 
                    type="number" 
                    min="1" 
                    style={{ width: 60 }} 
                    className="form-input"
                    value={form.newScorerGoals}
                    onChange={e => setForm({ ...form, newScorerGoals: e.target.value })}
                    title="Number of goals"
                  />
                  <button type="button" className="btn btn-primary btn-sm" onClick={addMatchScorer}>
                    <Plus size={14} /> Add
                  </button>
                </div>

                {form.scorers.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                    {form.scorers.map((sc, i) => (
                      <span key={i} className="scorer-pill" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        ⚽ {sc.name} ({sc.team}) ×{sc.goals}
                        <button 
                          type="button" 
                          onClick={() => removeMatchScorer(i)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--danger)' }}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="admin-form-actions" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={cancelEdit}>
              <X size={14} /> Cancel
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={handleSave}>
              <Check size={14} /> Save Match Details & Update Bracket
            </button>
          </div>
        </div>
      )}

      {/* MATCHES LIST (UPCOMING FIRST) */}
      <div className="admin-list">
        {displayedFixtures.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
            <HelpCircle size={32} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
            <p>No matches found matching the criteria.</p>
          </div>
        ) : (
          displayedFixtures.map(fix => {
            const isCompleted = fix.status === 'completed';
            const isLive = fix.status === 'live';
            const isPostponed = fix.status === 'postponed';
            const hs = Number(fix.homeScore);
            const as = Number(fix.awayScore);
            const hp = Number(fix.homePenalty);
            const ap = Number(fix.awayPenalty);
            const hasPens = isCompleted && hs === as && fix.homePenalty !== undefined && fix.awayPenalty !== undefined && !isNaN(hp) && !isNaN(ap);

            let winnerTeam = null;
            if (isCompleted) {
              if (hs > as) winnerTeam = fix.homeTeam;
              else if (as > hs) winnerTeam = fix.awayTeam;
              else if (hasPens) winnerTeam = hp > ap ? fix.homeTeam : fix.awayTeam;
            }

            return (
              <div 
                key={fix.id} 
                className="admin-list-item" 
                style={{ 
                  borderLeft: isCompleted 
                    ? '4px solid var(--primary)' 
                    : isPostponed 
                      ? '4px solid #D97706' 
                      : isLive 
                        ? '4px solid var(--danger)' 
                        : '4px solid var(--gold)',
                  background: editId === fix.id ? 'var(--bg-card)' : '#FFFFFF'
                }}
              >
                <div className="admin-list-item-info" style={{ flex: 1 }}>
                  {/* Status and round badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className="badge badge-primary" style={{ fontSize: '10px', padding: '2px 8px' }}>
                      {fix.round}
                    </span>
                    <span className={`badge badge-${fix.status}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                      {fix.status.toUpperCase()}
                    </span>
                    {hasPens && (
                      <span className="badge badge-penalties" style={{ fontSize: '10px', padding: '2px 8px' }}>
                        Penalties
                      </span>
                    )}
                  </div>

                  {/* Match Teams and Scores */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span className="admin-list-item-name" style={{ fontSize: '16px' }}>
                      <span style={{ fontWeight: winnerTeam === fix.homeTeam ? 900 : 600, color: winnerTeam === fix.homeTeam ? 'var(--primary)' : 'inherit' }}>
                        {fix.homeTeam}
                      </span>
                      
                      {isCompleted ? (
                        <span style={{ color: 'var(--gold)', margin: '0 8px', fontWeight: 900 }}>
                          {fix.homeScore} - {fix.awayScore}
                          {hasPens && <span style={{ color: '#7E22CE', fontSize: '13px', marginLeft: 4 }}>({fix.homePenalty} - {fix.awayPenalty} Pens)</span>}
                        </span>
                      ) : (
                        <span style={{ margin: '0 8px', color: 'var(--text-muted)', fontWeight: 700 }}>vs</span>
                      )}

                      <span style={{ fontWeight: winnerTeam === fix.awayTeam ? 900 : 600, color: winnerTeam === fix.awayTeam ? 'var(--primary)' : 'inherit' }}>
                        {fix.awayTeam}
                      </span>
                    </span>

                    {winnerTeam && (
                      <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 700, background: 'rgba(21, 102, 55, 0.08)', padding: '2px 8px', borderRadius: '4px' }}>
                        🏆 Winner: {winnerTeam}
                      </span>
                    )}
                  </div>

                  {/* Postponed Warning Note */}
                  {isPostponed && (
                    <div style={{ fontSize: '12.5px', color: '#B45309', fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      ⚠️ Postponed: {fix.postponedReason || 'Awaiting reschedule'}
                    </div>
                  )}

                  {/* Schedule & Venue Meta */}
                  <span className="admin-list-item-meta" style={{ marginTop: 2 }}>
                    📅 {new Date(fix.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · ⏰ {fix.time} · 📍 {fix.venue}
                  </span>
                </div>

                {/* Actions */}
                <div className="admin-list-actions">
                  <button 
                    className="btn btn-ghost btn-sm" 
                    title="Detailed Match Edit" 
                    onClick={() => startEdit(fix)}
                    style={{ fontWeight: 600 }}
                  >
                    <SlidersHorizontal size={13} /> Detailed Edit
                  </button>

                  {!isPostponed && !isCompleted && (
                    <button 
                      className="btn btn-ghost btn-sm" 
                      title="Quick Postpone" 
                      onClick={() => quickPostpone(fix)}
                      style={{ color: '#B45309' }}
                    >
                      Postpone
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
