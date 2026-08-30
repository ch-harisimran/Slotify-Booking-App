import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';

/**
 * Shared "browse doctors" logic used by both the home screen and the search
 * screen: fetch the roster (refetched on focus), fetch/toggle the signed-in
 * user's favorites, derive the specialty chip list, and filter by
 * query/specialty. Pass `withNextAppointment: true` (home screen only) to
 * also surface the user's soonest upcoming booking.
 */
export function useDoctorSearch({ withNextAppointment = false } = {}) {
  const { session, profile } = useAuth();
  const router = useRouter();
  const [doctors, setDoctors] = useState([]);
  const [query, setQuery] = useState('');
  const [specialty, setSpecialty] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [nextAppointment, setNextAppointment] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch('/api/services');
      setDoctors(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      if (session) {
        apiFetch('/api/favorites/me', { token: session.access_token })
          .then((rows) => setFavoriteIds(new Set(rows.map((r) => r.service_id))))
          .catch(() => {});
        if (withNextAppointment) {
          apiFetch('/api/bookings/me', { token: session.access_token })
            .then((rows) => {
              const upcoming = rows
                .filter((b) => b.status !== 'cancelled' && new Date(b.start_time) > new Date())
                .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
              setNextAppointment(upcoming[0] || null);
            })
            .catch(() => {});
        }
      } else {
        setFavoriteIds(new Set());
        setNextAppointment(null);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [load, session])
  );

  async function toggleFavorite(doctor) {
    if (!session) return router.push('/login');
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

  function refresh() {
    setRefreshing(true);
    load();
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

  const popular = useMemo(
    () => [...filtered].sort((a, b) => (b.rating || 0) - (a.rating || 0)),
    [filtered]
  );

  return {
    session,
    profile,
    doctors,
    query,
    setQuery,
    specialty,
    setSpecialty,
    loading,
    refreshing,
    refresh,
    error,
    favoriteIds,
    toggleFavorite,
    specialties,
    filtered,
    popular,
    nextAppointment,
  };
}
