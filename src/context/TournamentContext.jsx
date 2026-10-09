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
import { processKnockoutProgression } from '../utils/bracketProgression';

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

  // ===== Teams Management =====
  const addTeam = useCallback((team) => {
    const newTeamId = genId();
    const newTeam = {
      ...team,
      id: newTeamId,
      name: team.name ? team.name.trim() : 'Unnamed Club',
      badge: team.badge || '#156637',
      players: Array.isArray(team.players) ? team.players : [],
      played: team.played || 0,
      won: team.won || 0,
      drawn: team.drawn || 0,
      lost: team.lost || 0,
      gf: team.gf || 0,
      ga: team.ga || 0,
      points: team.points || 0,
    };

    setData(prev => {
      upsertTeamInDb(newTeam).catch(e => console.error('Error saving team to Neon:', e));
      showToast(`Club "${newTeam.name}" saved successfully!`);
      return {
        ...prev,
        teams: [...prev.teams, newTeam],
      };
    });
  }, [showToast]);

  // ===== Auto-Generate / Auto-Assign Fixtures from Tournament Scale =====
  const autoGenerateFixtures = useCallback((options = {}) => {
    setData(prev => {
      const {
        bracketSize = (prev.teams.length > 8 ? 16 : prev.teams.length > 4 ? 8 : prev.teams.length > 2 ? 4 : 2),
        assignmentMode = 'auto', // 'auto' | 'manual'
        shuffle = false,
        replaceExisting = true,
        startDate = new Date().toISOString().split('T')[0],
        defaultVenue = 'EMS Stadium, Kozhikode',
        defaultTime = '16:30',
      } = options;

      let teamList = [...prev.teams];
      if (shuffle) {
        teamList.sort(() => Math.random() - 0.5);
      }

      const baseDate = new Date(startDate || new Date());
      const newFixtures = [];

      if (Number(bracketSize) === 16) {
        // 1. Eight Round of 16 matches
        for (let i = 1; i <= 8; i++) {
          const home = assignmentMode === 'auto' ? (teamList[(i - 1) * 2] || { name: 'TBD' }) : { name: 'TBD' };
          const away = assignmentMode === 'auto' ? (teamList[(i - 1) * 2 + 1] || { name: 'TBD' }) : { name: 'TBD' };
          const d = new Date(baseDate);
          d.setDate(d.getDate() + Math.floor((i - 1) / 2));

          newFixtures.push({
            id: genId(),
            round: `Round of 16 ${i}`,
            homeTeam: home.name,
            awayTeam: away.name,
            date: d.toISOString().split('T')[0],
            time: defaultTime,
            venue: defaultVenue,
            status: 'upcoming',
          });
        }

        // 2. Four Quarter-Finals
        for (let q = 1; q <= 4; q++) {
          const d = new Date(baseDate);
          d.setDate(d.getDate() + 4 + Math.floor((q - 1) / 2));
          newFixtures.push({
            id: genId(),
            round: `Quarter-Final ${q}`,
            homeTeam: 'TBD',
            awayTeam: 'TBD',
            date: d.toISOString().split('T')[0],
            time: defaultTime,
            venue: defaultVenue,
            status: 'upcoming',
          });
        }

        // 3. Two Semi-Finals
        for (let s = 1; s <= 2; s++) {
          const d = new Date(baseDate);
          d.setDate(d.getDate() + 8 + s);
          newFixtures.push({
            id: genId(),
            round: `Semi-Final ${s}`,
            homeTeam: 'TBD',
            awayTeam: 'TBD',
            date: d.toISOString().split('T')[0],
            time: defaultTime,
            venue: defaultVenue,
            status: 'upcoming',
          });
        }

        // 4. One Final
        const df = new Date(baseDate);
        df.setDate(df.getDate() + 12);
        newFixtures.push({
          id: genId(),
          round: 'Final',
          homeTeam: 'TBD',
          awayTeam: 'TBD',
          date: df.toISOString().split('T')[0],
          time: defaultTime,
          venue: defaultVenue,
          status: 'upcoming',
        });
      } else if (Number(bracketSize) === 8) {
        // 1. Four Quarter-Finals
        for (let q = 1; q <= 4; q++) {
          const home = assignmentMode === 'auto' ? (teamList[(q - 1) * 2] || { name: 'TBD' }) : { name: 'TBD' };
          const away = assignmentMode === 'auto' ? (teamList[(q - 1) * 2 + 1] || { name: 'TBD' }) : { name: 'TBD' };
          const d = new Date(baseDate);
          d.setDate(d.getDate() + Math.floor((q - 1) / 2));

          newFixtures.push({
            id: genId(),
            round: `Quarter-Final ${q}`,
            homeTeam: home.name,
            awayTeam: away.name,
            date: d.toISOString().split('T')[0],
            time: defaultTime,
            venue: defaultVenue,
            status: 'upcoming',
          });
        }

        // 2. Two Semi-Finals
        for (let s = 1; s <= 2; s++) {
          const d = new Date(baseDate);
          d.setDate(d.getDate() + 4 + s);
          newFixtures.push({
            id: genId(),
            round: `Semi-Final ${s}`,
            homeTeam: 'TBD',
            awayTeam: 'TBD',
            date: d.toISOString().split('T')[0],
            time: defaultTime,
            venue: defaultVenue,
            status: 'upcoming',
          });
        }

        // 3. One Final
        const df = new Date(baseDate);
        df.setDate(df.getDate() + 7);
        newFixtures.push({
          id: genId(),
          round: 'Final',
          homeTeam: 'TBD',
          awayTeam: 'TBD',
          date: df.toISOString().split('T')[0],
          time: defaultTime,
          venue: defaultVenue,
          status: 'upcoming',
        });
      } else if (Number(bracketSize) === 4) {
        // 1. Two Semi-Finals
        for (let s = 1; s <= 2; s++) {
          const home = assignmentMode === 'auto' ? (teamList[(s - 1) * 2] || { name: 'TBD' }) : { name: 'TBD' };
          const away = assignmentMode === 'auto' ? (teamList[(s - 1) * 2 + 1] || { name: 'TBD' }) : { name: 'TBD' };
          const d = new Date(baseDate);
          d.setDate(d.getDate() + s - 1);

          newFixtures.push({
            id: genId(),
            round: `Semi-Final ${s}`,
            homeTeam: home.name,
            awayTeam: away.name,
            date: d.toISOString().split('T')[0],
            time: defaultTime,
            venue: defaultVenue,
            status: 'upcoming',
          });
        }

        // 2. One Final
        const df = new Date(baseDate);
        df.setDate(df.getDate() + 3);
        newFixtures.push({
          id: genId(),
          round: 'Final',
          homeTeam: 'TBD',
          awayTeam: 'TBD',
          date: df.toISOString().split('T')[0],
          time: defaultTime,
          venue: defaultVenue,
          status: 'upcoming',
        });
      } else {
        // 2 Teams - Final
        const home = assignmentMode === 'auto' ? (teamList[0] || { name: 'TBD' }) : { name: 'TBD' };
        const away = assignmentMode === 'auto' ? (teamList[1] || { name: 'TBD' }) : { name: 'TBD' };
        newFixtures.push({
          id: genId(),
          round: 'Final',
          homeTeam: home.name,
          awayTeam: away.name,
          date: baseDate.toISOString().split('T')[0],
          time: defaultTime,
          venue: defaultVenue,
          status: 'upcoming',
        });
      }

      const finalFixtures = replaceExisting
        ? newFixtures
        : [...prev.fixtures, ...newFixtures];

      saveFixturesBatchInDb(finalFixtures).catch(e => console.error('Error saving fixtures to Neon:', e));
      showToast(`🏆 Generated ${newFixtures.length} tournament bracket fixtures (${bracketSize} Teams setup)!`);

      return {
        ...prev,
        fixtures: finalFixtures,
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
    setData(prev => {
      let fixtures = [...prev.fixtures, newFix];
      const { fixtures: progressedFixtures, nextMatchesToSave, toastMessage } = processKnockoutProgression(
        fixtures,
        newFix,
        null,
        genId
      );
      fixtures = progressedFixtures;

      upsertFixtureInDb(newFix).catch(e => console.error('Error adding fixture in Neon:', e));
      if (nextMatchesToSave && nextMatchesToSave.length > 0) {
        nextMatchesToSave.forEach(m => {
          upsertFixtureInDb(m).catch(e => console.error('Error saving progressed match to Neon:', e));
        });
      }

      showToast(toastMessage || `Knockout Fixture added: ${fixture.homeTeam} vs ${fixture.awayTeam}`);
      return {
        ...prev,
        fixtures,
      };
    });
  }, [showToast]);

  const updateFixture = useCallback((id, updates) => {
    setData(prev => {
      let fixtures = [...prev.fixtures];
      const matchIdx = fixtures.findIndex(f => f.id === id);
      if (matchIdx === -1) return prev;
      
      const prevMatch = fixtures[matchIdx];
      const updatedMatch = { ...prevMatch, ...updates };
      fixtures[matchIdx] = updatedMatch;

      // Automatic Knockout Winner Progression across tournament rounds
      const { fixtures: progressedFixtures, nextMatchesToSave, toastMessage } = processKnockoutProgression(
        fixtures,
        updatedMatch,
        prevMatch,
        genId
      );
      fixtures = progressedFixtures;

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
      if (nextMatchesToSave && nextMatchesToSave.length > 0) {
        nextMatchesToSave.forEach(m => {
          upsertFixtureInDb(m).catch(e => console.error('Error saving progressed match to Neon:', e));
        });
      }
      if (resultToSave) {
        upsertResultInDb(resultToSave).catch(e => console.error('Error saving result to Neon:', e));
      }

      if (toastMessage) {
        showToast(toastMessage);
      } else {
        showToast('Fixture updated successfully!');
      }

      return { ...prev, fixtures, results, scorers };
    });
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
    addFixture, updateFixture, deleteFixture, autoGenerateFixtures,
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
