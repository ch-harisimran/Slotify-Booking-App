'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';
import BookingCard from '../../components/BookingCard';

export default function DashboardPage() {
  const { session, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadBookings() {
    if (!session) return;
    setLoading(true);
    try {
      const data = await apiFetch('/api/bookings/me', { token: session.access_token });
      setBookings(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading) loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, session]);

  async function handleCancel(bookingId) {
    await apiFetch(`/api/bookings/${bookingId}`, {
      method: 'PATCH',
      token: session.access_token,
      body: { status: 'cancelled' },
    });
    await loadBookings();
  }

  async function handleReschedule(bookingId, start_time, end_time) {
    await apiFetch(`/api/bookings/${bookingId}`, {
      method: 'PATCH',
      token: session.access_token,
      body: { start_time, end_time },
    });
    await loadBookings();
  }

  if (authLoading) return <p className="muted" style={{ paddingTop: 32 }}>Loading…</p>;

  if (!session) {
    return (
      <div className="card" style={{ maxWidth: 420, margin: '48px auto 0', textAlign: 'center' }}>
        <h2 style={{ marginTop: 0 }}>Sign in to see your bookings</h2>
        <a href="/login" className="btn">Sign in</a>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 32, maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 4 }}>My Bookings</h1>
      <p className="muted">Manage your upcoming appointments.</p>

      {loading && <p className="muted">Loading bookings…</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && !error && bookings.length === 0 && (
        <p className="muted">No bookings yet. <a href="/">Browse services</a> to book one.</p>
      )}

      {bookings.map((booking) => (
        <BookingCard
          key={booking.id}
          booking={booking}
          onCancel={handleCancel}
          onReschedule={handleReschedule}
        />
      ))}

      <div className="card" style={{ marginTop: 24, opacity: 0.6 }}>
        <h3 style={{ marginTop: 0 }}>AI Reschedule</h3>
        <p className="muted" style={{ fontSize: '0.9rem' }}>
          "Move my haircut to Friday afternoon" — the natural-language reschedule chat box arrives in
          Week 4, once the OpenRouter integration is wired in. Use "Reschedule" above for now.
        </p>
      </div>
    </div>
  );
}
