import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

// Slotify mark: a pulse line in a rounded teal square with a coral
// "appointment dot" — reads as heartbeat (health) + booking at once.
// Mirrors web's Logo.js, built from Ionicons instead of raw SVG paths
// since react-native-svg isn't a project dependency.
export default function Logo({ size = 32, radius }) {
  const r = radius ?? Math.round(size * 0.3);
  return (
    <View style={[styles.box, { width: size, height: size, borderRadius: r }]}>
      <Ionicons name="pulse" size={Math.round(size * 0.6)} color={colors.white} />
      <View style={[styles.dot, { width: size * 0.24, height: size * 0.24, borderRadius: size * 0.12 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  dot: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: colors.coral,
    borderWidth: 1.5,
    borderColor: colors.bg,
  },
});
