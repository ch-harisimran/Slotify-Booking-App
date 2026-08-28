'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { IconCalendar, IconHome, IconLogOut, IconShield } from './icons';

function initials(name, email) {
  const source = name || email || '';
  const parts = source.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export default function Navbar() {
  const { session, profile } = useAuth();
  const pathname = usePathname();

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <IconCalendar size={16} />
          </span>
          Slotify
        </Link>
        <nav className="nav-links">
          <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
            <IconHome size={16} />
            Services
          </Link>
          {session ? (
            <>
              <Link href="/dashboard" className={`nav-link ${pathname === '/dashboard' ? 'active' : ''}`}>
                <IconCalendar size={16} />
                My Bookings
              </Link>
              {profile?.role === 'admin' && (
                <Link href="/admin" className={`nav-link ${pathname === '/admin' ? 'active' : ''}`}>
                  <IconShield size={16} />
                  Admin
                </Link>
              )}
              <button className="icon-btn" onClick={handleSignOut} title="Sign out" style={{ marginLeft: 4 }}>
                <IconLogOut size={16} />
              </button>
              <div className="avatar avatar-sm" style={{ marginLeft: 6 }}>
                {initials(profile?.name, profile?.email)}
              </div>
            </>
          ) : (
            <Link href="/login" className="btn btn-accent btn-sm">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
