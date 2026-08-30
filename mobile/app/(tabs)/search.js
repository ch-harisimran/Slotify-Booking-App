import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, Pressable, Image } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { getRecentlyViewed } from '../../lib/recentlyViewed';
import DoctorCard from '../../components/DoctorCard';
import EmptyState from '../../components/EmptyState';
import { colors, radii } from '../../theme';
import { getSpecialtyStyle } from '../../lib/specialties';

export default function SearchScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [doctors, setDoctors] = useState([]);
  const [query, setQuery] = useState('');
  const [specialty, setSpecialty] = useState('All');
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [recentIds, setRecentIds] = useState([]);

  useEffect(() => {
    apiFetch('/api/services').then(setDoctors).catch(() => {});
  }, []);

  useFocusEffect(
    useCallback(() => {
      getRecentlyViewed().then(setRecentIds);
      if (session) {
        apiFetch('/api/favorites/me', { token: session.access_token })
          .then((rows) => setFavoriteIds(new Set(rows.map((r) => r.service_id))))
          .catch(() => {});
      } else {
        setFavoriteIds(new Set());
      }
    }, [session])
  );

  async function toggleFavorite(doctor) {
    if (!session) return router.push('/login');
    const isFav = favoriteIds.has(doctor.id);
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      isFav ? next.delete(doctor.id) : next.add(doctor.id);
      return next;
    });
    try {
      if (isFav) {
        await apiFetch(`/api/favorites/${doctor.id}`, { method: 'DELETE', token: session.access_token });
      } else {
        await apiFetch('/api/favorites', { method: 'POST', token: session.access_token, body: { service_id: doctor.id } });
      }
    } catch {
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        isFav ? next.add(doctor.id) : next.delete(doctor.id);
        return next;
      });
    }
  }

  const specialties = useMemo(() => {
    const set = new Set(doctors.map((d) => d.specialty).filter(Boolean));
    return ['All', ...set];
  }, [doctors]);

  const filtered = useMemo(() => {
    let list = doctors;
    if (specialty !== 'All') list = list.filter((d) => d.specialty === specialty);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((d) => d.name.toLowerCase().includes(q) || d.specialty?.toLowerCase().includes(q));
    }
    return list;
  }, [doctors, query, specialty]);

  const recentDoctors = useMemo(
    () => recentIds.map((id) => doctors.find((d) => d.id === id)).filter(Boolean),
    [recentIds, doctors]
  );

  const ListHeader = (
    <View style={{ paddingTop: insets.top }}>
      <Text style={styles.title}>Search</Text>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={17} color={colors.textFaint} />
        <TextInput
          style={styles.searchInput}
          placeholder="Find the right doctor for you"
          placeholderTextColor={colors.textFaint}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <FlatList
        data={specialties}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        contentContainerStyle={{ gap: 8, paddingVertical: 14 }}
        renderItem={({ item }) => {
          const active = specialty === item;
          const st = item !== 'All' ? getSpecialtyStyle(item) : null;
          return (
            <Pressable style={[styles.chip, active && styles.chipActive]} onPress={() => setSpecialty(item)}>
              {st && (
                <View style={[styles.chipIcon, { backgroundColor: active ? 'rgba(255,255,255,0.22)' : st.bg }]}>
                  <Ionicons name={st.icon} size={11} color={active ? colors.white : st.fg} />
                </View>
              )}
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
            </Pressable>
          );
        }}
      />

      {recentDoctors.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Your Doctors</Text>
          <FlatList
            data={recentDoctors}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: 18, paddingBottom: 8 }}
            renderItem={({ item }) => (
              <Pressable style={styles.recentItem} onPress={() => router.push(`/doctor/${item.id}`)}>
                <View style={styles.recentPhoto}>
                  {item.photo_url && <Image source={{ uri: item.photo_url }} style={{ width: '100%', height: '100%' }} />}
                </View>
                <Text style={styles.recentName} numberOfLines={1}>{item.name}</Text>
              </Pressable>
            )}
          />
        </>
      )}

      <Text style={styles.sectionTitle}>{query || specialty !== 'All' ? 'Results' : 'Recommended Doctors'}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 110, gap: 12 }}
        ListHeaderComponent={ListHeader}
        renderItem={({ item }) => (
          <DoctorCard doctor={item} favorited={favoriteIds.has(item.id)} onToggleFavorite={toggleFavorite} />
        )}
        ListEmptyComponent={
          <EmptyState variant="search" title="No doctors match" subtitle="Try a different name or specialty." />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 16, marginBottom: 14 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.surface, borderRadius: radii.pill, borderWidth: 1,
    borderColor: colors.border, paddingHorizontal: 16, height: 46,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 14, paddingLeft: 7, borderRadius: radii.pill, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipIcon: { width: 22, height: 22, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: 12.5, fontWeight: '600', color: colors.textMuted },
  chipTextActive: { color: colors.white },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 6, marginBottom: 10 },
  recentItem: { width: 68, alignItems: 'center', gap: 6 },
  recentPhoto: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.surface2, borderWidth: 2, borderColor: colors.borderSoft, overflow: 'hidden' },
  recentName: { fontSize: 11, fontWeight: '600', color: colors.text },
  muted: { color: colors.textMuted, padding: 16, textAlign: 'center' },
});
