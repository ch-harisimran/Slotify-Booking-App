import { View, Text, Image, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { initials } from '../lib/format';

/**
 * The user's profile picture — or their initials on the accent-colored
 * circle when no picture is set. Used wherever the app shows "the user's
 * avatar": the profile screen and the home screen's top-left icon, so a
 * photo set in one place shows up in the other automatically (both just
 * read `profile.avatar_url`/`profile.name` from AuthContext).
 */
export default function Avatar({ url, name, email, size = 44, fontSize }) {
  const dim = { width: size, height: size, borderRadius: size * 0.34 };
  const textSize = fontSize || Math.round(size * 0.36);

  if (url) {
    return <Image source={{ uri: url }} style={[styles.base, dim]} />;
  }

  return (
    <View style={[styles.base, styles.fallback, dim]}>
      <Text style={[styles.fallbackText, { fontSize: textSize }]}>{initials(name, email)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden', backgroundColor: colors.surface2 },
  fallback: { backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  fallbackText: { color: colors.white, fontWeight: '800' },
});
