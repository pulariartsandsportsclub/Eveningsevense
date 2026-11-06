import { useTournament } from '../context/TournamentContext';
import { useAuth } from '../context/AuthContext';
import { deduplicateFixturesList, parseStageInfo } from '../utils/bracketProgression';
import { Trophy, MapPin, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import './KnockoutBracket.css';

const getTeamBadgeColor = (teamName, teams = []) => {
  if (!teamName || teamName === 'TBD') return '#94a3b8';
  const t = teams.find(x => x.name.toLowerCase() === teamName.toLowerCase());
  return t?.badge || '#156637';
};

const getTeamAbbr = (teamName) => {
  if (!teamName || teamName === 'TBD') return '?';
  const words = teamName.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return teamName.slice(0, 3).toUpperCase();
};

const formatMatchDate = (dateStr) => {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } catch {
    return null;
  }
};

const getPhaseIcon = (stage) => {
  switch (stage) {
    case 'final': return '🏆';
    case 'semi': return '🔥';
    case 'quarter': return '⚡';
    case 'r16': return '⚔️';
    default: return '⚽';
  }
};

function BracketMatch({ match, teams = [] }) {
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
    if (hs > as) {
      isHomeWinner = true;
    } else if (as > hs) {
      isAwayWinner = true;
    } else if (hasPenalties) {
      if (hp > ap) isHomeWinner = true;
      else if (ap > hp) isAwayWinner = true;
    }
  }

  const homeColor = getTeamBadgeColor(match.homeTeam, teams);
  const awayColor = getTeamBadgeColor(match.awayTeam, teams);
  const matchDateFormatted = formatMatchDate(match.date);
  const venueLabel = match.venue || 'Pulari Club Home Ground';

  return (
    <div className={`bracket-match-card ${isLive ? 'bracket-match--live' : ''} ${isPostponed ? 'bracket-match--postponed' : ''} ${isCompleted ? 'bracket-match--completed' : ''}`}>
      {/* Sleek Top Gold/Emerald Kasavu Accent Strip */}
      <div className="bracket-card-notch" />

      {/* Card Header: Round Tag & Status Pill */}
      <div className="bracket-card-header">
        <div className="bracket-round-tag">
          <span className="round-dot" />
          <span>{match.round}</span>
        </div>

        <div className="bracket-status-wrap">
          {isLive && (
            <span className="bracket-pill pill-live">
              <span className="live-radar-dot" />
              LIVE
            </span>
          )}
          {isCompleted && (
            <span className="bracket-pill pill-completed">
              <CheckCircle2 size={10} />
              {hasPenalties ? 'FT (Pen)' : 'FT'}
            </span>
          )}
          {isPostponed && (
            <span className="bracket-pill pill-postponed">
              <Clock size={10} />
              Postponed
            </span>
          )}
          {!isLive && !isCompleted && !isPostponed && (
            <span className="bracket-pill pill-upcoming">
              {match.time || 'Upcoming'}
            </span>
          )}
        </div>
      </div>

      {/* Teams Deck (Stadium Fixture Tabs) */}
      <div className="bracket-teams-deck">
        {/* Home Team Tab */}
        <div className={`bracket-team-tab ${isHomeWinner ? 'team-tab--winner' : ''} ${match.homeTeam === 'TBD' ? 'team-tab--tbd' : ''}`}>
          <div className="team-tab-identity">
            <span
              className="team-tab-crest"
              style={{ background: `linear-gradient(135deg, ${homeColor}, ${homeColor}cc)` }}
            >
              {getTeamAbbr(match.homeTeam)}
            </span>
            <span className="team-tab-name" title={match.homeTeam}>
              {match.homeTeam}
            </span>
            {isHomeWinner && (
              <span className="team-winner-badge" title="Advances to Next Round">
                <Trophy size={11} className="trophy-gold" />
              </span>
            )}
          </div>

          <div className="team-tab-score-box">
            {hasPenalties && (
              <span className="penalty-mini-tag" title="Penalty Shootout">({match.homePenalty}p)</span>
            )}
            <span className={`score-digit ${isHomeWinner ? 'score-winner' : ''}`}>
              {isCompleted || isLive ? (match.homeScore ?? 0) : '—'}
            </span>
          </div>
        </div>

        {/* Dynamic Stadium VS Separator */}
        <div className="bracket-teams-divider">
          <span className="divider-line" />
          <span className="divider-vs">VS</span>
          <span className="divider-line" />
        </div>

        {/* Away Team Tab */}
        <div className={`bracket-team-tab ${isAwayWinner ? 'team-tab--winner' : ''} ${match.awayTeam === 'TBD' ? 'team-tab--tbd' : ''}`}>
          <div className="team-tab-identity">
            <span
              className="team-tab-crest"
              style={{ background: `linear-gradient(135deg, ${awayColor}, ${awayColor}cc)` }}
            >
              {getTeamAbbr(match.awayTeam)}
            </span>
            <span className="team-tab-name" title={match.awayTeam}>
              {match.awayTeam}
            </span>
            {isAwayWinner && (
              <span className="team-winner-badge" title="Advances to Next Round">
                <Trophy size={11} className="trophy-gold" />
              </span>
            )}
          </div>

          <div className="team-tab-score-box">
            {hasPenalties && (
              <span className="penalty-mini-tag" title="Penalty Shootout">({match.awayPenalty}p)</span>
            )}
            <span className={`score-digit ${isAwayWinner ? 'score-winner' : ''}`}>
              {isCompleted || isLive ? (match.awayScore ?? 0) : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer: Stadium Venue & Schedule */}
      <div className="bracket-card-footer">
        {isPostponed ? (
          <div className="postponed-notice">
            <Clock size={11} />
            <span>{match.postponedReason || 'Match Rescheduled'}</span>
          </div>
        ) : (
          <>
            <div className="footer-meta-item" title={venueLabel}>
              <MapPin size={11} className="meta-icon" />
              <span className="meta-venue-text">
                {venueLabel.split(',')[0]}
              </span>
            </div>
            {matchDateFormatted && (
              <div className="footer-meta-item">
                <Calendar size={11} className="meta-icon" />
                <span>{matchDateFormatted}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function KnockoutBracket() {
  const { fixtures = [], teams = [] } = useTournament();
  const { isAuthenticated } = useAuth();

  if (!fixtures || fixtures.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '56px 24px', textAlign: 'center', background: 'var(--surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>No Tournament Fixtures Yet</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '420px', margin: '0 auto 18px' }}>
          {isAuthenticated
            ? 'Add teams or schedule your first knockout matches in the Admin dashboard to build the tournament bracket.'
            : 'Fixtures and tournament bracket will appear once scheduled by tournament officials.'}
        </p>
        {isAuthenticated && (
          <a href="/xyzabc?tab=teams" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            Add Teams in Admin →
          </a>
        )}
      </div>
    );
  }

  // 1. Deduplicate fixtures so duplicate slot entries are cleanly merged
  const { deduplicatedFixtures } = deduplicateFixturesList(fixtures);

  // 2. Identify active stages present in this tournament
  const hasR16 = deduplicatedFixtures.some(f => parseStageInfo(f.round).stage === 'r16');
  const hasQuarter = deduplicatedFixtures.some(f => parseStageInfo(f.round).stage === 'quarter');
  const hasSemi = deduplicatedFixtures.some(f => parseStageInfo(f.round).stage === 'semi');

  const phaseDefinitions = [];
  if (hasR16) {
    phaseDefinitions.push({ name: 'Round of 16', stage: 'r16' });
  }
  if (hasQuarter || hasR16) {
    phaseDefinitions.push({ name: 'Quarter-Finals', stage: 'quarter' });
  }
  if (hasSemi || hasQuarter || hasR16) {
    phaseDefinitions.push({ name: 'Semi-Finals', stage: 'semi' });
  }
  phaseDefinitions.push({ name: 'Final', stage: 'final' });

  // 3. Build active phases sorted by match number
  const activePhases = phaseDefinitions.map(phaseDef => {
    const matches = deduplicatedFixtures
      .filter(f => parseStageInfo(f.round).stage === phaseDef.stage)
      .sort((a, b) => {
        const infoA = parseStageInfo(a.round);
        const infoB = parseStageInfo(b.round);
        return infoA.matchNum - infoB.matchNum;
      });

    return {
      name: phaseDef.name,
      stage: phaseDef.stage,
      matches,
      isEmpty: matches.length === 0,
    };
  });

  return (
    <div className="bracket-wrapper">
      <div className="bracket-swipe-tip">
        <span>👈 Swipe horizontally to view full knockout tournament tree 👉</span>
      </div>
      <div className="bracket-scroll-container">
        <div className="bracket">
          {activePhases.map((phase) => {
            // Group into pairs for bracket connectors
            const pairs = [];
            for (let i = 0; i < phase.matches.length; i += 2) {
              pairs.push(phase.matches.slice(i, i + 2));
            }

            return (
              <div key={phase.name} className={`bracket-column ${phase.isEmpty ? 'bracket-column--empty' : ''} ${phase.stage === 'final' ? 'bracket-column--final' : ''}`}>
                <div className={`bracket-column-header ${phase.stage === 'final' ? 'column-header--final' : ''}`}>
                  <div className="phase-header-badge">
                    <span className="phase-icon">{getPhaseIcon(phase.stage)}</span>
                    <span className="phase-title">{phase.name}</span>
                  </div>
                  <span className="phase-match-count">
                    {phase.matches.length} {phase.matches.length === 1 ? 'Match' : 'Matches'}
                  </span>
                </div>

                <div className="bracket-matches">
                  {pairs.map((pair, idx) => (
                    <div key={idx} className={`bracket-match-pair ${pair.length === 1 ? 'single-match' : ''}`}>
                      {pair.map((m) => (
                        <div key={m.id} className="bracket-match-wrapper">
                          <BracketMatch match={m} teams={teams} />
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
  );
}

