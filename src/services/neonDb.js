import { neon } from '@neondatabase/serverless';

const DEFAULT_CONN_STR = 'postgresql://neondb_owner:npg_m9HfJyWMF0lP@ep-tiny-meadow-b52iowfu-pooler.c-7.us-east-2.aws.neon.tech/Pularisevens?sslmode=require';

const connectionString = (import.meta.env && import.meta.env.VITE_NEON_DATABASE_URL) || DEFAULT_CONN_STR;

let sqlClient = null;

export function getDb() {
  if (!sqlClient && connectionString) {
    try {
      sqlClient = neon(connectionString);
    } catch (e) {
      console.error('Failed to initialize Neon SQL client:', e);
    }
  }
  return sqlClient;
}

// Helper to check DB connectivity
export async function testDbConnection() {
  const sql = getDb();
  if (!sql) return { success: false, error: 'No connection string provided' };
  try {
    const res = await sql`SELECT NOW() as time, current_database() as db`;
    return { success: true, data: res[0] };
  } catch (err) {
    console.error('Neon DB Ping Error:', err);
    return { success: false, error: err.message };
  }
}

// ===== TEAMS =====
export async function fetchTeamsFromDb() {
  const sql = getDb();
  if (!sql) return null;
  const rows = await sql`SELECT * FROM teams ORDER BY name ASC`;
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    badge: r.badge,
    played: Number(r.played || 0),
    won: Number(r.won || 0),
    drawn: Number(r.drawn || 0),
    lost: Number(r.lost || 0),
    gf: Number(r.gf || 0),
    ga: Number(r.ga || 0),
    points: Number(r.points || 0),
    players: Array.isArray(r.players) ? r.players : (typeof r.players === 'string' ? JSON.parse(r.players) : []),
  }));
}

export async function upsertTeamInDb(team) {
  const sql = getDb();
  if (!sql) return;
  const playersJson = JSON.stringify(team.players || []);
  await sql`
    INSERT INTO teams (id, name, badge, played, won, drawn, lost, gf, ga, points, players)
    VALUES (
      ${team.id}, 
      ${team.name}, 
      ${team.badge || '#156637'}, 
      ${team.played || 0}, 
      ${team.won || 0}, 
      ${team.drawn || 0}, 
      ${team.lost || 0}, 
      ${team.gf || 0}, 
      ${team.ga || 0}, 
      ${team.points || 0}, 
      ${playersJson}
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      badge = EXCLUDED.badge,
      played = EXCLUDED.played,
      won = EXCLUDED.won,
      drawn = EXCLUDED.drawn,
      lost = EXCLUDED.lost,
      gf = EXCLUDED.gf,
      ga = EXCLUDED.ga,
      points = EXCLUDED.points,
      players = EXCLUDED.players,
      updated_at = CURRENT_TIMESTAMP;
  `;
}

export async function deleteTeamFromDb(id) {
  const sql = getDb();
  if (!sql) return;
  await sql`DELETE FROM teams WHERE id = ${id}`;
}

// ===== FIXTURES =====
export async function fetchFixturesFromDb() {
  const sql = getDb();
  if (!sql) return null;
  const rows = await sql`SELECT * FROM fixtures ORDER BY date ASC, time ASC`;
  return rows.map(r => ({
    id: r.id,
    round: r.round,
    homeTeam: r.home_team,
    awayTeam: r.away_team,
    date: r.date,
    time: r.time,
    venue: r.venue,
    status: r.status,
    nextMatchId: r.next_match_id,
    nextMatchSlot: r.next_match_slot,
    homeScore: r.home_score !== null && r.home_score !== undefined ? Number(r.home_score) : undefined,
    awayScore: r.away_score !== null && r.away_score !== undefined ? Number(r.away_score) : undefined,
    homePenalty: r.home_penalty !== null && r.home_penalty !== undefined ? Number(r.home_penalty) : undefined,
    awayPenalty: r.away_penalty !== null && r.away_penalty !== undefined ? Number(r.away_penalty) : undefined,
    scorers: Array.isArray(r.scorers) ? r.scorers : (typeof r.scorers === 'string' ? JSON.parse(r.scorers) : []),
  }));
}

