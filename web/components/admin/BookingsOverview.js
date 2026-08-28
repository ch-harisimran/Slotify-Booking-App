'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';

export default function BookingsOverview({ token }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/api/admin/bookings', { token })
      .then(setBookings)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      {error && <p className="error-text">{error}</p>}
      {loading ? (
        <p className="muted" style={{ marginTop: 16 }}>Loading bookings…</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ marginTop: 16 }}>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Service</th>
                <th>When</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td>{b.users?.name || b.users?.email || '—'}</td>
                  <td>{b.services?.name || '—'}</td>
                  <td>{new Date(b.start_time).toLocaleString()}</td>
                  <td>
                    <span className={`badge badge-${b.status}`}>{b.status}</span>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={4} className="muted">No bookings yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
