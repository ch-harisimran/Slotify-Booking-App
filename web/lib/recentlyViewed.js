const KEY = 'slotify_recently_viewed_doctors';
const MAX = 8;

export function getRecentlyViewed() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function addRecentlyViewed(doctorId) {
  if (typeof window === 'undefined') return;
  try {
    const current = getRecentlyViewed().filter((id) => id !== doctorId);
    current.unshift(doctorId);
    window.localStorage.setItem(KEY, JSON.stringify(current.slice(0, MAX)));
  } catch {
    // ignore storage errors (private mode, etc.)
  }
}
