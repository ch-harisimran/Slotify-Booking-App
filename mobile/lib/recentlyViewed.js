import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'slotify_recently_viewed_doctors';
const MAX = 8;

export async function getRecentlyViewed() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function addRecentlyViewed(doctorId) {
  try {
    const current = (await getRecentlyViewed()).filter((id) => id !== doctorId);
    current.unshift(doctorId);
    await AsyncStorage.setItem(KEY, JSON.stringify(current.slice(0, MAX)));
  } catch {
    // ignore storage errors
  }
}