export async function upsertFixtureInDb(fixture) {
  const sql = getDb();
  if (!sql) return;
  const scorersJson = JSON.stringify(fixture.scorers || []);
  const homeScore = fixture.homeScore !== undefined && fixture.homeScore !== '' ? Number(fixture.homeScore) : null;
  const awayScore = fixture.awayScore !== undefined && fixture.awayScore !== '' ? Number(fixture.awayScore) : null;
  const homePenalty = fixture.homePenalty !== undefined && fixture.homePenalty !== '' ? Number(fixture.homePenalty) : null;
  const awayPenalty = fixture.awayPenalty !== undefined && fixture.awayPenalty !== '' ? Number(fixture.awayPenalty) : null;

  await sql`
    INSERT INTO fixtures (
      id, round, home_team, away_team, date, time, venue, 
      status, next_match_id, next_match_slot, 
      home_score, away_score, home_penalty, away_penalty, scorers
    )
    VALUES (
      ${fixture.id}, 
      ${fixture.round}, 
      ${fixture.homeTeam}, 
      ${fixture.awayTeam}, 
      ${fixture.date}, 
      ${fixture.time}, 
      ${fixture.venue}, 
      ${fixture.status || 'upcoming'}, 
      ${fixture.nextMatchId || null}, 
      ${fixture.nextMatchSlot || null}, 
      ${homeScore}, 
      ${awayScore}, 
      ${homePenalty}, 
      ${awayPenalty}, 
      ${scorersJson}
    )
    ON CONFLICT (id) DO UPDATE SET
      round = EXCLUDED.round,
      home_team = EXCLUDED.home_team,
      away_team = EXCLUDED.away_team,
      date = EXCLUDED.date,
      time = EXCLUDED.time,
      venue = EXCLUDED.venue,
      status = EXCLUDED.status,
      next_match_id = EXCLUDED.next_match_id,
      next_match_slot = EXCLUDED.next_match_slot,
      home_score = EXCLUDED.home_score,
      away_score = EXCLUDED.away_score,
      home_penalty = EXCLUDED.home_penalty,
      away_penalty = EXCLUDED.away_penalty,
      scorers = EXCLUDED.scorers,
      updated_at = CURRENT_TIMESTAMP;
  `;
}

export async function saveFixturesBatchInDb(fixtures) {
  const sql = getDb();
  if (!sql || !fixtures || fixtures.length === 0) return;
  for (const f of fixtures) {
    await upsertFixtureInDb(f);
  }
}

export async function deleteFixtureFromDb(id) {
  const sql = getDb();
  if (!sql) return;
  await sql`DELETE FROM fixtures WHERE id = ${id}`;
}

// ===== RESULTS =====
export async function fetchResultsFromDb() {
  const sql = getDb();
  if (!sql) return null;
  const rows = await sql`SELECT * FROM results ORDER BY date DESC, time DESC`;
  return rows.map(r => ({
    id: r.id,
    fixtureId: r.fixture_id,
    round: r.round,
    homeTeam: r.home_team,
    awayTeam: r.away_team,
    homeScore: Number(r.home_score || 0),
    awayScore: Number(r.away_score || 0),
    homePenalty: r.home_penalty !== null && r.home_penalty !== undefined ? Number(r.home_penalty) : undefined,
    awayPenalty: r.away_penalty !== null && r.away_penalty !== undefined ? Number(r.away_penalty) : undefined,
    date: r.date,
    time: r.time,
    venue: r.venue,
    scorers: Array.isArray(r.scorers) ? r.scorers : (typeof r.scorers === 'string' ? JSON.parse(r.scorers) : []),
  }));
}

