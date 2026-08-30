'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { IconBell, IconCalendar } from './icons';

const SOON_WINDOW_MS = 48 * 60 * 60 * 1000; // appointments inside this window are "urgent"

function formatWhen(iso) {
  const start = new Date(iso);
  const diffMs = start.getTime() - Date.now();
  const diffHrs = diffMs / (1000 * 60 * 60);
  if (diffHrs < 24) {
    return `Today at ${start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }
  if (diffHrs < 48) {
    return `Tomorrow at ${start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }
  return start.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

// Bell icon that surfaces the user's own upcoming-appointment alerts — no
// backend "notifications" table needed, it derives alerts straight from
// /api/bookings/me each time it's opened. Appointments starting within 48h
// are flagged as urgent and drive the unread-dot badge.
export default function NotificationBell() {
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!session) {
      setBookings([]);
      return;
    }
    setLoading(true);
    apiFetch('/api/bookings/me', { token: session.access_token })
      .then((rows) => {
        const upcoming = rows
          .filter((b) => b.status !== 'cancelled' && new Date(b.start_time) > new Date())
          .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
        setBookings(upcoming);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session]);

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const urgentCount = bookings.filter((b) => new Date(b.start_time).getTime() - Date.now() < SOON_WINDOW_MS).length;

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="icon-btn"
        onClick={() => setOpen((v) => !v)}
        style={{ position: 'relative' }}
        aria-label="Notifications"
      >
        <IconBell size={17} />
        {urgentCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 7,
              right: 8,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--danger, #e5484d)',
              border: '1.5px solid var(--surface)',
            }}
          />
        )}
      </button>

      {open && (
        <div
          className="card"
          style={{
            position: 'absolute',
            top: 48,
            right: 0,
            width: 300,
            maxHeight: 360,
            overflowY: 'auto',
            padding: 10,
            zIndex: 40,
          }}
        >
          <p style={{ margin: '2px 6px 8px', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }} className="muted">
            Upcoming appointments
          </p>

          {!session && <p className="muted" style={{ margin: '6px', fontSize: '0.85rem' }}>Sign in to see your alerts.</p>}
          {session && loading && <p className="muted" style={{ margin: '6px', fontSize: '0.85rem' }}>Loading…</p>}
          {session && !loading && bookings.length === 0 && (
            <p className="muted" style={{ margin: '6px', fontSize: '0.85rem' }}>No upcoming appointments.</p>
          )}

          {bookings.slice(0, 6).map((b) => {
            const urgent = new Date(b.start_time).getTime() - Date.now() < SOON_WINDOW_MS;
            return (
              <Link
                key={b.id}
                href="/dashboard"
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  padding: '8px 6px',
                  borderRadius: 10,
                  color: 'var(--text)',
                }}
                className="notif-row"
              >
                <span
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 9,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: urgent ? 'rgba(229,72,77,0.12)' : 'var(--surface-2)',
                    color: urgent ? 'var(--danger, #e5484d)' : 'var(--text-muted)',
                  }}
                >
                  <IconCalendar size={14} />
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600 }}>
                    {b.services?.name || 'Appointment'}
                  </span>
                  <span className="muted" style={{ display: 'block', fontSize: '0.78rem' }}>
                    {formatWhen(b.start_time)}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
