// Tournament Context — Central state + localStorage persistence (Knockout Format)
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const TournamentContext = createContext(null);

const KERALA_VENUES = [
  'EMS Stadium, Kozhikode',
  'Jawaharlal Nehru Stadium, Kochi',
  'Malappuram Sevens Ground',
  'Chandrasekharan Nair Stadium, Trivandrum',
];

function getNextMatchDate(fixtures) {
  if (!fixtures || fixtures.length === 0) return '2026-10-14';
  const validDates = fixtures.map(f => f.date).filter(Boolean).sort();
  const latestDate = validDates[validDates.length - 1] || '2026-10-14';
  const d = new Date(latestDate);
  d.setDate(d.getDate() + 2);
  return d.toISOString().split('T')[0];
}

function getNextVenue(fixtures) {
  const idx = (fixtures ? fixtures.length : 0) % KERALA_VENUES.length;
  return KERALA_VENUES[idx];
}

function getNextKnockoutRound(fixtures) {
  const count = fixtures ? fixtures.length : 0;
  if (count < 4) return `Quarter-Final ${count + 1}`;
  if (count < 6) return `Semi-Final ${(count - 4) + 1}`;
  return 'Final';
}

// ===== SEED DATA (Knockout Format — No Groups) =====
const SEED_DATA = {
  teams: [
    { id: 't1', name: 'Real Madrid', badge: '#FFFFFF', played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 },
    { id: 't2', name: 'Barcelona', badge: '#A50044', played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 },
    { id: 't3', name: 'Bayern Munich', badge: '#DC052D', played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 },
    { id: 't4', name: 'Manchester City', badge: '#6CABDD', played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 },
    { id: 't5', name: 'Arsenal', badge: '#EF0107', played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 },
    { id: 't6', name: 'Liverpool', badge: '#C8102E', played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 },
    { id: 't7', name: 'Paris Saint-Germain', badge: '#004170', played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 },
    { id: 't8', name: 'Juventus', badge: '#000000', played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 },
    { id: 't9', name: 'AC Milan', badge: '#FB090B', played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 },
    { id: 't10', name: 'Inter Milan', badge: '#0018A8', played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 },
    { id: 't11', name: 'Borussia Dortmund', badge: '#FDE100', played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 },
    { id: 't12', name: 'Atletico Madrid', badge: '#CB3524', played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 },
    { id: 't13', name: 'Chelsea', badge: '#034694', played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 },
    { id: 't14', name: 'Manchester United', badge: '#DA291C', played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 },
    { id: 't15', name: 'Napoli', badge: '#12A0D7', played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 },
    { id: 't16', name: 'Ajax', badge: '#D2122E', played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 },
  ],
  fixtures: [
    { id: 'f1', round: 'Round of 16', homeTeam: 'Real Madrid', awayTeam: 'Ajax', date: '2026-10-15', time: '20:00', venue: 'EMS Stadium', status: 'upcoming', nextMatchId: 'f9', nextMatchSlot: 'homeTeam' },
    { id: 'f2', round: 'Round of 16', homeTeam: 'Barcelona', awayTeam: 'Napoli', date: '2026-10-15', time: '22:00', venue: 'Jawaharlal Nehru Stadium', status: 'upcoming', nextMatchId: 'f9', nextMatchSlot: 'awayTeam' },
    { id: 'f3', round: 'Round of 16', homeTeam: 'Bayern Munich', awayTeam: 'Manchester United', date: '2026-10-16', time: '20:00', venue: 'Malappuram Ground', status: 'upcoming', nextMatchId: 'f10', nextMatchSlot: 'homeTeam' },
    { id: 'f4', round: 'Round of 16', homeTeam: 'Manchester City', awayTeam: 'Chelsea', date: '2026-10-16', time: '22:00', venue: 'Chandrasekharan Nair', status: 'upcoming', nextMatchId: 'f10', nextMatchSlot: 'awayTeam' },
    { id: 'f5', round: 'Round of 16', homeTeam: 'Arsenal', awayTeam: 'Atletico Madrid', date: '2026-10-17', time: '20:00', venue: 'EMS Stadium', status: 'upcoming', nextMatchId: 'f11', nextMatchSlot: 'homeTeam' },
    { id: 'f6', round: 'Round of 16', homeTeam: 'Liverpool', awayTeam: 'Borussia Dortmund', date: '2026-10-17', time: '22:00', venue: 'Jawaharlal Nehru Stadium', status: 'upcoming', nextMatchId: 'f11', nextMatchSlot: 'awayTeam' },
    { id: 'f7', round: 'Round of 16', homeTeam: 'Paris Saint-Germain', awayTeam: 'Inter Milan', date: '2026-10-18', time: '20:00', venue: 'Malappuram Ground', status: 'upcoming', nextMatchId: 'f12', nextMatchSlot: 'homeTeam' },
    { id: 'f8', round: 'Round of 16', homeTeam: 'Juventus', awayTeam: 'AC Milan', date: '2026-10-18', time: '22:00', venue: 'Chandrasekharan Nair', status: 'upcoming', nextMatchId: 'f12', nextMatchSlot: 'awayTeam' },
    { id: 'f9', round: 'Quarter-Finals', homeTeam: 'TBD', awayTeam: 'TBD', date: '2026-10-20', time: '20:00', venue: 'EMS Stadium', status: 'upcoming', nextMatchId: 'f13', nextMatchSlot: 'homeTeam' },
    { id: 'f10', round: 'Quarter-Finals', homeTeam: 'TBD', awayTeam: 'TBD', date: '2026-10-20', time: '22:00', venue: 'Jawaharlal Nehru Stadium', status: 'upcoming', nextMatchId: 'f13', nextMatchSlot: 'awayTeam' },
    { id: 'f11', round: 'Quarter-Finals', homeTeam: 'TBD', awayTeam: 'TBD', date: '2026-10-21', time: '20:00', venue: 'Malappuram Ground', status: 'upcoming', nextMatchId: 'f14', nextMatchSlot: 'homeTeam' },
    { id: 'f12', round: 'Quarter-Finals', homeTeam: 'TBD', awayTeam: 'TBD', date: '2026-10-21', time: '22:00', venue: 'Chandrasekharan Nair', status: 'upcoming', nextMatchId: 'f14', nextMatchSlot: 'awayTeam' },
    { id: 'f13', round: 'Semi-Finals', homeTeam: 'TBD', awayTeam: 'TBD', date: '2026-10-24', time: '20:00', venue: 'EMS Stadium', status: 'upcoming', nextMatchId: 'f15', nextMatchSlot: 'homeTeam' },
    { id: 'f14', round: 'Semi-Finals', homeTeam: 'TBD', awayTeam: 'TBD', date: '2026-10-24', time: '22:00', venue: 'Jawaharlal Nehru Stadium', status: 'upcoming', nextMatchId: 'f15', nextMatchSlot: 'awayTeam' },
    { id: 'f15', round: 'Final', homeTeam: 'TBD', awayTeam: 'TBD', date: '2026-10-28', time: '20:00', venue: 'EMS Stadium', status: 'upcoming' },
  ],
  results: [],
  scorers: [],
};

