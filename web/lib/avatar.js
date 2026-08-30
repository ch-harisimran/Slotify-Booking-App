import { supabase } from './supabaseClient';

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Uploads a picked File to the `avatars` bucket at `{userId}/avatar.<ext>`
 * (upsert — re-uploading replaces the same file rather than accumulating
 * old ones), saves the resulting public URL onto the user's row, and
 * returns that URL so the caller can update local state immediately.
 */
export async function uploadAvatar(userId, file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Please choose a JPG, PNG, WEBP, or GIF image.');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Image must be smaller than 5MB.');
  }

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { contentType: file.type, upsert: true });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  // Cache-bust: upsert overwrites the same file at the same path, so
  // without this the browser would keep showing the old cached image.
  const avatarUrl = `${data.publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await supabase
    .from('users')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId);
  if (updateError) throw updateError;

  return avatarUrl;
}
