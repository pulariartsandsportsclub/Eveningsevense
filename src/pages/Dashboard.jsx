import { useTournament } from '../context/TournamentContext';
import { ResultCard, FixtureCard } from '../components/MatchCard';
import { Calendar, MapPin, Trophy, Users, CheckCircle, ChevronRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

function getTeamData(teams, teamName) {
  if (!teamName || !Array.isArray(teams)) return null;
  return teams.find(t => t.name && t.name.trim().toLowerCase() === teamName.trim().toLowerCase()) || null;
}

function TeamCrest({ teamName, teamData, size = 'md' }) {
  const badge = teamData?.badge;
  const isImage = badge && (badge.startsWith('http') || badge.startsWith('/') || badge.startsWith('data:'));
  const initials = teamName
    ? teamName.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || teamName.substring(0, 2).toUpperCase()
    : 'FC';
  const bgColor = (!isImage && badge && badge.startsWith('#')) ? badge : '#0E4829';

  return (
    <div className={`team-crest team-crest--${size}`}>
      {isImage ? (
        <img src={badge} alt={teamName} className="crest-img" />
      ) : (
        <div className="crest-shield" style={{ backgroundColor: bgColor }}>
          <span className="crest-initials">{initials}</span>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { fixtures = [], results = [], teams = [] } = useTournament();

  const latestResult = results.length > 0
    ? [...results].sort((a, b) => new Date(b.date) - new Date(a.date))[0]
    : null;

  const upcomingFixtures = fixtures
    .filter(f => f.status === 'upcoming')
    .sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`) - new Date(`${b.date}T${b.time || '00:00'}`));

  const nextFixture = upcomingFixtures[0] || null;
  const otherUpcoming = upcomingFixtures.slice(1, 4);

  const homeTeamData = nextFixture ? getTeamData(teams, nextFixture.homeTeam) : null;
  const awayTeamData = nextFixture ? getTeamData(teams, nextFixture.awayTeam) : null;

  const nextMatchDate = nextFixture ? new Date(`${nextFixture.date}T${nextFixture.time || '16:30'}`) : null;
  const isToday = nextMatchDate ? nextMatchDate.toDateString() === new Date().toDateString() : false;
  const dateFormatted = nextMatchDate
    ? (isToday ? 'Today' : nextMatchDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }))
    : '';

  return (
    <div className="page dashboard">
      {/* ===== FEATURED / NEXT MATCH HERO CARD ===== */}
      {nextFixture ? (
        <section className="next-match-section" aria-label="Next Match">
          <div className="next-match-card">
            {/* Subtle football pitch linework background */}
            <div className="pitch-canvas" aria-hidden="true">
              <div className="pitch-center-circle" />
              <div className="pitch-center-line" />
              <div className="pitch-penalty-arc" />
            </div>

            {/* Top Badges */}
            <div className="nm-header">
              <div className="nm-badge-pill">
                <span className="nm-badge-text">NEXT MATCH</span>
              </div>
              {nextFixture.round && (
                <span className="nm-stage-pill">{nextFixture.round}</span>
              )}
            </div>

            {/* Team Names and Crests Face-Off */}
            <div className="nm-faceoff">
              <div className="nm-team nm-team--home">
                <TeamCrest teamName={nextFixture.homeTeam} teamData={homeTeamData} size="lg" />
                <h3 className="nm-team-name">{nextFixture.homeTeam}</h3>
              </div>

              <div className="nm-vs-container">
                <div className="nm-vs-badge">
                  <span className="nm-vs-text">VS</span>
                </div>
                {nextFixture.time && (
                  <span className="nm-time-badge">{nextFixture.time}</span>
                )}
              </div>

              <div className="nm-team nm-team--away">
                <TeamCrest teamName={nextFixture.awayTeam} teamData={awayTeamData} size="lg" />
                <h3 className="nm-team-name">{nextFixture.awayTeam}</h3>
              </div>
            </div>

            {/* Footer Date and Venue */}
            <div className="nm-meta-bar">
              <div className="nm-meta-item">
                <Calendar size={14} className="nm-meta-icon" />
                <span>{dateFormatted}{nextFixture.time ? ` · ${nextFixture.time}` : ''}</span>
              </div>
              {nextFixture.venue && (
                <div className="nm-meta-item">
                  <MapPin size={14} className="nm-meta-icon" />
                  <span className="nm-meta-venue">{nextFixture.venue}</span>
                </div>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="next-match-empty">
          <Trophy size={36} className="empty-trophy" />
          <h3 className="empty-title">Tournament Schedule</h3>
          <p className="empty-desc">No upcoming matches currently scheduled. Check completed results or tournament brackets.</p>
          <div className="empty-actions">
            <Link to="/fixtures" className="btn btn-primary">View Bracket</Link>
          </div>
        </section>
      )}

      {/* ===== LATEST RESULT & UPCOMING FIXTURES ===== */}
      <div className="dashboard-grid">
        {/* Latest Result */}
        <section className="dash-section">
          <div className="section-header">
            <div className="section-title-wrap">
              <h2 className="section-title">Latest Result</h2>
              <span className="section-sub">Most recent match score</span>
            </div>
            {latestResult && <span className="section-badge badge badge-completed">FT</span>}
          </div>
          {latestResult ? (
            <ResultCard result={latestResult} />
          ) : (
            <div className="empty-state">
              <Trophy size={28} />
              <p>No completed results yet</p>
            </div>
          )}
        </section>

        {/* Upcoming Fixtures */}
        <section className="dash-section">
          <div className="section-header">
            <div className="section-title-wrap">
              <h2 className="section-title">Upcoming Fixtures</h2>
              <span className="section-sub">Next scheduled games</span>
            </div>
            <Link to="/fixtures" className="section-link">
              See all <ArrowRight size={13} />
            </Link>
          </div>
          {otherUpcoming.length > 0 ? (
            <div className="upcoming-list">
              {otherUpcoming.map(f => (
                <FixtureCard key={f.id} fixture={f} compact />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Calendar size={28} />
              <p>{nextFixture ? 'No more upcoming games in this round' : 'No fixtures scheduled'}</p>
            </div>
          )}
        </section>
      </div>

      {/* ===== QUICK ACCESS SECTION ===== */}
      <section className="quick-access-section" aria-label="Tournament Navigation">
        <div className="section-header">
          <div className="section-title-wrap">
            <h2 className="section-title">Quick Access</h2>
            <span className="section-sub">Explore the tournament</span>
          </div>
        </div>
        <div className="quick-access-grid">
          <Link to="/fixtures" className="quick-card">
            <div className="quick-card-icon-wrap icon-bracket">
              <Trophy size={20} />
            </div>
            <div className="quick-card-body">
              <span className="quick-card-title">Tournament Bracket</span>
              <span className="quick-card-sub">All knockout rounds & fixtures</span>
            </div>
            <ChevronRight size={18} className="quick-card-arrow" />
          </Link>

          <Link to="/teams" className="quick-card">
            <div className="quick-card-icon-wrap icon-teams">
              <Users size={20} />
            </div>
            <div className="quick-card-body">
              <span className="quick-card-title">Teams & Squads</span>
              <span className="quick-card-sub">Contenders, players & stats</span>
            </div>
            <ChevronRight size={18} className="quick-card-arrow" />
          </Link>

          <Link to="/results" className="quick-card">
            <div className="quick-card-icon-wrap icon-results">
              <CheckCircle size={20} />
            </div>
            <div className="quick-card-body">
              <span className="quick-card-title">Results & Standings</span>
              <span className="quick-card-sub">Match summaries & scores</span>
            </div>
            <ChevronRight size={18} className="quick-card-arrow" />
          </Link>
        </div>
      </section>
    </div>
  );
}