const STORAGE_KEY = 'eveningplay_tournament_knockout_v5';

function loadFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Strip any legacy group fields
      if (parsed.teams) {
        parsed.teams = parsed.teams.map(({ group, ...rest }) => rest);
      }
      // Ensure completed fixtures are represented in results
      if (parsed.fixtures) {
        const completed = parsed.fixtures.filter(f => f.status === 'completed' && f.homeScore !== undefined);
        const existingResultIds = new Set((parsed.results || []).map(r => r.id || r.fixtureId));
        const backfilled = completed.filter(f => !existingResultIds.has(f.id)).map(f => ({
          id: f.id,
          fixtureId: f.id,
          round: f.round,
          homeTeam: f.homeTeam,
          awayTeam: f.awayTeam,
          homeScore: parseInt(f.homeScore, 10),
          awayScore: parseInt(f.awayScore, 10),
          homePenalty: f.homePenalty !== undefined && f.homePenalty !== '' ? parseInt(f.homePenalty, 10) : undefined,
          awayPenalty: f.awayPenalty !== undefined && f.awayPenalty !== '' ? parseInt(f.awayPenalty, 10) : undefined,
          date: f.date,
          time: f.time,
          venue: f.venue,
          scorers: f.scorers || [],
        }));
        parsed.results = [...(parsed.results || []), ...backfilled];
      }
      return parsed;
    }
  } catch (e) { /* ignore */ }
  return null;
}

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) { /* ignore */ }
}

