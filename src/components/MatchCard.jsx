import './MatchCard.css';

function getScoreDisplay(result) {
  return `${result.homeScore} - ${result.awayScore}`;
}

export function ResultCard({ result, compact = false }) {
  const hs = Number(result.homeScore);
  const as = Number(result.awayScore);
  const hp = result.homePenalty !== undefined && result.homePenalty !== '' ? Number(result.homePenalty) : null;
  const ap = result.awayPenalty !== undefined && result.awayPenalty !== '' ? Number(result.awayPenalty) : null;

  const isTie = hs === as;
  const hasPenalties = isTie && hp !== null && ap !== null && !isNaN(hp) && !isNaN(ap);

  let winner = 'draw';
  if (hs > as) winner = 'home';
  else if (as > hs) winner = 'away';
  else if (hasPenalties) {
    if (hp > ap) winner = 'home';
    else if (ap > hp) winner = 'away';
  }

  return (
    <div className={`match-card glass-card result-card ${compact ? 'match-card--compact' : ''}`}>
      <div className="match-meta">
        <span className="badge badge-completed">
          {hasPenalties ? 'FT (PEN)' : 'FT'}
        </span>
        {result.round && <span className="badge badge-primary" style={{ fontSize: '10px' }}>{result.round}</span>}
        <span className="match-date">{new Date(result.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
      </div>
      <div className="match-teams">
        <div className={`team-side ${winner === 'home' ? 'team-side--winner' : ''}`}>
          <span className="team-name">{result.homeTeam}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="score-block">
            <span className="score-home">{result.homeScore}</span>
            <span className="score-sep">:</span>
            <span className="score-away">{result.awayScore}</span>
          </div>
          {hasPenalties && (
            <span className="score-penalties">
              {result.homePenalty} - {result.awayPenalty} (Pens)
            </span>
          )}
        </div>
        <div className={`team-side team-side--right ${winner === 'away' ? 'team-side--winner' : ''}`}>
          <span className="team-name">{result.awayTeam}</span>
        </div>
      </div>
      {!compact && result.scorers && result.scorers.length > 0 && (
        <div className="match-scorers">
          {result.scorers.map((s, i) => (
            <span key={i} className="scorer-pill">
              ⚽ {s.name} ({s.team}) ×{s.goals}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function FixtureCard({ fixture, compact = false }) {
  const isLive = fixture.status === 'live';
  const isPostponed = fixture.status === 'postponed';
  const isCompleted = fixture.status === 'completed';
  const matchDate = new Date(`${fixture.date}T${fixture.time || '16:30'}`);
  const isToday = matchDate.toDateString() === new Date().toDateString();

  const hs = fixture.homeScore !== undefined && fixture.homeScore !== '' ? Number(fixture.homeScore) : null;
  const as = fixture.awayScore !== undefined && fixture.awayScore !== '' ? Number(fixture.awayScore) : null;
  const hp = fixture.homePenalty !== undefined && fixture.homePenalty !== '' ? Number(fixture.homePenalty) : null;
  const ap = fixture.awayPenalty !== undefined && fixture.awayPenalty !== '' ? Number(fixture.awayPenalty) : null;
  const isTie = isCompleted && hs !== null && as !== null && hs === as;
  const hasPenalties = isTie && hp !== null && ap !== null && !isNaN(hp) && !isNaN(ap);

  return (
    <div className={`match-card glass-card fixture-card ${isPostponed ? 'fixture-card--postponed' : ''} ${compact ? 'match-card--compact' : ''}`}>
      <div className="match-meta">
        {isLive && <span className="badge badge-live">Live</span>}
        {isPostponed && <span className="badge badge-postponed">Postponed</span>}
        {isCompleted && <span className="badge badge-completed">{hasPenalties ? 'FT (Pen)' : 'FT'}</span>}
        {!isLive && !isPostponed && !isCompleted && <span className="badge badge-upcoming">Upcoming</span>}
        {fixture.round && <span className="badge badge-primary" style={{ fontSize: '10px' }}>{fixture.round}</span>}
        <span className="match-date">
          {isToday ? 'Today' : new Date(fixture.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          {fixture.time ? ` · ${fixture.time}` : ''}
        </span>
      </div>
      <div className="match-teams">
        <div className="team-side">
          <span className="team-name">{fixture.homeTeam}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {isCompleted ? (
            <>
              <div className="score-block">
                <span className="score-home">{fixture.homeScore}</span>
                <span className="score-sep">:</span>
                <span className="score-away">{fixture.awayScore}</span>
              </div>
              {hasPenalties && (
                <span className="score-penalties">
                  {fixture.homePenalty} - {fixture.awayPenalty} (Pens)
                </span>
              )}
            </>
          ) : (
            <div className="score-block fixture-vs">
              <span className="vs-text">VS</span>
            </div>
          )}
        </div>
        <div className="team-side team-side--right">
          <span className="team-name">{fixture.awayTeam}</span>
        </div>
      </div>
      {isPostponed && fixture.postponedReason && !compact && (
        <div className="match-postponed-note">
          ⚠️ {fixture.postponedReason}
        </div>
      )}
      {!compact && fixture.venue && (
        <div className="match-venue">
          📍 {fixture.venue}
        </div>
      )}
    </div>
  );
}
