'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import SplashScreen from './SplashScreen';

// Keeps the splash up for at least this long so it reads as a deliberate
// brand moment rather than a flash, even when the session check resolves
// instantly (e.g. session already cached).
const MIN_SPLASH_MS = 700;
const EXIT_MS = 320;

export default function SplashGate({ children }) {
  const { loading } = useAuth();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading && minTimeElapsed && !exiting) {
      setExiting(true);
      const timer = setTimeout(() => setMounted(false), EXIT_MS);
      return () => clearTimeout(timer);
    }
  }, [loading, minTimeElapsed, exiting]);

  return (
    <>
      {mounted && (
        <div className={`splash-overlay ${exiting ? 'splash-overlay-exit' : ''}`}>
          <SplashScreen />
        </div>
      )}
      {children}
    </>
  );
}
