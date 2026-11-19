import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { PlayPause } from '../../components/player';
import { Body, Card, Label } from '../../components/ui';
import { narrator, useNarrator } from '../../lib/narrator';
import { imageUrl, minutes, route, stopById } from '../../lib/route';
import { font, radius, space, useTheme } from '../../lib/theme';
import { useTour } from '../../lib/tour';

export default function StopScreen() {
  const c = useTheme();
  const n = useNarrator();
  const tour = useTour();
  const { id, story } = useLocalSearchParams<{ id: string; story?: string }>();
  const s = stopById(id);
  if (!s) return <Body>Остановка не найдена</Body>;
  const storyIndex = story != null ? Number(story) : null;
  const isStory = storyIndex != null && !!s.more[storyIndex];
  const track = isStory
    ? { id: `story:${s.id}:${storyIndex}`, title: s.more[storyIndex!].title, text: s.more[storyIndex!].text }
    : { id: `stop:${s.id}`, title: s.title, text: s.script };
  const isCurrent = n.trackId === track.id;
  const start = () => (isStory ? tour.playStory(s.id, storyIndex!) : tour.playStop(s.id));
  const next = route.stops[s.order]; // order is 1-based, so this is the following stop

  return (
    <>
      <Stack.Screen options={{ title: isStory ? 'Расскажи ещё' : `Остановка ${s.order} из ${route.stops.length}` }} />
      <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ paddingBottom: space.xxl }}>
        <Image source={{ uri: imageUrl(s) }} style={{ height: 240, backgroundColor: c.accentSoft }} contentFit="cover" transition={200} accessibilityLabel={s.title} />
        <Text style={{ fontFamily: font.ui, fontSize: 12, color: c.muted, paddingHorizontal: space.lg, paddingTop: 6 }}>Фото: {s.imageCredit}, Викисклад</Text>
        <View style={{ padding: space.lg, gap: space.lg }}>
          <View style={{ gap: 4 }}>
            <Label>{isStory ? s.title : s.subtitle}</Label>
            <Text style={{ fontFamily: font.display, fontSize: 24, lineHeight: 31, color: c.text }}>{track.title}</Text>
            <Body muted>
              {minutes(track.text)} мин слушать{tour.heard.includes(s.id) && !isStory ? ' · прослушано' : ''}
            </Body>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg, backgroundColor: c.surface, borderRadius: radius.lg, padding: space.md, borderWidth: 1, borderColor: c.border }}>
            {isCurrent ? <PlayPause size={56} /> : (
              <Pressable accessibilityRole="button" accessibilityLabel="Слушать" onPress={start} style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: c.onAccent, fontSize: 22, marginLeft: 3 }}>▶</Text>
              </Pressable>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: font.uiBold, color: c.text, fontSize: 16 }}>
                {isCurrent ? (n.status === 'done' ? 'Дослушано' : `Часть ${n.index + 1} из ${n.paragraphs.length}`) : 'Нажмите, чтобы слушать'}
              </Text>
              {isCurrent ? (
                <View style={{ flexDirection: 'row', gap: space.lg, marginTop: 6 }}>
                  <Pressable accessibilityRole="button" onPress={() => narrator.skip(-1)} hitSlop={8}><Text style={{ fontFamily: font.uiMedium, color: c.accent }}>‹ Назад</Text></Pressable>
                  <Pressable accessibilityRole="button" onPress={() => narrator.skip(1)} hitSlop={8}><Text style={{ fontFamily: font.uiMedium, color: c.accent }}>Вперёд ›</Text></Pressable>
                </View>
              ) : null}
            </View>
          </View>

          <View style={{ gap: space.md }}>
            {track.text.map((p, i) => {
              const now = isCurrent && n.index === i && n.status !== 'done';
              return (
                <Pressable key={i} onPress={() => narrator.play(track.id, track.title, track.text, i)} accessibilityRole="button" accessibilityHint="Слушать с этого места">
                  <Text style={{ fontFamily: font.read, fontSize: 18, lineHeight: 29, color: now ? c.accent : c.text, opacity: isCurrent && !now ? 0.75 : 1 }}>{p}</Text>
                </Pressable>
              );
            })}
          </View>

          {!isStory && s.more.length ? (
            <View style={{ gap: space.sm }}>
              <Text style={{ fontFamily: font.display, fontSize: 18, color: c.text }}>Расскажи ещё</Text>
              {s.more.map((m, i) => (
                <Pressable key={m.title} accessibilityRole="button" onPress={() => { tour.playStory(s.id, i); router.push({ pathname: '/stop/[id]', params: { id: s.id, story: String(i) } }); }}>
                  <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: c.accent, marginLeft: 2 }}>▶</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: font.uiBold, fontSize: 16, color: c.text }}>{m.title}</Text>
                      <Text style={{ fontFamily: font.ui, fontSize: 14, color: c.muted }}>{minutes(m.text)} мин</Text>
                    </View>
                  </Card>
                </Pressable>
              ))}
            </View>
          ) : null}

          {!isStory ? (
            <>
              <Card>
                <Label color={c.accent}>Полезно знать</Label>
                {s.practical.map((p) => <Body key={p}>· {p}</Body>)}
              </Card>
              {s.faq.length ? (
                <Card>
                  <Label color={c.accent}>Частые вопросы</Label>
                  {s.faq.map((f) => (
                    <View key={f.q} style={{ gap: 2, marginBottom: space.xs }}>
                      <Text style={{ fontFamily: font.uiBold, fontSize: 15, color: c.text }}>{f.q}</Text>
                      <Body style={{ fontSize: 15, lineHeight: 22 }}>{f.a}</Body>
                    </View>
                  ))}
                </Card>
              ) : null}
              {next ? (
                <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/map', params: { stop: next.id } })}>
                  <Card style={{ backgroundColor: c.accentSoft, borderWidth: 0 }}>
                    <Label color={c.accent}>Дальше{next.optional ? ' · по желанию' : ''}</Label>
                    <Text style={{ fontFamily: font.display, fontSize: 18, color: c.text }}>{next.order}. {next.title}</Text>
                    <Body style={{ fontSize: 15, lineHeight: 21 }}>{next.walk}</Body>
                    <Text style={{ fontFamily: font.uiMedium, color: c.accent }}>Показать путь ›</Text>
                  </Card>
                </Pressable>
              ) : (
                <Pressable accessibilityRole="button" onPress={() => { tour.playOutro(); router.replace('/(tabs)'); }}>
                  <Card style={{ backgroundColor: c.accentSoft, borderWidth: 0 }}>
                    <Label color={c.accent}>Маршрут пройден</Label>
                    <Text style={{ fontFamily: font.uiMedium, color: c.accent }}>▶ Прощание гида и где поесть ›</Text>
                  </Card>
                </Pressable>
              )}
            </>
          ) : null}
        </View>
      </ScrollView>
    </>
  );
}
