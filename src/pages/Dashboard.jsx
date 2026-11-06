import { useTournament } from '../context/TournamentContext';
import { ResultCard, FixtureCard } from '../components/MatchCard';
import { Trophy, Calendar, Zap, ArrowUpRight, Timer } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

export default function Dashboard() {
  const { fixtures = [], results = [] } = useTournament();

  const latestResult = results.length > 0 ? [...results].sort((a, b) => new Date(b.date) - new Date(a.date))[0] : null;
  const upcomingFixtures = fixtures
    .filter(f => f.status === 'upcoming')
    .sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`) - new Date(`${b.date}T${b.time || '00:00'}`));
  const nextFixture = upcomingFixtures[0] || null;

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
