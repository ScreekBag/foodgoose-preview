import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MiniPlayer } from '../../components/player';
import RouteMap from '../../components/RouteMap';
import { Body, Button, Card, Label, SaduBand } from '../../components/ui';
import { useLocation } from '../../lib/location';
import { useNarrator } from '../../lib/narrator';
import { distanceM, formatDistance, imageUrl, minutes, route, stopById } from '../../lib/route';
import { font, radius, space, useTheme } from '../../lib/theme';
import { useTour } from '../../lib/tour';

export default function Tour() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const tour = useTour();
  const n = useNarrator();
  const { pos } = useLocation();
  const [tipsOpen, setTipsOpen] = useState(false);
  const next = route.stops[tour.target];
  const nearby = tour.nearby ? stopById(tour.nearby) : null;

  const primary = () => {
    if (!tour.started) return tour.playIntro();
    router.push(`/stop/${next.id}`);
  };
  const primaryLabel = !tour.started ? 'Начать экскурсию' : tour.finished ? 'Послушать ещё раз' : `Продолжить: ${next.order}. ${next.title}`;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: space.xxl }}>
        <View>
          <Image source={{ uri: imageUrl(route.stops[5], 1200) }} style={{ height: 250 + insets.top, backgroundColor: c.accentSoft }} contentFit="cover" transition={200} accessibilityLabel="Рынок Мубаракия вечером" />
          <Text style={{ position: 'absolute', right: space.sm, bottom: space.xs, fontFamily: font.ui, fontSize: 11, color: '#FFFFFF', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 3 }}>Фото: {route.stops[5].imageCredit}</Text>
        </View>

        <View style={{ padding: space.lg, gap: space.lg }}>
          <SaduBand />
          <View style={{ gap: space.xs }}>
            <Label>Аудиоэкскурсия · {route.city}</Label>
            <Text style={{ fontFamily: font.displayBold, fontSize: 28, lineHeight: 34, color: c.text }}>{route.title}</Text>
            <Body muted>{route.subtitle}</Body>
          </View>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            {[[String(route.distanceKm).replace('.', ','), 'км пешком'], [String(route.stops.length), 'остановок'], ['2–2,5', 'часа']].map(([v, l]) => (
              <View key={l} style={{ flex: 1, backgroundColor: c.surface, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, paddingVertical: space.md, alignItems: 'center' }}>
                <Text style={{ fontFamily: font.display, fontSize: 20, color: c.accent }}>{v}</Text>
                <Text style={{ fontFamily: font.ui, fontSize: 13, color: c.muted }}>{l}</Text>
              </View>
            ))}
          </View>

          {nearby ? (
            <View style={{ backgroundColor: c.accent, borderRadius: radius.lg, padding: space.lg, gap: space.sm }}>
              <Text style={{ fontFamily: font.uiBold, color: c.onAccent, fontSize: 13, letterSpacing: 0.6, textTransform: 'uppercase' }}>Вы на месте</Text>
              <Text style={{ fontFamily: font.display, color: c.onAccent, fontSize: 19 }}>{nearby.order}. {nearby.title}</Text>
              <View style={{ flexDirection: 'row', gap: space.sm }}>
                <Pressable accessibilityRole="button" onPress={() => { tour.playStop(nearby.id); router.push(`/stop/${nearby.id}`); }} style={{ backgroundColor: c.onAccent, borderRadius: radius.pill, paddingVertical: 10, paddingHorizontal: 18 }}>
                  <Text style={{ fontFamily: font.uiBold, color: c.accent }}>▶ Слушать</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={tour.dismissNearby} style={{ paddingVertical: 10, paddingHorizontal: 12 }}>
                  <Text style={{ fontFamily: font.uiMedium, color: c.onAccent }}>Позже</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          <Button label={primaryLabel} onPress={primary} icon={!tour.started ? '▶' : undefined} />
          {tour.started && !tour.finished ? (
            <Body muted style={{ textAlign: 'center', marginTop: -space.sm, fontSize: 14 }}>
              Прослушано {tour.heard.length} из {route.stops.length}
              {pos ? ` · до следующей ${formatDistance(distanceM(pos, next))}` : ''}
            </Body>
          ) : null}

          <Pressable accessibilityRole="button" onPress={() => setTipsOpen((v) => !v)}>
            <Card style={{ borderLeftWidth: 3, borderLeftColor: c.sadu }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Label>Перед прогулкой</Label>
                <Text style={{ color: c.muted, fontSize: 16 }}>{tipsOpen ? '−' : '+'}</Text>
              </View>
              <Body style={{ fontSize: 15, lineHeight: 21 }}>Лучше всего: {route.bestTime}. Возьмите воду и закрытую одежду для мечети.</Body>
              {tipsOpen ? (
                <>
                  {route.tips.map((t) => <Body key={t} muted style={{ fontSize: 15, lineHeight: 21 }}>· {t}</Body>)}
                  <Body style={{ fontSize: 14, lineHeight: 20 }}>{route.safety}</Body>
                </>
              ) : null}
            </Card>
          </Pressable>

          <Pressable accessibilityRole="button" accessibilityLabel="Открыть карту" onPress={() => router.push('/map')} style={{ height: 190, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: c.border }}>
            <View pointerEvents="none" style={{ flex: 1 }}>
              <RouteMap center={{ lat: 29.3746, lng: 47.9683, delta: 0.02 }} targetId={tour.started ? next.id : undefined} heard={tour.heard} />
            </View>
            <View style={{ position: 'absolute', right: space.sm, bottom: space.sm, backgroundColor: c.surface, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: 12 }}>
              <Text style={{ fontFamily: font.uiMedium, color: c.accent, fontSize: 14 }}>Открыть карту ›</Text>
            </View>
          </Pressable>

          <Text style={{ fontFamily: font.display, fontSize: 20, color: c.text, marginTop: space.sm }}>Остановки</Text>
          <View>
            <IntroRow playing={n.trackId === 'intro' && n.status === 'playing'} onPress={tour.playIntro} />
            {route.stops.map((s, i) => {
              const heard = tour.heard.includes(s.id);
              const isNext = tour.started && i === tour.target && !tour.finished;
              const playing = n.trackId === `stop:${s.id}` && n.status === 'playing';
              return (
                <Pressable key={s.id} accessibilityRole="button" onPress={() => router.push(`/stop/${s.id}`)} style={({ pressed }) => ({ flexDirection: 'row', gap: space.md, opacity: pressed ? 0.7 : 1 })}>
                  <View style={{ alignItems: 'center', width: 32 }}>
                    <View style={{ width: 2, height: 10, backgroundColor: c.border }} />
                    <View style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: heard || isNext ? c.accent : c.borderInput, backgroundColor: heard ? c.accent : c.surface, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontFamily: font.uiBold, fontSize: 14, color: heard ? c.onAccent : isNext ? c.accent : c.muted }}>{heard ? '✓' : s.order}</Text>
                    </View>
                    {i < route.stops.length - 1 ? <View style={{ width: 2, flex: 1, backgroundColor: c.border }} /> : null}
                  </View>
                  <View style={{ flex: 1, flexDirection: 'row', gap: space.md, paddingVertical: space.md, alignItems: 'center' }}>
                    <Image source={{ uri: imageUrl(s, 300) }} style={{ width: 64, height: 64, borderRadius: radius.md, backgroundColor: c.accentSoft }} contentFit="cover" />
                    <View style={{ flex: 1, gap: 2 }}>
                      {isNext ? <Label color={c.accent}>Следующая</Label> : null}
                      <Text style={{ fontFamily: font.uiBold, fontSize: 16, color: c.text }}>{s.title}</Text>
                      <Text style={{ fontFamily: font.ui, fontSize: 14, color: c.muted }}>
                        {playing ? 'Сейчас играет' : `${s.subtitle} · ${minutes(s.script)} мин`}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Card>
            <Label>После прогулки</Label>
            <Text style={{ fontFamily: font.display, fontSize: 18, color: c.text }}>Где поесть у рынка</Text>
            {route.eat.map((e) => (
              <View key={e.name} style={{ gap: 2 }}>
                <Body style={{ fontFamily: font.uiMedium }}>{e.name}</Body>
                <Body muted style={{ fontSize: 14, lineHeight: 20 }}>
                  {e.note}
                  {e.unsure ? ' Проверьте, открыто ли сейчас.' : ''}
                </Body>
              </View>
            ))}
            <Pressable accessibilityRole="button" onPress={tour.playOutro}>
              <Text style={{ fontFamily: font.uiMedium, color: c.accent, marginTop: space.xs }}>▶ Послушать прощание гида</Text>
            </Pressable>
          </Card>
        </View>
      </ScrollView>
      <MiniPlayer />
    </View>
  );
}

function IntroRow({ playing, onPress }: { playing: boolean; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ flexDirection: 'row', gap: space.md, opacity: pressed ? 0.7 : 1 })}>
      <View style={{ alignItems: 'center', width: 32 }}>
        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center', marginTop: space.md }}>
          <Text style={{ color: c.accent, fontSize: 13, marginLeft: 2 }}>▶</Text>
        </View>
        <View style={{ width: 2, flex: 1, backgroundColor: c.border }} />
      </View>
      <View style={{ flex: 1, paddingVertical: space.md, gap: 2 }}>
        <Text style={{ fontFamily: font.uiBold, fontSize: 16, color: c.text }}>Вступление</Text>
        <Text style={{ fontFamily: font.ui, fontSize: 14, color: c.muted }}>{playing ? 'Сейчас играет' : `О маршруте · ${minutes(route.intro)} мин`}</Text>
      </View>
    </Pressable>
  );
}
