import { neon } from '@neondatabase/serverless';
import { DEFAULT_SQUADS } from '../src/data/defaultSquads.js';

const CONNECTION_STRING = process.env.VITE_NEON_DATABASE_URL || 
  'postgresql://neondb_owner:npg_m9HfJyWMF0lP@ep-tiny-meadow-b52iowfu-pooler.c-7.us-east-2.aws.neon.tech/Pularisevens?sslmode=require';

const SEED_TEAMS = [
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
];

const SEED_FIXTURES = [
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
];

export const SEED_FINANCES = [
  { id: 'fin_1', type: 'income', title: 'Tournament Team Registration (16 Clubs)', amount: 80000, category: 'Team Registration', date: '2026-10-10', payment_method: 'UPI', reference_no: 'UPI/PULARI/REG16', paid_by_or_to: '16 Competing Clubs', notes: '₹5,000 entry deposit per team received' },
  { id: 'fin_2', type: 'income', title: 'Title Sponsorship - Malabar Gold', amount: 50000, category: 'Sponsorship', date: '2026-10-11', payment_method: 'Bank Transfer', reference_no: 'NEFT/MBG/78921', paid_by_or_to: 'Malabar Gold & Diamonds', notes: 'Main title banner rights and stadium backdrop' },
  { id: 'fin_3', type: 'income', title: 'Associate Sponsorship - Kerala Blasters Fan Club', amount: 25000, category: 'Sponsorship', date: '2026-10-12', payment_method: 'UPI', reference_no: 'UPI/KBFC/SPON', paid_by_or_to: 'KBFC Kozhikode Wing', notes: 'Co-sponsor branding' },
  { id: 'fin_4', type: 'income', title: 'Gate Passes / Ticket Counters (Advance Sales)', amount: 34500, category: 'Ticket Sales', date: '2026-10-13', payment_method: 'Cash', reference_no: 'GATE/ADV/101', paid_by_or_to: 'Spectators Counter', notes: 'Opening 2 match day tickets' },
  { id: 'fin_5', type: 'income', title: 'Food & Tea Stalls Vendor Licensing', amount: 12000, category: 'Stall Vendor', date: '2026-10-13', payment_method: 'Cash', reference_no: 'STALL/LIC/4', paid_by_or_to: '4 Stadium Stalls', notes: '₹3,000 per food stall permit' },
  { id: 'fin_6', type: 'income', title: 'Gulf Malayali Diaspora Sports Patronage', amount: 15000, category: 'Donations', date: '2026-10-14', payment_method: 'Bank Transfer', reference_no: 'IMPS/DXB/8821', paid_by_or_to: 'Dubai Pulari Supporters Club', notes: 'Youth football development fund contribution' },
  
  { id: 'fin_7', type: 'expense', title: 'EMS Stadium Ground & Floodlights Booking', amount: 35000, category: 'Ground & Lighting', date: '2026-10-11', payment_method: 'Bank Transfer', reference_no: 'CORP/EMS/GD01', paid_by_or_to: 'Kozhikode District Sports Council', notes: 'Ground rental for full tournament schedule' },
  { id: 'fin_8', type: 'expense', title: 'Kerala Football Referees Association Officiating Pool', amount: 18000, category: 'Referees & Officials', date: '2026-10-12', payment_method: 'UPI', reference_no: 'UPI/KFRA/OFF01', paid_by_or_to: 'District Referees Association', notes: 'Qualified referee panel for 15 knockout fixtures' },
  { id: 'fin_9', type: 'expense', title: 'Championship Rolling Trophy & Golden Boot Awards', amount: 22500, category: 'Trophies & Awards', date: '2026-10-12', payment_method: 'UPI', reference_no: 'UPI/SPORTS/TR09', paid_by_or_to: 'Champion Sports Awards Calicut', notes: 'Gold-plated champion cup, runner-up & medals' },
  { id: 'fin_10', type: 'expense', title: 'First Aid Medical Team, Ambulance on Standby & Physio', amount: 8500, category: 'Medical & First Aid', date: '2026-10-13', payment_method: 'Cash', reference_no: 'MED/EMERG/12', paid_by_or_to: 'Apollo Care Mobile Unit', notes: 'Medical kits and emergency support for players' },
  { id: 'fin_11', type: 'expense', title: 'High-Decibel Sound System & Diesel Generator Backup', amount: 14000, category: 'Sound & Stage', date: '2026-10-13', payment_method: 'Cash', reference_no: 'SND/STAGE/GEN', paid_by_or_to: 'Pulari Audio & Events', notes: 'Line array speakers & 25kVA generator' },
  { id: 'fin_12', type: 'expense', title: 'Electrolyte Drinks, Glucose & Bottled Water for Teams', amount: 9200, category: 'Refreshments', date: '2026-10-14', payment_method: 'Cash', reference_no: 'REF/BEV/2026', paid_by_or_to: 'Metro Beverages', notes: 'Match hydration for 16 teams' },
  { id: 'fin_13', type: 'expense', title: 'Promotional Flex Hoardings, Posters & Printing', amount: 7800, category: 'Marketing & Print', date: '2026-10-10', payment_method: 'UPI', reference_no: 'UPI/PRINT/FLX4', paid_by_or_to: 'Calicut Modern Printers', notes: 'Junction flex banners and match schedules' },
  { id: 'fin_14', type: 'expense', title: 'Nivia Shining Star Sevens Match Balls & Cones', amount: 6500, category: 'Equipment & Balls', date: '2026-10-10', payment_method: 'UPI', reference_no: 'UPI/NIVIA/BL01', paid_by_or_to: 'Universal Sports Goods', notes: '10 Match balls + training equipment' },
];

