import { useTournament } from '../context/TournamentContext';
import { BarChart2 } from 'lucide-react';
import './Leaderboard.css';

const RANK_COLORS = {
  0: { bg: 'rgba(218, 165, 32, 0.08)', border: 'rgba(218, 165, 32, 0.4)', color: '#B8860B', medal: '🥇' },
  1: { bg: 'rgba(100, 116, 139, 0.06)', border: 'rgba(100, 116, 139, 0.3)', color: '#475569', medal: '🥈' },
  2: { bg: 'rgba(180, 83, 9, 0.08)', border: 'rgba(180, 83, 9, 0.35)', color: '#92400E', medal: '🥉' },
};

export default function Leaderboard() {
  const { scorers } = useTournament();
  const sorted = [...scorers].sort((a, b) => b.goals - a.goals || (b.assists || 0) - (a.assists || 0));
  const maxGoals = sorted[0]?.goals || 1;

  return (
    <div className="page leaderboard-page">
      <div className="page-header">
        <h1 className="page-title">🏅 Golden Boot Leaderboard</h1>
        <p className="page-subtitle">Top individual goalscorers of the tournament</p>
      </div>

      {sorted.length === 0 ? (
        <div className="empty-state">
          <BarChart2 size={40} />
          <p>No scorer data yet. Add scorers via Admin panel.</p>
        </div>
      ) : (
        <div className="leaderboard-table glass-card">
          <div className="lb-header-row">
            <div className="lb-col lb-col-rank">#</div>
            <div className="lb-col lb-col-player">Player</div>
            <div className="lb-col lb-col-team">Team</div>
            <div className="lb-col lb-col-goals">Goals</div>
            <div className="lb-col lb-col-assists">Assists</div>
            <div className="lb-col lb-col-bar">Ratio</div>
          </div>

          <div className="lb-body">
            {sorted.map((scorer, index) => {
              const rank = RANK_COLORS[index];
              return (
                <div
                  key={scorer.id}
                  className={`lb-row ${rank ? 'lb-row--ranked' : ''}`}
                  style={rank ? { background: rank.bg, borderLeft: `3.5px solid ${rank.color}` } : {}}
                >
                  <div className="lb-col lb-col-rank">
                    <span className="rank-label" style={rank ? { color: rank.color } : {}}>
                      {rank ? rank.medal : String(index + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <div className="lb-col lb-col-player">
                    <div
                      className="scorer-avatar"
                      style={{
                        background: `${scorer.teamBadge || '#156637'}18`,
                        borderColor: `${scorer.teamBadge || '#156637'}44`,
                        color: scorer.teamBadge || '#156637',
                      }}
                    >
                      {scorer.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <div className="scorer-name-wrap">
                      <span className="scorer-name">{scorer.name}</span>
                      <span className="scorer-team-sub">{scorer.team}</span>
                    </div>
                  </div>

                  <div className="lb-col lb-col-team">
                    <span
                      className="scorer-team-pill"
                      style={{
                        background: `${scorer.teamBadge || '#156637'}18`,
                        color: scorer.teamBadge || '#156637',
                        borderColor: `${scorer.teamBadge || '#156637'}35`,
                      }}
                    >
                      {scorer.team}
                    </span>
                  </div>

                  <div className="lb-col lb-col-goals">
                    <span className="goal-count" style={rank ? { color: rank.color } : {}}>{scorer.goals}</span>
                    <span className="goal-label">⚽</span>
                  </div>

                  <div className="lb-col lb-col-assists">
                    <span className="assist-count">{scorer.assists || 0}</span>
                    <span className="assist-label">🎯</span>
                  </div>

                  <div className="lb-col lb-col-bar">
                    <div className="perf-bar-track">
                      <div
                        className="perf-bar-fill"
                        style={{
                          width: `${(scorer.goals / maxGoals) * 100}%`,
                          background: scorer.teamBadge || 'var(--primary)',
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
