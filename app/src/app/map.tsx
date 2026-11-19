import { useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, Text, View } from 'react-native';
import RouteMap from '../components/RouteMap';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body } from '../components/ui';
import { useLocation } from '../lib/location';
import { distanceM, formatDistance, route, stopById } from '../lib/route';
import { font, radius, space, useTheme } from '../lib/theme';
import { useTour } from '../lib/tour';

export default function MapScreen() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const tour = useTour();
  const { stop: stopId } = useLocalSearchParams<{ stop?: string }>();
  const target = stopById(stopId ?? '') ?? route.stops[tour.target];
  const { pos, permission } = useLocation();
  const dist = pos ? distanceM(pos, target) : null;
  const openAppleMaps = () =>
    Linking.openURL(`http://maps.apple.com/?daddr=${target.lat},${target.lng}&dirflg=w`).catch(() => {});

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <RouteMap center={{ lat: target.lat, lng: target.lng, delta: 0.008 }} targetId={target.id} heard={tour.heard} showUser={permission === 'granted'} />
      <View style={{ position: 'absolute', left: space.lg, right: space.lg, bottom: insets.bottom + space.lg, backgroundColor: c.surface, borderRadius: radius.lg, padding: space.lg, gap: space.sm, borderWidth: 1, borderColor: c.border }}>
        <Text style={{ fontFamily: font.display, fontSize: 18, color: c.text }}>{target.order}. {target.title}</Text>
        <Body muted>{dist != null ? `Примерно ${formatDistance(dist)} от вас` : 'Ваше местоположение пока неизвестно'}</Body>
        <Body style={{ fontSize: 14, lineHeight: 20 }}>{target.walk}</Body>
        <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
          <Pressable accessibilityRole="button" onPress={openAppleMaps} style={{ backgroundColor: c.accent, borderRadius: radius.pill, paddingVertical: 10, paddingHorizontal: 16 }}>
            <Text style={{ fontFamily: font.uiBold, color: c.onAccent }}>Маршрут в Картах</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => tour.act(`here:${target.id}`)} style={{ backgroundColor: c.accentSoft, borderRadius: radius.pill, paddingVertical: 10, paddingHorizontal: 16 }}>
            <Text style={{ fontFamily: font.uiBold, color: c.accent }}>Я на месте</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
