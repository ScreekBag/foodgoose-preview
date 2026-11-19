import { router } from 'expo-router';
import { Pressable, ScrollView, Text } from 'react-native';
import { Body, Card, Label } from '../../components/ui';
import { route } from '../../lib/route';
import { font, space, useTheme } from '../../lib/theme';
import { useTour } from '../../lib/tour';

export default function Routes() {
  const c = useTheme();
  const tour = useTour();
  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
      <Pressable accessibilityRole="button" onPress={() => router.push('/route')}>
        <Card>
          <Label color={c.accent}>{route.city}</Label>
          <Text style={{ fontFamily: font.display, fontSize: 20, color: c.text }}>{route.title}</Text>
          <Body muted>
            {route.subtitle} · {route.stops.length} остановок · {String(route.distanceKm).replace('.', ',')} км · {route.durationText}
          </Body>
          <Body>{tour.finished ? 'Пройден' : tour.started ? `В процессе: прослушано ${tour.heard.length} из ${route.stops.length}` : 'Не начат'}</Body>
        </Card>
      </Pressable>
      <Card style={{ backgroundColor: c.accentSoft, borderWidth: 0 }}>
        <Label color={c.accent}>Скоро</Label>
        <Body>Набережная: башни Кувейта и Шарк. А потом — маршруты, которые гид соберёт по вашей просьбе.</Body>
      </Card>
    </ScrollView>
  );
}