async function initDatabase() {
  console.log('Connecting to Neon Database...');
  const sql = neon(CONNECTION_STRING);

  try {
    console.log('Applying database schema & creating tables...');
    await sql.transaction([
      sql`
        CREATE TABLE IF NOT EXISTS teams (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          badge VARCHAR(255) NOT NULL DEFAULT '#156637',
          played INTEGER NOT NULL DEFAULT 0,
          won INTEGER NOT NULL DEFAULT 0,
          drawn INTEGER NOT NULL DEFAULT 0,
          lost INTEGER NOT NULL DEFAULT 0,
          gf INTEGER NOT NULL DEFAULT 0,
          ga INTEGER NOT NULL DEFAULT 0,
          points INTEGER NOT NULL DEFAULT 0,
          players JSONB NOT NULL DEFAULT '[]'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `,
      sql`
        CREATE TABLE IF NOT EXISTS fixtures (
          id VARCHAR(50) PRIMARY KEY,
          round VARCHAR(100) NOT NULL,
          home_team VARCHAR(255) NOT NULL,
          away_team VARCHAR(255) NOT NULL,
          date VARCHAR(50) NOT NULL,
          time VARCHAR(50) NOT NULL,
          venue VARCHAR(255) NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'upcoming',
          next_match_id VARCHAR(50),
          next_match_slot VARCHAR(50),
          home_score INTEGER,
          away_score INTEGER,
          home_penalty INTEGER,
          away_penalty INTEGER,
          scorers JSONB NOT NULL DEFAULT '[]'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `,
      sql`
        CREATE TABLE IF NOT EXISTS results (
          id VARCHAR(50) PRIMARY KEY,
          fixture_id VARCHAR(50),
          round VARCHAR(100) NOT NULL,
          home_team VARCHAR(255) NOT NULL,
          away_team VARCHAR(255) NOT NULL,
          home_score INTEGER NOT NULL DEFAULT 0,
          away_score INTEGER NOT NULL DEFAULT 0,
          home_penalty INTEGER,
          away_penalty INTEGER,
          date VARCHAR(50),
          time VARCHAR(50),
          venue VARCHAR(255),
          scorers JSONB NOT NULL DEFAULT '[]'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `,
      sql`
        CREATE TABLE IF NOT EXISTS scorers (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          team VARCHAR(255) NOT NULL,
          team_badge VARCHAR(255) DEFAULT '#156637',
          goals INTEGER NOT NULL DEFAULT 0,
          assists INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `,
      sql`
        CREATE TABLE IF NOT EXISTS tournament_meta (
          id VARCHAR(50) PRIMARY KEY DEFAULT 'current',
          title VARCHAR(255) NOT NULL DEFAULT 'Evening Sevens Football Championship',
          club_name VARCHAR(255) NOT NULL DEFAULT 'Pulari Arts and Sports Club',
          season VARCHAR(50) NOT NULL DEFAULT '2026',
          status VARCHAR(50) NOT NULL DEFAULT 'in_progress',
          settings JSONB NOT NULL DEFAULT '{"maxPlayersPerTeam": 15, "format": "knockout"}'::jsonb,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `,
      sql`
        CREATE TABLE IF NOT EXISTS tournament_finances (
          id VARCHAR(50) PRIMARY KEY,
          type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
          title VARCHAR(255) NOT NULL,
          amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
          category VARCHAR(100) NOT NULL,
          date VARCHAR(50) NOT NULL,
          payment_method VARCHAR(50) DEFAULT 'Cash',
          reference_no VARCHAR(100),
          paid_by_or_to VARCHAR(255),
          notes TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `
    ]);

    console.log('Tables created or confirmed successfully!');

    // Check if teams exist
    const existingTeams = await sql`SELECT COUNT(*) as count FROM teams`;
    if (parseInt(existingTeams[0].count, 10) === 0) {
      console.log('Seeding teams and squads...');
      for (const t of SEED_TEAMS) {
        const squad = DEFAULT_SQUADS[t.name] || [];
        await sql`
          INSERT INTO teams (id, name, badge, played, won, drawn, lost, gf, ga, points, players)
          VALUES (${t.id}, ${t.name}, ${t.badge}, ${t.played}, ${t.won}, ${t.drawn}, ${t.lost}, ${t.gf}, ${t.ga}, ${t.points}, ${JSON.stringify(squad)})
          ON CONFLICT (id) DO NOTHING;
        `;
      }
      console.log(`Seeded ${SEED_TEAMS.length} teams.`);
    }

    // Check if fixtures exist
    const existingFixtures = await sql`SELECT COUNT(*) as count FROM fixtures`;
    if (parseInt(existingFixtures[0].count, 10) === 0) {
      console.log('Seeding initial knockout fixtures...');
      for (const f of SEED_FIXTURES) {
        await sql`
          INSERT INTO fixtures (id, round, home_team, away_team, date, time, venue, status, next_match_id, next_match_slot, scorers)
          VALUES (
            ${f.id}, ${f.round}, ${f.homeTeam}, ${f.awayTeam}, 
            ${f.date}, ${f.time}, ${f.venue}, ${f.status}, 
            ${f.nextMatchId || null}, ${f.nextMatchSlot || null}, 
            '[]'::jsonb
          )
          ON CONFLICT (id) DO NOTHING;
        `;
      }
      console.log(`Seeded ${SEED_FIXTURES.length} fixtures.`);
    }

    // Check if finances exist, if not seed finances
    const existingFinances = await sql`SELECT COUNT(*) as count FROM tournament_finances`;
    if (parseInt(existingFinances[0].count, 10) === 0) {
      console.log('Seeding tournament finances...');
      for (const fin of SEED_FINANCES) {
        await sql`
          INSERT INTO tournament_finances (id, type, title, amount, category, date, payment_method, reference_no, paid_by_or_to, notes)
          VALUES (${fin.id}, ${fin.type}, ${fin.title}, ${fin.amount}, ${fin.category}, ${fin.date}, ${fin.payment_method}, ${fin.reference_no}, ${fin.paid_by_or_to}, ${fin.notes})
          ON CONFLICT (id) DO NOTHING;
        `;
      }
      console.log(`Seeded ${SEED_FINANCES.length} financial transactions.`);
    } else {
      console.log(`Finances table already has ${existingFinances[0].count} transactions.`);
    }

    console.log('\n======================================================');
    console.log('Neon Database Setup & Finances Module Initialized! 🚀');
    console.log('======================================================');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
}

initDatabase();
