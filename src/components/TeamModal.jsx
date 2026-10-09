import { useState, useEffect } from 'react';
import {
  X, Users, Calendar, Trophy, Target, Flame, CheckCircle,
  XCircle, Clock, Search, Medal, Activity
} from 'lucide-react';
import './TeamModal.css';

export default function TeamModal({ teamAnalytics, onClose }) {
  const [activeTab, setActiveTab] = useState('squad'); // 'squad' | 'matches' | 'stats'
  const [playerSearch, setPlayerSearch] = useState('');
  const [matchFilter, setMatchFilter] = useState('all'); // 'all' | 'upcoming' | 'results'

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const team = teamAnalytics?.team || {};
  const played = teamAnalytics?.played || 0;
  const won = teamAnalytics?.won || 0;
  const drawn = teamAnalytics?.drawn || 0;
  const lost = teamAnalytics?.lost || 0;
  const gf = teamAnalytics?.gf || 0;
  const ga = teamAnalytics?.ga || 0;
  const gd = teamAnalytics?.gd || 0;
  const winRate = teamAnalytics?.winRate || 0;
  const cleanSheets = teamAnalytics?.cleanSheets || 0;
  const form = teamAnalytics?.form || [];
  const status = teamAnalytics?.status || 'active';
  const teamUpcoming = teamAnalytics?.teamUpcoming || [];
  const teamResults = teamAnalytics?.teamResults || [];
  const players = teamAnalytics?.players || [];
  const teamScorers = teamAnalytics?.teamScorers || [];
  const topScorer = teamAnalytics?.topScorer || null;

  // Filter players
  const filteredPlayers = !playerSearch.trim()
    ? players
    : players.filter(p => p.toLowerCase().includes(playerSearch.toLowerCase()));

  // Combined matches
  const filteredMatches = matchFilter === 'upcoming'
    ? { upcoming: teamUpcoming, results: [] }
    : matchFilter === 'results'
      ? { upcoming: [], results: teamResults }
      : { upcoming: teamUpcoming, results: teamResults };

  if (!teamAnalytics) return null;

  const badgeColor = team.badge || '#156637';

  // Get goals for a player from teamScorers
  const getPlayerGoals = (playerName) => {
    const found = teamScorers.find(s => s.name.toLowerCase() === playerName.toLowerCase());
    return found ? found.goals : 0;
  };

  return (
    <div className="team-modal-overlay" role="presentation" onMouseDown={onClose}>
      <div
        className="team-modal-content animate-scale"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-team-name"
        onMouseDown={(e) => e.stopPropagation()}
        style={{ '--team-accent': badgeColor }}
      >
        {/* ===== HERO BANNER ===== */}
        <div className="tm-hero" style={{ background: `linear-gradient(135deg, ${badgeColor}22 0%, #0d2117 100%)` }}>
          <button
            type="button"
            className="tm-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>

          <div className="tm-hero-inner">
            <div
              className="tm-crest"
              style={{
                background: badgeColor,
                color: badgeColor.toLowerCase() === '#ffffff' ? '#17211d' : '#fff',
                boxShadow: `0 8px 24px ${badgeColor}44`,
              }}
            >
              <span>{team.name ? team.name.charAt(0) : 'T'}</span>
            </div>

            <div className="tm-hero-info">
              <div className="tm-tag-row">
                <span className="tm-kicker">Pulari Knockout 2026</span>
                {status === 'champion' && (
                  <span className="tm-status-pill tm-status-pill--champion">
                    <Trophy size={12} /> Champions
                  </span>
                )}
                {status === 'active' && (
                  <span className="tm-status-pill tm-status-pill--active">
                    <Flame size={12} /> In Contention
                  </span>
                )}
                {status === 'eliminated' && (
                  <span className="tm-status-pill tm-status-pill--eliminated">
                    <XCircle size={12} /> Knocked Out
                  </span>
                )}
              </div>

              <h2 id="modal-team-name" className="tm-title">{team.name}</h2>

              <div className="tm-quick-pills">
                <div className="tm-pill">
                  <Users size={13} />
                  <span>{players.length} Players</span>
                </div>
                <div className="tm-pill">
                  <Trophy size={13} />
                  <span>{won}W - {drawn}D - {lost}L</span>
                </div>
                <div className="tm-pill">
                  <Target size={13} />
                  <span>{gf} Goals ({gd >= 0 ? `+${gd}` : gd})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Strip in Hero */}
          {form.length > 0 && (
            <div className="tm-form-strip">
              <span className="tm-form-label">Recent Form:</span>
              <div className="tm-form-dots">
                {form.map((res, i) => (
                  <span
                    key={i}
                    className={`tm-form-dot tm-form-dot--${res.toLowerCase()}`}
                    title={res === 'W' ? 'Win' : res === 'D' ? 'Draw' : 'Loss'}
                  >
                    {res}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ===== TAB BAR ===== */}
        <div className="tm-nav-tabs">
          <button
            type="button"
            className={`tm-tab-btn ${activeTab === 'squad' ? 'tm-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('squad')}
          >
            <Users size={15} />
            <span>Squad & Roster</span>
            <span className="tm-tab-count">{players.length}</span>
          </button>

          <button
            type="button"
            className={`tm-tab-btn ${activeTab === 'matches' ? 'tm-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('matches')}
          >
            <Calendar size={15} />
            <span>Fixtures & Results</span>
            <span className="tm-tab-count">{teamUpcoming.length + teamResults.length}</span>
          </button>

          <button
            type="button"
            className={`tm-tab-btn ${activeTab === 'stats' ? 'tm-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <Activity size={15} />
            <span>Analytics & Form</span>
          </button>
        </div>

        {/* ===== MODAL BODY ===== */}
        <div className="tm-body">
          {/* TAB 1: SQUAD */}
          {activeTab === 'squad' && (
            <div className="tm-tab-pane animate-fade">
              <div className="tm-squad-controls">
                <div className="tm-search-box">
                  <Search size={14} className="tm-search-icon" />
                  <input
                    type="text"
                    className="form-input tm-search-input"
                    placeholder="Search player in squad..."
                    value={playerSearch}
                    onChange={(e) => setPlayerSearch(e.target.value)}
                  />
                  {playerSearch && (
                    <button
                      type="button"
                      className="tm-search-clear"
                      onClick={() => setPlayerSearch('')}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {topScorer && topScorer.goals > 0 && (
                  <div className="tm-top-scorer-badge">
                    <Medal size={14} />
                    <span>Top Scorer: <strong>{topScorer.name}</strong> ({topScorer.goals} ⚽)</span>
                  </div>
                )}
              </div>

              {filteredPlayers.length === 0 ? (
                <div className="tm-empty-pane">
                  <Users size={32} />
                  <p>{playerSearch ? `No player found matching "${playerSearch}"` : 'No players registered yet.'}</p>
                </div>
              ) : (
                <div className="tm-player-grid">
                  {filteredPlayers.map((player, idx) => {
                    const goals = getPlayerGoals(player);
                    const isCaptain = idx === 0;
                    return (
                      <div key={`${player}-${idx}`} className="tm-player-card">
                        <div className="tm-player-num">{String(idx + 1).padStart(2, '0')}</div>
                        <div className="tm-player-avatar" style={{ background: `${badgeColor}18`, color: badgeColor }}>
                          {player.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="tm-player-meta">
                          <span className="tm-player-name">{player}</span>
                          <div className="tm-player-sub">
                            {isCaptain && <span className="tm-captain-tag">Captain</span>}
                            {goals > 0 && (
                              <span className="tm-player-goals">
                                ⚽ {goals} {goals === 1 ? 'goal' : 'goals'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MATCHES */}
          {activeTab === 'matches' && (
            <div className="tm-tab-pane animate-fade">
              <div className="tm-matches-filter-row">
                <div className="tm-sub-pills">
                  <button
                    type="button"
                    className={`tm-sub-pill ${matchFilter === 'all' ? 'tm-sub-pill--active' : ''}`}
                    onClick={() => setMatchFilter('all')}
                  >
                    All Matches ({teamUpcoming.length + teamResults.length})
                  </button>
                  <button
                    type="button"
                    className={`tm-sub-pill ${matchFilter === 'upcoming' ? 'tm-sub-pill--active' : ''}`}
                    onClick={() => setMatchFilter('upcoming')}
                  >
                    Upcoming ({teamUpcoming.length})
                  </button>
                  <button
                    type="button"
                    className={`tm-sub-pill ${matchFilter === 'results' ? 'tm-sub-pill--active' : ''}`}
                    onClick={() => setMatchFilter('results')}
                  >
                    Results ({teamResults.length})
                  </button>
                </div>
              </div>

              {filteredMatches.upcoming.length === 0 && filteredMatches.results.length === 0 ? (
                <div className="tm-empty-pane">
                  <Calendar size={32} />
                  <p>No fixtures or results recorded for {team.name} yet.</p>
                </div>
              ) : (
                <div className="tm-match-list">
                  {/* Upcoming section */}
                  {filteredMatches.upcoming.length > 0 && (
                    <div className="tm-match-group">
                      <h4 className="tm-match-group-title">
                        <Clock size={14} /> Upcoming Fixtures
                      </h4>
                      <div className="tm-cards-col">
                        {filteredMatches.upcoming.map((fix) => {
                          const isHome = fix.homeTeam?.toLowerCase() === team.name.toLowerCase();
                          return (
                            <div key={fix.id} className="tm-match-item tm-match-item--upcoming">
                              <div className="tm-match-top">
                                <span className="badge badge-upcoming">{fix.round || 'Knockout'}</span>
                                <span className="tm-match-date">
                                  {new Date(fix.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  {fix.time ? ` · ${fix.time}` : ''}
                                </span>
                              </div>
                              <div className="tm-match-matchup">
                                <span className={`tm-team-label ${isHome ? 'tm-team-label--self' : ''}`}>{fix.homeTeam}</span>
                                <span className="tm-vs-bubble">VS</span>
                                <span className={`tm-team-label ${!isHome ? 'tm-team-label--self' : ''}`}>{fix.awayTeam}</span>
                              </div>
                              {fix.venue && (
                                <div className="tm-match-venue">📍 {fix.venue}</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Results section */}
                  {filteredMatches.results.length > 0 && (
                    <div className="tm-match-group">
                      <h4 className="tm-match-group-title">
                        <CheckCircle size={14} /> Match Results
                      </h4>
                      <div className="tm-cards-col">
                        {filteredMatches.results.map((res) => {
                          const isHome = res.homeTeam?.toLowerCase() === team.name.toLowerCase();
                          const myScore = isHome ? res.homeScore : res.awayScore;
                          const oppScore = isHome ? res.awayScore : res.homeScore;
                          const isWin = myScore > oppScore;
                          const isDraw = myScore === oppScore;

                          return (
                            <div
                              key={res.id}
                              className={`tm-match-item tm-match-item--result ${isWin ? 'tm-match--win' : isDraw ? 'tm-match--draw' : 'tm-match--loss'}`}
                            >
                              <div className="tm-match-top">
                                <div className="tm-outcome-badge">
                                  <span className={`badge ${isWin ? 'badge-completed' : isDraw ? 'badge-upcoming' : 'badge-live'}`}>
                                    {isWin ? 'WIN' : isDraw ? 'DRAW' : 'LOSS'}
                                  </span>
                                  {res.round && <span className="badge badge-primary">{res.round}</span>}
                                </div>
                                <span className="tm-match-date">
                                  {new Date(res.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                              </div>

                              <div className="tm-match-matchup">
                                <span className={`tm-team-label ${isHome ? 'tm-team-label--self' : ''}`}>{res.homeTeam}</span>
                                <div className="tm-score-box">
                                  <span>{res.homeScore}</span>
                                  <span>:</span>
                                  <span>{res.awayScore}</span>
                                </div>
                                <span className={`tm-team-label ${!isHome ? 'tm-team-label--self' : ''}`}>{res.awayTeam}</span>
                              </div>

                              {res.scorers && res.scorers.length > 0 && (
                                <div className="tm-scorers-strip">
                                  {res.scorers.map((s, idx) => (
                                    <span key={idx} className="tm-scorer-chip">
                                      ⚽ {s.name} ({s.team}) ×{s.goals}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ANALYTICS & STATS */}
          {activeTab === 'stats' && (
            <div className="tm-tab-pane animate-fade">
              {/* Top Stats Grid */}
              <div className="tm-stats-grid">
                <div className="tm-stat-box">
                  <span className="tm-stat-label">Matches Played</span>
                  <span className="tm-stat-value">{played}</span>
                  <span className="tm-stat-sub">{won}W · {drawn}D · {lost}L</span>
                </div>

                <div className="tm-stat-box">
                  <span className="tm-stat-label">Win Rate</span>
                  <span className="tm-stat-value" style={{ color: 'var(--primary)' }}>{winRate}%</span>
                  <div className="tm-winrate-bar">
                    <div className="tm-winrate-fill" style={{ width: `${winRate}%` }} />
                  </div>
                </div>

                <div className="tm-stat-box">
                  <span className="tm-stat-label">Goals Scored</span>
                  <span className="tm-stat-value" style={{ color: 'var(--gold)' }}>{gf}</span>
                  <span className="tm-stat-sub">{played > 0 ? (gf / played).toFixed(1) : 0} per match</span>
                </div>

                <div className="tm-stat-box">
                  <span className="tm-stat-label">Goals Conceded</span>
                  <span className="tm-stat-value" style={{ color: 'var(--danger)' }}>{ga}</span>
                  <span className="tm-stat-sub">{cleanSheets} Clean sheets</span>
                </div>
              </div>

              {/* Goal Comparison Bar */}
              <div className="tm-perf-panel">
                <div className="tm-perf-header">
                  <span>Offensive vs Defensive Ratio</span>
                  <span className="tm-perf-gd" style={{ color: gd >= 0 ? 'var(--primary)' : 'var(--danger)' }}>
                    GD: {gd > 0 ? `+${gd}` : gd}
                  </span>
                </div>
                <div className="tm-ratio-track">
                  <div
                    className="tm-ratio-gf"
                    style={{
                      width: `${(gf + ga) > 0 ? (gf / (gf + ga)) * 100 : 50}%`,
                      background: 'var(--primary)',
                    }}
                    title={`Goals Scored: ${gf}`}
                  />
                  <div
                    className="tm-ratio-ga"
                    style={{
                      width: `${(gf + ga) > 0 ? (ga / (gf + ga)) * 100 : 50}%`,
                      background: 'var(--danger)',
                    }}
                    title={`Goals Conceded: ${ga}`}
                  />
                </div>
                <div className="tm-ratio-legend">
                  <span><i style={{ background: 'var(--primary)' }} /> Scored ({gf})</span>
                  <span><i style={{ background: 'var(--danger)' }} /> Conceded ({ga})</span>
                </div>
              </div>

              {/* Team Top Scorers list */}
              <div className="tm-scorers-section">
                <h4 className="tm-section-heading">
                  <Medal size={15} /> Team Goalscorers
                </h4>
                {teamScorers.length === 0 ? (
                  <div className="tm-empty-mini">
                    <p>No tournament goals registered for {team.name} yet.</p>
                  </div>
                ) : (
                  <div className="tm-scorers-table">
                    {teamScorers.map((sc, i) => (
                      <div key={sc.id || i} className="tm-scorer-row">
                        <span className="tm-scorer-rank">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
                        <span className="tm-scorer-name">{sc.name}</span>
                        <div className="tm-scorer-goals-pill">
                          <span>{sc.goals}</span>
                          <small>⚽ goals</small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
