'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { getRecentlyViewed } from '../../lib/recentlyViewed';
import DoctorCard from '../../components/DoctorCard';
import EmptyState from '../../components/EmptyState';
import { IconSearch } from '../../components/icons';
import { getSpecialtyStyle } from '../../lib/specialties';

export default function SearchPage() {
  const { session } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [query, setQuery] = useState('');
  const [specialty, setSpecialty] = useState('All');
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [recentIds, setRecentIds] = useState([]);

  useEffect(() => {
    apiFetch('/api/services').then(setDoctors).finally(() => setLoading(false));
    setRecentIds(getRecentlyViewed());
  }, []);

  useEffect(() => {
    if (!session) return setFavoriteIds(new Set());
    apiFetch('/api/favorites/me', { token: session.access_token })
      .then((rows) => setFavoriteIds(new Set(rows.map((r) => r.service_id))))
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
      list = list.filter((d) => d.name.toLowerCase().includes(q) || d.specialty?.toLowerCase().includes(q));
    }
    return list;
  }, [doctors, query, specialty]);

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
