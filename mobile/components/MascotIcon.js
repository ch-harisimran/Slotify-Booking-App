import { View } from 'react-native';

// Slotify's AI assistant mark for mobile — a small friendly face built from
// plain Views (no react-native-svg dependency), mirroring web's IconMascot.
// Drop-in replacement for `<Ionicons name="sparkles" ... />`: same
// {size, color} interface.
export default function MascotIcon({ size = 20, color = '#fff' }) {
  const s = size;
  const border = Math.max(1.4, s * 0.09);
  const eye = Math.max(2.2, s * 0.11);
  const mouthW = s * 0.42;
  const mouthH = mouthW * 0.55;
  const dot = Math.max(2.4, s * 0.14);

  return (
    <View style={{ width: s, height: s }}>
      <View
        style={{
          width: s,
          height: s,
          borderRadius: s * 0.32,
          borderWidth: border,
          borderColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={{ flexDirection: 'row', gap: s * 0.16, marginBottom: s * 0.1 }}>
          <View style={{ width: eye, height: eye, borderRadius: eye / 2, backgroundColor: color }} />
          <View style={{ width: eye, height: eye, borderRadius: eye / 2, backgroundColor: color }} />
        </View>
        <View
          style={{
            width: mouthW,
            height: mouthH,
            borderBottomLeftRadius: mouthH,
            borderBottomRightRadius: mouthH,
            borderWidth: Math.max(1.2, s * 0.07),
            borderTopWidth: 0,
            borderColor: color,
          }}
        />
      </View>
      <View
        style={{
          position: 'absolute',
          top: -dot * 0.3,
          right: -dot * 0.3,
          width: dot,
          height: dot,
          borderRadius: dot / 2,
          backgroundColor: color,
        }}
      />
    </View>
  );
}
