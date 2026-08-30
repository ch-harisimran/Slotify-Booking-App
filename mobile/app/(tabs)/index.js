import { useRouter } from 'expo-router';
import { View, Text, TextInput, FlatList, ActivityIndicator, StyleSheet, RefreshControl, Pressable, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDoctorSearch } from '../../hooks/useDoctorSearch';
import DoctorCard from '../../components/DoctorCard';
import NotificationBell from '../../components/NotificationBell';
import { colors, radii, shadow } from '../../theme';
import { getSpecialtyStyle } from '../../lib/specialties';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    session, profile, query, setQuery, specialty, setSpecialty, loading, refreshing, refresh,
    error, favoriteIds, toggleFavorite, specialties, popular, nextAppointment,
  } = useDoctorSearch({ withNextAppointment: true });

  const firstName = profile?.name?.split(' ')[0];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const ListHeader = (
    <View>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.topRow}>
          <Pressable style={styles.topRowLeft} onPress={() => router.push('/(tabs)/profile')}>
            <View style={styles.avatarSm}>
              <Text style={styles.avatarSmText}>{(firstName || 'S').slice(0, 1).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.hello}>Hello</Text>
              <Text style={styles.greeting}>{firstName || 'there'}</Text>
            </View>
          </Pressable>
          <NotificationBell />
        </View>
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
      </View>

      {session && nextAppointment && (
        <Pressable style={styles.apptCard} onPress={() => router.push('/(tabs)/bookings')}>
          <View style={styles.apptPhoto}>
            {nextAppointment.services?.photo_url ? (
              <Image source={{ uri: nextAppointment.services.photo_url }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.apptLabel}>MY APPOINTMENT</Text>
            <Text style={styles.apptName}>
              {nextAppointment.services?.name} · {nextAppointment.services?.specialty}
            </Text>
            <Text style={styles.apptTime}>
              {new Date(nextAppointment.start_time).toLocaleString([], {
                weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
              })}
            </Text>
          </View>
        </Pressable>
      )}

      <Text style={styles.sectionTitle}>Doctor Specialty</Text>
      <FlatList
        data={specialties}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
        renderItem={({ item }) => {
          const active = specialty === item;
          const style = item !== 'All' ? getSpecialtyStyle(item) : null;
          return (
            <Pressable
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setSpecialty(item)}
            >
              {style && (
                <View style={[styles.chipIcon, { backgroundColor: active ? 'rgba(255,255,255,0.22)' : style.bg }]}>
                  <Ionicons name={style.icon} size={11} color={active ? colors.white : style.fg} />
                </View>
              )}
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
            </Pressable>
          );
        }}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.sectionHeadRow}>
        <Text style={styles.sectionTitle}>Popular Doctors</Text>
        <Pressable onPress={() => router.push('/(tabs)/search')}>
          <Text style={styles.seeAll}>See all</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={popular}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 110, gap: 12 }}
        ListHeaderComponent={ListHeader}
        renderItem={({ item }) => (
          <DoctorCard doctor={item} favorited={favoriteIds.has(item.id)} onToggleFavorite={toggleFavorite} />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
        ListEmptyComponent={<Text style={styles.muted}>No doctors match your search.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  header: { paddingTop: 16, paddingBottom: 8 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  topRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarSm: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  avatarSmText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  hello: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  greeting: { fontSize: 17, fontWeight: '800', color: colors.text, marginTop: 1 },
  subtitle: { fontSize: 13.5, color: colors.textMuted, marginBottom: 16 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.surface, borderRadius: radii.pill, borderWidth: 1,
    borderColor: colors.border, paddingHorizontal: 16, height: 46,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  apptCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1,
    borderColor: colors.borderSoft, padding: 14, marginBottom: 20, ...shadow,
  },
  apptPhoto: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  apptLabel: { fontSize: 10, fontWeight: '700', color: colors.textFaint, letterSpacing: 0.4 },
  apptName: { fontSize: 13.5, fontWeight: '700', color: colors.text, marginTop: 2 },
  apptTime: { fontSize: 12.5, color: colors.textMuted, marginTop: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 10, marginTop: 4 },
  sectionHeadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 24 },
  seeAll: { fontSize: 12.5, fontWeight: '600', color: colors.accent },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 7, paddingHorizontal: 14, paddingLeft: 7, borderRadius: radii.pill,
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipIcon: { width: 22, height: 22, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: 12.5, fontWeight: '600', color: colors.textMuted },
  chipTextActive: { color: colors.white },
  error: { color: colors.danger, marginTop: 12 },
  muted: { color: colors.textMuted, padding: 16, textAlign: 'center' },
});
