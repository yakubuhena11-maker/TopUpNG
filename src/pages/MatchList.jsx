import { useState, useEffect } from 'react';
import { getMatches } from '../services/api';

function MatchList() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ sport: 'football', date: '' });

  useEffect(() => {
    fetchMatches();
  }, [filters]);

  const fetchMatches = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getMatches(filters);
      setMatches(response.data);
    } catch (err) {
      setError('Could not load matches. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="match-list-page">
      <h2>Upcoming Matches</h2>

      <div className="filters">
        <select name="sport" value={filters.sport} onChange={handleFilterChange}>
          <option value="football">Football</option>
        </select>
        <input
          type="date"
          name="date"
          value={filters.date}
          onChange={handleFilterChange}
        />
      </div>

      {loading && <p>Loading matches...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && matches.length === 0 && (
        <p>No matches found.</p>
      )}

      <div className="match-grid">
        {matches.map((match) => (
          <div key={match.id} className="match-card">
            <div className="match-teams">
              {match.homeTeam} vs {match.awayTeam}
            </div>
            <div className="match-meta">
              {match.competition} · {match.startTime}
            </div>
            {match.prediction && (
              <div className="match-prediction">
                Prediction: {match.prediction} ({match.probability}%)
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default MatchList;