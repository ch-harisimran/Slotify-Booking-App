'use client';

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

export default function Navbar() {
  const { session, profile } = useAuth();

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="brand">Slotify</Link>
        <nav className="nav-links">
          <Link href="/">Services</Link>
          {session ? (
            <>
              <Link href="/dashboard">My Bookings</Link>
              {profile?.role === 'admin' && <Link href="/admin">Admin</Link>}
              <button className="btn btn-secondary" onClick={handleSignOut}>
                Sign out
              </button>
            </>
          ) : (
            <Link href="/login" className="btn">Sign in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
