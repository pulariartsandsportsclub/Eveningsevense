/**
 * Tournament Knockout Bracket Progression Engine
 * Automatically advances winners to subsequent rounds:
 * Round of 16 (8 matches) -> Quarter-Finals (4 matches) -> Semi-Finals (2 matches) -> Final (1 match)
 */

export function getMatchWinner(match) {
  if (!match || match.status !== 'completed') return null;

  const h = parseInt(match.homeScore, 10);
  const a = parseInt(match.awayScore, 10);
  if (isNaN(h) || isNaN(a)) return null;

  const home = match.homeTeam && match.homeTeam !== 'TBD' ? match.homeTeam : null;
  const away = match.awayTeam && match.awayTeam !== 'TBD' ? match.awayTeam : null;

  if (h > a) return home;
  if (a > h) return away;

  // Knockout Tie - Penalty Shootout
  const hp = match.homePenalty !== undefined && match.homePenalty !== '' ? parseInt(match.homePenalty, 10) : null;
  const ap = match.awayPenalty !== undefined && match.awayPenalty !== '' ? parseInt(match.awayPenalty, 10) : null;

  if (hp !== null && ap !== null && !isNaN(hp) && !isNaN(ap)) {
    if (hp > ap) return home;
    if (ap > hp) return away;
  }

  return null;
}

export function parseStageInfo(roundName = '', matchIndexInRound = 0) {
  const r = (roundName || '').trim().toLowerCase();

  // 1. Round of 16
  if (r.includes('16') || r.includes('r16')) {
    const after16 = roundName.replace(/round\s*of\s*16/i, '').replace(/r16/i, '');
    const numMatch = after16.match(/\d+/);
    const matchNum = numMatch ? parseInt(numMatch[0], 10) : matchIndexInRound + 1;
    return {
      stage: 'r16',
      stageLabel: 'Round of 16',
      matchNum,
      nextStage: 'quarter',
      nextStageLabel: 'Quarter-Final',
    };
  }

  // 2. Quarter-Final
  if (r.includes('quarter') || r.includes('qf')) {
    const afterQF = roundName.replace(/quarter[\s-]*finals?/i, '').replace(/qf/i, '');
    const numMatch = afterQF.match(/\d+/);
    const matchNum = numMatch ? parseInt(numMatch[0], 10) : matchIndexInRound + 1;
    return {
      stage: 'quarter',
      stageLabel: 'Quarter-Final',
      matchNum,
      nextStage: 'semi',
      nextStageLabel: 'Semi-Final',
    };
  }

  // 3. Semi-Final
  if (r.includes('semi') || r.includes('sf')) {
    const afterSF = roundName.replace(/semi[\s-]*finals?/i, '').replace(/sf/i, '');
    const numMatch = afterSF.match(/\d+/);
    const matchNum = numMatch ? parseInt(numMatch[0], 10) : matchIndexInRound + 1;
    return {
      stage: 'semi',
      stageLabel: 'Semi-Final',
      matchNum,
      nextStage: 'final',
      nextStageLabel: 'Final',
    };
  }

  // 4. Final
  if (r.includes('final') && !r.includes('semi') && !r.includes('quarter') && !r.includes('third')) {
    return {
      stage: 'final',
      stageLabel: 'Final',
      matchNum: 1,
      nextStage: null,
      nextStageLabel: null,
    };
  }

  // 5. Third Place Playoff
  if (r.includes('third') || r.includes('3rd')) {
    return {
      stage: 'third',
      stageLabel: 'Third Place Playoff',
      matchNum: 1,
      nextStage: null,
      nextStageLabel: null,
    };
  }

  // 6. Other / Custom
  return {
    stage: 'other',
    stageLabel: roundName || 'Knockout Match',
    matchNum: matchIndexInRound + 1,
    nextStage: null,
    nextStageLabel: null,
  };
}

/**
 * Returns canonical knockout slot key (e.g. 'r16_1'...'r16_8', 'quarter_1'...'quarter_4', 'semi_1'...'semi_2', 'final')
 */
export function getFixtureSlotKey(fixture, indexInRound = 0) {
  if (!fixture) return 'unknown';
  const info = parseStageInfo(fixture.round, indexInRound);
  if (info.stage === 'final') return 'final';
  if (info.stage === 'third') return 'third';
  if (info.stage === 'r16' || info.stage === 'quarter' || info.stage === 'semi') {
    return `${info.stage}_${info.matchNum}`;
  }
  return `other_${(fixture.round || 'match').toLowerCase().replace(/\s+/g, '_')}`;
}

/**
 * Quality heuristic to keep the most informative match record when deduplicating
 */
