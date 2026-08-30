import { useCallback, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Pressable } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';
import DoctorCard from '../../components/DoctorCard';
import EmptyState from '../../components/EmptyState';
import { colors, radii } from '../../theme';

export default function FavoritesScreen() {
  const { session, loading: authLoading } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const data = await apiFetch('/api/favorites/me', { token: session.access_token });
      setRows(data);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      if (!authLoading) load();
    }, [authLoading, load])
  );

  async function toggleFavorite(doctor) {
    setRows((prev) => prev.filter((r) => r.service_id !== doctor.id));
    try {
      await apiFetch(`/api/favorites/${doctor.id}`, { method: 'DELETE', token: session.access_token });
    } catch {
      load();
    }
  }

  if (authLoading || (loading && session)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.center}>
        <View style={styles.avatar}>
          <Ionicons name="heart-outline" size={22} color={colors.white} />
        </View>
        <Text style={styles.muted}>Sign in to see your favorites.</Text>
        <Pressable style={styles.signInBtn} onPress={() => router.push('/login')}>
          <Text style={styles.signInBtnText}>Sign in</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 110, gap: 12 }}
        ListHeaderComponent={
          <View style={{ paddingTop: insets.top }}>
            <Text style={styles.title}>Favorite</Text>
            <Text style={styles.subtitle}>Doctors you've saved for quick access.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <DoctorCard doctor={{ ...item.services, id: item.service_id }} favorited onToggleFavorite={toggleFavorite} />
        )}
        ListEmptyComponent={
          <EmptyState
            variant="favorites"
            title="No favorites yet"
            subtitle="Tap the heart on any doctor to save them here."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: colors.bg },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 16, marginBottom: 2 },
  subtitle: { fontSize: 13, color: colors.textMuted, marginBottom: 14 },
  avatar: { width: 52, height: 52, borderRadius: 18, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  muted: { color: colors.textMuted, textAlign: 'center', marginBottom: 12, padding: 16 },
  signInBtn: { backgroundColor: colors.accent, borderRadius: radii.pill, paddingVertical: 12, paddingHorizontal: 24 },
  signInBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
});
