'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { IconCalendar, IconHome, IconLogOut, IconShield, IconHeart, IconMascot, IconUser } from './icons';
import Logo from './Logo';
import Avatar from './Avatar';

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
          <Logo size={30} rounded={10} />
          Slotify
        </Link>

        {/* Same icon set/order as the mobile bottom nav: Home, Favorite, AI, Bookings, Profile */}
        <nav className="nav-links">
          <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
            <IconHome size={16} />
            Home
          </Link>
          <Link href="/favorites" className={`nav-link ${pathname === '/favorites' ? 'active' : ''}`}>
            <IconHeart size={16} />
            Favorite
          </Link>
          <Link href="/ai" className={`nav-link nav-link-ai ${pathname === '/ai' ? 'active' : ''}`}>
            <IconMascot size={16} />
            AI Assistant
          </Link>
          <Link href="/dashboard" className={`nav-link ${pathname === '/dashboard' ? 'active' : ''}`}>
            <IconCalendar size={16} />
            Bookings
          </Link>
          <Link href="/profile" className={`nav-link ${pathname === '/profile' ? 'active' : ''}`}>
            <IconUser size={16} />
            Profile
          </Link>
          {profile?.role === 'admin' && (
            <Link href="/admin" className={`nav-link ${pathname === '/admin' ? 'active' : ''}`}>
              <IconShield size={16} />
              Admin
            </Link>
          )}

          {session ? (
            <>
              <button className="icon-btn" onClick={handleSignOut} title="Sign out" style={{ marginLeft: 4 }}>
                <IconLogOut size={16} />
              </button>
              <Link href="/profile" style={{ marginLeft: 6, display: 'flex' }}>
                <Avatar url={profile?.avatar_url} name={profile?.name} email={profile?.email} className="avatar-sm" />
              </Link>
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