export function getFixtureQualityScore(f) {
  if (!f) return 0;
  let score = 0;
  if (f.status === 'completed') score += 1000;
  else if (f.status === 'live') score += 500;
  else if (f.status === 'postponed') score += 100;
  else score += 50;

  if (f.homeScore !== undefined && f.homeScore !== null && f.homeScore !== '') score += 200;
  if (f.awayScore !== undefined && f.awayScore !== null && f.awayScore !== '') score += 200;
  if (f.homePenalty !== undefined && f.homePenalty !== null && f.homePenalty !== '') score += 50;
  if (f.awayPenalty !== undefined && f.awayPenalty !== null && f.awayPenalty !== '') score += 50;

  if (f.homeTeam && f.homeTeam !== 'TBD' && !f.homeTeam.startsWith('Winner')) score += 100;
  if (f.awayTeam && f.awayTeam !== 'TBD' && !f.awayTeam.startsWith('Winner')) score += 100;

  if (Array.isArray(f.scorers) && f.scorers.length > 0) score += 50;
  if (f.date && f.date !== 'TBD') score += 10;
  if (f.venue && f.venue.trim()) score += 5;

  return score;
}

/**
 * Deduplicate fixtures list so every knockout bracket slot has at most ONE match.
 * Returns { deduplicatedFixtures, removedFixtureIds }
 */
export function deduplicateFixturesList(fixtures = []) {
  if (!Array.isArray(fixtures) || fixtures.length === 0) {
    return { deduplicatedFixtures: [], removedFixtureIds: [] };
  }

  // Group by stage to compute natural indices for round labels without numbers
  const stageGroups = { r16: [], quarter: [], semi: [], final: [], third: [], other: [] };
  fixtures.forEach((f, origIdx) => {
    const info = parseStageInfo(f.round, 0);
    const stage = stageGroups[info.stage] ? info.stage : 'other';
    stageGroups[stage].push({ fixture: f, origIdx });
  });

  const slotMap = new Map();
  const removedFixtureIds = [];

  Object.keys(stageGroups).forEach(stage => {
    stageGroups[stage].forEach((item, stageIdx) => {
      const slotKey = getFixtureSlotKey(item.fixture, stageIdx);
      if (!slotMap.has(slotKey)) {
        slotMap.set(slotKey, item.fixture);
      } else {
        const existing = slotMap.get(slotKey);
        const existingScore = getFixtureQualityScore(existing);
        const newScore = getFixtureQualityScore(item.fixture);

        if (newScore > existingScore) {
          if (existing.id) removedFixtureIds.push(existing.id);
          slotMap.set(slotKey, item.fixture);
        } else {
          if (item.fixture.id) removedFixtureIds.push(item.fixture.id);
        }
      }
    });
  });

  const stageOrder = { r16: 1, quarter: 2, semi: 3, third: 4, final: 5, other: 6 };
  const deduplicatedFixtures = Array.from(slotMap.values()).sort((a, b) => {
    const infoA = parseStageInfo(a.round);
    const infoB = parseStageInfo(b.round);
    const ordA = stageOrder[infoA.stage] || 99;
    const ordB = stageOrder[infoB.stage] || 99;
    if (ordA !== ordB) return ordA - ordB;
    return infoA.matchNum - infoB.matchNum;
  });

  return { deduplicatedFixtures, removedFixtureIds };
}

/**
 * Calculates progression target details for a given match
 */
export function getProgressionTarget(match, allFixtures = []) {
  if (!match) return null;

  let matchIndexInRound = 0;
  if (Array.isArray(allFixtures) && allFixtures.length > 0) {
    const sameStageMatches = allFixtures.filter(f => {
      const s1 = parseStageInfo(f.round).stage;
      const s2 = parseStageInfo(match.round).stage;
      return s1 === s2 && s1 !== 'other';
    });
    const foundIdx = sameStageMatches.findIndex(f => f.id === match.id);
    if (foundIdx !== -1) {
      matchIndexInRound = foundIdx;
    }
  }

  const stageInfo = parseStageInfo(match.round, matchIndexInRound);
  if (!stageInfo.nextStage) return null;

  const targetMatchNum = Math.floor((stageInfo.matchNum - 1) / 2) + 1;
  const targetSlot = (stageInfo.matchNum - 1) % 2 === 0 ? 'homeTeam' : 'awayTeam';
  
  let targetRoundLabel = `${stageInfo.nextStageLabel} ${targetMatchNum}`;
  if (stageInfo.nextStage === 'final') {
    targetRoundLabel = 'Final';
  }

  return {
    currentStage: stageInfo.stage,
    currentMatchNum: stageInfo.matchNum,
    targetStage: stageInfo.nextStage,
    targetMatchNum,
    targetSlot,
    targetRoundLabel,
    targetSlotKey: stageInfo.nextStage === 'final' ? 'final' : `${stageInfo.nextStage}_${targetMatchNum}`,
    description: `${targetRoundLabel} (${targetSlot === 'homeTeam' ? 'Home' : 'Away'})`,
  };
}

