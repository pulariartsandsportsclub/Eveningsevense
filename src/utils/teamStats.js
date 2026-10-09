import { getTeamPlayers } from '../data/defaultSquads';

export function getTeamAnalytics(team, fixtures = [], results = [], scorers = []) {
  if (!team) return null;

  const teamName = team.name;

  // Filter completed matches
  const teamResults = results.filter(
    r => r.homeTeam?.toLowerCase() === teamName.toLowerCase() ||
         r.awayTeam?.toLowerCase() === teamName.toLowerCase()
  );

  let won = 0;
  let drawn = 0;
  let lost = 0;
  let gf = 0;
  let ga = 0;
  let cleanSheets = 0;
  const form = [];

  // Sort chronological for form
  const sortedResults = [...teamResults].sort((a, b) => new Date(a.date) - new Date(b.date));

  sortedResults.forEach(r => {
    const isHome = r.homeTeam?.toLowerCase() === teamName.toLowerCase();
    const myScore = Number(isHome ? r.homeScore : r.awayScore) || 0;
    const oppScore = Number(isHome ? r.awayScore : r.homeScore) || 0;
    const myPen = Number(isHome ? r.homePenalty : r.awayPenalty);
    const oppPen = Number(isHome ? r.awayPenalty : r.homePenalty);

    gf += myScore;
    ga += oppScore;
    if (oppScore === 0) cleanSheets += 1;

    if (myScore > oppScore) {
      won += 1;
      form.push('W');
    } else if (oppScore > myScore) {
      lost += 1;
      form.push('L');
    } else {
      // Tie - check penalties if any
      if (!isNaN(myPen) && !isNaN(oppPen) && myPen !== oppPen) {
        if (myPen > oppPen) {
          won += 1;
          form.push('W');
        } else {
          lost += 1;
          form.push('L');
        }
      } else {
        drawn += 1;
        form.push('D');
      }
    }
  });

  // If results array has no data yet, fallback to team object stats if available
  const hasResultRecords = teamResults.length > 0;
  const finalPlayed = hasResultRecords ? teamResults.length : (Number(team.played) || 0);
  const finalWon = hasResultRecords ? won : (Number(team.won) || 0);
  const finalDrawn = hasResultRecords ? drawn : (Number(team.drawn) || 0);
  const finalLost = hasResultRecords ? lost : (Number(team.lost) || 0);
  const finalGF = hasResultRecords ? gf : (Number(team.gf) || 0);
  const finalGA = hasResultRecords ? ga : (Number(team.ga) || 0);
  const finalGD = finalGF - finalGA;
  const finalPoints = hasResultRecords ? (finalWon * 3 + finalDrawn) : (Number(team.points) || 0);
  const winRate = finalPlayed > 0 ? Math.round((finalWon / finalPlayed) * 100) : 0;

  // Upcoming / Live fixtures
  const teamUpcoming = fixtures
    .filter(f => (f.status === 'upcoming' || f.status === 'live') &&
                 (f.homeTeam?.toLowerCase() === teamName.toLowerCase() ||
                  f.awayTeam?.toLowerCase() === teamName.toLowerCase()))
    .sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`) - new Date(`${b.date}T${b.time || '00:00'}`));

  const nextMatch = teamUpcoming[0] || null;
  const lastMatch = [...teamResults].sort((a, b) => new Date(b.date) - new Date(a.date))[0] || null;

  // Knockout status determination
  let status = 'active'; // 'active' | 'champion' | 'eliminated'
  const isFinalResult = teamResults.find(r => r.round?.toLowerCase().includes('final') && !r.round?.toLowerCase().includes('semi') && !r.round?.toLowerCase().includes('quarter'));
  if (isFinalResult) {
    const isHome = isFinalResult.homeTeam?.toLowerCase() === teamName.toLowerCase();
    const myScore = isHome ? isFinalResult.homeScore : isFinalResult.awayScore;
    const oppScore = isHome ? isFinalResult.awayScore : isFinalResult.homeScore;
    if (myScore > oppScore) {
      status = 'champion';
    } else {
      status = 'eliminated';
    }
  } else if (teamUpcoming.length > 0) {
    status = 'active';
  } else if (finalLost > 0 && teamUpcoming.length === 0 && teamResults.length > 0) {
    status = 'eliminated';
  }

  // Players
  const players = getTeamPlayers(team);

  // Scorers associated with this team
  const teamScorers = scorers.filter(
    s => s.team?.toLowerCase() === teamName.toLowerCase()
  ).sort((a, b) => (b.goals || 0) - (a.goals || 0));

  const topScorer = teamScorers[0] || null;

  return {
    team,
    played: finalPlayed,
    won: finalWon,
    drawn: finalDrawn,
    lost: finalLost,
    gf: finalGF,
    ga: finalGA,
    gd: finalGD,
    points: finalPoints,
    winRate,
    cleanSheets,
    form: form.slice(-5), // Last 5 matches
    status,
    nextMatch,
    lastMatch,
    upcomingCount: teamUpcoming.length,
    teamUpcoming,
    teamResults: [...teamResults].sort((a, b) => new Date(b.date) - new Date(a.date)),
    players,
    teamScorers,
    topScorer,
  };
}
