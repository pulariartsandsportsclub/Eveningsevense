import { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { FixtureCard } from '../components/MatchCard';
import KnockoutBracket from '../components/KnockoutBracket';
import { Calendar, Network, List } from 'lucide-react';
import '../pages/Teams.css';

export default function Fixtures() {
  const { fixtures } = useTournament();
  const [view, setView] = useState('bracket'); // 'bracket' | 'list'
  const [filter, setFilter] = useState('all');

  const filtered = fixtures.filter(f => {
    if (filter === 'all') return true;
    return f.status === filter;
  });

  // Group by date
  const grouped = filtered.reduce((acc, f) => {
    const key = f.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(f);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  return (
    <div className="page">
      <div className="page-header fixtures-page-header">
        <div>
          <h1 className="page-title">⚔️ Knockout Bracket</h1>
          <p className="page-subtitle">Tournament progression and upcoming matches</p>
        </div>
        
        <div className="fixtures-view-toggle">
          <button 
            className={`btn ${view === 'bracket' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
            onClick={() => setView('bracket')}
            style={{ padding: '4px 12px' }}
          >
            <Network size={16} /> Bracket
          </button>
          <button 
            className={`btn ${view === 'list' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
            onClick={() => setView('list')}
            style={{ padding: '4px 12px' }}
          >
            <List size={16} /> List
          </button>
        </div>
      </div>

      {view === 'bracket' ? (
        <div style={{ marginTop: '20px' }}>
          <KnockoutBracket />
        </div>
      ) : (
        <>
          <div className="filter-bar">
            {['all', 'upcoming', 'live', 'completed', 'postponed'].map(f => (
              <button
                key={f}
                className={`filter-btn ${filter === f ? 'filter-btn--active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                {f === 'live' && fixtures.filter(x => x.status === 'live').length > 0 && (
                  <span className="live-count">{fixtures.filter(x => x.status === 'live').length}</span>
                )}
                {f === 'postponed' && fixtures.filter(x => x.status === 'postponed').length > 0 && (
                  <span className="live-count" style={{ background: '#D97706' }}>{fixtures.filter(x => x.status === 'postponed').length}</span>
                )}
              </button>
            ))}
          </div>

          {sortedDates.length === 0 ? (
            <div className="empty-state">
              <Calendar size={40} />
              <p>No fixtures found. Add fixtures via Admin panel.</p>
            </div>
          ) : (
            sortedDates.map(date => (
              <div key={date} className="fixture-group">
                <div className="fixture-date-header">
                  <span className="fixture-date-line" />
                  <span className="fixture-date-label">
                    {new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  <span className="fixture-date-line" />
                </div>
                <div className="fixture-group-cards">
                  {grouped[date].map(f => (
                    <FixtureCard key={f.id} fixture={f} />
                  ))}
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}
