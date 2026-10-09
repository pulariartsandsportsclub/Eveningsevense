import { useState, useMemo } from 'react';
import { useTournament } from '../../context/TournamentContext';
import {
  Trophy, Calendar, Clock, MapPin, Check, X, AlertTriangle,
  HelpCircle, Search, SlidersHorizontal, Flame, Zap, Plus, RefreshCw
} from 'lucide-react';
import { getProgressionTarget, getMatchWinner, parseStageInfo, deduplicateFixturesList } from '../../utils/bracketProgression';
import '../KnockoutBracket.css';
import './AdminPanel.css';

const COMMON_POSTPONE_REASONS = [
  '🌧️ Heavy Rain / Pitch Waterlogged',
  '🏟️ Ground Maintenance',
  '⚡ Adverse Weather Conditions',
  '⏰ Rescheduled Kickoff Time',
];

const KERALA_VENUES = [
  'EMS Stadium, Kozhikode',
  'Jawaharlal Nehru Stadium, Kochi',
  'Malappuram Sevens Ground',
  'Chandrasekharan Nair Stadium, Trivandrum',
];

function getPhaseIndex(roundName) {
  const r = (roundName || '').toLowerCase();
  if (r.includes('16') || r.includes('r16')) return 0;
  if (r.includes('quarter') || r.includes('qf')) return 1;
  if (r.includes('semi') || r.includes('sf')) return 2;
  if (r.includes('third')) return -1;
  if (r.includes('final')) return 3;
  return 1;
}

/**
 * Admin Bracket Match Card
 * Clickable match card embedded in the Knockout Tree
 */
