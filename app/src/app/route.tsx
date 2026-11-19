import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Body, Card, Label } from '../components/ui';
import { minutes, route } from '../lib/route';
import { font, space, useTheme } from '../lib/theme';

const region = {
  latitude: 29.3746, longitude: 47.9683, latitudeDelta: 0.019, longitudeDelta: 0.02,
};

export default function RouteSheet() {
  const c = useTheme();
  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
      <View style={{ gap: 4 }}>
        <Text style={{ fontFamily: font.display, fontSize: 24, color: c.text }}>{route.title}</Text>
        <Body muted>
          {route.subtitle} · {String(route.distanceKm).replace('.', ',')} км · {route.durationText} · лучше всего {route.bestTime}
        </Body>
      </View>
      <View style={{ height: 240, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: c.border }}>
        <MapView style={{ flex: 1 }} initialRegion={region} showsPointsOfInterests={false}>
          <Polyline coordinates={route.stops.map((s) => ({ latitude: s.lat, longitude: s.lng }))} strokeColor={c.accent} strokeWidth={4} lineDashPattern={[8, 6]} />
          {route.stops.map((s) => (
            <Marker key={s.id} coordinate={{ latitude: s.lat, longitude: s.lng }} title={`${s.order}. ${s.title}`} pinColor={s.optional ? c.muted : c.sadu} />
          ))}
        </MapView>
      </View>
      <Text style={{ fontFamily: font.ui, fontSize: 12, color: c.muted, marginTop: -space.sm }}>Пунктир соединяет остановки по прямой. Точный путь гид подскажет по дороге.</Text>
      <Card>
        <Label>Важно знать</Label>
        {route.tips.map((t) => <Body key={t}>· {t}</Body>)}
        <Body muted style={{ fontSize: 14 }}>{route.safety}</Body>
      </Card>
      <View style={{ gap: space.sm }}>
        {route.stops.map((s) => (
          <Pressable key={s.id} accessibilityRole="button" onPress={() => router.push(`/stop/${s.id}`)}>
            <Card>
              <Label>{`Остановка ${s.order}${s.optional ? ' · по желанию' : ''}`}</Label>
              <Text style={{ fontFamily: font.display, fontSize: 17, color: c.text }}>{s.title}</Text>
              <Body muted>{s.subtitle} · рассказ {minutes(s.script)} мин</Body>
              <Body style={{ fontSize: 14, lineHeight: 20 }}>{s.walk}</Body>
            </Card>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
