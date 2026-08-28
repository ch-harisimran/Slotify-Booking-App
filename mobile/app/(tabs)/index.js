import { useCallback, useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import ServiceCard from '../../components/ServiceCard';
import { colors, radii } from '../../theme';

export default function ServicesScreen() {
  const { profile } = useAuth();
  const [services, setServices] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await apiFetch('/api/services');
      setServices(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return services;
    const q = query.trim().toLowerCase();
    return services.filter(
      (s) => s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)
    );
  }, [services, query]);

  const firstName = profile?.name?.split(' ')[0];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>{firstName ? `Hey, ${firstName}` : 'Book an appointment'}</Text>
        <Text style={styles.subtitle}>Pick a service and find a time that works for you.</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={17} color={colors.textFaint} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search services…"
            placeholderTextColor={colors.textFaint}
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      {error ? (
        <Text style={styles.error}>
          Couldn't load services: {error}. Check EXPO_PUBLIC_API_URL in .env and that the backend is running.
        </Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingTop: 4 }}
          renderItem={({ item }) => <ServiceCard service={item} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
            />
          }
          ListEmptyComponent={
            <Text style={styles.muted}>
              {services.length === 0 ? 'No services available yet.' : 'No services match your search.'}
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  greeting: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 13.5, color: colors.textMuted, marginBottom: 16 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    height: 46,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  error: { color: colors.danger, padding: 16 },
  muted: { color: colors.textMuted, padding: 16, textAlign: 'center' },
});
