'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import ServiceCard from '../components/ServiceCard';
import { IconSearch } from '../components/icons';

export default function HomePage() {
  const { profile } = useAuth();
  const [services, setServices] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/api/services')
      .then(setServices)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return services;
    const q = query.trim().toLowerCase();
    return services.filter(
      (s) => s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)
    );
  }, [services, query]);

  const firstName = profile?.name?.split(' ')[0];

  return (
    <div style={{ paddingTop: 28 }}>
      <div className="hero">
        <h1 style={{ position: 'relative', marginBottom: 6, fontSize: '1.8rem' }}>
          {firstName ? `Hey, ${firstName}` : 'Book an appointment'}
        </h1>
        <p className="muted" style={{ position: 'relative', margin: 0 }}>
          Pick a service and find a time that works for you.
        </p>

        <div className="input-with-icon" style={{ position: 'relative', marginTop: 20, maxWidth: 420 }}>
          <span className="icon-slot">
            <IconSearch size={17} />
          </span>
          <input
            type="text"
            placeholder="Search services…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {loading && <p className="muted" style={{ marginTop: 24 }}>Loading services…</p>}
      {error && (
        <p className="error-text" style={{ marginTop: 24 }}>
          Couldn't load services: {error}. Is the backend running at the API URL in your .env.local?
        </p>
      )}
      {!loading && !error && filtered.length === 0 && (
        <p className="muted" style={{ marginTop: 24 }}>
          {services.length === 0 ? 'No services available yet.' : 'No services match your search.'}
        </p>
      )}

      <div className="grid">
        {filtered.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>
    </div>
  );
}
