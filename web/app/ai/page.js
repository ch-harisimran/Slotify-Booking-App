'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { IconMascot, IconSend, IconStar } from '../../components/icons';

const GREETING = "Hi, I'm Slotify's AI assistant. Tell me what's going on and I can help you find the right doctor — or just say hi!";

export default function AiAssistantPage() {
  const { session } = useAuth();
  const router = useRouter();
  const [chat, setChat] = useState([{ role: 'assistant', text: GREETING }]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const threadRef = useRef(null);

  // Runs after every render where the thread actually grew or the
  // "Thinking…" indicator toggled — unlike calling this right after
  // setChat(), a layout effect keyed on the real content is guaranteed to
  // fire once the DOM has the new message(s) in it, so the scroll target is
  // always accurate instead of occasionally landing one message short.
  useEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [chat.length, busy]);

  // Resume a signed-in user's conversation instead of resetting to the
  // greeting every time this page loads.
  useEffect(() => {
    if (!session) return;
    apiFetch('/api/ai/history', { token: session.access_token })
      .then((res) => {
        if (res?.messages?.length > 0) setChat(res.messages);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  async function send(overrideText) {
    const message = (overrideText ?? input).trim();
    if (!message || busy) return;

    const history = chat.map((m) => ({ role: m.role, text: m.text }));
    setChat((c) => [...c, { role: 'user', text: message }]);
    setInput('');
    setBusy(true);

    try {
      const result = await apiFetch('/api/ai/chat', {
        method: 'POST',
        token: session?.access_token,
        body: { message, history },
      });
      setChat((c) => [...c, { role: 'assistant', text: result.reply, ...result }]);
    } catch (err) {
      setChat((c) => [...c, { role: 'error', text: err.message }]);
    } finally {
      setBusy(false);
    }
  }

  // With `rescheduleBookingId`, this moves an existing booking (PATCH)
  // instead of creating a new one (POST) — used when the AI offered
  // "closest available slots" for a reschedule rather than a fresh booking.
  async function bookSlot(doctorId, slot, rescheduleBookingId) {
    if (!session) return router.push('/login');
    setBusy(true);
    try {
      const booking = rescheduleBookingId
        ? await apiFetch(`/api/bookings/${rescheduleBookingId}`, {
            method: 'PATCH',
            token: session.access_token,
            body: { start_time: slot.start_time, end_time: slot.end_time },
          })
        : await apiFetch('/api/bookings', {
            method: 'POST',
            token: session.access_token,
            body: { service_id: doctorId, start_time: slot.start_time, end_time: slot.end_time },
          });
      setChat((c) => [
        ...c,
        {
          role: 'assistant',
          intent: 'booking_confirmed',
          text: `${rescheduleBookingId ? "Done — I've moved it to" : "Booked! You're set for"} ${new Date(booking.start_time).toLocaleString([], {
            weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
          })}.`,
        },
      ]);
    } catch (err) {
      setChat((c) => [...c, { role: 'error', text: err.message }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ paddingTop: 24, maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 116px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div className="avatar avatar-lg">
          <IconMascot size={22} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.3rem' }}>AI Assistant</h1>
          <p className="muted" style={{ margin: '2px 0 0', fontSize: '0.85rem' }}>Ask about symptoms, or book an appointment right here.</p>
        </div>
      </div>

      <div ref={threadRef} className="chat-thread" style={{ flex: 1, maxHeight: 'none', padding: '8px 4px' }}>
        {chat.map((msg, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <div className={`chat-bubble ${msg.role === 'user' ? 'user' : msg.role === 'error' ? 'error' : 'assistant'}`}>
              {msg.text ?? msg.reply}
            </div>

            {msg.disclaimer && (
              <p className="faint" style={{ fontSize: '0.74rem', margin: '4px 2px 0' }}>{msg.disclaimer}</p>
            )}

            {msg.intent === 'auth_required' && (
              <Link href="/login" className="btn btn-accent btn-sm" style={{ marginTop: 8 }}>Sign in</Link>
            )}

            {msg.doctors?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10, maxWidth: '92%' }}>
                {msg.doctors.map((d) => (
                  <Link
                    key={d.id}
                    href={`/doctors/${d.id}`}
                    className="card"
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, textDecoration: 'none', color: 'var(--text)' }}
                  >
                    <div className="doctor-avatar-photo" style={{ width: 44, height: 44 }}>
                      {d.photo_url && <img src={d.photo_url} alt={d.name} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>{d.name}</p>
                      <p className="muted" style={{ margin: '1px 0 0', fontSize: '0.78rem' }}>{d.specialty}</p>
                    </div>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--warning)', fontSize: '0.8rem', fontWeight: 700 }}>
                      <IconStar size={12} />
                      {Number(d.rating).toFixed(1)}
                    </span>
                  </Link>
                ))}
                {(msg.intent === 'symptom' || msg.intent === 'which_doctor') && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                    <button className="btn btn-accent btn-sm" onClick={() => send(`Book me with ${msg.doctors[0].name}`)}>
                      Book with {msg.doctors[0].name}
                    </button>
                    <Link href="/search" className="btn btn-secondary btn-sm">Search doctors</Link>
                  </div>
                )}
              </div>
            )}

            {msg.bookings?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10, maxWidth: '92%' }}>
                {msg.bookings.map((b) => (
                  <div key={b.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12 }}>
                    <div className="doctor-avatar-photo" style={{ width: 44, height: 44 }}>
                      {b.services?.photo_url && <img src={b.services.photo_url} alt={b.services.name} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>{b.services?.name}</p>
                      <p className="muted" style={{ margin: '1px 0 0', fontSize: '0.78rem' }}>{b.services?.specialty}</p>
                    </div>
                    <span className="muted" style={{ fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {new Date(b.start_time).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
                <Link href="/dashboard" className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }}>Manage bookings</Link>
              </div>
            )}

            {msg.checkups?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10, maxWidth: '92%' }}>
                {msg.checkups.map((c, idx) => (
                  <div key={idx} className="card" style={{ padding: 10 }}>
                    <p style={{ margin: 0, fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      {new Date(c.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p style={{ margin: '3px 0 0', fontSize: '0.85rem' }}>
                      {c.affected_area}
                      {c.condition_guess ? ` — ${c.condition_guess}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {(msg.intent === 'book' || msg.intent === 'reschedule') && msg.doctor && (
              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, marginTop: 10, maxWidth: '92%' }}>
                <div className="doctor-avatar-photo" style={{ width: 40, height: 40 }}>
                  {msg.doctor.photo_url && <img src={msg.doctor.photo_url} alt={msg.doctor.name} />}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.88rem' }}>{msg.doctor.name}</p>
                  <p className="muted" style={{ margin: '1px 0 0', fontSize: '0.78rem' }}>{msg.doctor.specialty}</p>
                </div>
              </div>
            )}

            {(msg.intent === 'booking_unavailable') && msg.nearest_slots?.length > 0 && (
              <div className="slots" style={{ marginTop: 10 }}>
                {msg.nearest_slots.map((slot) => (
                  <button
                    key={slot.start_time}
                    type="button"
                    className="slot-btn"
                    onClick={() => bookSlot(msg.doctor.id, slot, msg.reschedule_booking_id)}
                  >
                    {new Date(slot.start_time).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </button>
                ))}
              </div>
            )}

            {(msg.intent === 'booking_confirmed' || msg.intent === 'booking_cancelled') && (
              <Link href="/dashboard" className="btn btn-secondary btn-sm" style={{ marginTop: 8 }}>View my bookings</Link>
            )}
          </div>
        ))}
        {busy && <div className="chat-bubble assistant">Thinking…</div>}
      </div>

      <div className="chat-input-row">
        <input
          type="text"
          placeholder="Say hi, describe symptoms, or book an appointment…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          disabled={busy}
        />
        <button className="send-btn" onClick={() => send()} disabled={busy || !input.trim()}>
          <IconSend size={16} />
        </button>
      </div>
    </div>
  );
}
