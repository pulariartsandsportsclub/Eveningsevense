import { useTournament } from '../context/TournamentContext';
import './KnockoutBracket.css';

function getPhaseIndex(roundName) {
  const r = (roundName || '').toLowerCase();
  if (r.includes('16')) return 0;
  if (r.includes('quarter') || r.includes('qf')) return 1;
  if (r.includes('semi') || r.includes('sf')) return 2;
  if (r.includes('third')) return -1; // Ignore 3rd place for main bracket
  if (r.includes('final')) return 3;
  return 0;
}

const PHASE_NAMES = ['Round of 16', 'Quarter-Finals', 'Semi-Finals', 'Final'];

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

  // Group by phase
  const phases = [[], [], [], []]; // 4 phases: R16, QF, SF, Final

  fixtures.forEach(m => {
    const pIdx = getPhaseIndex(m.round);
    if (pIdx >= 0 && pIdx < 4) {
      phases[pIdx].push(m);
    }
  });

  // Preserve tournament tree ordering by fixture ID (f1-f8, f9-f12, f13-f14, f15)
  // or by natural index so tree lines connect accurately
  const activePhases = phases.map((matches, i) => {
    const sorted = [...matches].sort((a, b) => {
      const numA = parseInt((a.id || '').replace(/\D/g, ''), 10) || 0;
      const numB = parseInt((b.id || '').replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });

    return {
      name: PHASE_NAMES[i],
      matches: sorted,
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
