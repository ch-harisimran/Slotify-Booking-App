'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { apiFetch } from '../../lib/api';
import { uploadAvatar } from '../../lib/avatar';
import {
  IconUser, IconCalendar, IconHeart, IconLock, IconLogOut, IconShield, IconChevronRight, IconX, IconTrash, IconCamera,
} from '../../components/icons';
import Avatar from '../../components/Avatar';

function ModalShell({ title, onClose, children }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(20,24,22,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        className="card-lg"
        style={{ width: '100%', maxWidth: 420, maxHeight: '85vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: '1.15rem' }}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="avatar-sm"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: 'none', cursor: 'pointer' }}
          >
            <IconX size={14} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Row({ icon, label, onClick, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
        padding: '13px 16px', border: 'none', borderBottom: '1px solid var(--border-soft)',
        background: 'transparent', cursor: 'pointer', font: 'inherit',
      }}
    >
      <span
        className="avatar-sm"
        style={{ background: danger ? 'var(--danger-soft)' : 'var(--accent-soft)', color: danger ? 'var(--danger)' : 'var(--accent)' }}
      >
        {icon}
      </span>
      <span style={{ flex: 1, fontWeight: 600, fontSize: '0.92rem', color: danger ? 'var(--danger)' : 'var(--text)' }}>{label}</span>
      {!danger && <IconChevronRight size={15} style={{ color: 'var(--text-faint)' }} />}
    </button>
  );
}

export default function ProfilePage() {
  const { session, profile, loading, refreshProfile } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.name || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [policyOpen, setPolicyOpen] = useState(null); // null | 'privacy' | 'terms'

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const avatarInputRef = useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    setAvatarError('');
    setAvatarUploading(true);
    try {
      await uploadAvatar(session.user.id, file);
      await refreshProfile();
    } catch (err) {
      setAvatarError(err.message);
    } finally {
      setAvatarUploading(false);
    }
  }

  function closeDeleteModal() {
    setDeleteOpen(false);
    setDeleteConfirmText('');
    setDeleteError('');
  }

  async function handleDeleteAccount(e) {
    e.preventDefault();
    setDeleting(true);
    setDeleteError('');
    try {
      await apiFetch('/api/users/me', { method: 'DELETE', token: session.access_token });
      // The account (and its session) is already gone server-side — signOut
      // here just clears local storage, so ignore any error from it.
      await supabase.auth.signOut().catch(() => {});
      router.push('/');
    } catch (err) {
      setDeleteError(err.message);
      setDeleting(false);
    }
  }

  async function saveName(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { error: updateError } = await supabase.from('users').update({ name }).eq('id', session.user.id);
      if (updateError) throw updateError;
      await refreshProfile();
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function closePasswordModal() {
    setPasswordOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordSuccess('');
  }

  async function changePassword(e) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    setPasswordSaving(true);
    try {
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: profile?.email || session.user.email,
        password: currentPassword,
      });
      if (reauthError) throw new Error('Current password is incorrect.');

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      setPasswordSuccess('Password updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setPasswordSaving(false);
    }
  }

  if (loading) return <p className="muted" style={{ paddingTop: 32 }}>Loading…</p>;

  if (!session) {
    return (
      <div className="card-lg" style={{ maxWidth: 420, margin: '64px auto 0', textAlign: 'center' }}>
        <div className="avatar avatar-lg" style={{ margin: '0 auto 12px' }}>
          <IconUser size={22} />
        </div>
        <h2 style={{ marginTop: 0 }}>Sign in to see your profile</h2>
        <a href="/login" className="btn btn-accent">Sign in</a>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 28, maxWidth: 520, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: 20 }}>My Profile</h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Avatar url={profile?.avatar_url} name={profile?.name} email={profile?.email} className="avatar-lg" />
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={avatarUploading}
            title="Change photo"
            style={{
              position: 'absolute', right: -2, bottom: -2, width: 22, height: 22, borderRadius: '50%',
              background: 'var(--accent)', color: 'white', border: '2px solid var(--bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: avatarUploading ? 'default' : 'pointer',
              padding: 0,
            }}
          >
            <IconCamera size={11} />
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleAvatarChange}
            style={{ display: 'none' }}
          />
        </div>
        {editing ? (
          <form onSubmit={saveName} style={{ flex: 1 }}>
            <input value={name} onChange={(e) => setName(e.target.value)} style={{ marginBottom: 6 }} autoFocus />
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-accent btn-sm" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>Cancel</button>
            </div>
            {error && <p className="error-text" style={{ marginTop: 6 }}>{error}</p>}
          </form>
        ) : (
          <div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem' }}>{profile?.name || 'Slotify user'}</p>
            <p className="muted" style={{ margin: '2px 0 0', fontSize: '0.85rem' }}>{profile?.email}</p>
            {avatarUploading && <p className="muted" style={{ margin: '4px 0 0', fontSize: '0.8rem' }}>Uploading photo…</p>}
            {avatarError && <p className="error-text" style={{ margin: '4px 0 0', fontSize: '0.8rem' }}>{avatarError}</p>}
          </div>
        )}
      </div>

      <p className="faint" style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
        Account Settings
      </p>
      <div className="card" style={{ padding: 0, marginBottom: 20 }}>
        <Row icon={<IconUser size={15} />} label="Personal Information" onClick={() => setEditing(true)} />
        <Row icon={<IconCalendar size={15} />} label="Booking History" onClick={() => router.push('/dashboard')} />
        <Row icon={<IconHeart size={15} />} label="Favorites" onClick={() => router.push('/favorites')} />
        <Row icon={<IconLock size={15} />} label="Password & Security" onClick={() => setPasswordOpen(true)} />
      </div>

      <p className="faint" style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
        Policy Center
      </p>
      <div className="card" style={{ padding: 0, marginBottom: 20 }}>
        <Row icon={<IconShield size={15} />} label="Privacy Policy" onClick={() => setPolicyOpen('privacy')} />
        <Row icon={<IconShield size={15} />} label="Terms & Conditions" onClick={() => setPolicyOpen('terms')} />
      </div>

      <div className="card" style={{ padding: 0 }}>
        <Row icon={<IconLogOut size={15} />} label="Sign out" onClick={handleSignOut} danger />
        <Row icon={<IconTrash size={15} />} label="Delete Account" onClick={() => setDeleteOpen(true)} danger />
      </div>

      {passwordOpen && (
        <ModalShell title="Password & Security" onClose={closePasswordModal}>
          <form onSubmit={changePassword}>
            <div className="field">
              <label htmlFor="current-password">Current password</label>
              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoFocus
              />
            </div>
            <div className="field">
              <label htmlFor="new-password">New password</label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="confirm-new-password">Confirm new password</label>
              <input
                id="confirm-new-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>

            <button className="btn btn-accent btn-block" type="submit" disabled={passwordSaving}>
              {passwordSaving ? 'Saving…' : 'Update password'}
            </button>

            {passwordError && <p className="error-text">{passwordError}</p>}
            {passwordSuccess && <p className="success-text">{passwordSuccess}</p>}
          </form>
        </ModalShell>
      )}

      {deleteOpen && (
        <ModalShell title="Delete account" onClose={deleting ? () => {} : closeDeleteModal}>
          <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-muted)', marginTop: 0 }}>
            This permanently deletes your Slotify account and cancels every upcoming appointment you have booked.
            This can't be undone.
          </p>
          <form onSubmit={handleDeleteAccount}>
            <div className="field">
              <label htmlFor="delete-confirm">Type <strong>DELETE</strong> to confirm</label>
              <input
                id="delete-confirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                autoFocus
                required
              />
            </div>
            <button
              className="btn btn-danger btn-block"
              type="submit"
              disabled={deleteConfirmText !== 'DELETE' || deleting}
            >
              {deleting ? 'Deleting…' : 'Permanently delete my account'}
            </button>
            {deleteError && <p className="error-text">{deleteError}</p>}
          </form>
        </ModalShell>
      )}

      {policyOpen && (
        <ModalShell
          title={policyOpen === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions'}
          onClose={() => setPolicyOpen(null)}
        >
          {policyOpen === 'privacy' ? (
            <div style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>
              <p>Slotify collects the information you provide when booking appointments — your name, email, and the symptoms or notes you share with our AI assistant — to match you with the right doctor and manage your bookings.</p>
              <p>We never sell your personal data. Your health-related notes are visible only to you and the doctors you book with. You can request a copy or deletion of your data at any time by contacting support.</p>
              <p>Authentication is handled securely through Supabase, and passwords are never stored in plain text.</p>
            </div>
          ) : (
            <div style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>
              <p>By using Slotify, you agree to book appointments in good faith and to attend or cancel them with reasonable notice.</p>
              <p>Slotify's AI assistant offers general guidance and doctor recommendations, but is not a substitute for professional medical advice, diagnosis, or treatment.</p>
              <p>Accounts found to be abusing the booking system or submitting false information may be suspended.</p>
            </div>
          )}
        </ModalShell>
      )}
    </div>
  );
}
