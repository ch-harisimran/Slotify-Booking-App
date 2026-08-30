// Shared formatting helpers used across pages/components.

/** Turns a name (or, failing that, an email) into 1-2 uppercase initials for an avatar. */
export function initials(name, email) {
  const source = name || email || '';
  const parts = source.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase() || 'S';
}
