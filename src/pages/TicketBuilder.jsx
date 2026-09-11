import { useState } from 'react';
import { createTicket } from '../services/api';

function TicketBuilder() {
  const [selections, setSelections] = useState([]);
  const [ticketName, setTicketName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // For MVP, selections are added manually by ID/market until MatchList
  // supports an "Add to ticket" button that feeds into this list
  const addSelection = (match, market, prediction) => {
    setSelections([...selections, { matchId: match, market, prediction }]);
  };

  const removeSelection = (index) => {
    setSelections(selections.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (selections.length === 0) {
      setMessage('Add at least one selection before saving.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      await createTicket({ name: ticketName, selections });
      setMessage('Ticket saved successfully.');
      setSelections([]);
      setTicketName('');
    } catch (err) {
      setMessage('Could not save ticket. Is the backend running?');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ticket-builder-page">
      <h2>Ticket Builder</h2>

      <input
        type="text"
        placeholder="Ticket name"
        value={ticketName}
        onChange={(e) => setTicketName(e.target.value)}
      />

      {message && <p>{message}</p>}

      {selections.length === 0 ? (
        <p>No selections yet. Add matches from the Matches page.</p>
      ) : (
        <ul className="selection-list">
          {selections.map((sel, index) => (
            <li key={index}>
              {sel.matchId} — {sel.market}: {sel.prediction}
              <button onClick={() => removeSelection(index)}>Remove</button>
            </li>
          ))}
        </ul>
      )}

      <button onClick={handleSave} disabled={saving || selections.length === 0}>
        {saving ? 'Saving...' : 'Save Ticket'}
      </button>
    </div>
  );
}

export default TicketBuilder;