function AdminBracketMatchCard({ match, isActive, onSelect, getTeamColor, getTeamBadgeLabel }) {
  const isPlaceholder = match.isPlaceholder;
  const isCompleted = match.status === 'completed';
  const isLive = match.status === 'live';
  const isPostponed = match.status === 'postponed';

  const hs = match.homeScore !== undefined && match.homeScore !== '' ? Number(match.homeScore) : null;
  const as = match.awayScore !== undefined && match.awayScore !== '' ? Number(match.awayScore) : null;
  const hp = match.homePenalty !== undefined && match.homePenalty !== '' ? Number(match.homePenalty) : null;
  const ap = match.awayPenalty !== undefined && match.awayPenalty !== '' ? Number(match.awayPenalty) : null;

  const isTie = isCompleted && hs !== null && as !== null && hs === as;
  const hasPenalties = isTie && hp !== null && ap !== null && !isNaN(hp) && !isNaN(ap);

  let isHomeWinner = false;
  let isAwayWinner = false;

  if (isCompleted && hs !== null && as !== null) {
    if (hs > as) isHomeWinner = true;
    else if (as > hs) isAwayWinner = true;
    else if (hasPenalties) {
      if (hp > ap) isHomeWinner = true;
      else if (ap > hp) isAwayWinner = true;
    }
  }

  const winnerName = isHomeWinner ? match.homeTeam : isAwayWinner ? match.awayTeam : null;

  return (
    <div
      className={`admin-bracket-card ${isActive ? 'admin-bracket-card--active' : ''} ${isLive ? 'admin-bracket-card--live' : ''} ${isPostponed ? 'admin-bracket-card--postponed' : ''} ${isPlaceholder ? 'admin-bracket-card--placeholder' : ''}`}
      onClick={() => {
        if (!isPlaceholder) onSelect(match);
      }}
      role={!isPlaceholder ? 'button' : undefined}
      tabIndex={!isPlaceholder ? 0 : undefined}
    >
      {/* Header */}
      <div className="admin-bracket-card-header">
        <span className="admin-bracket-round">{match.round}</span>
        {isLive && <span className="bracket-badge badge-live"><span className="live-pulse-dot" /> LIVE</span>}
        {isCompleted && (
          <span className="bracket-badge badge-completed">
            {hasPenalties ? 'FT (PEN)' : 'FT'}
          </span>
        )}
        {isPostponed && <span className="bracket-badge badge-postponed">POSTPONED</span>}
        {!isLive && !isCompleted && !isPostponed && (
          <span className="bracket-badge badge-upcoming">
            {isPlaceholder ? 'TBD' : 'UPCOMING'}
          </span>
        )}
      </div>

      {/* Teams Deck */}
      <div className="admin-bracket-teams-deck">
        {/* Home Team */}
        <div className={`bracket-team-row ${isHomeWinner ? 'team-row--winner' : ''}`}>
          <div className="team-meta-info">
            <span
              className="team-mini-circle"
              style={{ background: getTeamColor(match.homeTeam) }}
            >
              {match.homeTeam && match.homeTeam !== 'TBD' ? getTeamBadgeLabel(match.homeTeam) : '?'}
            </span>
            <span className={`bracket-team-title ${isHomeWinner ? 'winner-bold' : ''}`} title={match.homeTeam}>
              {match.homeTeam}
            </span>
          </div>
          <div className="bracket-score-cluster">
            {hasPenalties && <span className="bracket-pen-score">({match.homePenalty}p)</span>}
            <span className="bracket-score-val">
              {isCompleted || isLive ? (match.homeScore ?? 0) : '-'}
            </span>
          </div>
        </div>

        {/* Away Team */}
        <div className={`bracket-team-row ${isAwayWinner ? 'team-row--winner' : ''}`}>
          <div className="team-meta-info">
            <span
              className="team-mini-circle"
              style={{ background: getTeamColor(match.awayTeam) }}
            >
              {match.awayTeam && match.awayTeam !== 'TBD' ? getTeamBadgeLabel(match.awayTeam) : '?'}
            </span>
            <span className={`bracket-team-title ${isAwayWinner ? 'winner-bold' : ''}`} title={match.awayTeam}>
              {match.awayTeam}
            </span>
          </div>
          <div className="bracket-score-cluster">
            {hasPenalties && <span className="bracket-pen-score">({match.awayPenalty}p)</span>}
            <span className="bracket-score-val">
              {isCompleted || isLive ? (match.awayScore ?? 0) : '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Winner Strip if completed */}
      {winnerName && (
        <div className="admin-bracket-winner-strip">
          🏆 <strong>{winnerName}</strong> Advanced
        </div>
      )}

      {/* Action CTA */}
      <div className="admin-bracket-card-cta">
        {isPlaceholder ? (
          <span className="placeholder-note-txt">Awaiting earlier round results</span>
        ) : (
          <button
            type="button"
            className={`bracket-quick-edit-cta ${isActive ? 'bracket-quick-edit-cta--active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(match);
            }}
          >
            {isActive ? '✏️ Editing Score...' : isCompleted ? '⚡ Update Score' : '⚡ Record Score'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ResultsAdmin() {
  const { fixtures = [], teams = [], updateFixture } = useTournament();
  const [viewMode, setViewMode] = useState('bracket'); // 'bracket' | 'cards'
  const [editId, setEditId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
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

  const getTeamColor = (name) => {
    const t = teams.find(team => team.name === name);
    return t?.badge || '#156637';
  };

  const getTeamBadgeLabel = (name) => {
    if (!name || name === 'TBD') return '?';
    const idx = teams.findIndex(t => t.name.toLowerCase() === name.toLowerCase());
    return idx !== -1 ? (idx + 1) : name.charAt(0);
  };

  // Only consider fixtures where teams are known or scheduled
  const playableFixtures = useMemo(() => {
    const { deduplicatedFixtures } = deduplicateFixturesList(fixtures);
    return deduplicatedFixtures.filter(f => f.homeTeam !== 'TBD' || f.awayTeam !== 'TBD');
  }, [fixtures]);

  // Sort with UPCOMING MATCHES FIRST, then LIVE, then POSTPONED, then COMPLETED
  const sortedFixtures = useMemo(() => {
    const statusWeight = {
      live: 1,
      upcoming: 2,
      postponed: 3,
      completed: 4,
    };

    return [...playableFixtures].sort((a, b) => {
      const weightA = statusWeight[a.status] || 5;
      const weightB = statusWeight[b.status] || 5;
      if (weightA !== weightB) {
        return weightA - weightB;
      }
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

  // Bracket Structure builder for Results Knockout View
  const bracketPhases = useMemo(() => {
    // 1. Deduplicate fixtures so duplicate slot entries are cleanly merged
    const { deduplicatedFixtures } = deduplicateFixturesList(fixtures);

    // 2. Identify active phases
    const hasR16 = deduplicatedFixtures.some(f => parseStageInfo(f.round).stage === 'r16');
    const hasQuarter = deduplicatedFixtures.some(f => parseStageInfo(f.round).stage === 'quarter');
    const hasSemi = deduplicatedFixtures.some(f => parseStageInfo(f.round).stage === 'semi');

    let phaseConfigs = [];
    if (hasR16) {
      phaseConfigs = [
        { name: 'Round of 16', stage: 'r16', count: 8 },
        { name: 'Quarter-Finals', stage: 'quarter', count: 4 },
        { name: 'Semi-Finals', stage: 'semi', count: 2 },
        { name: 'Final', stage: 'final', count: 1 },
      ];
    } else if (hasQuarter) {
      phaseConfigs = [
        { name: 'Quarter-Finals', stage: 'quarter', count: 4 },
        { name: 'Semi-Finals', stage: 'semi', count: 2 },
        { name: 'Final', stage: 'final', count: 1 },
      ];
    } else if (hasSemi) {
      phaseConfigs = [
        { name: 'Semi-Finals', stage: 'semi', count: 2 },
        { name: 'Final', stage: 'final', count: 1 },
      ];
    } else {
      phaseConfigs = [
        { name: 'Final', stage: 'final', count: 1 },
      ];
    }

    return phaseConfigs.map((phaseConfig) => {
      // Find all matches matching this phase
      const phaseMatches = deduplicatedFixtures.filter(f => {
        const info = parseStageInfo(f.round);
        return info.stage === phaseConfig.stage;
      });

      // Sort strictly by match number
      const sorted = [...phaseMatches].sort((a, b) => {
        const infoA = parseStageInfo(a.round);
        const infoB = parseStageInfo(b.round);
        return infoA.matchNum - infoB.matchNum;
      });

      // Fill symmetrical slots so bracket connectors line up perfectly
      const slots = [];
      for (let i = 1; i <= phaseConfig.count; i++) {
        // Strict match lookup by matchNum to prevent duplicate slot hijacking
        const existing = sorted.find(m => {
          const info = parseStageInfo(m.round);
          return info.matchNum === i;
        });

        if (existing) {
          slots.push(existing);
        } else {
          // Placeholder for future knockout stage
          let placeholderHome = 'TBD';
          let placeholderAway = 'TBD';
          if (phaseConfig.stage === 'quarter') {
            placeholderHome = `Winner R16 M${(i - 1) * 2 + 1}`;
            placeholderAway = `Winner R16 M${(i - 1) * 2 + 2}`;
          } else if (phaseConfig.stage === 'semi') {
            placeholderHome = `Winner QF ${(i - 1) * 2 + 1}`;
            placeholderAway = `Winner QF ${(i - 1) * 2 + 2}`;
          } else if (phaseConfig.stage === 'final') {
            placeholderHome = 'Winner SF 1';
            placeholderAway = 'Winner SF 2';
          }

          slots.push({
            id: `placeholder_${phaseConfig.stage}_${i}`,
            round: phaseConfig.name === 'Final' ? 'Final' : `${phaseConfig.name.replace(/s$/, '')} ${i}`,
            homeTeam: placeholderHome,
            awayTeam: placeholderAway,
            status: 'upcoming',
            isPlaceholder: true,
            date: 'TBD',
            time: 'TBD',
          });
        }
      }

      return {
        name: phaseConfig.name,
        stage: phaseConfig.stage,
        matches: slots,
      };
    });
  }, [fixtures]);

  const activeEditFixture = fixtures.find(f => f.id === editId);

  const startEdit = (fix) => {
    if (!fix || fix.isPlaceholder) return;
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
      scorers: Array.isArray(fix.scorers) ? [...fix.scorers] : [],
      newScorerName: '',
      newScorerTeam: fix.homeTeam !== 'TBD' ? fix.homeTeam : '',
      newScorerGoals: 1,
    });
    window.scrollTo({ top: 180, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditId(null);
  };

  const addMatchScorer = () => {
    if (!form.newScorerName.trim()) {
      alert('Please enter player name');
      return;
    }
    const scorer = {
      name: form.newScorerName.trim(),
      team: form.newScorerTeam || activeEditFixture?.homeTeam || 'TBD',
      goals: parseInt(form.newScorerGoals, 10) || 1,
    };
    setForm(prev => ({
      ...prev,
      scorers: [...prev.scorers, scorer],
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

    let hs = form.homeScore !== '' ? parseInt(form.homeScore, 10) : undefined;
    let as = form.awayScore !== '' ? parseInt(form.awayScore, 10) : undefined;

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

    const postponedReasonText = form.status === 'postponed'
      ? (form.postponedReason.trim() || 'Match postponed by tournament committee')
      : undefined;

    const payload = {
      status: form.status,
      date: form.date,
      time: form.time,
      venue: form.venue,
      homeScore: form.status === 'completed' || form.status === 'live' ? hs : undefined,
      awayScore: form.status === 'completed' || form.status === 'live' ? as : undefined,
      homePenalty: form.status === 'completed' && form.homePenalty !== '' ? parseInt(form.homePenalty, 10) : undefined,
      awayPenalty: form.status === 'completed' && form.awayPenalty !== '' ? parseInt(form.awayPenalty, 10) : undefined,
      postponedReason: postponedReasonText,
      scorers: form.scorers,
      newScorers: form.scorers,
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
    <div className="admin-submodule">
      {/* ===== RESULTS VIEW MODE SWITCHER & HEADER ===== */}
      <div className="admin-results-topbar">
        <div className="results-title-meta">
          <div className="header-crest-icon" style={{ background: 'linear-gradient(135deg, #009b62 0%, #007046 100%)' }}>
            <Trophy size={16} color="#ffffff" />
          </div>
          <div>
            <h3 className="results-headline">Match Results & Knockout Scoreboard</h3>
            <p className="results-subheadline">
              Record match scores, shootouts & watch winners automatically progress across the knockout tournament tree.
            </p>
          </div>
        </div>

        <div className="admin-view-switcher">
          <button
            type="button"
            className={`admin-view-tab ${viewMode === 'bracket' ? 'admin-view-tab--active' : ''}`}
            onClick={() => setViewMode('bracket')}
            title="Knockout Tree Bracket View"
          >
            <Trophy size={13} />
            <span>🏆 Tournament Bracket (ബ്രാക്കറ്റ്)</span>
          </button>
          <button
            type="button"
            className={`admin-view-tab ${viewMode === 'cards' ? 'admin-view-tab--active' : ''}`}
            onClick={() => setViewMode('cards')}
            title="List of all match cards"
          >
            <SlidersHorizontal size={13} />
            <span>📋 All Match Cards (ലിസ്റ്റ്)</span>
          </button>
        </div>
      </div>

      {/* ===== DETAILED EDIT DRAWER / CARD (Appears when match is selected) ===== */}
      {editId && activeEditFixture && (
        <div className="admin-editor-panel editor-panel--editing animate-scale">
          <div className="editor-panel-header">
            <div className="panel-title-group">
              <div className="header-crest-icon" style={{ background: 'linear-gradient(135deg, #FFD700 0%, #C59317 100%)' }}>
                <Trophy size={18} color="#ffffff" />
              </div>
              <div>
                <span className="matchday-dossier-tag" style={{ color: '#FFD700' }}>🏆 Official Match Center</span>
                <h3>Record Score & Advance Bracket</h3>
                <p className="panel-subtitle">
                  {activeEditFixture.round}: <strong>{activeEditFixture.homeTeam}</strong> vs <strong>{activeEditFixture.awayTeam}</strong>
                </p>
                {(() => {
                  const target = getProgressionTarget(activeEditFixture, fixtures);
                  if (!target) return null;
                  return (
                    <div className="progression-hint-badge" style={{ marginTop: '6px' }}>
                      <Zap size={13} style={{ color: '#009b62' }} />
                      <span>Winner automatically advances to: <strong>{target.description}</strong></span>
                    </div>
                  );
                })()}
              </div>
            </div>

            <button type="button" className="btn btn-sm btn-ghost" onClick={cancelEdit}>
              <X size={14} /> Close
            </button>
          </div>

          <div className="admin-editor-form">
            {/* Status and Stadium */}
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Match Status</label>
                <div className="status-pill-selector">
                  {[
                    { key: 'upcoming', label: 'Upcoming', color: '#1D4ED8' },
                    { key: 'live', label: 'Live In Play', color: '#DC2626' },
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

              <div className="form-group">
                <label className="form-label">Stadium / Venue</label>
                <input
                  className="form-input"
                  value={form.venue}
                  onChange={e => setForm({ ...form, venue: e.target.value })}
                  list="result-venues"
                />
                <datalist id="result-venues">
                  {KERALA_VENUES.map(v => <option key={v} value={v} />)}
                </datalist>
              </div>
            </div>

            {/* Date & Time */}
            <div className="form-grid-2">
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

            {/* Score Inputs (Dial Steppers) */}
            {(form.status === 'completed' || form.status === 'live') && (
              <div className="score-stepper-deck">
                <div className="stepper-header">
                  <span className="stepper-title">Official Match Score (Regular Time)</span>
                </div>

                <div className="stepper-matchup-arena">
                  {/* Home Team Stepper */}
                  <div className="team-stepper-card">
                    <span className="team-badge-circle" style={{ background: getTeamColor(activeEditFixture.homeTeam) }}>
                      {getTeamBadgeLabel(activeEditFixture.homeTeam)}
                    </span>
                    <span className="stepper-team-name">{activeEditFixture.homeTeam}</span>
                    <div className="score-dial-control">
                      <button
                        type="button"
                        className="score-dial-btn"
                        onClick={() => adjustScore('homeScore', -1)}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        className="score-stepper-input"
                        value={form.homeScore}
                        onChange={e => setForm({ ...form, homeScore: e.target.value })}
                      />
                      <button
                        type="button"
                        className="score-dial-btn score-dial-btn--plus"
                        onClick={() => adjustScore('homeScore', 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="stepper-vs-badge">VS</div>

                  {/* Away Team Stepper */}
                  <div className="team-stepper-card">
                    <span className="team-badge-circle" style={{ background: getTeamColor(activeEditFixture.awayTeam) }}>
                      {getTeamBadgeLabel(activeEditFixture.awayTeam)}
                    </span>
                    <span className="stepper-team-name">{activeEditFixture.awayTeam}</span>
                    <div className="score-dial-control">
                      <button
                        type="button"
                        className="score-dial-btn"
                        onClick={() => adjustScore('awayScore', -1)}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        className="score-stepper-input"
                        value={form.awayScore}
                        onChange={e => setForm({ ...form, awayScore: e.target.value })}
                      />
                      <button
                        type="button"
                        className="score-dial-btn score-dial-btn--plus"
                        onClick={() => adjustScore('awayScore', 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Penalty Shootout section if tied */}
                {form.status === 'completed' && isTie && (
                  <div className="penalty-inline-box animate-fade-in">
                    <div className="penalty-title">
                      <Zap size={14} /> Penalty Shootout Decider (Mandatory for Knockouts)
                    </div>
                    <p className="penalty-subtitle">
                      Regular time ended tied ({form.homeScore} - {form.awayScore}). Enter penalty shootout goals:
                    </p>
                    <div className="penalty-inputs-row">
                      <div className="penalty-input-item">
                        <label>{activeEditFixture.homeTeam} Pens:</label>
                        <input
                          type="number"
                          min="0"
                          className="penalty-number-input"
                          value={form.homePenalty}
                          placeholder="e.g. 5"
                          onChange={e => setForm({ ...form, homePenalty: e.target.value })}
                        />
                      </div>
                      <span className="score-dash">-</span>
                      <div className="penalty-input-item">
                        <label>{activeEditFixture.awayTeam} Pens:</label>
                        <input
                          type="number"
                          min="0"
                          className="penalty-number-input"
                          value={form.awayPenalty}
                          placeholder="e.g. 4"
                          onChange={e => setForm({ ...form, awayPenalty: e.target.value })}
                        />
                      </div>
                    </div>

                    {hasPenaltiesDecided && (
                      <div className="shootout-winner-banner">
                        🎯 Shootout Winner: <strong>{hpNum > apNum ? activeEditFixture.homeTeam : activeEditFixture.awayTeam}</strong> advances to next round!
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Postponed reason */}
            {form.status === 'postponed' && (
              <div className="postponed-inline-box animate-fade-in">
                <div className="postponed-title">
                  <AlertTriangle size={14} /> Match Postponement Reason
                </div>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 🌧️ Heavy Rain / Pitch Unfit"
                  value={form.postponedReason}
                  onChange={e => setForm({ ...form, postponedReason: e.target.value })}
                />
                <div className="postpone-quick-chips">
                  {COMMON_POSTPONE_REASONS.map(r => (
                    <button
                      key={r}
                      type="button"
                      className="chip-btn"
                      onClick={() => setForm({ ...form, postponedReason: r })}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Goalscorers Entry */}
            {(form.status === 'completed' || form.status === 'live') && (
              <div className="scorers-manager-box">
                <div className="scorers-manager-header">
                  <span>⚽ Match Goalscorers (Updates Golden Boot automatically)</span>
                </div>

                <div className="scorers-add-bar">
                  <input
                    type="text"
                    className="form-input scorer-name-input"
                    placeholder="Player Name (e.g. Rahul, Ashiq)"
                    value={form.newScorerName}
                    onChange={e => setForm({ ...form, newScorerName: e.target.value })}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMatchScorer(); } }}
                  />
                  <select
                    className="form-select scorer-team-select"
                    value={form.newScorerTeam}
                    onChange={e => setForm({ ...form, newScorerTeam: e.target.value })}
                  >
                    <option value={activeEditFixture.homeTeam}>{activeEditFixture.homeTeam}</option>
                    <option value={activeEditFixture.awayTeam}>{activeEditFixture.awayTeam}</option>
                  </select>
                  <input
                    type="number"
                    min="1"
                    className="form-input scorer-goals-input"
                    value={form.newScorerGoals}
                    onChange={e => setForm({ ...form, newScorerGoals: e.target.value })}
                    title="Number of goals by this player"
                  />
                  <button type="button" className="btn btn-sm btn-primary" onClick={addMatchScorer}>
                    <Plus size={14} /> Add Goal
                  </button>
                </div>

                <div className="scorers-chips-container">
                  {form.scorers.length === 0 ? (
                    <span className="no-scorers-note">No goals registered yet for this match.</span>
                  ) : (
                    <div className="scorer-tags-list">
                      {form.scorers.map((sc, i) => (
                        <span key={i} className="scorer-tag-chip">
                          ⚽ {sc.name} ({sc.team}) ×{sc.goals}
                          <button
                            type="button"
                            onClick={() => removeMatchScorer(i)}
                            className="tag-remove-btn"
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

            {/* Save Actions */}
            <div className="editor-form-actions">
              <button type="button" className="btn btn-ghost" onClick={cancelEdit}>
                <X size={14} /> Cancel
              </button>
              <button type="button" className="btn btn-primary football-cta-btn" style={{ minWidth: '240px' }} onClick={handleSave}>
                <Check size={16} /> Save Scores & Update Knockout Tree
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== BRACKET VIEW (Default Interactive Knockout Tree) ===== */}
      {viewMode === 'bracket' && (
        <div className="admin-bracket-view-section animate-fade-in">
          {/* Informational Tip Banner */}
          <div className="admin-bracket-tip-banner">
            <div className="tip-badge-icon">💡</div>
            <div className="tip-content">
              <strong>Interactive Bracket Editor:</strong> Click on any match card below to enter scores, penalty shootouts, or match status. When saved, the winning club automatically advances to the next round in the bracket tree!
            </div>
          </div>

          <div className="admin-bracket-wrapper">
            <div className="bracket-swipe-tip">
              <span>👈 Swipe horizontally to view full knockout tournament tree 👉</span>
            </div>
            <div className="admin-bracket-scroll-container">
              <div className="admin-bracket">
                {bracketPhases.map((phase) => {
                  // Group matches into pairs of 2 for tree connectors
                  const pairs = [];
                  for (let i = 0; i < phase.matches.length; i += 2) {
                    pairs.push(phase.matches.slice(i, i + 2));
                  }

                  return (
                    <div key={phase.name} className="admin-bracket-column">
                      <h3 className="admin-bracket-column-title">{phase.name}</h3>
                      <div className="admin-bracket-matches">
                        {pairs.map((pair, idx) => (
                          <div key={idx} className={`bracket-match-pair ${pair.length === 1 ? 'single-match' : ''}`}>
                            {pair.map((m) => (
                              <div key={m.id} className="bracket-match-wrapper">
                                <AdminBracketMatchCard
                                  match={m}
                                  isActive={editId === m.id}
                                  onSelect={startEdit}
                                  getTeamColor={getTeamColor}
                                  getTeamBadgeLabel={getTeamBadgeLabel}
                                />
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== CARDS LIST VIEW (Alternative List Format) ===== */}
      {viewMode === 'cards' && (
        <div className="admin-cards-view-section animate-fade-in">
          {/* Search and Status Filter controls */}
          <div className="results-header-controls" style={{ marginBottom: '18px' }}>
            <div className="filter-pill-group">
              <button
                type="button"
                className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
                onClick={() => setFilterStatus('all')}
              >
                All Matches ({sortedFixtures.length})
              </button>
              <button
                type="button"
                className={`filter-btn ${filterStatus === 'upcoming' ? 'active' : ''}`}
                onClick={() => setFilterStatus('upcoming')}
              >
                Upcoming ({sortedFixtures.filter(f => f.status === 'upcoming').length})
              </button>
              <button
                type="button"
                className={`filter-btn ${filterStatus === 'live' ? 'active' : ''}`}
                onClick={() => setFilterStatus('live')}
              >
                <Flame size={13} /> Live ({sortedFixtures.filter(f => f.status === 'live').length})
              </button>
              <button
                type="button"
                className={`filter-btn ${filterStatus === 'completed' ? 'active' : ''}`}
                onClick={() => setFilterStatus('completed')}
              >
                Completed ({sortedFixtures.filter(f => f.status === 'completed').length})
              </button>
              <button
                type="button"
                className={`filter-btn ${filterStatus === 'postponed' ? 'active' : ''}`}
                onClick={() => setFilterStatus('postponed')}
              >
                Postponed ({sortedFixtures.filter(f => f.status === 'postponed').length})
              </button>
            </div>

            <div className="results-search-wrap">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                className="results-search-input"
                placeholder="Search teams or round…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="search-clear-btn" onClick={() => setSearchTerm('')}>
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          <div className="admin-list-section">
            {displayedFixtures.length === 0 ? (
              <div className="admin-empty-state">
                <div className="empty-icon-wrap">
                  <HelpCircle size={36} />
                </div>
                <h4>No Matches Found</h4>
                <p>No fixtures match your selected filter criteria.</p>
              </div>
            ) : (
              <div className="results-cards-grid">
                {displayedFixtures.map(fix => {
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
                      className={`result-card-item result-status--${fix.status} ${editId === fix.id ? 'result-card--active' : ''}`}
                    >
                      <div className="result-card-header">
                        <span className="result-round-tag">
                          <Trophy size={11} /> {fix.round}
                        </span>

                        <span className={`result-status-badge badge-${fix.status}`}>
                          {isLive && <span className="live-pulse-dot" />}
                          {fix.status.toUpperCase()}
                        </span>
                      </div>

                      {/* Team vs Team Layout */}
                      <div className="result-matchup-row">
                        <div className="team-cell home-cell">
                          <span className="team-badge-circle" style={{ background: getTeamColor(fix.homeTeam) }}>
                            {getTeamBadgeLabel(fix.homeTeam)}
                          </span>
                          <span className={`team-name-text ${winnerTeam === fix.homeTeam ? 'winner-bold' : ''}`}>
                            {fix.homeTeam}
                          </span>
                        </div>

                        <div className="score-cell">
                          {isCompleted ? (
                            <div className="final-score-box">
                              <span className="score-num">{fix.homeScore}</span>
                              <span className="score-colon">:</span>
                              <span className="score-num">{fix.awayScore}</span>
                              {hasPens && (
                                <span className="pens-score-tag">
                                  ({fix.homePenalty} - {fix.awayPenalty} Pens)
                                </span>
                              )}
                            </div>
                          ) : isLive ? (
                            <div className="live-score-box">
                              <span className="score-num">{fix.homeScore || 0}</span>
                              <span className="score-colon">:</span>
                              <span className="score-num">{fix.awayScore || 0}</span>
                            </div>
                          ) : (
                            <span className="vs-tag">VS</span>
                          )}
                        </div>

                        <div className="team-cell away-cell">
                          <span className={`team-name-text ${winnerTeam === fix.awayTeam ? 'winner-bold' : ''}`}>
                            {fix.awayTeam}
                          </span>
                          <span className="team-badge-circle" style={{ background: getTeamColor(fix.awayTeam) }}>
                            {getTeamBadgeLabel(fix.awayTeam)}
                          </span>
                        </div>
                      </div>

                      {/* Winner Banner */}
                      {winnerTeam && (
                        <div className="winner-strip">
                          🏆 Winner: <strong>{winnerTeam}</strong> advances to next round
                        </div>
                      )}

                      {/* Postponed Warning Note */}
                      {isPostponed && (
                        <div className="postponed-card-notice">
                          ⚠️ Postponed: {fix.postponedReason || 'Awaiting reschedule'}
                        </div>
                      )}

                      {/* Card Meta & Actions Footer */}
                      <div className="result-card-footer">
                        <div className="result-meta-chips">
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

                        <div className="result-card-actions">
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            onClick={() => startEdit(fix)}
                          >
                            <SlidersHorizontal size={13} /> Detailed Score
                          </button>

                          {!isPostponed && !isCompleted && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline"
                              onClick={() => quickPostpone(fix)}
                              title="Quick Postpone Match"
                            >
                              Postpone
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
