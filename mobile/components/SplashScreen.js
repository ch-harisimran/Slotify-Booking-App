import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

// Branded boot splash — shown while the app resolves the auth session, right
// after the native launch screen hands off to JS. Solid deep-teal ground
// (matches the dark end of the web hero gradient) with the pulse mark drawn
// directly on it (no boxed background this time, since the ground already
// is the mark's color) plus a small breathing dot to read as "alive/loading"
// without a spinner.
export default function SplashScreen() {
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(14)).current;
  const dotPulse = useRef(new Animated.Value(0.4)).current;
  const dots = useRef([0, 1, 2].map(() => new Animated.Value(0.3))).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(dotPulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(dotPulse, { toValue: 0.4, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    const loops = dots.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(v, { toValue: 1, duration: 340, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0.3, duration: 340, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.delay((2 - i) * 160),
        ])
      )
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [fade, rise, dotPulse, dots]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fade, transform: [{ translateY: rise }], alignItems: 'center' }}>
        <View style={styles.markWrap}>
          <Ionicons name="pulse" size={54} color="#F2FBF8" />
          <Animated.View style={[styles.dot, { opacity: dotPulse }]} />
        </View>
        <Text style={styles.word}>Slotify</Text>
        <Text style={styles.tagline}>Your health, one tap away</Text>
      </Animated.View>

      <View style={styles.loaderRow}>
        {dots.map((v, i) => (
          <Animated.View key={i} style={[styles.loaderDot, { opacity: v }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.accentHover,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markWrap: {
    width: 84,
    height: 84,
    borderRadius: 26,
    backgroundColor: 'rgba(242,251,248,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  dot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.coral,
  },
  word: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F2FBF8',
    letterSpacing: 0.2,
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(242,251,248,0.72)',
    marginTop: 6,
    fontWeight: '600',
  },
  loaderRow: {
    position: 'absolute',
    bottom: 64,
    flexDirection: 'row',
    gap: 8,
  },
  loaderDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#F2FBF8',
  },
});