export async function upsertResultInDb(result) {
  const sql = getDb();
  if (!sql) return;
  const scorersJson = JSON.stringify(result.scorers || []);
  const homePenalty = result.homePenalty !== undefined && result.homePenalty !== '' ? Number(result.homePenalty) : null;
  const awayPenalty = result.awayPenalty !== undefined && result.awayPenalty !== '' ? Number(result.awayPenalty) : null;

  await sql`
    INSERT INTO results (
      id, fixture_id, round, home_team, away_team, 
      home_score, away_score, home_penalty, away_penalty, 
      date, time, venue, scorers
    )
    VALUES (
      ${result.id}, 
      ${result.fixtureId || null}, 
      ${result.round}, 
      ${result.homeTeam}, 
      ${result.awayTeam}, 
      ${Number(result.homeScore) || 0}, 
      ${Number(result.awayScore) || 0}, 
      ${homePenalty}, 
      ${awayPenalty}, 
      ${result.date || null}, 
      ${result.time || null}, 
      ${result.venue || null}, 
      ${scorersJson}
    )
    ON CONFLICT (id) DO UPDATE SET
      fixture_id = EXCLUDED.fixture_id,
      round = EXCLUDED.round,
      home_team = EXCLUDED.home_team,
      away_team = EXCLUDED.away_team,
      home_score = EXCLUDED.home_score,
      away_score = EXCLUDED.away_score,
      home_penalty = EXCLUDED.home_penalty,
      away_penalty = EXCLUDED.away_penalty,
      date = EXCLUDED.date,
      time = EXCLUDED.time,
      venue = EXCLUDED.venue,
      scorers = EXCLUDED.scorers,
      updated_at = CURRENT_TIMESTAMP;
  `;
}

export async function deleteResultFromDb(id) {
  const sql = getDb();
  if (!sql) return;
  await sql`DELETE FROM results WHERE id = ${id} OR fixture_id = ${id}`;
}

// ===== SCORERS =====
export async function fetchScorersFromDb() {
  const sql = getDb();
  if (!sql) return null;
  const rows = await sql`SELECT * FROM scorers ORDER BY goals DESC, assists DESC`;
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    team: r.team,
    teamBadge: r.team_badge,
    goals: Number(r.goals || 0),
    assists: Number(r.assists || 0),
  }));
}

export async function upsertScorerInDb(scorer) {
  const sql = getDb();
  if (!sql) return;
  await sql`
    INSERT INTO scorers (id, name, team, team_badge, goals, assists)
    VALUES (
      ${scorer.id}, 
      ${scorer.name}, 
      ${scorer.team}, 
      ${scorer.teamBadge || '#156637'}, 
      ${Number(scorer.goals) || 0}, 
      ${Number(scorer.assists) || 0}
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      team = EXCLUDED.team,
      team_badge = EXCLUDED.team_badge,
      goals = EXCLUDED.goals,
      assists = EXCLUDED.assists,
      updated_at = CURRENT_TIMESTAMP;
  `;
}

export async function deleteScorerFromDb(id) {
  const sql = getDb();
  if (!sql) return;
  await sql`DELETE FROM scorers WHERE id = ${id}`;
}

// ===== FINANCES =====
export async function fetchFinancesFromDb() {
  const sql = getDb();
  if (!sql) return null;
  const rows = await sql`SELECT * FROM tournament_finances ORDER BY date DESC, created_at DESC`;
  return rows.map(r => ({
    id: r.id,
    type: r.type,
    title: r.title,
    amount: Number(r.amount || 0),
    category: r.category,
    date: r.date,
    paymentMethod: r.payment_method || 'Cash',
    referenceNo: r.reference_no || '',
    paidByOrTo: r.paid_by_or_to || '',
    notes: r.notes || '',
  }));
}

