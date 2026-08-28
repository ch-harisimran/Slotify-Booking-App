'use client';

import { useState } from 'react';

function toLocalDateInput(iso) {
  return new Date(iso).toISOString().slice(0, 10);
}

function toLocalTimeInput(iso) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function BookingCard({ booking, onCancel, onReschedule }) {
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(toLocalDateInput(booking.start_time));
  const [time, setTime] = useState(toLocalTimeInput(booking.start_time));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const durationMinutes = booking.services?.duration_minutes || 30;
  const canModify = booking.status !== 'cancelled';

  async function submitReschedule(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const startTime = new Date(`${date}T${time}:00`);
      const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
      await onReschedule(booking.id, startTime.toISOString(), endTime.toISOString());
      setEditing(false);
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

      {canModify && !editing && (
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => setEditing(true)} disabled={busy}>
            Reschedule
          </button>
          <button className="btn btn-danger" onClick={handleCancel} disabled={busy}>
            Cancel
          </button>
        </div>
      )}

      {canModify && editing && (
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
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setEditing(false)}
              disabled={busy}
            >
              Cancel edit
            </button>
          </div>
        </form>
      )}

      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
