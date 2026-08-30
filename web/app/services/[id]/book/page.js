'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

// Old booking route — the flow now lives on the Doctor Details page's
// Availability tab. Redirect anyone with an old link/bookmark there.
export default function LegacyBookRedirect() {
  const { id } = useParams();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/doctors/${id}`);
  }, [id, router]);

  return <p className="muted" style={{ paddingTop: 32 }}>Redirecting…</p>;
}