export async function upsertFinanceInDb(item) {
  const sql = getDb();
  if (!sql) return;
  await sql`
    INSERT INTO tournament_finances (
      id, type, title, amount, category, date, 
      payment_method, reference_no, paid_by_or_to, notes
    )
    VALUES (
      ${item.id}, 
      ${item.type}, 
      ${item.title}, 
      ${Number(item.amount) || 0}, 
      ${item.category}, 
      ${item.date}, 
      ${item.paymentMethod || 'Cash'}, 
      ${item.referenceNo || null}, 
      ${item.paidByOrTo || null}, 
      ${item.notes || null}
    )
    ON CONFLICT (id) DO UPDATE SET
      type = EXCLUDED.type,
      title = EXCLUDED.title,
      amount = EXCLUDED.amount,
      category = EXCLUDED.category,
      date = EXCLUDED.date,
      payment_method = EXCLUDED.payment_method,
      reference_no = EXCLUDED.reference_no,
      paid_by_or_to = EXCLUDED.paid_by_or_to,
      notes = EXCLUDED.notes,
      updated_at = CURRENT_TIMESTAMP;
  `;
}

export async function deleteFinanceFromDb(id) {
  const sql = getDb();
  if (!sql) return;
  await sql`DELETE FROM tournament_finances WHERE id = ${id}`;
}

// ===== BATCH DATA FETCH =====
export async function fetchAllTournamentDataFromDb() {
  const [teams, fixtures, results, scorers, finances] = await Promise.all([
    fetchTeamsFromDb(),
    fetchFixturesFromDb(),
    fetchResultsFromDb(),
    fetchScorersFromDb(),
    fetchFinancesFromDb(),
  ]);

  return { teams, fixtures, results, scorers, finances };
}

// ===== CLEAR ALL DATABASE DATA =====
export async function clearAllDatabaseData() {
  const sql = getDb();
  if (!sql) return;

  await sql.transaction([
    sql`TRUNCATE TABLE results CASCADE;`,
    sql`TRUNCATE TABLE fixtures CASCADE;`,
    sql`TRUNCATE TABLE scorers CASCADE;`,
    sql`TRUNCATE TABLE tournament_finances CASCADE;`,
    sql`TRUNCATE TABLE teams CASCADE;`,
  ]);
}

// ===== RESET DATABASE DATA =====
export async function resetDatabaseData(seedData = {}, defaultSquads = {}, seedFinances = []) {
  const sql = getDb();
  if (!sql) return;

  await clearAllDatabaseData();

  // Re-seed teams if provided
  if (seedData.teams && seedData.teams.length > 0) {
    for (const t of seedData.teams) {
      const squad = defaultSquads[t.name] || t.players || [];
      await sql`
        INSERT INTO teams (id, name, badge, played, won, drawn, lost, gf, ga, points, players)
        VALUES (${t.id}, ${t.name}, ${t.badge}, ${t.played || 0}, ${t.won || 0}, ${t.drawn || 0}, ${t.lost || 0}, ${t.gf || 0}, ${t.ga || 0}, ${t.points || 0}, ${JSON.stringify(squad)})
      `;
    }
  }

  // Re-seed fixtures if provided
  if (seedData.fixtures && seedData.fixtures.length > 0) {
    for (const f of seedData.fixtures) {
      await sql`
        INSERT INTO fixtures (id, round, home_team, away_team, date, time, venue, status, next_match_id, next_match_slot, scorers)
        VALUES (${f.id}, ${f.round}, ${f.homeTeam}, ${f.awayTeam}, ${f.date}, ${f.time}, ${f.venue}, ${f.status || 'upcoming'}, ${f.nextMatchId || null}, ${f.nextMatchSlot || null}, '[]'::jsonb)
      `;
    }
  }

  // Re-seed finances if provided
  if (seedFinances && seedFinances.length > 0) {
    for (const fin of seedFinances) {
      await sql`
        INSERT INTO tournament_finances (id, type, title, amount, category, date, payment_method, reference_no, paid_by_or_to, notes)
        VALUES (${fin.id}, ${fin.type}, ${fin.title}, ${fin.amount}, ${fin.category}, ${fin.date}, ${fin.paymentMethod || fin.payment_method || 'Cash'}, ${fin.referenceNo || fin.reference_no || null}, ${fin.paidByOrTo || fin.paid_by_or_to || null}, ${fin.notes || null})
      `;
    }
  }
}

