'use client';

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import ServicesManager from '../../components/admin/ServicesManager';
import AvailabilityManager from '../../components/admin/AvailabilityManager';
import BookingsOverview from '../../components/admin/BookingsOverview';
import { IconShield } from '../../components/icons';

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
      <div className="card-lg" style={{ maxWidth: 420, margin: '64px auto 0', textAlign: 'center' }}>
        <div className="avatar avatar-lg" style={{ margin: '0 auto 12px' }}>
          <IconShield size={22} />
        </div>
        <h2 style={{ marginTop: 0 }}>Sign in required</h2>
        <a href="/login" className="btn btn-accent">Sign in</a>
      </div>
    );
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="card-lg" style={{ maxWidth: 420, margin: '64px auto 0', textAlign: 'center' }}>
        <div className="avatar avatar-lg" style={{ margin: '0 auto 12px', background: 'var(--danger-soft)', color: 'var(--danger)' }}>
          <IconShield size={22} />
        </div>
        <h2 style={{ marginTop: 0 }}>Admins only</h2>
        <p className="muted">Your account doesn't have admin access.</p>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="avatar">
          <IconShield size={16} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Admin</h1>
          <p className="muted" style={{ margin: '2px 0 0', fontSize: '0.88rem' }}>
            Manage services, availability, and view all bookings.
          </p>
        </div>
      </div>

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
