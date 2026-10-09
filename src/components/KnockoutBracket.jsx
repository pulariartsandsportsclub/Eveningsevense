import { useTournament } from '../context/TournamentContext';
import { deduplicateFixturesList, parseStageInfo } from '../utils/bracketProgression';
import './KnockoutBracket.css';

function BracketMatch({ match }) {
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

  return (
    <div className={`bracket-match glass-card ${isLive ? 'bracket-match--live' : ''} ${isPostponed ? 'bracket-match--postponed' : ''}`}>
      <div className="bracket-match-header">
        <span className="bracket-round">{match.round}</span>
        {isLive && <span className="badge badge-live" style={{ fontSize: '9px', padding: '1px 5px' }}>Live</span>}
        {isCompleted && (
          <span className="badge badge-completed" style={{ fontSize: '9px', padding: '1px 5px' }}>
            {hasPenalties ? 'FT (Pen)' : 'FT'}
          </span>
        )}
        {isPostponed && <span className="badge badge-postponed" style={{ fontSize: '9px', padding: '1px 5px' }}>Postponed</span>}
      </div>

      <div className="bracket-teams">
        <div className={`bracket-team ${isHomeWinner ? 'winner' : ''}`}>
          <span className="bracket-team-name" title={match.homeTeam}>{match.homeTeam}</span>
          <div className="bracket-score-wrap">
            {hasPenalties && <span className="bracket-penalty-badge" title="Penalty Shootout">({match.homePenalty})</span>}
            <span className="bracket-score">{isCompleted ? match.homeScore : '-'}</span>
          </div>
        </div>
        <div className={`bracket-team ${isAwayWinner ? 'winner' : ''}`}>
          <span className="bracket-team-name" title={match.awayTeam}>{match.awayTeam}</span>
          <div className="bracket-score-wrap">
            {hasPenalties && <span className="bracket-penalty-badge" title="Penalty Shootout">({match.awayPenalty})</span>}
            <span className="bracket-score">{isCompleted ? match.awayScore : '-'}</span>
          </div>
        </div>
      </div>

      <div className="bracket-match-footer">
        {isPostponed ? (
          <span style={{ color: 'var(--warning, #B45309)', fontWeight: 600 }}>
            ⏳ {match.postponedReason || 'Match Postponed'}
          </span>
        ) : (
          <span>
            {new Date(match.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} • {match.time}
          </span>
        )}
      </div>
    </div>
  );
}

export default function KnockoutBracket() {
  const { fixtures = [] } = useTournament();

  if (!fixtures || fixtures.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '56px 24px', textAlign: 'center', background: 'var(--surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>No Tournament Fixtures Yet</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '420px', margin: '0 auto 18px' }}>
          Add teams or schedule your first knockout matches in the Admin dashboard to build the tournament bracket.
        </p>
        <a href="/admin?tab=teams" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          Add Teams in Admin →
        </a>
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
              <div key={phase.name} className={`bracket-column ${phase.isEmpty ? 'bracket-column--empty' : ''}`}>
                <h3 className="bracket-column-title">{phase.name}</h3>
                <div className="bracket-matches">
                  {pairs.map((pair, idx) => (
                    <div key={idx} className={`bracket-match-pair ${pair.length === 1 ? 'single-match' : ''}`}>
                      {pair.map((m) => (
                        <div key={m.id} className="bracket-match-wrapper">
                          <BracketMatch match={m} />
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