// ===== ADMIN AUTHENTICATION =====
export async function hashPassword(password) {
  const cryptoObj = (typeof globalThis !== 'undefined' && globalThis.crypto) || (typeof window !== 'undefined' && window.crypto);
  if (cryptoObj && cryptoObj.subtle) {
    const msgUint8 = new TextEncoder().encode(password);
    const hashBuffer = await cryptoObj.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  return password;
}

export async function ensureAdminTableExists() {
  const sql = getDb();
  if (!sql) return;

  await sql`
    CREATE TABLE IF NOT EXISTS admin_users (
      id VARCHAR(50) PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      display_name VARCHAR(255) DEFAULT 'Tournament Administrator',
      role VARCHAR(50) NOT NULL DEFAULT 'superadmin',
      last_login TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const defaultHash = '059a05054dabcdf6ee26a79f5d9eda87b75f50b3ddc4efb6a9761e14a5e9d461'; // SHA-256 of 'pulari2026'
  await sql`
    INSERT INTO admin_users (id, username, password_hash, display_name, role)
    VALUES ('adm_1', 'admin', ${defaultHash}, 'Pulari Tournament Admin', 'superadmin')
    ON CONFLICT (username) DO NOTHING;
  `;
}

export async function verifyAdminLoginInDb(username, password) {
  const cleanUser = username.trim().toLowerCase();
  const passwordHash = await hashPassword(password);
  const sql = getDb();

  if (!sql) {
    // Local / Offline fallback (admin / pulari2026)
    if (cleanUser === 'admin' && (password === 'pulari2026' || passwordHash === '059a05054dabcdf6ee26a79f5d9eda87b75f50b3ddc4efb6a9761e14a5e9d461')) {
      return {
        success: true,
        user: { username: 'admin', displayName: 'Pulari Admin', role: 'superadmin' }
      };
    }
    return { success: false, error: 'Database disconnected and credentials do not match offline fallback' };
  }

  try {
    await ensureAdminTableExists();
    const rows = await sql`
      SELECT id, username, display_name, role, password_hash
      FROM admin_users
      WHERE LOWER(username) = ${cleanUser}
      LIMIT 1;
    `;

    if (rows.length === 0) {
      // If table exists but user was modified or missing, allow default admin / pulari2026
      if (cleanUser === 'admin' && password === 'pulari2026') {
        return {
          success: true,
          user: { username: 'admin', displayName: 'Pulari Admin', role: 'superadmin' }
        };
      }
      return { success: false, error: 'Invalid username or password' };
    }

    const admin = rows[0];
    if (admin.password_hash === passwordHash) {
      // Update last_login
      await sql`UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ${admin.id};`;
      return {
        success: true,
        user: {
          id: admin.id,
          username: admin.username,
          displayName: admin.display_name || 'Tournament Admin',
          role: admin.role || 'superadmin'
        }
      };
    } else {
      return { success: false, error: 'Incorrect password. Please try again.' };
    }
  } catch (err) {
    console.error('Login verification error:', err);
    // Fallback if network glitch
    if (cleanUser === 'admin' && password === 'pulari2026') {
      return {
        success: true,
        user: { username: 'admin', displayName: 'Pulari Admin (Offline)', role: 'superadmin' }
      };
    }
    return { success: false, error: 'Database authentication failed: ' + err.message };
  }
}

export async function changeAdminPasswordInDb(username, currentPassword, newPassword) {
  const cleanUser = username.trim().toLowerCase();
  const currentHash = await hashPassword(currentPassword);
  const newHash = await hashPassword(newPassword);
  const sql = getDb();

  if (!sql) return { success: false, error: 'Database not connected' };

  try {
    const rows = await sql`
      SELECT id, password_hash FROM admin_users WHERE LOWER(username) = ${cleanUser} LIMIT 1;
    `;

    if (rows.length === 0 || rows[0].password_hash !== currentHash) {
      return { success: false, error: 'Current password does not match.' };
    }

    await sql`
      UPDATE admin_users SET password_hash = ${newHash}, updated_at = CURRENT_TIMESTAMP WHERE id = ${rows[0].id};
    `;

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
