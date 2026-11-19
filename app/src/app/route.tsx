import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import RouteMap from '../components/RouteMap';
import { Body, Card, Label } from '../components/ui';
import { minutes, route } from '../lib/route';
import { font, space, useTheme } from '../lib/theme';

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
        <RouteMap center={{ lat: 29.3746, lng: 47.9683, delta: 0.02 }} />
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
