import { useCallback, useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, Pressable, Image } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDoctorSearch } from '../../hooks/useDoctorSearch';
import { getRecentlyViewed } from '../../lib/recentlyViewed';
import DoctorCard from '../../components/DoctorCard';
import EmptyState from '../../components/EmptyState';
import { colors, radii } from '../../theme';
import { getSpecialtyStyle } from '../../lib/specialties';

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    doctors, query, setQuery, specialty, setSpecialty, favoriteIds, toggleFavorite, specialties, filtered,
  } = useDoctorSearch();
  const [recentIds, setRecentIds] = useState([]);

  useFocusEffect(
    useCallback(() => {
      getRecentlyViewed().then(setRecentIds);
    }, [])
  );

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
