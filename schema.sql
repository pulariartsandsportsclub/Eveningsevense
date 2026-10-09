-- ====================================================================
-- Pulari Evening Sevens Football Tournament - PostgreSQL Schema for Neon
-- Database: Pularisevens
-- ====================================================================

-- 1. Helper function for auto-updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- 2. TEAMS TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS teams (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    badge VARCHAR(255) NOT NULL DEFAULT '#156637',
    played INTEGER NOT NULL DEFAULT 0,
    won INTEGER NOT NULL DEFAULT 0,
    drawn INTEGER NOT NULL DEFAULT 0,
    lost INTEGER NOT NULL DEFAULT 0,
    gf INTEGER NOT NULL DEFAULT 0,   -- Goals For
    ga INTEGER NOT NULL DEFAULT 0,   -- Goals Against
    points INTEGER NOT NULL DEFAULT 0,
    players JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of player names e.g. ["Player 1", "Player 2"]
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for teams.updated_at
DROP TRIGGER IF EXISTS trg_teams_updated_at ON teams;
CREATE TRIGGER trg_teams_updated_at
BEFORE UPDATE ON teams
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================
-- 3. FIXTURES TABLE (Knockout Bracket & Scheduled Matches)
-- ====================================================================
CREATE TABLE IF NOT EXISTS fixtures (
    id VARCHAR(50) PRIMARY KEY,
    round VARCHAR(100) NOT NULL,            -- e.g. 'Round of 16', 'Quarter-Finals', 'Semi-Finals', 'Final'
    home_team VARCHAR(255) NOT NULL,
    away_team VARCHAR(255) NOT NULL,
    date VARCHAR(50) NOT NULL,              -- e.g. '2026-10-15'
    time VARCHAR(50) NOT NULL,              -- e.g. '20:00'
    venue VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'upcoming', -- 'upcoming' | 'ongoing' | 'completed' | 'postponed'
    next_match_id VARCHAR(50),              -- ID of subsequent knockout match
    next_match_slot VARCHAR(50),            -- 'homeTeam' or 'awayTeam' slot
    home_score INTEGER,
    away_score INTEGER,
    home_penalty INTEGER,
    away_penalty INTEGER,
    scorers JSONB NOT NULL DEFAULT '[]'::jsonb, -- Match-specific scorers [{ id, name, team, minute, goals }]
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast query lookup
CREATE INDEX IF NOT EXISTS idx_fixtures_status ON fixtures(status);
CREATE INDEX IF NOT EXISTS idx_fixtures_round ON fixtures(round);
CREATE INDEX IF NOT EXISTS idx_fixtures_date ON fixtures(date);

-- Trigger for fixtures.updated_at
DROP TRIGGER IF EXISTS trg_fixtures_updated_at ON fixtures;
CREATE TRIGGER trg_fixtures_updated_at
BEFORE UPDATE ON fixtures
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================
-- 4. RESULTS TABLE (Completed Matches Record)
-- ====================================================================
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

-- Indexes for results
CREATE INDEX IF NOT EXISTS idx_results_date ON results(date);
CREATE INDEX IF NOT EXISTS idx_results_round ON results(round);

-- Trigger for results.updated_at
DROP TRIGGER IF EXISTS trg_results_updated_at ON results;
CREATE TRIGGER trg_results_updated_at
BEFORE UPDATE ON results
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================
-- 5. SCORERS TABLE (Top Scorers & Assists Leaderboard)
-- ====================================================================
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

-- Indexes for leaderboard rankings
CREATE INDEX IF NOT EXISTS idx_scorers_goals ON scorers(goals DESC);
CREATE INDEX IF NOT EXISTS idx_scorers_team ON scorers(team);

-- Trigger for scorers.updated_at
DROP TRIGGER IF EXISTS trg_scorers_updated_at ON scorers;
CREATE TRIGGER trg_scorers_updated_at
BEFORE UPDATE ON scorers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================
-- 6. TOURNAMENT METADATA (Optional Configuration & Status)
-- ====================================================================
CREATE TABLE IF NOT EXISTS tournament_meta (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'current',
    title VARCHAR(255) NOT NULL DEFAULT 'Evening Sevens Football Championship',
    club_name VARCHAR(255) NOT NULL DEFAULT 'Pulari Arts and Sports Club',
    season VARCHAR(50) NOT NULL DEFAULT '2026',
    status VARCHAR(50) NOT NULL DEFAULT 'in_progress',
    settings JSONB NOT NULL DEFAULT '{"maxPlayersPerTeam": 15, "format": "knockout"}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO tournament_meta (id, title, club_name, season, status)
VALUES ('current', 'Evening Sevens Football Championship', 'Pulari Arts and Sports Club', '2026', 'in_progress')
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- 7. TOURNAMENT FINANCES (Income & Expense Management)
-- ====================================================================
CREATE TABLE IF NOT EXISTS tournament_finances (
    id VARCHAR(50) PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    title VARCHAR(255) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    category VARCHAR(100) NOT NULL,
    date VARCHAR(50) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'Cash', -- 'Cash' | 'UPI' | 'Bank Transfer' | 'Card' | 'Cheque'
    reference_no VARCHAR(100),
    paid_by_or_to VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for finances
CREATE INDEX IF NOT EXISTS idx_finances_type ON tournament_finances(type);
CREATE INDEX IF NOT EXISTS idx_finances_category ON tournament_finances(category);
CREATE INDEX IF NOT EXISTS idx_finances_date ON tournament_finances(date);

-- Trigger for tournament_finances.updated_at
DROP TRIGGER IF EXISTS trg_finances_updated_at ON tournament_finances;
CREATE TRIGGER trg_finances_updated_at
BEFORE UPDATE ON tournament_finances
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================
-- 8. ADMIN USERS TABLE (Authentication & Security)
-- ====================================================================
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

-- Trigger for admin_users.updated_at
DROP TRIGGER IF EXISTS trg_admin_users_updated_at ON admin_users;
CREATE TRIGGER trg_admin_users_updated_at
BEFORE UPDATE ON admin_users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Seed Default Administrator (admin / pulari2026)
INSERT INTO admin_users (id, username, password_hash, display_name, role)
VALUES ('adm_1', 'admin', '059a05054dabcdf6ee26a79f5d9eda87b75f50b3ddc4efb6a9761e14a5e9d461', 'Pulari Tournament Admin', 'superadmin')
ON CONFLICT (username) DO NOTHING;


