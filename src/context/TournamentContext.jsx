// Tournament Context — Neon PostgreSQL + LocalStorage Offline Cache (Knockout Format + Finances)
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchAllTournamentDataFromDb,
  upsertTeamInDb,
  deleteTeamFromDb,
  upsertFixtureInDb,
  saveFixturesBatchInDb,
  deleteFixtureFromDb,
  upsertResultInDb,
  deleteResultFromDb,
  upsertScorerInDb,
  deleteScorerFromDb,
  upsertFinanceInDb,
  deleteFinanceFromDb,
  clearAllDatabaseData,
  testDbConnection
} from '../services/neonDb';

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

// Clean initial state — No dummy data
const EMPTY_DATA = {
  teams: [],
  fixtures: [],
  results: [],
  scorers: [],
  finances: [],
};

const STORAGE_KEY = 'eveningplay_tournament_v7_clean';

function loadFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.teams) {
        parsed.teams = parsed.teams.map(({ group: _g, ...rest }) => rest);
      }
      return parsed;
    }
  } catch (_e) { /* ignore */ }
  return null;
}

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (_e) { /* ignore */ }
}

function genId() {
  return '_' + Math.random().toString(36).slice(2, 11);
}

export function TournamentProvider({ children }) {
  const [data, setData] = useState(() => loadFromStorage() || EMPTY_DATA);
  const [dbStatus, setDbStatus] = useState('connecting'); // 'connecting' | 'connected' | 'offline' | 'syncing'
  const [toasts, setToasts] = useState([]);
  const hasLoadedDb = useRef(false);

  // Synchronize localStorage cache whenever state updates
  useEffect(() => {
    saveToStorage(data);
  }, [data]);

  // ===== Toast Notification =====
  const showToast = useCallback((message, type = 'success') => {
    const id = genId();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  // ===== Load data from Neon PostgreSQL =====
  const loadDbData = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setDbStatus('syncing');
      const ping = await testDbConnection();
      if (!ping.success) {
        console.warn('Neon DB not reachable, using local data fallback.', ping.error);
        setDbStatus('offline');
        if (isManualRefresh) showToast('Could not reach Neon DB. Using offline cache.', 'error');
        return;
      }

      const dbData = await fetchAllTournamentDataFromDb();
      if (dbData) {
        setData({
          teams: dbData.teams || [],
          fixtures: dbData.fixtures || [],
          results: dbData.results || [],
          scorers: dbData.scorers || [],
          finances: dbData.finances || [],
        });
        setDbStatus('connected');
        if (isManualRefresh) showToast('Data synced with Neon PostgreSQL!');
      }
    } catch (err) {
      console.error('Failed loading data from Neon DB:', err);
      setDbStatus('offline');
      if (isManualRefresh) showToast('Failed syncing with Neon DB.', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    if (!hasLoadedDb.current) {
      hasLoadedDb.current = true;
      loadDbData();
    }
  }, [loadDbData]);

  // ===== Teams & Automatic Fixture Creation =====
  const addTeam = useCallback((team, customOpponent = '') => {
    const newTeamId = genId();
    const newTeam = { 
      ...team, 
      id: newTeamId,
      players: team.players || []
    };

    setData(prev => {
      const updatedFixtures = [...prev.fixtures];
      let fixtureSummary = '';

      if (customOpponent && customOpponent !== 'auto' && customOpponent !== 'TBD') {
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

      upsertTeamInDb(newTeam).catch(e => console.error('Error saving team to Neon:', e));
      saveFixturesBatchInDb(updatedFixtures).catch(e => console.error('Error saving fixtures to Neon:', e));

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
      const changedTeam = updatedTeams.find(t => t.id === id);

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
        saveFixturesBatchInDb(updatedFixtures).catch(e => console.error('Error updating fixtures in Neon:', e));
      }

      if (changedTeam) {
        upsertTeamInDb(changedTeam).catch(e => console.error('Error updating team in Neon:', e));
      }

      return { ...prev, teams: updatedTeams, fixtures: updatedFixtures, results: updatedResults };
    });
    showToast('Team updated!');
  }, [showToast]);

  const deleteTeam = useCallback((id) => {
    setData(prev => {
      const toDelete = prev.teams.find(t => t.id === id);
      const filteredTeams = prev.teams.filter(t => t.id !== id);
      const updatedFixtures = prev.fixtures.map(f => {
        if (!toDelete) return f;
        if (f.homeTeam === toDelete.name) return { ...f, homeTeam: 'TBD' };
        if (f.awayTeam === toDelete.name) return { ...f, awayTeam: 'TBD' };
        return f;
      }).filter(f => !(f.homeTeam === 'TBD' && f.awayTeam === 'TBD'));

      deleteTeamFromDb(id).catch(e => console.error('Error deleting team in Neon:', e));
      saveFixturesBatchInDb(updatedFixtures).catch(e => console.error('Error updating fixtures in Neon:', e));

      return { ...prev, teams: filteredTeams, fixtures: updatedFixtures };
    });
    showToast('Team deleted and fixtures adjusted.', 'error');
  }, [showToast]);

  // ===== Fixtures =====
  const addFixture = useCallback((fixture) => {
    const newFix = { ...fixture, id: genId(), status: fixture.status || 'upcoming' };
    setData(prev => ({
      ...prev,
      fixtures: [...prev.fixtures, newFix],
    }));
    upsertFixtureInDb(newFix).catch(e => console.error('Error adding fixture in Neon:', e));
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
      let nextMatchToSave = null;
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
            const hp = updatedMatch.homePenalty !== undefined && updatedMatch.homePenalty !== '' ? parseInt(updatedMatch.homePenalty, 10) : null;
            const ap = updatedMatch.awayPenalty !== undefined && updatedMatch.awayPenalty !== '' ? parseInt(updatedMatch.awayPenalty, 10) : null;
            if (hp !== null && ap !== null && !isNaN(hp) && !isNaN(ap)) {
              if (hp > ap) winner = updatedMatch.homeTeam;
              else if (ap > hp) winner = updatedMatch.awayTeam;
              else winner = null;
            }
          }

          const nextIdx = fixtures.findIndex(f => f.id === updatedMatch.nextMatchId);
          if (nextIdx !== -1 && winner) {
            fixtures[nextIdx] = {
              ...fixtures[nextIdx],
              [updatedMatch.nextMatchSlot]: winner
            };
            nextMatchToSave = fixtures[nextIdx];
          }
        }
      } else if (prevMatch.status === 'completed' && updatedMatch.status !== 'completed') {
        if (updatedMatch.nextMatchId) {
          const nextIdx = fixtures.findIndex(f => f.id === updatedMatch.nextMatchId);
          if (nextIdx !== -1) {
            fixtures[nextIdx] = {
              ...fixtures[nextIdx],
              [updatedMatch.nextMatchSlot]: 'TBD'
            };
            nextMatchToSave = fixtures[nextIdx];
          }
        }
      }

      // Synchronize results array
      let results = [...(prev.results || [])].filter(r => r.id !== id && r.fixtureId !== id);
      let resultToSave = null;
      if (updatedMatch.status === 'completed') {
        const hp = updatedMatch.homePenalty !== undefined && updatedMatch.homePenalty !== '' ? parseInt(updatedMatch.homePenalty, 10) : undefined;
        const ap = updatedMatch.awayPenalty !== undefined && updatedMatch.awayPenalty !== '' ? parseInt(updatedMatch.awayPenalty, 10) : undefined;
        resultToSave = {
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
        };
        results.unshift(resultToSave);
      } else {
        deleteResultFromDb(id).catch(e => console.error('Error removing result from Neon:', e));
      }

      // Synchronize new scorers
      let scorers = [...prev.scorers];
      if (updates.newScorers && Array.isArray(updates.newScorers)) {
        updates.newScorers.forEach(sc => {
          if (!sc.name || !sc.name.trim()) return;
          const existIdx = scorers.findIndex(s => s.name.toLowerCase() === sc.name.trim().toLowerCase() && s.team === sc.team);
          let targetScorer;
          if (existIdx !== -1) {
            targetScorer = {
              ...scorers[existIdx],
              goals: (scorers[existIdx].goals || 0) + (parseInt(sc.goals, 10) || 1),
            };
            scorers[existIdx] = targetScorer;
          } else {
            targetScorer = {
              id: genId(),
              name: sc.name.trim(),
              team: sc.team,
              teamBadge: sc.teamBadge || '#156637',
              goals: parseInt(sc.goals, 10) || 1,
              assists: 0,
            };
            scorers.push(targetScorer);
          }
          upsertScorerInDb(targetScorer).catch(e => console.error('Error saving scorer to Neon:', e));
        });
      }

      // Persist to Neon DB
      upsertFixtureInDb(updatedMatch).catch(e => console.error('Error saving fixture to Neon:', e));
      if (nextMatchToSave) {
        upsertFixtureInDb(nextMatchToSave).catch(e => console.error('Error saving next match to Neon:', e));
      }
      if (resultToSave) {
        upsertResultInDb(resultToSave).catch(e => console.error('Error saving result to Neon:', e));
      }

      return { ...prev, fixtures, results, scorers };
    });
    showToast('Fixture updated successfully!');
  }, [showToast]);

  const deleteFixture = useCallback((id) => {
    setData(prev => ({ ...prev, fixtures: prev.fixtures.filter(f => f.id !== id) }));
    deleteFixtureFromDb(id).catch(e => console.error('Error deleting fixture from Neon:', e));
    showToast('Fixture deleted.', 'error');
  }, [showToast]);

  // ===== Results =====
  const addResult = useCallback((result) => {
    const newRes = { ...result, id: genId() };
    setData(prev => ({ ...prev, results: [...prev.results, newRes] }));
    upsertResultInDb(newRes).catch(e => console.error('Error saving result to Neon:', e));
    showToast('Match result recorded!');
  }, [showToast]);

  const updateResult = useCallback((id, updates) => {
    setData(prev => {
      const updatedResults = prev.results.map(r => r.id === id ? { ...r, ...updates } : r);
      const changed = updatedResults.find(r => r.id === id);
      if (changed) {
        upsertResultInDb(changed).catch(e => console.error('Error updating result in Neon:', e));
      }
      return { ...prev, results: updatedResults };
    });
    showToast('Result updated!');
  }, [showToast]);

  const deleteResult = useCallback((id) => {
    setData(prev => ({ ...prev, results: prev.results.filter(r => r.id !== id) }));
    deleteResultFromDb(id).catch(e => console.error('Error deleting result in Neon:', e));
    showToast('Result deleted.', 'error');
  }, [showToast]);

  // ===== Scorers =====
  const addScorer = useCallback((scorer) => {
    const newScorer = { ...scorer, id: genId() };
    setData(prev => ({ ...prev, scorers: [...prev.scorers, newScorer] }));
    upsertScorerInDb(newScorer).catch(e => console.error('Error saving scorer to Neon:', e));
    showToast('Scorer added!');
  }, [showToast]);

  const updateScorer = useCallback((id, updates) => {
    setData(prev => {
      const updatedScorers = prev.scorers.map(s => s.id === id ? { ...s, ...updates } : s);
      const changed = updatedScorers.find(s => s.id === id);
      if (changed) {
        upsertScorerInDb(changed).catch(e => console.error('Error updating scorer in Neon:', e));
      }
      return { ...prev, scorers: updatedScorers };
    });
    showToast('Scorer updated!');
  }, [showToast]);

  const deleteScorer = useCallback((id) => {
    setData(prev => ({ ...prev, scorers: prev.scorers.filter(s => s.id !== id) }));
    deleteScorerFromDb(id).catch(e => console.error('Error deleting scorer in Neon:', e));
    showToast('Scorer deleted.', 'error');
  }, [showToast]);

  // ===== Finances =====
  const addFinanceTransaction = useCallback((transaction) => {
    const newTx = {
      ...transaction,
      id: genId(),
      amount: Number(transaction.amount) || 0,
    };
    setData(prev => ({
      ...prev,
      finances: [newTx, ...(prev.finances || [])],
    }));
    upsertFinanceInDb(newTx).catch(e => console.error('Error saving finance to Neon:', e));
    showToast(`${transaction.type === 'income' ? 'Income' : 'Expense'} recorded: ₹${Number(transaction.amount).toLocaleString('en-IN')}`);
  }, [showToast]);

  const updateFinanceTransaction = useCallback((id, updates) => {
    setData(prev => {
      const currentList = prev.finances || [];
      const updatedFinances = currentList.map(item => item.id === id ? { ...item, ...updates, amount: Number(updates.amount !== undefined ? updates.amount : item.amount) } : item);
      const changed = updatedFinances.find(f => f.id === id);
      if (changed) {
        upsertFinanceInDb(changed).catch(e => console.error('Error updating finance in Neon:', e));
      }
      return { ...prev, finances: updatedFinances };
    });
    showToast('Transaction updated!');
  }, [showToast]);

  const deleteFinanceTransaction = useCallback((id) => {
    setData(prev => ({
      ...prev,
      finances: (prev.finances || []).filter(item => item.id !== id),
    }));
    deleteFinanceFromDb(id).catch(e => console.error('Error deleting finance in Neon:', e));
    showToast('Transaction removed.', 'error');
  }, [showToast]);

  const resetData = useCallback(async () => {
    setData(EMPTY_DATA);
    setDbStatus('syncing');
    try {
      await clearAllDatabaseData();
      setDbStatus('connected');
      showToast('All tournament data and finances cleared from Neon DB');
    } catch (e) {
      console.error('Error clearing database:', e);
      setDbStatus('offline');
      showToast('Cleared locally, but failed to sync to Neon DB.', 'error');
    }
  }, [showToast]);

  const value = {
    ...data,
    finances: data.finances || [],
    dbStatus,
    refreshDb: () => loadDbData(true),
    addTeam, updateTeam, deleteTeam,
    addFixture, updateFixture, deleteFixture,
    addResult, updateResult, deleteResult,
    addScorer, updateScorer, deleteScorer,
    addFinanceTransaction, updateFinanceTransaction, deleteFinanceTransaction,
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