function genId() {
  return '_' + Math.random().toString(36).slice(2, 11);
}

export function TournamentProvider({ children }) {
  const [data, setData] = useState(() => loadFromStorage() || SEED_DATA);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    saveToStorage(data);
  }, [data]);

  // ===== Toast Notification =====
  const showToast = useCallback((message, type = 'success') => {
    const id = genId();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  // ===== Teams & Automatic Fixture Creation =====
  const addTeam = useCallback((team, customOpponent = '') => {
    const newTeamId = genId();
    const newTeam = { ...team, id: newTeamId };

    setData(prev => {
      const updatedFixtures = [...prev.fixtures];
      let fixtureSummary = '';

      if (customOpponent && customOpponent !== 'auto' && customOpponent !== 'TBD') {
        // Paired with an explicitly selected team
        const newFix = {
          id: genId(),
          round: getNextKnockoutRound(updatedFixtures),
          homeTeam: team.name,
          awayTeam: customOpponent,
          date: getNextMatchDate(updatedFixtures),
          time: '16:30',
          venue: getNextVenue(updatedFixtures),
          status: 'upcoming',
        };
        updatedFixtures.push(newFix);
        fixtureSummary = `${team.name} vs ${customOpponent}`;
      } else {
        // 1. Check if there is an existing fixture waiting for an opponent (with 'TBD')
        const tbdIdx = updatedFixtures.findIndex(f => f.status === 'upcoming' && (f.awayTeam === 'TBD' || f.homeTeam === 'TBD'));

        if (tbdIdx !== -1) {
          const waiting = updatedFixtures[tbdIdx];
          if (waiting.awayTeam === 'TBD') {
            updatedFixtures[tbdIdx] = { ...waiting, awayTeam: team.name };
            fixtureSummary = `${waiting.homeTeam} vs ${team.name}`;
          } else {
            updatedFixtures[tbdIdx] = { ...waiting, homeTeam: team.name };
            fixtureSummary = `${team.name} vs ${waiting.awayTeam}`;
          }
        } else {
          // 2. Check if there is any team in prev.teams not currently in an upcoming fixture
          const scheduled = new Set();
          updatedFixtures.filter(f => f.status === 'upcoming').forEach(f => {
            scheduled.add(f.homeTeam);
            scheduled.add(f.awayTeam);
          });

          const availableOpponent = prev.teams.find(t => !scheduled.has(t.name) && t.name !== team.name);

          if (availableOpponent) {
            const newFix = {
              id: genId(),
              round: getNextKnockoutRound(updatedFixtures),
              homeTeam: availableOpponent.name,
              awayTeam: team.name,
              date: getNextMatchDate(updatedFixtures),
              time: '16:30',
              venue: getNextVenue(updatedFixtures),
              status: 'upcoming',
            };
            updatedFixtures.push(newFix);
            fixtureSummary = `${availableOpponent.name} vs ${team.name}`;
          } else {
            // 3. No opponent available yet: create a Knockout fixture with TBD
            const newFix = {
              id: genId(),
              round: getNextKnockoutRound(updatedFixtures),
              homeTeam: team.name,
              awayTeam: 'TBD',
              date: getNextMatchDate(updatedFixtures),
              time: '16:30',
              venue: getNextVenue(updatedFixtures),
              status: 'upcoming',
            };
            updatedFixtures.push(newFix);
            fixtureSummary = `${team.name} vs TBD`;
          }
        }
      }

      setTimeout(() => {
        showToast(`Team added & Knockout Fixture created: ${fixtureSummary}!`);
      }, 50);

      return {
        ...prev,
        teams: [...prev.teams, newTeam],
        fixtures: updatedFixtures,
      };
    });
  }, [showToast]);

  const updateTeam = useCallback((id, updates) => {
    setData(prev => {
      const oldTeam = prev.teams.find(t => t.id === id);
      const updatedTeams = prev.teams.map(t => t.id === id ? { ...t, ...updates } : t);

      // If team name changed, cascade name change to fixtures and results
      let updatedFixtures = prev.fixtures;
      let updatedResults = prev.results;
      if (oldTeam && updates.name && oldTeam.name !== updates.name) {
        updatedFixtures = prev.fixtures.map(f => ({
          ...f,
          homeTeam: f.homeTeam === oldTeam.name ? updates.name : f.homeTeam,
          awayTeam: f.awayTeam === oldTeam.name ? updates.name : f.awayTeam,
        }));
        updatedResults = prev.results.map(r => ({
          ...r,
          homeTeam: r.homeTeam === oldTeam.name ? updates.name : r.homeTeam,
          awayTeam: r.awayTeam === oldTeam.name ? updates.name : r.awayTeam,
        }));
      }

      return { ...prev, teams: updatedTeams, fixtures: updatedFixtures, results: updatedResults };
    });
    showToast('Team updated!');
  }, [showToast]);

  const deleteTeam = useCallback((id) => {
    setData(prev => {
      const toDelete = prev.teams.find(t => t.id === id);
      const filteredTeams = prev.teams.filter(t => t.id !== id);
      // Remove or set TBD in upcoming fixtures
      const updatedFixtures = prev.fixtures.map(f => {
        if (!toDelete) return f;
        if (f.homeTeam === toDelete.name) return { ...f, homeTeam: 'TBD' };
        if (f.awayTeam === toDelete.name) return { ...f, awayTeam: 'TBD' };
        return f;
      }).filter(f => !(f.homeTeam === 'TBD' && f.awayTeam === 'TBD'));

      return { ...prev, teams: filteredTeams, fixtures: updatedFixtures };
    });
    showToast('Team deleted and fixtures adjusted.', 'error');
  }, [showToast]);

  // ===== Fixtures =====
  const addFixture = useCallback((fixture) => {
    const id = genId();
    setData(prev => ({
      ...prev,
      fixtures: [...prev.fixtures, { ...fixture, id, status: fixture.status || 'upcoming' }],
    }));
    showToast(`Knockout Fixture added: ${fixture.homeTeam} vs ${fixture.awayTeam}`);
  }, [showToast]);

  const updateFixture = useCallback((id, updates) => {
    setData(prev => {
      let fixtures = [...prev.fixtures];
      const matchIdx = fixtures.findIndex(f => f.id === id);
      if (matchIdx === -1) return prev;
      
      const prevMatch = fixtures[matchIdx];
      const updatedMatch = { ...prevMatch, ...updates };
      fixtures[matchIdx] = updatedMatch;

      // Knockout Winner Progression (Auto-advance)
      if (updatedMatch.status === 'completed' && updatedMatch.homeScore !== undefined && updatedMatch.awayScore !== undefined) {
        if (updatedMatch.nextMatchId) {
          const h = parseInt(updatedMatch.homeScore, 10);
          const a = parseInt(updatedMatch.awayScore, 10);
          let winner = null;

          if (h > a) {
            winner = updatedMatch.homeTeam;
          } else if (a > h) {
            winner = updatedMatch.awayTeam;
          } else {
            // Tie - evaluated through penalty shootout
            const hp = updatedMatch.homePenalty !== undefined && updatedMatch.homePenalty !== '' ? parseInt(updatedMatch.homePenalty, 10) : null;
            const ap = updatedMatch.awayPenalty !== undefined && updatedMatch.awayPenalty !== '' ? parseInt(updatedMatch.awayPenalty, 10) : null;
            if (hp !== null && ap !== null && !isNaN(hp) && !isNaN(ap)) {
              if (hp > ap) winner = updatedMatch.homeTeam;
              else if (ap > hp) winner = updatedMatch.awayTeam;
              else winner = null; // Still tied
            }
          }

          const nextIdx = fixtures.findIndex(f => f.id === updatedMatch.nextMatchId);
          if (nextIdx !== -1 && winner) {
            fixtures[nextIdx] = {
              ...fixtures[nextIdx],
              [updatedMatch.nextMatchSlot]: winner
            };
          }
        }
      } else if (prevMatch.status === 'completed' && updatedMatch.status !== 'completed') {
        // Was completed before, but now changed to postponed or upcoming
        if (updatedMatch.nextMatchId) {
          const nextIdx = fixtures.findIndex(f => f.id === updatedMatch.nextMatchId);
          if (nextIdx !== -1) {
            fixtures[nextIdx] = {
              ...fixtures[nextIdx],
              [updatedMatch.nextMatchSlot]: 'TBD'
            };
          }
        }
      }

      // Synchronize results array for Dashboard & Results page
      let results = [...(prev.results || [])].filter(r => r.id !== id && r.fixtureId !== id);
      if (updatedMatch.status === 'completed') {
        const hp = updatedMatch.homePenalty !== undefined && updatedMatch.homePenalty !== '' ? parseInt(updatedMatch.homePenalty, 10) : undefined;
        const ap = updatedMatch.awayPenalty !== undefined && updatedMatch.awayPenalty !== '' ? parseInt(updatedMatch.awayPenalty, 10) : undefined;
        results.unshift({
          id: updatedMatch.id,
          fixtureId: updatedMatch.id,
          round: updatedMatch.round,
          homeTeam: updatedMatch.homeTeam,
          awayTeam: updatedMatch.awayTeam,
          homeScore: parseInt(updatedMatch.homeScore, 10),
          awayScore: parseInt(updatedMatch.awayScore, 10),
          homePenalty: hp,
          awayPenalty: ap,
          date: updatedMatch.date,
          time: updatedMatch.time,
          venue: updatedMatch.venue,
          scorers: updatedMatch.scorers || [],
        });
      }

      // Synchronize new scorers if provided
      let scorers = [...prev.scorers];
      if (updates.newScorers && Array.isArray(updates.newScorers)) {
        updates.newScorers.forEach(sc => {
          if (!sc.name || !sc.name.trim()) return;
          const existIdx = scorers.findIndex(s => s.name.toLowerCase() === sc.name.trim().toLowerCase() && s.team === sc.team);
          if (existIdx !== -1) {
            scorers[existIdx] = {
              ...scorers[existIdx],
              goals: (scorers[existIdx].goals || 0) + (parseInt(sc.goals, 10) || 1),
            };
          } else {
            scorers.push({
              id: genId(),
              name: sc.name.trim(),
              team: sc.team,
              teamBadge: sc.teamBadge || '#156637',
              goals: parseInt(sc.goals, 10) || 1,
              assists: 0,
            });
          }
        });
      }

      return { ...prev, fixtures, results, scorers };
    });
    showToast('Fixture updated successfully!');
  }, [showToast]);

  const deleteFixture = useCallback((id) => {
    setData(prev => ({ ...prev, fixtures: prev.fixtures.filter(f => f.id !== id) }));
    showToast('Fixture deleted.', 'error');
  }, [showToast]);

  // ===== Results =====
  const addResult = useCallback((result) => {
    setData(prev => ({ ...prev, results: [...prev.results, { ...result, id: genId() }] }));
    showToast('Match result recorded!');
  }, [showToast]);

  const updateResult = useCallback((id, updates) => {
    setData(prev => ({ ...prev, results: prev.results.map(r => r.id === id ? { ...r, ...updates } : r) }));
    showToast('Result updated!');
  }, [showToast]);

  const deleteResult = useCallback((id) => {
    setData(prev => ({ ...prev, results: prev.results.filter(r => r.id !== id) }));
    showToast('Result deleted.', 'error');
  }, [showToast]);

  // ===== Scorers =====
  const addScorer = useCallback((scorer) => {
    setData(prev => ({ ...prev, scorers: [...prev.scorers, { ...scorer, id: genId() }] }));
    showToast('Scorer added!');
  }, [showToast]);

  const updateScorer = useCallback((id, updates) => {
    setData(prev => ({ ...prev, scorers: prev.scorers.map(s => s.id === id ? { ...s, ...updates } : s) }));
    showToast('Scorer updated!');
  }, [showToast]);

  const deleteScorer = useCallback((id) => {
    setData(prev => ({ ...prev, scorers: prev.scorers.filter(s => s.id !== id) }));
    showToast('Scorer deleted.', 'error');
  }, [showToast]);

  const resetData = useCallback(() => {
    setData(SEED_DATA);
    showToast('Tournament data reset to Kerala Knockout defaults');
  }, [showToast]);

  const value = {
    ...data,
    addTeam, updateTeam, deleteTeam,
    addFixture, updateFixture, deleteFixture,
    addResult, updateResult, deleteResult,
    addScorer, updateScorer, deleteScorer,
    resetData,
    toasts,
  };

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament() {
  const ctx = useContext(TournamentContext);
  if (!ctx) throw new Error('useTournament must be used within TournamentProvider');
  return ctx;
}
