'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AvailabilityManager({ token }) {
  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState('');
  const [windows, setWindows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ day_of_week: '1', start_time: '09:00', end_time: '17:00' });
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ day_of_week: '1', start_time: '', end_time: '' });
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    apiFetch('/api/services')
      .then((data) => {
        setServices(data);
        if (data.length > 0) setServiceId(data[0].id);
      })
      .catch((err) => setError(err.message));
  }, []);

  async function loadWindows(id) {
    if (!id) return;
    setLoading(true);
    try {
      const data = await apiFetch(`/api/admin/availability?service_id=${id}`, { token });
      setWindows(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (serviceId) loadWindows(serviceId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      await apiFetch('/api/admin/availability', {
        method: 'POST',
        token,
        body: {
          service_id: serviceId,
          day_of_week: Number(form.day_of_week),
          start_time: form.start_time,
          end_time: form.end_time,
        },
      });
      await loadWindows(serviceId);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  function startEdit(w) {
    setEditingId(w.id);
    setEditForm({
      day_of_week: String(w.day_of_week),
      start_time: w.start_time.slice(0, 5),
      end_time: w.end_time.slice(0, 5),
    });
  }

  async function saveEdit(id) {
    setSavingId(id);
    setError('');
    try {
      await apiFetch(`/api/admin/availability/${id}`, {
        method: 'PATCH',
        token,
        body: {
          day_of_week: Number(editForm.day_of_week),
          start_time: editForm.start_time,
          end_time: editForm.end_time,
        },
      });
      setEditingId(null);
      await loadWindows(serviceId);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  }

  const sortedWindows = [...windows].sort((a, b) => a.day_of_week - b.day_of_week);

  return (
    <div>
      <div className="field" style={{ marginTop: 16, maxWidth: 320 }}>
        <label>Service</label>
        <select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <form onSubmit={handleCreate} className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Add a weekly window</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div className="field" style={{ flex: 1, minWidth: 140 }}>
            <label>Day</label>
            <select value={form.day_of_week} onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}>
              {DAYS.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ flex: 1, minWidth: 100 }}>
            <label>Start</label>
            <input
              type="time"
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              required
            />
          </div>
          <div className="field" style={{ flex: 1, minWidth: 100 }}>
            <label>End</label>
            <input
              type="time"
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              required
            />
          </div>
        </div>
        <button className="btn btn-accent" type="submit" disabled={creating || !serviceId}>
          {creating ? 'Adding…' : 'Add window'}
        </button>
      </form>

      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <p className="muted" style={{ marginTop: 16 }}>Loading availability…</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Day</th>
              <th>Start</th>
              <th>End</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sortedWindows.map((w) => (
              <tr key={w.id}>
                {editingId === w.id ? (
                  <>
                    <td>
                      <select
                        value={editForm.day_of_week}
                        onChange={(e) => setEditForm({ ...editForm, day_of_week: e.target.value })}
                      >
                        {DAYS.map((d, i) => (
                          <option key={d} value={i}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="time"
                        value={editForm.start_time}
                        onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        type="time"
                        value={editForm.end_time}
                        onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                      />
                    </td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <button type="button" className="btn btn-accent btn-sm" onClick={() => saveEdit(w.id)} disabled={savingId === w.id}>
                        {savingId === w.id ? 'Saving…' : 'Save'}
                      </button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{DAYS[w.day_of_week]}</td>
                    <td>{w.start_time.slice(0, 5)}</td>
                    <td>{w.end_time.slice(0, 5)}</td>
                    <td>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => startEdit(w)}>
                        Edit
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {sortedWindows.length === 0 && (
              <tr>
                <td colSpan={4} className="muted">No availability windows yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