/**
 * Executes winner progression across the fixtures list.
 * Deduplicates in place, updates existing matches, never creates spurious duplicates.
 */
export function processKnockoutProgression(fixtures = [], updatedMatch, prevMatch, genId) {
  // 1. Initial deduplication safety pass
  const cleanInit = deduplicateFixturesList(fixtures);
  let resultFixtures = [...cleanInit.deduplicatedFixtures];
  const removedFixtureIds = [...cleanInit.removedFixtureIds];
  const nextMatchesToSave = [];
  let toastMessage = null;

  const prevWinner = getMatchWinner(prevMatch);
  const newWinner = getMatchWinner(updatedMatch);

  // If winner has not changed and match status hasn't toggled completion, return early
  if (prevWinner === newWinner && updatedMatch?.status === prevMatch?.status) {
    return { fixtures: resultFixtures, nextMatchesToSave, toastMessage, removedFixtureIds };
  }

  const progression = getProgressionTarget(updatedMatch, resultFixtures);
  if (!progression) {
    return { fixtures: resultFixtures, nextMatchesToSave, toastMessage, removedFixtureIds };
  }

  const { targetStage, targetMatchNum, targetSlot, targetRoundLabel, targetSlotKey } = progression;

  // Search for target match by nextMatchId, slot key, or stage info
  let nextMatchIdx = -1;
  if (updatedMatch.nextMatchId) {
    nextMatchIdx = resultFixtures.findIndex(f => f.id === updatedMatch.nextMatchId);
  }

  if (nextMatchIdx === -1 && targetSlotKey) {
    nextMatchIdx = resultFixtures.findIndex((f, idx) => getFixtureSlotKey(f, idx) === targetSlotKey);
  }

  if (nextMatchIdx === -1) {
    nextMatchIdx = resultFixtures.findIndex(f => {
      const info = parseStageInfo(f.round);
      if (targetStage === 'final') return info.stage === 'final';
      return info.stage === targetStage && info.matchNum === targetMatchNum;
    });
  }

  // Handle Winner Progression
  if (newWinner) {
    if (nextMatchIdx !== -1) {
      // IN-PLACE UPDATE ONLY
      const existingNext = { ...resultFixtures[nextMatchIdx] };

      // Clear former winner if placed in opposing slot
      if (prevWinner && existingNext.homeTeam === prevWinner && targetSlot !== 'homeTeam') {
        existingNext.homeTeam = 'TBD';
      }
      if (prevWinner && existingNext.awayTeam === prevWinner && targetSlot !== 'awayTeam') {
        existingNext.awayTeam = 'TBD';
      }

      existingNext[targetSlot] = newWinner;
      resultFixtures[nextMatchIdx] = existingNext;
      nextMatchesToSave.push(existingNext);

      toastMessage = `⚡ ${newWinner} advanced to ${existingNext.round || targetRoundLabel}!`;
    } else {
      // Create new match only if the stage doesn't already exist
      let nextDate = updatedMatch.date || new Date().toISOString().split('T')[0];
      try {
        const d = new Date(nextDate);
        if (!isNaN(d.getTime())) {
          d.setDate(d.getDate() + 1);
          nextDate = d.toISOString().split('T')[0];
        }
      } catch (e) {}

      const newNextMatch = {
        id: genId ? genId() : `fix_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        round: targetRoundLabel,
        homeTeam: targetSlot === 'homeTeam' ? newWinner : 'TBD',
        awayTeam: targetSlot === 'awayTeam' ? newWinner : 'TBD',
        date: nextDate,
        time: '16:30',
        venue: updatedMatch.venue || 'EMS Stadium, Kozhikode',
        status: 'upcoming',
      };

      resultFixtures.push(newNextMatch);
      nextMatchesToSave.push(newNextMatch);

      toastMessage = `⚡ ${newWinner} advanced! Auto-created ${targetRoundLabel}.`;
    }
  } else if (prevWinner && !newWinner) {
    // Match was reset / uncompleted
    if (nextMatchIdx !== -1) {
      const existingNext = { ...resultFixtures[nextMatchIdx] };
      if (existingNext[targetSlot] === prevWinner) {
        existingNext[targetSlot] = 'TBD';
        resultFixtures[nextMatchIdx] = existingNext;
        nextMatchesToSave.push(existingNext);
        toastMessage = `Removed ${prevWinner} from ${existingNext.round || targetRoundLabel}.`;
      }
    }
  }

  // Final deduplication safety pass
  const cleanFinal = deduplicateFixturesList(resultFixtures);
  resultFixtures = cleanFinal.deduplicatedFixtures;
  if (cleanFinal.removedFixtureIds.length > 0) {
    cleanFinal.removedFixtureIds.forEach(id => {
      if (!removedFixtureIds.includes(id)) removedFixtureIds.push(id);
    });
  }

  return { fixtures: resultFixtures, nextMatchesToSave, toastMessage, removedFixtureIds };
}
