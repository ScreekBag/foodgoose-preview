import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { font, radius, space, useTheme } from '../lib/theme';

/** Sadu-weave band: the app's one ornament, from Bedouin weaving (stop 3). */
export function SaduBand({ height = 10 }: { height?: number }) {
  const c = useTheme();
  const cells = Array.from({ length: 28 });
  return (
    <View style={{ flexDirection: 'row', height, overflow: 'hidden', borderRadius: 2 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {cells.map((_, i) => (
        <View key={i} style={{ width: height, height, transform: [{ rotate: '45deg' }, { scale: 0.72 }], backgroundColor: i % 3 === 2 ? c.accent : c.sadu, marginRight: height * 0.15 }} />
      ))}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const c = useTheme();
  return <View style={[{ backgroundColor: c.surface, borderColor: c.border, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.lg, padding: space.lg, gap: space.sm }, style]}>{children}</View>;
}

export function Label({ children, color }: { children: ReactNode; color?: string }) {
  const c = useTheme();
  return <Text style={{ fontFamily: font.uiBold, fontSize: 12, letterSpacing: 0.8, textTransform: 'uppercase', color: color ?? c.sadu }}>{children}</Text>;
}

export function Body({ children, muted, style }: { children: ReactNode; muted?: boolean; style?: object }) {
  const c = useTheme();
  return <Text style={[{ fontFamily: font.ui, fontSize: 16, lineHeight: 23, color: muted ? c.muted : c.text }, style]}>{children}</Text>;
}

export function Button({ label, onPress, kind = 'primary', icon }: { label: string; onPress: () => void; kind?: 'primary' | 'secondary'; icon?: string }) {
  const c = useTheme();
  const primary = kind === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: primary ? c.accent : c.accentSoft, borderRadius: radius.pill, paddingVertical: 14, paddingHorizontal: 22,
        alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, opacity: pressed ? 0.8 : 1,
      })}>
      {icon ? <Text style={{ color: primary ? c.onAccent : c.accent, fontSize: 15 }}>{icon}</Text> : null}
      <Text style={{ fontFamily: font.uiBold, fontSize: 16, color: primary ? c.onAccent : c.accent }}>{label}</Text>
    </Pressable>
  );
}
