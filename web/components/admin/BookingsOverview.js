'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../lib/api';

const STATUSES = ['All', 'confirmed', 'rescheduled', 'cancelled'];

function toLocalDateInput(iso) {
  return new Date(iso).toISOString().slice(0, 10);
}
function toLocalTimeInput(iso) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function toCsv(rows) {
  const header = ['Customer', 'Email', 'Service', 'Specialty', 'Start', 'End', 'Status', 'Price'];
  const lines = rows.map((b) => [
    b.users?.name || '',
    b.users?.email || '',
    b.services?.name || '',
    b.services?.specialty || '',
    new Date(b.start_time).toLocaleString(),
    new Date(b.end_time).toLocaleString(),
    b.status,
    b.services?.price ?? '',
  ]);
  const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;
  return [header, ...lines].map((row) => row.map(escape).join(',')).join('\n');
}

export default function BookingsOverview({ token }) {
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [dateFilter, setDateFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [rescheduleId, setRescheduleId] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    apiFetch('/api/services').then(setServices).catch(() => {});
  }, []);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFilter) params.set('date', dateFilter);
      if (serviceFilter !== 'All') params.set('service_id', serviceFilter);
      if (statusFilter !== 'All') params.set('status', statusFilter);
      const qs = params.toString();
      const data = await apiFetch(`/api/admin/bookings${qs ? `?${qs}` : ''}`, { token });
      setBookings(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter, serviceFilter, statusFilter]);

  const stats = useMemo(() => {
    const now = new Date();
    const upcoming = bookings.filter((b) => b.status !== 'cancelled' && new Date(b.start_time) > now).length;
    const cancelled = bookings.filter((b) => b.status === 'cancelled').length;
    const revenue = bookings
      .filter((b) => b.status !== 'cancelled')
      .reduce((sum, b) => sum + (Number(b.services?.price) || 0), 0);
    return { total: bookings.length, upcoming, cancelled, revenue };
  }, [bookings]);

  async function handleCancel(booking) {
    const when = new Date(booking.start_time).toLocaleString();
    if (!window.confirm(`Cancel ${booking.users?.name || 'this customer'}'s appointment with ${booking.services?.name} on ${when}?`)) {
      return;
    }
    setBusyId(booking.id);
    try {
      await apiFetch(`/api/bookings/${booking.id}`, { method: 'PATCH', token, body: { status: 'cancelled' } });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  function startReschedule(booking) {
    setRescheduleId(booking.id);
    setRescheduleDate(toLocalDateInput(booking.start_time));
    setRescheduleTime(toLocalTimeInput(booking.start_time));
  }

  async function saveReschedule(booking) {
    setBusyId(booking.id);
    try {
      const duration = booking.services?.duration_minutes || 30;
      const startTime = new Date(`${rescheduleDate}T${rescheduleTime}:00`);
      const endTime = new Date(startTime.getTime() + duration * 60000);
      await apiFetch(`/api/bookings/${booking.id}`, {
        method: 'PATCH',
        token,
        body: { start_time: startTime.toISOString(), end_time: endTime.toISOString() },
      });
      setRescheduleId(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  function exportCsv() {
    const csv = toCsv(bookings);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `slotify-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 16 }}>
        <div className="card" style={{ flex: 1, minWidth: 120 }}>
          <p className="muted" style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Total</p>
          <p style={{ margin: '4px 0 0', fontSize: '1.4rem', fontWeight: 800 }}>{stats.total}</p>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 120 }}>
          <p className="muted" style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Upcoming</p>
          <p style={{ margin: '4px 0 0', fontSize: '1.4rem', fontWeight: 800 }}>{stats.upcoming}</p>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 120 }}>
          <p className="muted" style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Cancelled</p>
          <p style={{ margin: '4px 0 0', fontSize: '1.4rem', fontWeight: 800 }}>{stats.cancelled}</p>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 120 }}>
          <p className="muted" style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Revenue</p>
          <p style={{ margin: '4px 0 0', fontSize: '1.4rem', fontWeight: 800 }}>${stats.revenue.toFixed(2)}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end', marginTop: 16 }}>
        <div className="field" style={{ minWidth: 160 }}>
          <label>Date</label>
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
        </div>
        <div className="field" style={{ minWidth: 180 }}>
          <label>Doctor</label>
          <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)}>
            <option value="All">All doctors</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="field" style={{ minWidth: 160 }}>
          <label>Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s === 'All' ? 'All statuses' : s}</option>
            ))}
          </select>
        </div>
        {(dateFilter || serviceFilter !== 'All' || statusFilter !== 'All') && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => { setDateFilter(''); setServiceFilter('All'); setStatusFilter('All'); }}
          >
            Clear filters
          </button>
        )}
        <button type="button" className="btn btn-accent btn-sm" style={{ marginLeft: 'auto' }} onClick={exportCsv} disabled={bookings.length === 0}>
          Export CSV
        </button>
      </div>

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
                <th></th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  {rescheduleId === b.id ? (
                    <>
                      <td>{b.users?.name || b.users?.email || '—'}</td>
                      <td>{b.services?.name || '—'}</td>
                      <td style={{ display: 'flex', gap: 6 }}>
                        <input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} style={{ width: 130 }} />
                        <input type="time" value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)} style={{ width: 90 }} />
                      </td>
                      <td>
                        <span className={`badge badge-${b.status}`}>{b.status}</span>
                      </td>
                      <td style={{ display: 'flex', gap: 6 }}>
                        <button type="button" className="btn btn-accent btn-sm" onClick={() => saveReschedule(b)} disabled={busyId === b.id}>
                          {busyId === b.id ? 'Saving…' : 'Save'}
                        </button>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRescheduleId(null)}>
                          Cancel edit
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{b.users?.name || b.users?.email || '—'}</td>
                      <td>{b.services?.name || '—'}</td>
                      <td>{new Date(b.start_time).toLocaleString()}</td>
                      <td>
                        <span className={`badge badge-${b.status}`}>{b.status}</span>
                      </td>
                      <td style={{ display: 'flex', gap: 6 }}>
                        {b.status !== 'cancelled' && (
                          <>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => startReschedule(b)} disabled={busyId === b.id}>
                              Reschedule
                            </button>
                            <button type="button" className="btn btn-danger btn-sm" onClick={() => handleCancel(b)} disabled={busyId === b.id}>
                              {busyId === b.id ? 'Cancelling…' : 'Cancel'}
                            </button>
                          </>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={5} className="muted">No bookings match these filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
