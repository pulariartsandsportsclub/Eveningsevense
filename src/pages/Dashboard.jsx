import { useTournament } from '../context/TournamentContext';
import { ResultCard, FixtureCard } from '../components/MatchCard';
import { Trophy, Users, Calendar, Target, TrendingUp, Zap, ArrowUpRight, Timer } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

export default function Dashboard() {
  const { teams, fixtures, results, scorers } = useTournament();

  const latestResult = [...results].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  const upcomingFixtures = fixtures
    .filter(f => f.status === 'upcoming')
    .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
  const nextFixture = upcomingFixtures[0];
  const topScorers = [...scorers].sort((a, b) => b.goals - a.goals).slice(0, 3);
  const totalGoals = results.reduce((sum, r) => sum + r.homeScore + r.awayScore, 0);
  const liveCount = fixtures.filter(f => f.status === 'live').length;

  return (
    <div className="page dashboard">
      {/* ===== HERO ===== */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-tag">
            <Zap size={12} />
            Live from Pulari • Season 2026
          </div>
          <h1 className="hero-title">Where the game<br /><span className="hero-title-accent">comes alive.</span></h1>
          <p className="hero-sub">The official home of the Pulari EveningPlay knockout. Follow every fixture, every goal, and every moment under the lights.</p>
          <div className="hero-actions">
            <Link to="/fixtures" className="btn btn-primary">View fixtures <ArrowUpRight size={16} /></Link>
            <Link to="/leaderboard" className="hero-text-link">Golden Boot <span>→</span></Link>
          </div>
        </div>
        <div className="hero-trophy">
          <div className="pitch-markings"><span /><i /><b /></div>
          <div className="hero-orbit hero-orbit-one" />
          <div className="hero-orbit hero-orbit-two" />
          <div className="trophy-glow" />
          <img src="/pulari-logo.png" alt="Pulari Arts and Sports Club" className="hero-club-logo" />
          <div className="hero-scoreboard"><Timer size={13} /> <span>THE BEAUTIFUL GAME</span></div>
        </div>
      </section>

      {/* ===== QUICK STATS ===== */}
      <section className="stats-bar">
        <div className="stat-pill">
          <Users size={16} />
            <span className="stat-pill-val">{String(teams.length).padStart(2, '0')}</span>
          <span className="stat-pill-label">Teams</span>
        </div>
        <div className="stat-pill">
          <Calendar size={16} />
          <span className="stat-pill-val">{fixtures.length}</span>
          <span className="stat-pill-label">Fixtures</span>
        </div>
        <div className="stat-pill">
          <Target size={16} />
          <span className="stat-pill-val">{totalGoals}</span>
          <span className="stat-pill-label">Goals</span>
        </div>
        <div className="stat-pill">
          <TrendingUp size={16} />
          <span className="stat-pill-val">{results.length}</span>
          <span className="stat-pill-label">Results</span>
        </div>
        {liveCount > 0 && (
          <div className="stat-pill stat-pill--live">
            <span className="live-dot" />
            <span className="stat-pill-val">{liveCount}</span>
            <span className="stat-pill-label">Live Now</span>
          </div>
        )}
      </section>

      {/* ===== MAIN GRID ===== */}
      <div className="dashboard-grid">
        {/* Latest Result */}
        <section className="dash-section">
          <div className="section-header">
            <h2 className="section-title">Latest Result</h2>
            <span className="section-badge badge badge-completed">FT</span>
          </div>
          {latestResult
            ? <ResultCard result={latestResult} />
            : <div className="empty-state"><Trophy size={32} /><p>No results yet</p></div>
          }
        </section>

        {/* Next Fixture */}
        <section className="dash-section">
          <div className="section-header">
            <h2 className="section-title">Next Match</h2>
            <span className="section-badge badge badge-upcoming">Upcoming</span>
          </div>
          {nextFixture
            ? <FixtureCard fixture={nextFixture} />
            : <div className="empty-state"><Calendar size={32} /><p>No upcoming matches</p></div>
          }
        </section>
      </div>

      {/* ===== TOP SCORERS PREVIEW ===== */}
      <section className="dash-section scorers-preview">
        <div className="section-header">
          <h2 className="section-title">🏅 Top Scorers</h2>
          <a href="/leaderboard" className="section-link">View all →</a>
        </div>
        <div className="scorers-podium">
          {topScorers.map((scorer, index) => {
            const medals = ['🥇', '🥈', '🥉'];
            const rankClass = ['gold', 'silver', 'bronze'][index];
            return (
              <div key={scorer.id} className={`podium-card glass-card podium-${rankClass}`}>
                <div className="podium-rank">{medals[index]}</div>
                <div className="podium-avatar" style={{ background: `linear-gradient(135deg, ${scorer.teamBadge}33, ${scorer.teamBadge}66)`, borderColor: `${scorer.teamBadge}44` }}>
                  <span style={{ color: scorer.teamBadge }}>{scorer.name.split(' ').map(w => w[0]).join('')}</span>
                </div>
                <div className="podium-info">
                  <span className="podium-name">{scorer.name}</span>
                  <span className="podium-team">{scorer.team}</span>
                </div>
                <div className="podium-goals">
                  <span className="podium-goal-num">{scorer.goals}</span>
                  <span className="podium-goal-label">goals</span>
                </div>
              </div>
            );
          })}
          {topScorers.length === 0 && (
            <div className="empty-state"><p>No scorer data yet</p></div>
          )}
        </div>
      </section>

      {/* ===== UPCOMING FIXTURES STRIP ===== */}
      {upcomingFixtures.length > 1 && (
        <section className="dash-section">
          <div className="section-header">
            <h2 className="section-title">Upcoming Fixtures</h2>
            <a href="/fixtures" className="section-link">See all →</a>
          </div>
          <div className="upcoming-strip">
            {upcomingFixtures.slice(0, 3).map(f => (
              <FixtureCard key={f.id} fixture={f} compact />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
