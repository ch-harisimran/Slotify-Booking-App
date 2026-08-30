'use client';

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useDoctorSearch } from '../lib/useDoctorSearch';
import DoctorCard from '../components/DoctorCard';
import { IconSearch, IconCalendar, IconMascot, IconChevronRight } from '../components/icons';
import { getSpecialtyStyle } from '../lib/specialties';
import Avatar from '../components/Avatar';
import NotificationBell from '../components/NotificationBell';

export default function HomePage() {
  const { profile } = useAuth();
  const {
    session, doctors, query, setQuery, specialty, setSpecialty, loading, error,
    favoriteIds, toggleFavorite, specialties, popular, nextAppointment,
  } = useDoctorSearch({ withNextAppointment: true });

  const firstName = profile?.name?.split(' ')[0];

  return (
    <div style={{ paddingTop: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href={session ? '/profile' : '/login'} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text)' }}>
          {session ? (
            <Avatar
              url={profile?.avatar_url}
              name={profile?.name}
              email={profile?.email}
              style={{ width: 44, height: 44, borderRadius: 14 }}
            />
          ) : (
            <span className="avatar" style={{ width: 44, height: 44, borderRadius: 14 }}>
              <IconCalendar size={18} />
            </span>
          )}
          <span>
            <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Hello</span>
            <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 500 }}>
              {firstName || (session ? 'there' : 'Sign in')}
            </span>
          </span>
        </Link>
        <NotificationBell />
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
      {!loading && !error && popular.length === 0 && (
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
