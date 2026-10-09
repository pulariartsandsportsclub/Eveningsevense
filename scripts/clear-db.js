import { neon } from '@neondatabase/serverless';

const CONNECTION_STRING = process.env.VITE_NEON_DATABASE_URL || 
  'postgresql://neondb_owner:npg_m9HfJyWMF0lP@ep-tiny-meadow-b52iowfu-pooler.c-7.us-east-2.aws.neon.tech/Pularisevens?sslmode=require';

async function clearDatabase() {
  console.log('Connecting to Neon Database to clear all dummy data...');
  const sql = neon(CONNECTION_STRING);

  try {
    await sql.transaction([
      sql`TRUNCATE TABLE results CASCADE;`,
      sql`TRUNCATE TABLE fixtures CASCADE;`,
      sql`TRUNCATE TABLE scorers CASCADE;`,
      sql`TRUNCATE TABLE tournament_finances CASCADE;`,
      sql`TRUNCATE TABLE teams CASCADE;`,
    ]);

    console.log('✅ Successfully cleared all data from teams, fixtures, results, scorers, and tournament_finances tables in Neon DB!');
  } catch (err) {
    console.error('Error clearing database tables:', err);
  }
}

clearDatabase();
