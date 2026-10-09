import { useState, useMemo } from 'react';
import { useTournament } from '../context/TournamentContext';
import TeamCard from '../components/TeamCard';
import TeamModal from '../components/TeamModal';
import { getTeamAnalytics } from '../utils/teamStats';
import {
  Users, Search, X, Trophy, Target, LayoutGrid, List,
  ArrowUpDown, Flame, Shield, ArrowUpRight
} from 'lucide-react';
import './Teams.css';

export default function Teams() {
  const { teams, fixtures, results, scorers } = useTournament();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'active' | 'winners' | 'eliminated' | 'squad'
  const [sortOption, setSortOption] = useState('name-asc'); // 'name-asc' | 'name-desc' | 'wins' | 'goals' | 'winrate' | 'squad'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table' | 'squad'
  const [selectedTeam, setSelectedTeam] = useState(null);

  // Compute analytics for all teams
  const allTeamAnalytics = useMemo(() => {
    return teams.map(team => getTeamAnalytics(team, fixtures, results, scorers));
  }, [teams, fixtures, results, scorers]);

  // Overall Tournament Metrics
  const totalRegisteredPlayers = useMemo(() => {
    return allTeamAnalytics.reduce((sum, t) => sum + (t.players ? t.players.length : 0), 0);
  }, [allTeamAnalytics]);

  const activeContendersCount = useMemo(() => {
    return allTeamAnalytics.filter(t => t.status === 'active' || t.status === 'champion').length;
  }, [allTeamAnalytics]);

  const totalTournamentGoals = useMemo(() => {
    return results.reduce((sum, r) => sum + (Number(r.homeScore) || 0) + (Number(r.awayScore) || 0), 0);
  }, [results]);

  // Filter & Search Logic (searches team names and player names)
  const filteredTeams = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return allTeamAnalytics.filter(item => {
      // 1. Search Query
      if (q) {
        const matchesTeamName = item.team.name.toLowerCase().includes(q);
        const matchesPlayer = item.players.some(p => p.toLowerCase().includes(q));
        if (!matchesTeamName && !matchesPlayer) return false;
      }

      // 2. Filter Category
      if (filterMode === 'active') return item.status === 'active' || item.status === 'champion';
      if (filterMode === 'winners') return item.won > 0;
      if (filterMode === 'eliminated') return item.status === 'eliminated';
      if (filterMode === 'squad') return item.players && item.players.length > 0;

      return true;
    });
  }, [allTeamAnalytics, searchTerm, filterMode]);

  // Sort Logic
  const sortedTeams = useMemo(() => {
    return [...filteredTeams].sort((a, b) => {
      if (sortOption === 'name-asc') return a.team.name.localeCompare(b.team.name);
      if (sortOption === 'name-desc') return b.team.name.localeCompare(a.team.name);
      if (sortOption === 'wins') return b.won - a.won || b.gf - a.gf;
      if (sortOption === 'goals') return b.gf - a.gf || b.gd - a.gd;
      if (sortOption === 'winrate') return b.winRate - a.winRate || b.won - a.won;
      if (sortOption === 'squad') return b.players.length - a.players.length;
      return 0;
    });
  }, [filteredTeams, sortOption]);

  // Selected Team Analytics for Modal
  const selectedAnalytics = useMemo(() => {
    if (!selectedTeam) return null;
    return allTeamAnalytics.find(a => a.team.id === selectedTeam.id) || getTeamAnalytics(selectedTeam, fixtures, results, scorers);
  }, [selectedTeam, allTeamAnalytics, fixtures, results, scorers]);

  return (
    <div className="page teams-page">
      {/* ===== HEADER ===== */}
      <div className="teams-header-hero">
        <div className="teams-hero-text">
          <div className="teams-hero-tag">
            <Shield size={13} />
            <span>Knockout Championship 2026</span>
          </div>
          <h1 className="page-title">Tournament Teams</h1>
          <p className="page-subtitle">
            Explore squad rosters, tournament records, and match progression for every competing club.
          </p>
        </div>

        {/* Vital Metrics Ribbon */}
        <div className="teams-metrics-ribbon">
          <div className="tm-stat-pill">
            <div className="tm-stat-icon-wrap" style={{ background: 'var(--primary-dim)', color: 'var(--primary)' }}>
              <Shield size={16} />
            </div>
            <div className="tm-stat-details">
              <span className="tm-stat-num">{teams.length}</span>
              <span className="tm-stat-lbl">Clubs</span>
            </div>
          </div>

          <div className="tm-stat-pill">
            <div className="tm-stat-icon-wrap" style={{ background: 'rgba(233, 158, 17, 0.12)', color: 'var(--gold)' }}>
              <Flame size={16} />
            </div>
            <div className="tm-stat-details">
              <span className="tm-stat-num">{activeContendersCount}</span>
              <span className="tm-stat-lbl">In Contention</span>
            </div>
          </div>

          <div className="tm-stat-pill">
            <div className="tm-stat-icon-wrap" style={{ background: 'rgba(0, 155, 98, 0.12)', color: 'var(--primary)' }}>
              <Users size={16} />
            </div>
            <div className="tm-stat-details">
              <span className="tm-stat-num">{totalRegisteredPlayers}</span>
              <span className="tm-stat-lbl">Players</span>
            </div>
          </div>

          <div className="tm-stat-pill">
            <div className="tm-stat-icon-wrap" style={{ background: 'rgba(189, 53, 45, 0.12)', color: 'var(--danger)' }}>
              <Target size={16} />
            </div>
            <div className="tm-stat-details">
              <span className="tm-stat-num">{totalTournamentGoals}</span>
              <span className="tm-stat-lbl">Goals</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== CONTROLS & TOOLBAR ===== */}
      <div className="teams-toolbar-container">
        {/* Search & Sort Row */}
        <div className="teams-search-row">
          <div className="teams-search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="form-input teams-search-input"
              placeholder="Search team name or player..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className="teams-clear-search"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="teams-right-controls">
            {/* Sort Dropdown */}
            <div className="teams-sort-wrapper">
              <ArrowUpDown size={14} className="teams-sort-icon" />
              <select
                className="form-input teams-sort-select"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="name-asc">Sort: Name (A to Z)</option>
                <option value="name-desc">Sort: Name (Z to A)</option>
                <option value="wins">Sort: Most Wins</option>
                <option value="goals">Sort: Most Goals</option>
                <option value="winrate">Sort: Highest Win Rate</option>
                <option value="squad">Sort: Squad Size</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="teams-view-toggle">
              <button
                type="button"
                className={`teams-view-btn ${viewMode === 'grid' ? 'teams-view-btn--active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Cards Grid View"
                aria-label="Grid View"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                className={`teams-view-btn ${viewMode === 'table' ? 'teams-view-btn--active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Standings Table View"
                aria-label="Table View"
              >
                <List size={16} />
              </button>
              <button
                type="button"
                className={`teams-view-btn ${viewMode === 'squad' ? 'teams-view-btn--active' : ''}`}
                onClick={() => setViewMode('squad')}
                title="Squad Gallery View"
                aria-label="Squad Gallery View"
              >
                <Users size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="teams-filter-chips">
          <button
            type="button"
            className={`filter-btn ${filterMode === 'all' ? 'filter-btn--active' : ''}`}
            onClick={() => setFilterMode('all')}
          >
            All Teams ({teams.length})
          </button>
          <button
            type="button"
            className={`filter-btn ${filterMode === 'active' ? 'filter-btn--active' : ''}`}
            onClick={() => setFilterMode('active')}
          >
            <Flame size={13} /> In Contention ({activeContendersCount})
          </button>
          <button
            type="button"
            className={`filter-btn ${filterMode === 'winners' ? 'filter-btn--active' : ''}`}
            onClick={() => setFilterMode('winners')}
          >
            <Trophy size={13} /> Won Matches
          </button>
          <button
            type="button"
            className={`filter-btn ${filterMode === 'squad' ? 'filter-btn--active' : ''}`}
            onClick={() => setFilterMode('squad')}
          >
            <Users size={13} /> With Squad
          </button>
          <button
            type="button"
            className={`filter-btn ${filterMode === 'eliminated' ? 'filter-btn--active' : ''}`}
            onClick={() => setFilterMode('eliminated')}
          >
            Knocked Out
          </button>
        </div>
      </div>

      {/* ===== TEAMS LISTING CONTENT ===== */}
      {sortedTeams.length === 0 ? (
        <div className="empty-state teams-empty-state">
          <Shield size={44} />
          <h3>No teams found</h3>
          <p>
            {searchTerm
              ? `No teams or players matched your search "${searchTerm}".`
              : 'No teams match the selected filter.'}
          </p>
          {searchTerm && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => { setSearchTerm(''); setFilterMode('all'); }}
            >
              Reset Search & Filters
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* ===== TABLE / STANDINGS VIEW ===== */
        <div className="teams-table-container glass-card">
          <div className="teams-table-header">
            <div className="tt-col tt-col-rank">#</div>
            <div className="tt-col tt-col-team">Team</div>
            <div className="tt-col tt-col-stat">P</div>
            <div className="tt-col tt-col-stat">W</div>
            <div className="tt-col tt-col-stat">D</div>
            <div className="tt-col tt-col-stat">L</div>
            <div className="tt-col tt-col-stat">GF</div>
            <div className="tt-col tt-col-stat">GA</div>
            <div className="tt-col tt-col-stat">GD</div>
            <div className="tt-col tt-col-form">Form</div>
            <div className="tt-col tt-col-squad">Squad</div>
            <div className="tt-col tt-col-action">Details</div>
          </div>

          <div className="teams-table-body">
            {sortedTeams.map((item, i) => {
              const badgeColor = item.team.badge || '#156637';
              const isLight = badgeColor.toLowerCase() === '#ffffff' || badgeColor.toLowerCase() === '#fff';

              return (
                <div
                  key={item.team.id}
                  className="teams-table-row"
                  onClick={() => setSelectedTeam(item.team)}
                >
                  <div className="tt-col tt-col-rank">
                    <span className="tt-rank-num">{String(i + 1).padStart(2, '0')}</span>
                  </div>

                  <div className="tt-col tt-col-team">
                    <div
                      className="tt-crest"
                      style={{
                        background: badgeColor,
                        color: isLight ? '#17211d' : '#FFFFFF',
                      }}
                    >
                      {item.team.name.charAt(0)}
                    </div>
                    <div className="tt-team-info">
                      <span className="tt-team-name">{item.team.name}</span>
                      <span className="tt-team-stage">
                        {item.status === 'champion' ? '🏆 Champion' : item.status === 'eliminated' ? 'Knocked Out' : 'Knockout Stage'}
                      </span>
                    </div>
                  </div>

                  <div className="tt-col tt-col-stat tt-font-mono">{item.played}</div>
                  <div className="tt-col tt-col-stat tt-font-mono tt-val-win">{item.won}</div>
                  <div className="tt-col tt-col-stat tt-font-mono">{item.drawn}</div>
                  <div className="tt-col tt-col-stat tt-font-mono tt-val-loss">{item.lost}</div>
                  <div className="tt-col tt-col-stat tt-font-mono">{item.gf}</div>
                  <div className="tt-col tt-col-stat tt-font-mono">{item.ga}</div>
                  <div className="tt-col tt-col-stat tt-font-mono" style={{ color: item.gd > 0 ? 'var(--primary)' : item.gd < 0 ? 'var(--danger)' : 'inherit', fontWeight: 700 }}>
                    {item.gd > 0 ? `+${item.gd}` : item.gd}
                  </div>

                  <div className="tt-col tt-col-form">
                    {item.form.length > 0 ? (
                      <div className="tt-form-dots">
                        {item.form.map((res, fIdx) => (
                          <span key={fIdx} className={`tt-form-dot tt-form-dot--${res.toLowerCase()}`}>{res}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="tt-no-form">—</span>
                    )}
                  </div>

                  <div className="tt-col tt-col-squad">
                    <span className="tt-squad-badge">
                      <Users size={12} /> {item.players.length}
                    </span>
                  </div>

                  <div className="tt-col tt-col-action">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm tt-view-btn"
                      onClick={(e) => { e.stopPropagation(); setSelectedTeam(item.team); }}
                    >
                      Squad <ArrowUpRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ===== CARDS GRID & SQUAD GALLERY VIEW ===== */
        <div className={viewMode === 'squad' ? 'teams-squad-grid' : 'teams-cards-grid'}>
          {sortedTeams.map((item, i) => (
            <div key={item.team.id} style={{ animationDelay: `${Math.min(i * 0.03, 0.4)}s` }}>
              <TeamCard
                team={item.team}
                analytics={item}
                index={i}
                onSelect={setSelectedTeam}
                viewMode={viewMode}
              />
            </div>
          ))}
        </div>
      )}

      {/* ===== INTERACTIVE SQUAD & ANALYTICS MODAL ===== */}
      {selectedTeam && (
        <TeamModal
          teamAnalytics={selectedAnalytics}
          onClose={() => setSelectedTeam(null)}
        />
      )}
    </div>
  );
}
