import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow } from '../theme';
import { getSpecialtyStyle } from '../lib/specialties';

export default function DoctorCard({ doctor, favorited = false, onToggleFavorite, style }) {
  const router = useRouter();
  const { icon, bg, fg } = getSpecialtyStyle(doctor.specialty);

  return (
    <Pressable style={[styles.card, style]} onPress={() => router.push(`/doctor/${doctor.id}`)}>
      <View style={[styles.photoWrap, { backgroundColor: bg }]}>
        {doctor.photo_url ? (
          <Image source={{ uri: doctor.photo_url }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={styles.photo} />
        )}
        <View style={[styles.specialtyBadge, { backgroundColor: bg }]}>
          <Ionicons name={icon} size={13} color={fg} />
        </View>
        {onToggleFavorite && (
          <Pressable
            style={[styles.heart, favorited && styles.heartActive]}
            onPress={(e) => {
              e.stopPropagation?.();
              onToggleFavorite(doctor);
            }}
            hitSlop={8}
          >
            <Ionicons name={favorited ? 'heart' : 'heart-outline'} size={14} color={favorited ? colors.danger : colors.textFaint} />
          </Pressable>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={11} color={colors.warning} />
          <Text style={styles.ratingText}>{Number(doctor.rating || 4.5).toFixed(1)}</Text>
        </View>
        <Text style={styles.name} numberOfLines={1}>{doctor.name}</Text>
        <Text style={[styles.specialty, { color: fg }]} numberOfLines={1}>{doctor.specialty}</Text>
        <Text style={styles.price}>
          ${Number(doctor.price).toFixed(0)}<Text style={styles.priceUnit}>/visit</Text>
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    overflow: 'hidden',
    ...shadow,
  },
  photoWrap: { width: '100%', aspectRatio: 1 },
  photo: { width: '100%', height: '100%' },
  specialtyBadge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heart: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartActive: {},
  body: { padding: 10 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 3 },
  ratingText: { fontSize: 11, fontWeight: '700', color: colors.warning },
  name: { fontSize: 13.5, fontWeight: '700', color: colors.text },
  specialty: { fontSize: 11.5, fontWeight: '600', marginTop: 1, marginBottom: 6 },
  price: { fontSize: 13.5, fontWeight: '800', color: colors.accent },
  priceUnit: { fontWeight: '500', color: colors.textFaint, fontSize: 10.5 },
});
