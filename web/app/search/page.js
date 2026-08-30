'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useDoctorSearch } from '../../lib/useDoctorSearch';
import { getRecentlyViewed } from '../../lib/recentlyViewed';
import DoctorCard from '../../components/DoctorCard';
import EmptyState from '../../components/EmptyState';
import { IconSearch } from '../../components/icons';
import { getSpecialtyStyle } from '../../lib/specialties';

export default function SearchPage() {
  const {
    session, doctors, query, setQuery, specialty, setSpecialty, loading,
    favoriteIds, toggleFavorite, specialties, filtered,
  } = useDoctorSearch();
  const [recentIds, setRecentIds] = useState([]);

  useEffect(() => {
    setRecentIds(getRecentlyViewed());
  }, []);

  const recentDoctors = useMemo(
    () => recentIds.map((id) => doctors.find((d) => d.id === id)).filter(Boolean),
    [recentIds, doctors]
  );

  return (
    <div style={{ paddingTop: 28 }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: 16 }}>Search</h1>

      <div className="input-with-icon" style={{ position: 'relative', maxWidth: 480 }}>
        <span className="icon-slot">
          <IconSearch size={17} />
        </span>
        <input
          type="text"
          placeholder="Find the right doctor for you"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      <div className="chip-row" style={{ marginTop: 16 }}>
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

      {recentDoctors.length > 0 && (
        <>
          <div className="section-head" style={{ marginTop: 24 }}>
            <h2>Your Doctors</h2>
          </div>
          <div className="doctor-avatar-row">
            {recentDoctors.map((d) => (
              <Link key={d.id} href={`/doctors/${d.id}`} className="doctor-avatar-item">
                <div className="doctor-avatar-photo">
                  {d.photo_url && <img src={d.photo_url} alt={d.name} />}
                </div>
                <span>{d.name.replace(/^Dr\.\s*/, 'Dr. ')}</span>
              </Link>
            ))}
          </div>
        </>
      )}

      <div className="section-head" style={{ marginTop: 24 }}>
        <h2>{query || specialty !== 'All' ? 'Results' : 'Recommended Doctors'}</h2>
      </div>

      {loading && <p className="muted">Loading doctors…</p>}
      {!loading && filtered.length === 0 && (
        <EmptyState variant="search" title="No doctors match" subtitle="Try a different name or specialty." />
      )}

      <div className="doctor-grid">
        {filtered.map((doctor) => (
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
