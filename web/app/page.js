'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import DoctorCard from '../components/DoctorCard';
import { IconSearch, IconCalendar, IconMascot, IconBell, IconChevronRight } from '../components/icons';
import { getSpecialtyStyle } from '../lib/specialties';
import { initials } from '../lib/format';

export default function HomePage() {
  const { session, profile } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [query, setQuery] = useState('');
  const [specialty, setSpecialty] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [nextAppointment, setNextAppointment] = useState(null);

  useEffect(() => {
    apiFetch('/api/services')
      .then(setDoctors)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!session) {
      setFavoriteIds(new Set());
      setNextAppointment(null);
      return;
    }
    apiFetch('/api/favorites/me', { token: session.access_token })
      .then((rows) => setFavoriteIds(new Set(rows.map((r) => r.service_id))))
      .catch(() => {});
    apiFetch('/api/bookings/me', { token: session.access_token })
      .then((rows) => {
        const upcoming = rows
          .filter((b) => b.status !== 'cancelled' && new Date(b.start_time) > new Date())
          .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
        setNextAppointment(upcoming[0] || null);
      })
      .catch(() => {});
  }, [session]);

  async function toggleFavorite(doctor) {
    if (!session) return;
    const isFav = favoriteIds.has(doctor.id);
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      isFav ? next.delete(doctor.id) : next.add(doctor.id);
      return next;
    });
    try {
      if (isFav) {
        await apiFetch(`/api/favorites/${doctor.id}`, { method: 'DELETE', token: session.access_token });
      } else {
        await apiFetch('/api/favorites', { method: 'POST', token: session.access_token, body: { service_id: doctor.id } });
      }
    } catch {
      // revert on failure
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        isFav ? next.add(doctor.id) : next.delete(doctor.id);
        return next;
      });
    }
  }

  const specialties = useMemo(() => {
    const set = new Set(doctors.map((d) => d.specialty).filter(Boolean));
    return ['All', ...set];
  }, [doctors]);

  const filtered = useMemo(() => {
    let list = doctors;
    if (specialty !== 'All') list = list.filter((d) => d.specialty === specialty);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (d) => d.name.toLowerCase().includes(q) || d.specialty?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [doctors, query, specialty]);

  const popular = useMemo(
    () => [...filtered].sort((a, b) => (b.rating || 0) - (a.rating || 0)),
    [filtered]
  );

  const firstName = profile?.name?.split(' ')[0];

  return (
    <div style={{ paddingTop: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href={session ? '/profile' : '/login'} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text)' }}>
          <span className="avatar" style={{ width: 44, height: 44, borderRadius: 14 }}>
            {session ? initials(profile?.name, profile?.email) : <IconCalendar size={18} />}
          </span>
          <span>
            <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Hello</span>
            <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 500 }}>
              {firstName || (session ? 'there' : 'Sign in')}
            </span>
          </span>
        </Link>
        <button type="button" className="icon-btn">
          <IconBell size={17} />
        </button>
      </div>

      <div className="input-with-icon" style={{ position: 'relative', marginTop: 18, maxWidth: 480 }}>
        <span className="icon-slot">
          <IconSearch size={17} />
        </span>
        <input
          type="text"
          placeholder="Find the right doctor for you"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <Link href="/ai" className="hero ai-teaser" style={{ marginTop: 18, padding: '18px 20px' }}>
        <span className="ai-teaser-icon">
          <IconMascot size={22} />
        </span>
        <span>
          <span className="hero-eyebrow" style={{ display: 'block', marginBottom: 3 }}>AI assistant</span>
          <span style={{ position: 'relative', display: 'block', fontSize: '0.92rem', fontWeight: 500, maxWidth: '34ch', lineHeight: 1.35 }}>
            Describe your symptoms and I'll find — and book — the right doctor.
          </span>
        </span>
        <span className="ai-teaser-arrow">
          <IconChevronRight size={18} />
        </span>
      </Link>

      {session && nextAppointment && (
        <Link href="/dashboard" className="appt-summary" style={{ marginTop: 20, display: 'flex' }}>
          <div className="appt-summary-photo">
            {nextAppointment.services?.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={nextAppointment.services.photo_url} alt="" />
            ) : (
              <IconCalendar size={20} />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="muted" style={{ margin: 0, fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              My Appointment
            </p>
            <p style={{ margin: '2px 0 0', fontWeight: 700 }}>
              {nextAppointment.services?.name} · {nextAppointment.services?.specialty}
            </p>
            <p className="muted" style={{ margin: '2px 0 0', fontSize: '0.85rem' }}>
              {new Date(nextAppointment.start_time).toLocaleString([], {
                weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
              })}
            </p>
          </div>
        </Link>
      )}

      <div className="section-head" style={{ marginTop: session && nextAppointment ? 28 : 32 }}>
        <h2>Doctor Specialty</h2>
      </div>
      <div className="chip-row">
        {specialties.map((s) => {
          const style = s !== 'All' ? getSpecialtyStyle(s) : null;
          const active = specialty === s;
          return (
            <button
              key={s}
              type="button"
              className={`chip ${active ? 'active' : ''}`}
              onClick={() => setSpecialty(s)}
            >
              {style && (
                <span
                  className="chip-icon"
                  style={{ background: active ? 'rgba(255,255,255,0.22)' : style.bg, color: active ? '#fff' : style.fg }}
                >
                  <style.icon size={12} />
                </span>
              )}
              {s}
            </button>
          );
        })}
      </div>

      {loading && <p className="muted" style={{ marginTop: 24 }}>Loading doctors…</p>}
      {error && (
        <p className="error-text" style={{ marginTop: 24 }}>
          Couldn't load doctors: {error}. Is the backend running at the API URL in your .env.local?
        </p>
      )}
      {!loading && !error && filtered.length === 0 && (
        <p className="muted" style={{ marginTop: 24 }}>
          {doctors.length === 0 ? 'No doctors available yet.' : 'No doctors match your search.'}
        </p>
      )}

      <div className="section-head">
        <h2>Popular Doctors</h2>
        <Link href="/search">See all</Link>
      </div>
      <div className="doctor-grid">
        {popular.map((doctor) => (
          <DoctorCard
            key={doctor.id}
            doctor={doctor}
            favorited={favoriteIds.has(doctor.id)}
            onToggleFavorite={session ? toggleFavorite : undefined}
          />
        ))}
      </div>
    </div>
  );
}
