import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabaseClient';

// Minimal base64 -> byte array decoder. Supabase Storage's upload() needs
// raw bytes (ArrayBuffer/Uint8Array), not a base64 string, and pulling in a
// whole extra package just for this one conversion isn't worth it when
// expo-image-picker can already hand us the base64 payload directly.
const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function decodeBase64(base64) {
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, '');
  const bytes = [];
  for (let i = 0; i < clean.length; i += 4) {
    const e1 = B64_CHARS.indexOf(clean[i]);
    const e2 = B64_CHARS.indexOf(clean[i + 1]);
    const e3 = clean[i + 2] !== undefined ? B64_CHARS.indexOf(clean[i + 2]) : -1;
    const e4 = clean[i + 3] !== undefined ? B64_CHARS.indexOf(clean[i + 3]) : -1;
    bytes.push((e1 << 2) | (e2 >> 4));
    if (e3 >= 0) bytes.push(((e2 & 15) << 4) | (e3 >> 2));
    if (e4 >= 0) bytes.push(((e3 & 3) << 6) | e4);
  }
  return new Uint8Array(bytes);
}

/**
 * Opens the photo library, lets the user crop to a square, and returns the
 * picked asset (with base64 data attached) — or null if they cancelled.
 * Throws if photo library permission is denied.
 */
export async function pickAvatarImage() {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Photo library permission is required to set a profile picture.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
    base64: true,
  });

  if (result.canceled || !result.assets?.[0]) return null;
  return result.assets[0];
}

/**
 * Uploads a picked asset to the `avatars` bucket at `{userId}/avatar.<ext>`
 * (upsert — re-uploading replaces the same file rather than accumulating
 * old ones), saves the resulting public URL onto the user's row, and
 * returns that URL so the caller can update local state immediately.
 */
export async function uploadAvatar(userId, asset) {
  const rawExt = (asset.uri.split('.').pop() || 'jpg').split('?')[0].toLowerCase();
  const ext = /^[a-z0-9]{2,5}$/.test(rawExt) ? rawExt : 'jpg';
  const contentType = asset.mimeType || (ext === 'png' ? 'image/png' : 'image/jpeg');
  const path = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, decodeBase64(asset.base64), { contentType, upsert: true });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  // Cache-bust: upsert overwrites the same file at the same path, so
  // without this the CDN/browser would keep showing the old cached image.
  const avatarUrl = `${data.publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await supabase
    .from('users')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId);
  if (updateError) throw updateError;

  return avatarUrl;
}
