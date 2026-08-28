'use client';

import { useState } from 'react';

function toLocalDateInput(iso) {
  return new Date(iso).toISOString().slice(0, 10);
}

function toLocalTimeInput(iso) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatSlot(iso) {
  return new Date(iso).toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function BookingCard({ booking, onCancel, onReschedule, onAiReschedule }) {
  const [mode, setMode] = useState(null); // null | 'manual' | 'ai'
  const [date, setDate] = useState(toLocalDateInput(booking.start_time));
  const [time, setTime] = useState(toLocalTimeInput(booking.start_time));
  const [aiMessage, setAiMessage] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const durationMinutes = booking.services?.duration_minutes || 30;
  const canModify = booking.status !== 'cancelled';

  function resetPanels() {
    setMode(null);
    setError('');
    setAiSuggestions(null);
  }

  async function submitReschedule(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const startTime = new Date(`${date}T${time}:00`);
      const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
      await onReschedule(booking.id, startTime.toISOString(), endTime.toISOString());
      resetPanels();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitAiReschedule(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setAiSuggestions(null);
    try {
      await onAiReschedule(booking.id, aiMessage);
      setAiMessage('');
      resetPanels();
    } catch (err) {
      setError(err.message);
      if (err.data?.nearest_slots?.length) {
        setAiSuggestions(err.data.nearest_slots);
      }
    } finally {
      setBusy(false);
    }
  }

  async function applySuggestedSlot(slot) {
    setBusy(true);
    setError('');
    try {
      await onReschedule(booking.id, slot.start_time, slot.end_time);
      resetPanels();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    setBusy(true);
    setError('');
    try {
      await onCancel(booking.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ margin: '0 0 4px' }}>{booking.services?.name || 'Service'}</h3>
          <p className="muted" style={{ margin: '0 0 6px', fontSize: '0.9rem' }}>
            {new Date(booking.start_time).toLocaleString()}
          </p>
        </div>
        <span className={`badge badge-${booking.status}`}>{booking.status}</span>
      </div>

      {canModify && mode === null && (
        <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn" onClick={() => setMode('ai')} disabled={busy}>
            Ask AI
          </button>
          <button className="btn btn-secondary" onClick={() => setMode('manual')} disabled={busy}>
            Reschedule
          </button>
          <button className="btn btn-danger" onClick={handleCancel} disabled={busy}>
            Cancel
          </button>
        </div>
      )}

      {canModify && mode === 'manual' && (
        <form onSubmit={submitReschedule} style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>New date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>New time</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Save'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={resetPanels} disabled={busy}>
              Cancel edit
            </button>
          </div>
        </form>
      )}

      {canModify && mode === 'ai' && (
        <form onSubmit={submitAiReschedule} style={{ marginTop: 12 }}>
          <div className="field">
            <label>Tell the AI when you'd like to move it</label>
            <input
              type="text"
              value={aiMessage}
              onChange={(e) => setAiMessage(e.target.value)}
              placeholder='e.g. "move it to Friday afternoon"'
              required
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" type="submit" disabled={busy || !aiMessage.trim()}>
              {busy ? 'Thinking…' : 'Send'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={resetPanels} disabled={busy}>
              Cancel
            </button>
          </div>

          {aiSuggestions && (
            <div style={{ marginTop: 12 }}>
              <p className="muted" style={{ fontSize: '0.85rem', margin: '0 0 8px' }}>
                Closest open times — tap one to book it:
              </p>
              <div className="slots">
                {aiSuggestions.map((slot) => (
                  <button
                    key={slot.start_time}
                    type="button"
                    className="slot-btn"
                    onClick={() => applySuggestedSlot(slot)}
                    disabled={busy}
                  >
                    {formatSlot(slot.start_time)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>
      )}

      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
