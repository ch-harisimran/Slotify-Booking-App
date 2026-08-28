export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Thin wrapper around fetch for calling the Slotify backend API.
 * Pass `token` (a Supabase session access_token) for authenticated routes.
 */
export async function apiFetch(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }

  return data;
}
