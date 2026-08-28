import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow } from '../theme';

export default function ServiceCard({ service }) {
  const router = useRouter();
  return (
    <Pressable style={styles.card} onPress={() => router.push(`/service/${service.id}`)}>
      <View style={styles.topRow}>
        <View style={styles.avatar}>
          <Ionicons name="cut-outline" size={20} color={colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{service.name}</Text>
          <Text style={styles.price}>${Number(service.price).toFixed(2)}</Text>
        </View>
      </View>

      {service.description ? <Text style={styles.desc}>{service.description}</Text> : null}

      <View style={styles.bottomRow}>
        <View style={styles.durationPill}>
          <Ionicons name="time-outline" size={13} color={colors.textMuted} />
          <Text style={styles.durationText}>{service.duration_minutes} min</Text>
        </View>
        <View style={styles.bookBtn}>
          <Text style={styles.bookBtnText}>Book now</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: 16,
    marginBottom: 12,
    ...shadow,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 2 },
  price: { fontSize: 13, color: colors.textMuted },
  desc: { fontSize: 13, color: colors.textMuted, marginBottom: 12, lineHeight: 18 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  durationText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  bookBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radii.pill,
  },
  bookBtnText: { color: colors.white, fontWeight: '700', fontSize: 12.5 },
});
