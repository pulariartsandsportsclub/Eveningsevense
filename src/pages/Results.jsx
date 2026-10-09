import { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { ResultCard } from '../components/MatchCard';
import { CheckCircle } from 'lucide-react';
import '../pages/Teams.css';
import './Results.css';

export default function Results() {
  const { results, teams } = useTournament();
  const [filterTeam, setFilterTeam] = useState('All');

  const teamNames = ['All', ...new Set([...results.map(r => r.homeTeam), ...results.map(r => r.awayTeam)])].sort();

  const filtered = filterTeam === 'All'
    ? results
    : results.filter(r => r.homeTeam === filterTeam || r.awayTeam === filterTeam);

  const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Results</h1>
        <p className="page-subtitle">{results.length} matches completed</p>
      </div>

      <div className="filter-bar results-filter" style={{ flexWrap: 'wrap' }}>
        {teamNames.slice(0, 8).map(name => (
          <button
            key={name}
            className={`filter-btn ${filterTeam === name ? 'filter-btn--active' : ''}`}
            onClick={() => setFilterTeam(name)}
          >
            {name}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="empty-state">
          <CheckCircle size={40} />
          <p>No results yet. Enter match results via Admin panel.</p>
        </div>
      ) : (
        <div className="results-list">
          {sorted.map((r, i) => (
            <div key={r.id} style={{ animationDelay: `${i * 0.05}s` }}>
              <ResultCard result={r} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
