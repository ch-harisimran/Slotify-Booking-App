import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../../theme';

// Landing spot for the redirect back from Google sign-in
// (slotify://auth/callback#access_token=...). The actual token exchange
// happens in AuthContext's Linking listener, which runs as soon as this URL
// is received — this screen just covers the brief gap until that finishes
// and AuthGate redirects into the app.
export default function AuthCallbackScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.accent} />
      <Text style={styles.text}>Signing you in…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: colors.bg },
  text: { color: colors.textMuted, fontSize: 13.5, fontWeight: '600' },
});
