import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '../../theme';

// Old booking route — the flow now lives on the Doctor Details screen's
// Availability tab. Redirect anyone with an old link there.
export default function LegacyServiceRedirect() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/doctor/${id}`);
  }, [id, router]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}
