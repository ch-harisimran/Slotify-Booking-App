'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '../../../../lib/api';
import { useAuth } from '../../../../context/AuthContext';
import { IconCheck, IconClock, IconScissors } from '../../../../components/icons';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function toISODate(d) {
  return d.toISOString().slice(0, 10);
}

function formatSlotTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function nextDays(count) {
  const days = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = 0; i < count; i += 1) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    days.push(d);
  }
  return days;
}

export default function BookServicePage() {
  const { id } = useParams();
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();

  const [service, setService] = useState(null);
  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const days = useMemo(() => nextDays(21), []);

  useEffect(() => {
    apiFetch('/api/services')
      .then((services) => {
        const match = services.find((s) => s.id === id);
        setService(match || null);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  useEffect(() => {
    if (!id || !date) return;
    setSelectedSlot(null);
    setLoadingSlots(true);
    setError('');

    apiFetch(`/api/availability?service_id=${id}&date=${date}`)
      .then((res) => setSlots(res.slots || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoadingSlots(false));
  }, [id, date]);

  async function handleConfirm() {
    if (!session) {
      router.push('/login');
      return;
    }
    if (!selectedSlot) return;

    setConfirming(true);
    setError('');

    try {
      await apiFetch('/api/bookings', {
        method: 'POST',
        token: session.access_token,
        body: {
          service_id: id,
          start_time: selectedSlot.start_time,
          end_time: selectedSlot.end_time,
        },
      });
      setConfirmed(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirming(false);
    }
  }

  if (confirmed) {
    return (
      <div className="card-lg" style={{ maxWidth: 440, margin: '64px auto 0', textAlign: 'center' }}>
        <div
          className="avatar-lg"
          style={{
            background: 'var(--success-soft)',
            color: 'var(--success)',
            margin: '0 auto 16px',
          }}
        >
          <IconCheck size={26} />
        </div>
        <h2 style={{ marginTop: 0, marginBottom: 6 }}>Booking confirmed!</h2>
        <p className="muted">
          {service?.name} · {new Date(selectedSlot.start_time).toLocaleString([], {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </p>
        <a href="/dashboard" className="btn btn-accent" style={{ marginTop: 16 }}>
          View my bookings
        </a>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 28, maxWidth: 600, margin: '0 auto' }}>
      {!service ? (
        <p className="muted">Loading service…</p>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="avatar avatar-lg">
              <IconScissors size={22} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.4rem' }}>{service.name}</h1>
              <p className="muted" style={{ margin: '2px 0 0', fontSize: '0.88rem' }}>
                <IconClock size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
                {service.duration_minutes} min · ${Number(service.price).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="card-lg" style={{ marginTop: 20 }}>
            <label>Pick a date</label>
            <div className="date-strip">
              {days.map((d) => {
                const iso = toISODate(d);
                const selected = iso === date;
                return (
                  <div
                    key={iso}
                    className={`date-pill ${selected ? 'selected' : ''}`}
                    onClick={() => setDate(iso)}
                  >
                    <span className="dow">{d.toLocaleDateString([], { weekday: 'short' })}</span>
                    <span className="dom">{d.getDate()}</span>
                  </div>
                );
              })}
            </div>

            <label style={{ marginTop: 16 }}>Available times</label>
            {loadingSlots && <p className="muted">Loading times…</p>}
            {!loadingSlots && slots.length === 0 && (
              <p className="muted">No open slots on this day — try another date.</p>
            )}
            <div className="slots">
              {slots.map((slot) => (
                <button
                  key={slot.start_time}
                  type="button"
                  className={`slot-btn ${selectedSlot?.start_time === slot.start_time ? 'selected' : ''}`}
                  onClick={() => setSelectedSlot(slot)}
                >
                  {formatSlotTime(slot.start_time)}
                </button>
              ))}
            </div>

            {error && <p className="error-text">{error}</p>}

            <button
              className="btn btn-accent btn-block"
              style={{ marginTop: 24 }}
              disabled={!selectedSlot || confirming}
              onClick={handleConfirm}
            >
              {authLoading
                ? 'Loading…'
                : !session
                ? 'Sign in to book'
                : confirming
                ? 'Booking…'
                : 'Confirm booking'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
