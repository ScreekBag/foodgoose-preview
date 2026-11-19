import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, Button, SaduBand } from '../components/ui';
import { useLocation } from '../lib/location';
import { route } from '../lib/route';
import { font, space, useTheme } from '../lib/theme';
import { useTour } from '../lib/tour';

export default function Welcome() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const tour = useTour();
  const { request } = useLocation();

  const start = async () => {
    await request();
    tour.finishOnboarding();
    router.replace('/(tabs)');
  };
  const skip = () => {
    tour.finishOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + space.xxl, paddingBottom: insets.bottom + space.xl, paddingHorizontal: space.xl, gap: space.xl }}>
      <SaduBand height={12} />
      <View style={{ gap: space.md }}>
        <Text style={{ fontFamily: font.displayBold, fontSize: 44, color: c.accent }}>Кут</Text>
        <Text style={{ fontFamily: font.display, fontSize: 22, lineHeight: 30, color: c.text }}>Аудиогид, который идёт рядом</Text>
        <Body muted>
          «Кут» по-арабски — крепость. От этого слова, по одной из версий, и пошло название Кувейта. Гид пишет вам первым, когда вы подходите к месту, и рассказывает его историю.
        </Body>
      </View>
      <View style={{ gap: space.sm, padding: space.lg, backgroundColor: c.surface, borderRadius: 16, borderWidth: 1, borderColor: c.border }}>
        <Text style={{ fontFamily: font.uiBold, fontSize: 15, color: c.text }}>Первый маршрут</Text>
        <Body>{route.title} — {route.subtitle.toLowerCase()}</Body>
        <Body muted>
          {route.stops.length} остановок · {String(route.distanceKm).replace('.', ',')} км · {route.durationText} · язык: русский
        </Body>
      </View>
      <View style={{ gap: space.sm }}>
        <Text style={{ fontFamily: font.uiBold, fontSize: 15, color: c.text }}>Разрешите геолокацию</Text>
        <Body muted>Так гид узнает, что вы подошли к остановке, и сам предложит рассказ. Ваше местоположение никуда не отправляется.</Body>
      </View>
      <View style={{ flex: 1 }} />
      <View style={{ gap: space.sm }}>
        <Button label="Разрешить и начать" onPress={start} />
        <Button label="Позже" kind="secondary" onPress={skip} />
      </View>
    </ScrollView>
  );
}
