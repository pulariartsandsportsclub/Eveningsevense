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

  // 5. Other / Third Place
  return {
    stage: 'other',
    stageLabel: roundName || 'Knockout Match',
    matchNum: matchIndexInRound + 1,
    nextStage: null,
    nextStageLabel: null,
  };
}

/**
 * Calculates progression target details for a given match
 */
export function getProgressionTarget(match, allFixtures = []) {
  if (!match) return null;

  // Determine match number within round
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
    description: `${targetRoundLabel} (${targetSlot === 'homeTeam' ? 'Home' : 'Away'})`,
  };
}

/**
 * Executes winner progression across the fixtures list
 * Returns updated fixtures array and list of modified/created next matches
 */
export function processKnockoutProgression(fixtures = [], updatedMatch, prevMatch, genId) {
  const resultFixtures = [...fixtures];
  const nextMatchesToSave = [];
  let toastMessage = null;

  const prevWinner = getMatchWinner(prevMatch);
  const newWinner = getMatchWinner(updatedMatch);

  // If winner has not changed, return early
  if (prevWinner === newWinner && updatedMatch.status === prevMatch?.status) {
    return { fixtures: resultFixtures, nextMatchesToSave, toastMessage };
  }

  const progression = getProgressionTarget(updatedMatch, resultFixtures);
  if (!progression) {
    return { fixtures: resultFixtures, nextMatchesToSave, toastMessage };
  }

  const { targetStage, targetMatchNum, targetSlot, targetRoundLabel } = progression;

  // Look for existing target match
  let nextMatchIdx = -1;

  // 1. Check if updatedMatch explicitly pointed to a match
  if (updatedMatch.nextMatchId) {
    nextMatchIdx = resultFixtures.findIndex(f => f.id === updatedMatch.nextMatchId);
  }

  // 2. Search by stage and match number
  if (nextMatchIdx === -1) {
    const nextStageMatches = resultFixtures
      .map((f, idx) => ({ fixture: f, origIdx: idx, info: parseStageInfo(f.round) }))
      .filter(item => item.info.stage === targetStage);

    if (targetStage === 'final') {
      if (nextStageMatches.length > 0) {
        nextMatchIdx = nextStageMatches[0].origIdx;
      }
    } else {
      const matchWithNum = nextStageMatches.find(item => item.info.matchNum === targetMatchNum);
      if (matchWithNum) {
        nextMatchIdx = matchWithNum.origIdx;
      } else if (nextStageMatches[targetMatchNum - 1]) {
        nextMatchIdx = nextStageMatches[targetMatchNum - 1].origIdx;
      }
    }
  }

  // Handle case: A winner emerged (or winner changed)
  if (newWinner) {
    if (nextMatchIdx !== -1) {
      // Update existing fixture
      const existingNext = { ...resultFixtures[nextMatchIdx] };

      // If previous winner was in the other slot, clear it
      if (prevWinner && existingNext.homeTeam === prevWinner && targetSlot !== 'homeTeam') {
        existingNext.homeTeam = 'TBD';
      }
      if (prevWinner && existingNext.awayTeam === prevWinner && targetSlot !== 'awayTeam') {
        existingNext.awayTeam = 'TBD';
      }

      existingNext[targetSlot] = newWinner;
      resultFixtures[nextMatchIdx] = existingNext;
      nextMatchesToSave.push(existingNext);

      toastMessage = `⚡ ${newWinner} advanced to ${targetRoundLabel}!`;
    } else {
      // Auto-create next round fixture
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
    // Result was undone or match marked upcoming/live
    if (nextMatchIdx !== -1) {
      const existingNext = { ...resultFixtures[nextMatchIdx] };
      if (existingNext[targetSlot] === prevWinner) {
        existingNext[targetSlot] = 'TBD';
        resultFixtures[nextMatchIdx] = existingNext;
        nextMatchesToSave.push(existingNext);
        toastMessage = `Removed ${prevWinner} from ${targetRoundLabel} (match uncompleted).`;
      }
    }
  }

  return { fixtures: resultFixtures, nextMatchesToSave, toastMessage };
}
