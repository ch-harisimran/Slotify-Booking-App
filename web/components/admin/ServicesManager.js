'use client';

import { useAdminCrudList } from '../../lib/useAdminCrudList';

const emptyForm = { name: '', duration_minutes: '', price: '', description: '' };

export default function ServicesManager({ token }) {
  const {
    items: services, loading, error, form, setForm, creating, handleCreate,
    editingId, editForm, setEditForm, savingId, startEdit, cancelEdit, saveEdit,
  } = useAdminCrudList({
    token,
    listPath: '/api/admin/services',
    basePath: '/api/admin/services',
    emptyForm,
    toCreateBody: (f) => ({
      name: f.name,
      duration_minutes: Number(f.duration_minutes),
      price: Number(f.price) || 0,
      description: f.description,
    }),
    toEditForm: (service) => ({
      name: service.name,
      duration_minutes: service.duration_minutes,
      price: service.price,
      description: service.description || '',
    }),
    toPatchBody: (f) => ({
      name: f.name,
      duration_minutes: Number(f.duration_minutes),
      price: Number(f.price),
      description: f.description,
    }),
  });

  return (
    <div>
      <form onSubmit={handleCreate} className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Add a service</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div className="field" style={{ flex: 2, minWidth: 160 }}>
            <label>Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="field" style={{ flex: 1, minWidth: 100 }}>
            <label>Duration (min)</label>
            <input
              type="number"
              min="1"
              value={form.duration_minutes}
              onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
              required
            />
          </div>
          <div className="field" style={{ flex: 1, minWidth: 100 }}>
            <label>Price ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>
        </div>
        <div className="field">
          <label>Description</label>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <button className="btn btn-accent" type="submit" disabled={creating}>
          {creating ? 'Adding…' : 'Add service'}
        </button>
      </form>

      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <p className="muted" style={{ marginTop: 16 }}>Loading services…</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Duration</th>
                <th>Price</th>
                <th>Description</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id}>
                  {editingId === s.id ? (
                    <>
                      <td>
                        <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={editForm.duration_minutes}
                          onChange={(e) => setEditForm({ ...editForm, duration_minutes: e.target.value })}
                          style={{ width: 70 }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.price}
                          onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                          style={{ width: 80 }}
                        />
                      </td>
                      <td>
                        <input
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        />
                      </td>
                      <td style={{ display: 'flex', gap: 6 }}>
                        <button type="button" className="btn btn-accent btn-sm" onClick={() => saveEdit(s.id)} disabled={savingId === s.id}>
                          {savingId === s.id ? 'Saving…' : 'Save'}
                        </button>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={cancelEdit}>
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{s.name}</td>
                      <td>{s.duration_minutes} min</td>
                      <td>${Number(s.price).toFixed(2)}</td>
                      <td className="muted">{s.description}</td>
                      <td>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => startEdit(s)}>
                          Edit
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {services.length === 0 && (
                <tr>
                  <td colSpan={5} className="muted">No services yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
