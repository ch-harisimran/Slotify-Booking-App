import { Tabs } from 'expo-router';
import { colors } from '../../theme';
import BottomNav from '../../components/BottomNav';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomNav {...props} />}
      screenOptions={{
        headerTitleAlign: 'center',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { fontWeight: '800', color: colors.text },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', headerShown: false }} />
      <Tabs.Screen name="favorites" options={{ title: 'Favorites', headerShown: false }} />
      <Tabs.Screen name="ai" options={{ title: 'AI Assistant', headerShown: false }} />
      <Tabs.Screen name="bookings" options={{ title: 'Bookings', headerShown: false }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', headerShown: false }} />
      <Tabs.Screen name="search" options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}
