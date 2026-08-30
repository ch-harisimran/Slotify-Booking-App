import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '../theme';

const ICONS = {
  bookings: 'calendar-outline',
  favorites: 'heart-outline',
  search: 'search-outline',
};

// Tinted-circle + icon empty state — mirrors the spirit of web's illustrated
// EmptyState without needing react-native-svg as a new dependency.
export default function EmptyState({ variant = 'bookings', title, subtitle, children }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.circle}>
        <Ionicons name={ICONS[variant] || ICONS.bookings} size={38} color={colors.accent} />
      </View>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children ? <View style={{ marginTop: 14 }}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 20 },
  circle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: colors.accentSoft,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 15.5, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 12.5, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
});
