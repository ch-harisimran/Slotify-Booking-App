'use client';

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import ServicesManager from '../../components/admin/ServicesManager';
import AvailabilityManager from '../../components/admin/AvailabilityManager';
import BookingsOverview from '../../components/admin/BookingsOverview';

const TABS = [
  { key: 'services', label: 'Services' },
  { key: 'availability', label: 'Availability' },
  { key: 'bookings', label: 'All Bookings' },
];

export default function AdminPage() {
  const { session, profile, loading } = useAuth();
  const [tab, setTab] = useState('services');

  if (loading) {
    return <p className="muted" style={{ paddingTop: 32 }}>Loading…</p>;
  }

  if (!session) {
    return (
      <div className="card" style={{ maxWidth: 420, margin: '48px auto 0', textAlign: 'center' }}>
        <h2 style={{ marginTop: 0 }}>Sign in required</h2>
        <a href="/login" className="btn">Sign in</a>
      </div>
    );
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="card" style={{ maxWidth: 420, margin: '48px auto 0', textAlign: 'center' }}>
        <h2 style={{ marginTop: 0 }}>Admins only</h2>
        <p className="muted">Your account doesn't have admin access.</p>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 32 }}>
      <h1 style={{ marginBottom: 4 }}>Admin</h1>
      <p className="muted">Manage services, availability, and view all bookings.</p>

      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`tab-btn ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'services' && <ServicesManager token={session.access_token} />}
      {tab === 'availability' && <AvailabilityManager token={session.access_token} />}
      {tab === 'bookings' && <BookingsOverview token={session.access_token} />}
    </div>
  );
}
