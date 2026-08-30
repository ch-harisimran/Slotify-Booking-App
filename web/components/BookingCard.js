'use client';

import { useEffect, useRef, useState } from 'react';
import { IconCalendar, IconStethoscope, IconSend, IconSparkles } from './icons';

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

const GREETING = 'Tell me when you\'d like to move this — try "Friday afternoon" or "next Tuesday at 10am".';

export default function BookingCard({ booking, onCancel, onReschedule, onAiReschedule }) {
  const [mode, setMode] = useState(null); // null | 'manual' | 'ai'
  const [date, setDate] = useState(toLocalDateInput(booking.start_time));
  const [time, setTime] = useState(toLocalTimeInput(booking.start_time));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [chat, setChat] = useState([{ role: 'assistant', text: GREETING }]);
  const [chatInput, setChatInput] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const chatThreadRef = useRef(null);

  const durationMinutes = booking.services?.duration_minutes || 30;
  const canModify = booking.status !== 'cancelled';

  // Keeps the newest message (or the "Thinking…" bubble) in view instead of
  // leaving the user to scroll the mini chat down manually.
  useEffect(() => {
    const el = chatThreadRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [chat.length, chatBusy]);

  function resetPanels() {
    setMode(null);
    setError('');
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

  async function sendChatMessage(e) {
    e.preventDefault();
    const message = chatInput.trim();
    if (!message) return;

    setChat((c) => [...c, { role: 'user', text: message }]);
    setChatInput('');
    setChatBusy(true);

    try {
      const result = await onAiReschedule(booking.id, message);
      if (result?.needsInfo) {
        setChat((c) => [...c, { role: 'assistant', text: result.reply }]);
      } else if (result?.booking) {
        setChat((c) => [
          ...c,
          { role: 'assistant', text: `Done — I've moved it to ${formatSlot(result.booking.start_time)}.` },
        ]);
      }
    } catch (err) {
      const suggestions = err.data?.nearest_slots?.length ? err.data.nearest_slots : null;
      setChat((c) => [...c, { role: 'error', text: err.message, suggestions }]);
    } finally {
      setChatBusy(false);
    }
  }

  async function applySuggestedSlot(slot) {
    setChatBusy(true);
    try {
      await onReschedule(booking.id, slot.start_time, slot.end_time);
      setChat((c) => [
        ...c,
        { role: 'assistant', text: `Booked for ${formatSlot(slot.start_time)}.` },
      ]);
    } catch (err) {
      setChat((c) => [...c, { role: 'error', text: err.message }]);
    } finally {
      setChatBusy(false);
    }
  }

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="avatar" style={{ overflow: 'hidden' }}>
            {booking.services?.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={booking.services.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <IconStethoscope size={16} />
            )}
          </div>
          <div>
            <h3 style={{ margin: '0 0 3px', fontSize: '1rem' }}>{booking.services?.name || 'Doctor'}</h3>
            {booking.services?.specialty && (
              <p className="muted" style={{ margin: '0 0 3px', fontSize: '0.8rem' }}>{booking.services.specialty}</p>
            )}
            <p className="muted" style={{ margin: 0, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 5 }}>
              <IconCalendar size={13} />
              {new Date(booking.start_time).toLocaleString([], {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
        <span className={`badge badge-${booking.status}`}>{booking.status}</span>
      </div>

      {canModify && mode === null && (
        <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-accent btn-sm" onClick={() => setMode('ai')} disabled={busy}>
            <IconSparkles size={14} />
            Ask AI
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setMode('manual')} disabled={busy}>
            Reschedule
          </button>
          <button className="btn btn-danger btn-sm" onClick={handleCancel} disabled={busy}>
            Cancel
          </button>
        </div>
      )}

      {canModify && mode === 'manual' && (
        <form onSubmit={submitReschedule} style={{ marginTop: 14 }}>
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
            <button className="btn btn-accent btn-sm" type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Save'}
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={resetPanels} disabled={busy}>
              Cancel edit
            </button>
          </div>
        </form>
      )}

      {canModify && mode === 'ai' && (
        <div style={{ marginTop: 14 }}>
          <div className="chat-thread" ref={chatThreadRef}>
            {chat.map((msg, i) => (
              <div key={i}>
                <div className={`chat-bubble ${msg.role}`}>{msg.text}</div>
                {msg.suggestions && (
                  <div className="slots" style={{ marginTop: 6, marginLeft: 2 }}>
                    {msg.suggestions.map((slot) => (
                      <button
                        key={slot.start_time}
                        type="button"
                        className="slot-btn"
                        onClick={() => applySuggestedSlot(slot)}
                        disabled={chatBusy}
                      >
                        {formatSlot(slot.start_time)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {chatBusy && <div className="chat-bubble assistant">Thinking…</div>}
          </div>

          <form onSubmit={sendChatMessage} className="chat-input-row">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type a message…"
              disabled={chatBusy}
            />
            <button type="submit" className="send-btn" disabled={chatBusy || !chatInput.trim()}>
              <IconSend size={16} />
            </button>
          </form>
          <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: 10 }} onClick={resetPanels}>
            Close
          </button>
        </div>
      )}

      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
