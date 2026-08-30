'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { addRecentlyViewed } from '../../../lib/recentlyViewed';
import { IconCheck, IconStar, IconHeart, IconBriefcase, IconChevronLeft, IconBell } from '../../../components/icons';
import { getSpecialtyStyle } from '../../../lib/specialties';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function toISODate(d) {
  return d.toISOString().slice(0, 10);
}
function formatSlotTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
function nextDays(count) {
  const days = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = 0; i < count; i += 1) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    days.push(d);
  }
  return days;
}

const TABS = ['About', 'Availability', 'Education', 'Reviews'];

export default function DoctorDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();

  const [doctor, setDoctor] = useState(null);
  const [tab, setTab] = useState('About');
  const [favorited, setFavorited] = useState(false);

  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [waitlistEntry, setWaitlistEntry] = useState(null);
  const [waitlistBusy, setWaitlistBusy] = useState(false);

  const days = useMemo(() => nextDays(21), []);

  useEffect(() => {
    apiFetch('/api/services').then((services) => {
      const match = services.find((s) => s.id === id);
      setDoctor(match || null);
    });
    if (id) addRecentlyViewed(id);
  }, [id]);

  useEffect(() => {
    if (!session) return setFavorited(false);
    apiFetch('/api/favorites/me', { token: session.access_token })
      .then((rows) => setFavorited(rows.some((r) => r.service_id === id)))
      .catch(() => {});
  }, [session, id]);

  useEffect(() => {
    if (!session) return setWaitlistEntry(null);
    apiFetch('/api/waitlist/me', { token: session.access_token })
      .then((rows) => setWaitlistEntry(rows.find((w) => w.service_id === id && w.status === 'waiting') || null))
      .catch(() => {});
  }, [session, id]);

  useEffect(() => {
    if (tab !== 'Availability' || !id || !date) return;
    setSelectedSlot(null);
    setLoadingSlots(true);
    setError('');
    apiFetch(`/api/availability?service_id=${id}&date=${date}`)
      .then((res) => setSlots(res.slots || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoadingSlots(false));
  }, [id, date, tab]);

  async function toggleFavorite() {
    if (!session) return router.push('/login');
    setFavorited((f) => !f);
    try {
      if (favorited) {
        await apiFetch(`/api/favorites/${id}`, { method: 'DELETE', token: session.access_token });
      } else {
        await apiFetch('/api/favorites', { method: 'POST', token: session.access_token, body: { service_id: id } });
      }
    } catch {
      setFavorited((f) => !f);
    }
  }

  async function toggleWaitlist() {
    if (!session) return router.push('/login');
    setWaitlistBusy(true);
    try {
      if (waitlistEntry) {
        await apiFetch(`/api/waitlist/${waitlistEntry.id}`, { method: 'DELETE', token: session.access_token });
        setWaitlistEntry(null);
      } else {
        const created = await apiFetch('/api/waitlist', {
          method: 'POST',
          token: session.access_token,
          body: { service_id: id },
        });
        setWaitlistEntry(created);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setWaitlistBusy(false);
    }
  }

  async function handleConfirm() {
    if (!session) return router.push('/login');
    if (!selectedSlot) return;
    setConfirming(true);
    setError('');
    try {
      await apiFetch('/api/bookings', {
        method: 'POST',
        token: session.access_token,
        body: { service_id: id, start_time: selectedSlot.start_time, end_time: selectedSlot.end_time },
      });
      setConfirmed(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirming(false);
    }
  }

  if (!doctor) {
    return <p className="muted" style={{ paddingTop: 32 }}>Loading doctor…</p>;
  }

  if (confirmed) {
    return (
      <div className="card-lg" style={{ maxWidth: 440, margin: '64px auto 0', textAlign: 'center' }}>
        <div className="avatar-lg" style={{ background: 'var(--success-soft)', color: 'var(--success)', margin: '0 auto 16px' }}>
          <IconCheck size={26} />
        </div>
        <h2 style={{ marginTop: 0, marginBottom: 6 }}>Booking confirmed!</h2>
        <p className="muted">
          {doctor.name} · {new Date(selectedSlot.start_time).toLocaleString([], {
            weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
          })}
        </p>
        <a href="/dashboard" className="btn btn-accent" style={{ marginTop: 16 }}>View my bookings</a>
      </div>
    );
  }

  const { icon: SpecialtyIcon, bg: specBg, fg: specFg } = getSpecialtyStyle(doctor.specialty);

  return (
    <div style={{ paddingTop: 24, maxWidth: 920, margin: '0 auto' }}>
      <button className="icon-btn" onClick={() => router.back()} style={{ marginBottom: 14 }}>
        <IconChevronLeft size={18} />
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 340px) 1fr', gap: 28, alignItems: 'start' }}>
        <div style={{ position: 'relative' }}>
          <div className="doctor-card-photo" style={{ background: specBg, borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)' }}>
            {doctor.photo_url && <img src={doctor.photo_url} alt={doctor.name} />}
          </div>
          <button
            type="button"
            className={`doctor-card-heart ${favorited ? 'active' : ''}`}
            onClick={toggleFavorite}
            style={{ top: 14, right: 14 }}
          >
            <IconHeart size={16} filled={favorited} />
          </button>
        </div>

        <div>
          <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: specBg, color: specFg }}>
            <SpecialtyIcon size={12} />
            {doctor.specialty}
          </span>
          <h1 style={{ margin: '10px 0 2px', fontSize: '1.6rem' }}>{doctor.name}</h1>
          <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent)' }}>
            ${Number(doctor.price).toFixed(0)}<span style={{ fontWeight: 500, color: 'var(--text-faint)', fontSize: '0.8rem' }}>/visit</span>
          </p>

          <div style={{ display: 'flex', gap: 24, marginTop: 18 }}>
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem' }}>
                <IconBriefcase size={14} style={{ verticalAlign: -2, marginRight: 4 }} />
                {doctor.experience_years}/Yr
              </p>
              <p className="muted" style={{ margin: 0, fontSize: '0.78rem' }}>Experience</p>
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem' }}>{doctor.reviews_count}</p>
              <p className="muted" style={{ margin: 0, fontSize: '0.78rem' }}>Reviews</p>
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem', color: 'var(--warning)' }}>
                <IconStar size={14} style={{ verticalAlign: -2, marginRight: 3 }} />
                {Number(doctor.rating).toFixed(1)}
              </p>
              <p className="muted" style={{ margin: 0, fontSize: '0.78rem' }}>Rating</p>
            </div>
          </div>

          <div className="tabs" style={{ marginTop: 22 }}>
            {TABS.map((t) => (
              <button key={t} type="button" className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                {t}
              </button>
            ))}
          </div>

          {tab === 'About' && (
            <div style={{ marginTop: 16 }}>
              <p style={{ lineHeight: 1.6, color: 'var(--text-muted)' }}>{doctor.bio}</p>
              {doctor.why_choose?.length > 0 && (
                <>
                  <h3 style={{ fontSize: '1rem', marginBottom: 10 }}>Why Choose {doctor.name}?</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {doctor.why_choose.map((reason, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <span style={{ color: 'var(--success)', marginTop: 2, flexShrink: 0 }}>
                          <IconCheck size={15} />
                        </span>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{reason}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {tab === 'Availability' && (
            <div style={{ marginTop: 16 }}>
              <label>Choose Date</label>
              <div className="date-strip">
                {days.map((d) => {
                  const iso = toISODate(d);
                  const selected = iso === date;
                  return (
                    <div key={iso} className={`date-pill ${selected ? 'selected' : ''}`} onClick={() => setDate(iso)}>
                      <span className="dow">{d.toLocaleDateString([], { weekday: 'short' })}</span>
                      <span className="dom">{d.getDate()}</span>
                    </div>
                  );
                })}
              </div>

              <label style={{ marginTop: 16 }}>Choose Time</label>
              {loadingSlots && <p className="muted">Loading times…</p>}
              {!loadingSlots && slots.length === 0 && (
                <>
                  <p className="muted">No open slots on this day — try another date.</p>
                  <button
                    type="button"
                    className={`btn btn-sm ${waitlistEntry ? 'btn-secondary' : 'btn-accent'}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 4 }}
                    onClick={toggleWaitlist}
                    disabled={waitlistBusy}
                  >
                    <IconBell size={13} />
                    {waitlistEntry
                      ? "You're on the waitlist — leave"
                      : `Notify me when ${doctor.name} has an opening`}
                  </button>
                </>
              )}
              <div className="slots">
                {slots.map((slot) => (
                  <button
                    key={slot.start_time}
                    type="button"
                    className={`slot-btn ${selectedSlot?.start_time === slot.start_time ? 'selected' : ''}`}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    {formatSlotTime(slot.start_time)}
                  </button>
                ))}
              </div>

              {error && <p className="error-text">{error}</p>}

              <button
                className="btn btn-accent btn-block"
                style={{ marginTop: 20 }}
                disabled={!selectedSlot || confirming}
                onClick={handleConfirm}
              >
                {authLoading ? 'Loading…' : !session ? 'Sign in to book' : confirming ? 'Booking…' : 'Confirm booking'}
              </button>
            </div>
          )}

          {tab === 'Education' && (
            <div style={{ marginTop: 16 }}>
              <h3 style={{ fontSize: '1rem', marginBottom: 12 }}>Education Qualification</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {(doctor.education || []).map((e, i) => (
                  <div key={i} className="card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ color: 'var(--success)', flexShrink: 0 }}>
                      <IconCheck size={16} />
                    </span>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '0.92rem' }}>{e.degree}</p>
                      <p className="muted" style={{ margin: '2px 0 0', fontSize: '0.82rem' }}>{e.school} · {e.year}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'Reviews' && (
            <div style={{ marginTop: 16 }}>
              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: 4, fontSize: '1.4rem', fontWeight: 800 }}>
                  <IconStar size={20} />
                  {Number(doctor.rating).toFixed(1)}
                </span>
                <p className="muted" style={{ margin: 0 }}>Based on {doctor.reviews_count} patient reviews.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
