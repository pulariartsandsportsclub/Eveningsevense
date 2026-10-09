import { Users, Trophy, ArrowUpRight, Flame, XCircle, Clock, CheckCircle } from 'lucide-react';
import './TeamCard.css';

export default function TeamCard({ team, analytics, index, onSelect, viewMode = 'grid' }) {
  const badgeColor = team.badge || '#156637';

  const {
    played = 0,
    won = 0,
    drawn = 0,
    lost = 0,
    gf = 0,
    gd = 0,
    status = 'active',
    nextMatch = null,
    lastMatch = null,
    players = [],
    topScorer = null,
  } = analytics || {};

  // Contrast text color for crest
  const isLightBadge = badgeColor.toLowerCase() === '#ffffff' || badgeColor.toLowerCase() === '#fff';
  const crestTextColor = isLightBadge ? '#17211d' : '#FFFFFF';

  if (viewMode === 'squad') {
    return (
      <div
        className="team-squad-card glass-card"
        onClick={() => onSelect(team)}
        style={{ '--team-color': badgeColor }}
      >
        <div className="tsc-header">
          <div
            className="tsc-crest"
            style={{
              background: badgeColor,
              color: crestTextColor,
              boxShadow: `0 4px 14px ${badgeColor}40`,
            }}
          >
            {index !== undefined ? index + 1 : (team.name ? team.name.charAt(0) : '1')}
          </div>
          <div className="tsc-info">
            <h3 className="tsc-name">{team.name}</h3>
            <span className="tsc-count">{players.length} Squad Members</span>
          </div>
          <button type="button" className="tsc-view-btn" aria-label="View team details">
            <ArrowUpRight size={15} />
          </button>
        </div>

        <div className="tsc-roster-preview">
          {players.slice(0, 7).map((p, idx) => (
            <span key={idx} className="tsc-player-pill">
              <span className="tsc-num">{idx + 1}</span> {p}
            </span>
          ))}
          {players.length > 7 && (
            <span className="tsc-player-more">+{players.length - 7} more</span>
          )}
        </div>
      </div>
    );
  }

  // Default Grid View
  return (
    <div
      className="team-pro-card glass-card"
      onClick={() => onSelect(team)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(team); }}
      style={{ '--team-color': badgeColor }}
    >
      {/* Glow highlight line */}
      <div className="team-card-glow-bar" style={{ background: badgeColor }} />

      {/* Top Meta */}
      <div className="team-card-top">
        <span className="team-card-index">#{String(index + 1).padStart(2, '0')}</span>

        <div className="team-card-status">
          {status === 'champion' && (
            <span className="badge badge-upcoming" style={{ color: '#d97706', borderColor: 'rgba(217, 119, 6, 0.3)' }}>
              <Trophy size={10} /> Champion
            </span>
          )}
          {status === 'active' && (
            <span className="badge badge-completed">
              <Flame size={10} /> In Contention
            </span>
          )}
          {status === 'eliminated' && (
            <span className="badge badge-live">
              <XCircle size={10} /> Knocked Out
            </span>
          )}
        </div>
      </div>

      {/* Main Crest + Title */}
      <div className="team-card-main">
        <div
          className="team-pro-crest"
          style={{
            background: badgeColor,
            color: crestTextColor,
            boxShadow: `0 6px 18px ${badgeColor}38`,
          }}
        >
          <span>{index !== undefined ? index + 1 : (team.name ? team.name.charAt(0) : '1')}</span>
        </div>

        <div className="team-pro-title-wrap">
          <h3 className="team-pro-title">{team.name}</h3>

          {/* Sub context (Next match or Last match) */}
          {nextMatch ? (
            <span className="team-pro-subcontext">
              <Clock size={11} /> Next: vs {nextMatch.homeTeam === team.name ? nextMatch.awayTeam : nextMatch.homeTeam}
            </span>
          ) : lastMatch ? (
            <span className="team-pro-subcontext">
              <CheckCircle size={11} /> Last: {lastMatch.homeScore}-{lastMatch.awayScore} vs {lastMatch.homeTeam === team.name ? lastMatch.awayTeam : lastMatch.homeTeam}
            </span>
          ) : (
            <span className="team-pro-subcontext" style={{ color: 'var(--text-muted)' }}>
              Knockout Stage
            </span>
          )}
        </div>
      </div>

      {/* Performance Bar (Wins / Goals) */}
      <div className="team-pro-stats-strip">
        <div className="tps-col">
          <span className="tps-label">P</span>
          <span className="tps-val">{played}</span>
        </div>
        <div className="tps-col">
          <span className="tps-label">W-D-L</span>
          <span className="tps-val">{won}-{drawn}-{lost}</span>
        </div>
        <div className="tps-col">
          <span className="tps-label">GF</span>
          <span className="tps-val">{gf}</span>
        </div>
        <div className="tps-col">
          <span className="tps-label">GD</span>
          <span className="tps-val" style={{ color: gd > 0 ? 'var(--primary)' : gd < 0 ? 'var(--danger)' : 'inherit' }}>
            {gd > 0 ? `+${gd}` : gd}
          </span>
        </div>
      </div>

      {/* Footer info: Squad size & Top Scorer or Action */}
      <div className="team-pro-footer">
        <div className="team-pro-squad-info">
          <Users size={13} />
          <span>{players.length} Players</span>
          {topScorer && topScorer.goals > 0 && (
            <span className="team-pro-top-scorer">
              • ⚽ {topScorer.name.split(' ').pop()} ({topScorer.goals})
            </span>
          )}
        </div>

        <div className="team-pro-action">
          <span className="team-pro-cta">Squad</span>
          <ArrowUpRight size={14} className="team-pro-arrow" />
        </div>
      </div>
    </div>
  );
}
