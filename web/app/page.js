'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import ServiceCard from '../components/ServiceCard';

export default function HomePage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/api/services')
      .then(setServices)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ paddingTop: 32 }}>
      <h1 style={{ marginBottom: 4 }}>Book an appointment</h1>
      <p className="muted">Pick a service below and find a time that works for you.</p>

      {loading && <p className="muted">Loading services…</p>}
      {error && (
        <p className="error-text">
          Couldn't load services: {error}. Is the backend running at the API URL in your .env.local?
        </p>
      )}
      {!loading && !error && services.length === 0 && (
        <p className="muted">No services available yet.</p>
      )}

      <div className="grid">
        {services.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>
    </div>
  );
}
