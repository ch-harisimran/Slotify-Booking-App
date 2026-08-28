'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '../../../../lib/api';
import { useAuth } from '../../../../context/AuthContext';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatSlotTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
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
      <div className="card" style={{ maxWidth: 480, margin: '48px auto 0', textAlign: 'center' }}>
        <h2 style={{ marginTop: 0 }}>Booking confirmed!</h2>
        <p className="muted">
          {service?.name} on {new Date(selectedSlot.start_time).toLocaleString()}
        </p>
        <a href="/dashboard" className="btn" style={{ marginTop: 12 }}>
          View my bookings
        </a>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 32, maxWidth: 560, margin: '0 auto' }}>
      {!service ? (
        <p className="muted">Loading service…</p>
      ) : (
        <>
          <h1 style={{ marginBottom: 4 }}>{service.name}</h1>
          <p className="muted">
            {service.duration_minutes} min · ${Number(service.price).toFixed(2)}
          </p>

          <div className="card" style={{ marginTop: 20 }}>
            <div className="field">
              <label htmlFor="date">Pick a date</label>
              <input
                id="date"
                type="date"
                min={todayISO()}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <label>Available times</label>
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
              className="btn"
              style={{ marginTop: 20, width: '100%' }}
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
