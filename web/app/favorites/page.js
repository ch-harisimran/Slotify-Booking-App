'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import DoctorCard from '../../components/DoctorCard';
import EmptyState from '../../components/EmptyState';
import { IconHeart } from '../../components/icons';

export default function FavoritesPage() {
  const { session, loading: authLoading } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!session) return;
    setLoading(true);
    try {
      const data = await apiFetch('/api/favorites/me', { token: session.access_token });
      setRows(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, session]);

  async function toggleFavorite(doctor) {
    setRows((prev) => prev.filter((r) => r.service_id !== doctor.id));
    try {
      await apiFetch(`/api/favorites/${doctor.id}`, { method: 'DELETE', token: session.access_token });
    } catch {
      load();
    }
  }

  if (authLoading) return <p className="muted" style={{ paddingTop: 32 }}>Loading…</p>;

  if (!session) {
    return (
      <div className="card-lg" style={{ maxWidth: 420, margin: '64px auto 0', textAlign: 'center' }}>
        <div className="avatar avatar-lg" style={{ margin: '0 auto 12px' }}>
          <IconHeart size={22} />
        </div>
        <h2 style={{ marginTop: 0 }}>Sign in to see your favorites</h2>
        <a href="/login" className="btn btn-accent">Sign in</a>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 28 }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: 4 }}>Favorite</h1>
      <p className="muted">Doctors you've saved for quick access.</p>

      {loading && <p className="muted" style={{ marginTop: 20 }}>Loading favorites…</p>}
      {!loading && rows.length === 0 && (
        <EmptyState
          variant="favorites"
          title="No favorites yet"
          subtitle="Tap the heart on any doctor to save them here."
        />
      )}

      <div className="doctor-grid">
        {rows.map((r) => (
          <DoctorCard key={r.id} doctor={{ ...r.services, id: r.service_id }} favorited onToggleFavorite={toggleFavorite} />
        ))}
      </div>
    </div>
  );
}
