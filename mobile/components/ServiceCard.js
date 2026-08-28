import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function ServiceCard({ service }) {
  const router = useRouter();
  return (
    <Pressable style={styles.card} onPress={() => router.push(`/service/${service.id}`)}>
      <Text style={styles.name}>{service.name}</Text>
      {service.description ? <Text style={styles.desc}>{service.description}</Text> : null}
      <Text style={styles.meta}>
        {service.duration_minutes} min · ${Number(service.price).toFixed(2)}
      </Text>
      <Text style={styles.cta}>Book →</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    marginBottom: 12,
  },
  name: { fontSize: 17, fontWeight: '700', marginBottom: 4, color: '#1a1d23' },
  desc: { fontSize: 13, color: '#6b7280', marginBottom: 8 },
  meta: { fontSize: 13, color: '#1a1d23', marginBottom: 10 },
  cta: { fontSize: 14, fontWeight: '600', color: '#4f46e5' },
});
