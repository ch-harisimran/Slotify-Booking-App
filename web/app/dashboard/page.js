'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';
import BookingCard from '../../components/BookingCard';
import { IconCalendar } from '../../components/icons';

export default function DashboardPage() {
  const { session, profile, loading: authLoading } = useAuth();
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

  async function handleAiReschedule(bookingId, message) {
    const result = await apiFetch(`/api/bookings/${bookingId}/reschedule-ai`, {
      method: 'POST',
      token: session.access_token,
      body: { message },
    });
    await loadBookings();
    return result;
  }

  if (authLoading) return <p className="muted" style={{ paddingTop: 32 }}>Loading…</p>;

  if (!session) {
    return (
      <div className="card-lg" style={{ maxWidth: 420, margin: '64px auto 0', textAlign: 'center' }}>
        <div className="avatar avatar-lg" style={{ margin: '0 auto 12px' }}>
          <IconCalendar size={22} />
        </div>
        <h2 style={{ marginTop: 0 }}>Sign in to see your bookings</h2>
        <a href="/login" className="btn btn-accent">Sign in</a>
      </div>
    );
  }

  const firstName = profile?.name?.split(' ')[0];

  return (
    <div style={{ paddingTop: 28, maxWidth: 680, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 4, fontSize: '1.6rem' }}>
        {firstName ? `${firstName}'s bookings` : 'My Bookings'}
      </h1>
      <p className="muted">Manage your upcoming appointments, or ask the AI to move one for you.</p>

      {loading && bookings.length === 0 && <p className="muted" style={{ marginTop: 20 }}>Loading bookings…</p>}
      {error && <p className="error-text" style={{ marginTop: 20 }}>{error}</p>}
      {!loading && !error && bookings.length === 0 && (
        <p className="muted" style={{ marginTop: 20 }}>
          No bookings yet. <a href="/">Browse services</a> to book one.
        </p>
      )}

      <div style={{ marginTop: 20 }}>
        {bookings.map((booking) => (
          <BookingCard
            key={booking.id}
            booking={booking}
            onCancel={handleCancel}
            onReschedule={handleReschedule}
            onAiReschedule={handleAiReschedule}
          />
        ))}
      </div>
    </div>
  );
}
