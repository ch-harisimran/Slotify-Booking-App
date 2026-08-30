'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from './api';

/**
 * Shared "admin CRUD list" logic used by both ServicesManager and
 * AvailabilityManager: fetch a list, create via a form, and inline-edit a
 * row via a second form — with loading/error/creating/savingId state for
 * each phase. The two managers only differ in their endpoints and how a
 * form maps to a request body, so those are passed in as callbacks.
 *
 * `listPath` is re-fetched whenever it changes (e.g. AvailabilityManager
 * passes `/api/admin/availability?service_id=${serviceId}`, which changes
 * as the selected service changes); pass null/'' to skip fetching.
 * `basePath` is the create/patch endpoint, e.g. `/api/admin/services`
 * (PATCH goes to `${basePath}/${id}`).
 */
export function useAdminCrudList({
  token,
  listPath,
  basePath,
  emptyForm,
  toCreateBody,
  toEditForm,
  toPatchBody,
  resetFormOnCreate = true,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [savingId, setSavingId] = useState(null);

  async function load() {
    if (!listPath) return;
    setLoading(true);
    try {
      const data = await apiFetch(listPath, { token });
      setItems(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listPath]);

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      await apiFetch(basePath, { method: 'POST', token, body: toCreateBody(form) });
      if (resetFormOnCreate) setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  function startEdit(item) {
    setEditingId(item.id);
    setEditForm(toEditForm(item));
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id) {
    setSavingId(id);
    setError('');
    try {
      await apiFetch(`${basePath}/${id}`, { method: 'PATCH', token, body: toPatchBody(editForm) });
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  }

  return {
    items,
    loading,
    error,
    load,
    form,
    setForm,
    creating,
    handleCreate,
    editingId,
    editForm,
    setEditForm,
    savingId,
    startEdit,
    cancelEdit,
    saveEdit,
  };
}
