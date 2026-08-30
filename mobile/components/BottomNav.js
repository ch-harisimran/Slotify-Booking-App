import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MascotIcon from './MascotIcon';
import { colors, radii, shadow } from '../theme';

const ICONS = {
  index: 'home',
  favorites: 'heart',
  ai: 'sparkles',
  bookings: 'calendar',
  profile: 'person',
};

// Floating pill nav matching the source design: Home, Favorite, a raised
// accent-circle center button (AI assistant), Bookings, Profile.
export default function BottomNav({ state, navigation, insets }) {
  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]} pointerEvents="box-none">
      <View style={styles.bar}>
        {state.routes.filter((route) => ICONS[route.name]).map((route) => {
          const index = state.routes.indexOf(route);
          const focused = state.index === index;
          const isCenter = route.name === 'ai';
          const iconName = ICONS[route.name] || 'ellipse';

          function onPress() {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          }

          if (isCenter) {
            return (
              <Pressable key={route.key} onPress={onPress} style={styles.centerBtn}>
                <MascotIcon size={22} color={colors.white} />
              </Pressable>
            );
          }

          return (
            <Pressable key={route.key} onPress={onPress} style={styles.item} hitSlop={8}>
              <Ionicons
                name={focused ? iconName : `${iconName}-outline`}
                size={22}
                color={focused ? colors.accent : colors.textFaint}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '88%',
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingHorizontal: 22,
    paddingVertical: 12,
    ...shadow,
    shadowOpacity: 0.12,
    shadowRadius: 20,
  },
  item: { alignItems: 'center', justifyContent: 'center', width: 32, height: 32 },
  centerBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -26,
    shadowColor: colors.accent,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});
