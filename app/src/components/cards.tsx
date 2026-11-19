import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useLocation } from '../lib/location';
import { useNarrator } from '../lib/narrator';
import { distanceM, formatDistance, imageUrl, minutes, route, stopById } from '../lib/route';
import { font, radius, space, useTheme } from '../lib/theme';
import { Message, useTour } from '../lib/tour';
import { Body, Card, Label } from './ui';

/** Time-aware notes for today, Kuwait time (UTC+3, no daylight saving). */
function todayNotes() {
  const now = new Date();
  const kw = new Date(now.getTime() + (now.getTimezoneOffset() + 180) * 60000);
  const day = kw.getDay(); // 5 = Friday, 6 = Saturday
  const h = kw.getHours();
  const month = kw.getMonth();
  const notes: string[] = [];
  if (day === 5 || day === 6) notes.push('Сегодня выходной в Кувейте: в Большую мечеть туристов не пускают, Дом Саду в пятницу, скорее всего, закрыт.');
  else notes.push('Сегодня будний день — хороший день для прогулки. В мечеть лучше записаться заранее.');
  if (day === 5 && h < 16) notes.push('В пятницу рынок оживает только после 16:00.');
  if (month >= 4 && month <= 8 && h >= 10 && h < 17) notes.push('Сейчас самое жаркое время. Лучше начать после пяти вечера.');
  if (h >= 13 && h < 16) notes.push('С 13 до 16 многие музеи закрыты на перерыв.');
  return notes;
}

export function BriefCard() {
  const c = useTheme();
  return (
    <Card>
      <Label>Перед прогулкой</Label>
      {todayNotes().map((n) => (
        <Body key={n}>{n}</Body>
      ))}
      {route.tips.map((t) => (
        <Body key={t} muted>
          · {t}
        </Body>
      ))}
      <View style={{ borderLeftWidth: 3, borderLeftColor: c.sadu, paddingLeft: space.md, marginTop: space.xs }}>
        <Body style={{ fontSize: 14, lineHeight: 20 }}>{route.safety}</Body>
      </View>
    </Card>
  );
}

export function RouteCard() {
  const c = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push('/route')}>
      <Card>
        <Label color={c.accent}>Маршрут</Label>
        <Text style={{ fontFamily: font.display, fontSize: 20, color: c.text }}>{route.title}</Text>
        <Body muted>
          {route.subtitle} · {String(route.distanceKm).replace('.', ',')} км · {route.durationText}
        </Body>
        <View style={{ gap: 6, marginTop: space.xs }}>
          {route.stops.map((s) => (
            <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
              <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: font.uiBold, fontSize: 11, color: c.accent }}>{s.order}</Text>
              </View>
              <Body style={{ flex: 1 }}>
                {s.title}
                {s.optional ? <Text style={{ color: c.muted }}> · по желанию</Text> : null}
              </Body>
            </View>
          ))}
        </View>
        <Text style={{ fontFamily: font.uiMedium, color: c.accent, marginTop: space.xs }}>Подробнее о маршруте ›</Text>
      </Card>
    </Pressable>
  );
}

export function StopCard({ stopId }: { stopId: string }) {
  const c = useTheme();
  const tour = useTour();
  const n = useNarrator();
  const s = stopById(stopId)!;
  const playing = n.trackId === `stop:${stopId}` && n.status === 'playing';
  const heard = tour.heard.includes(stopId);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Открыть рассказ: ${s.title}`} onPress={() => router.push(`/stop/${stopId}`)}>
      <View style={{ backgroundColor: c.surface, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: playing ? c.accent : c.border }}>
        <Image source={{ uri: imageUrl(s, 900) }} style={{ height: 150, backgroundColor: c.accentSoft }} contentFit="cover" transition={200} />
        <View style={{ padding: space.lg, gap: 4 }}>
          <Label>{`Остановка ${s.order}`}</Label>
          <Text style={{ fontFamily: font.display, fontSize: 18, color: c.text }}>{s.title}</Text>
          <Body muted>
            {s.subtitle} · {minutes(s.script)} мин{heard ? ' · прослушано' : ''}
          </Body>
          {playing ? <Text style={{ fontFamily: font.uiMedium, color: c.accent, marginTop: 4 }}>Сейчас играет · открыть текст ›</Text> : null}
          <Text style={{ fontFamily: font.ui, fontSize: 12, color: c.muted, marginTop: 4 }}>Фото: {s.imageCredit}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export function WalkCard({ stopId, active }: { stopId: string; active: boolean }) {
  const c = useTheme();
  const tour = useTour();
  const { pos, permission, request } = useLocation();
  const s = stopById(stopId)!;
  const arrived = tour.arrived.includes(stopId);
  const dist = pos ? distanceM(pos, s) : null;
  return (
    <Card style={{ borderColor: active && !arrived ? c.accent : c.border, borderWidth: active && !arrived ? 1 : undefined }}>
      <Label color={c.accent}>{arrived ? 'Вы на месте' : 'Идём к остановке'}</Label>
      <Text style={{ fontFamily: font.display, fontSize: 18, color: c.text }}>
        {s.order}. {s.title}
      </Text>
      {!arrived && dist != null ? <Body>Осталось примерно {formatDistance(dist)}</Body> : null}
      {!arrived && permission !== 'granted' ? (
        <Body muted>Включите геолокацию, и я сам начну рассказ, когда вы подойдёте. Или нажмите «Я на месте».</Body>
      ) : null}
      {active && !arrived ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.xs }}>
          <SmallButton label="Карта" onPress={() => router.push({ pathname: '/map', params: { stop: stopId } })} />
          <SmallButton label="Я на месте" onPress={() => tour.act(`here:${stopId}`)} />
          {permission !== 'granted' ? <SmallButton label="Включить геолокацию" onPress={request} /> : null}
        </View>
      ) : null}
    </Card>
  );
}

function SmallButton({ label, onPress }: { label: string; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ backgroundColor: c.accentSoft, borderRadius: radius.pill, paddingVertical: 9, paddingHorizontal: 14, opacity: pressed ? 0.75 : 1 })}>
      <Text style={{ fontFamily: font.uiMedium, color: c.accent, fontSize: 15 }}>{label}</Text>
    </Pressable>
  );
}

export function StoryCard({ stopId, index }: { stopId: string; index: number }) {
  const c = useTheme();
  const s = stopById(stopId)!;
  const story = s.more[index];
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/stop/[id]', params: { id: stopId, story: String(index) } })}>
      <Card>
        <Label color={c.accent}>Расскажи ещё · {s.title}</Label>
        <Text style={{ fontFamily: font.display, fontSize: 17, color: c.text }}>{story.title}</Text>
        <Text numberOfLines={4} style={{ fontFamily: font.read, fontSize: 16, lineHeight: 24, color: c.text }}>
          {story.text.join(' ')}
        </Text>
        <Text style={{ fontFamily: font.uiMedium, color: c.accent }}>Читать полностью ›</Text>
      </Card>
    </Pressable>
  );
}

export function FinishCard() {
  const c = useTheme();
  const tour = useTour();
  return (
    <Card>
      <Label>Маршрут пройден</Label>
      <Text style={{ fontFamily: font.display, fontSize: 20, color: c.text }}>Спасибо за прогулку!</Text>
      <Body muted>
        Прослушано остановок: {tour.heard.length} из {route.stops.length} · около {String(route.distanceKm).replace('.', ',')} км
      </Body>
      <Text style={{ fontFamily: font.uiBold, fontSize: 15, color: c.text, marginTop: space.sm }}>Где поесть рядом</Text>
      {route.eat.map((e) => (
        <View key={e.name} style={{ gap: 2 }}>
          <Body style={{ fontFamily: font.uiMedium }}>{e.name}</Body>
          <Body muted style={{ fontSize: 14, lineHeight: 20 }}>
            {e.note}
            {e.unsure ? ' Перед походом проверьте, открыто ли сейчас.' : ''}
          </Body>
        </View>
      ))}
    </Card>
  );
}

export function MessageView({ m, isLastWalk }: { m: Message; isLastWalk: boolean }) {
  switch (m.kind) {
    case 'text':
      return <Bubble role={m.role} text={m.text} />;
    case 'brief':
      return <BriefCard />;
    case 'route':
      return <RouteCard />;
    case 'stop':
      return <StopCard stopId={m.stopId} />;
    case 'walk':
      return <WalkCard stopId={m.stopId} active={isLastWalk} />;
    case 'story':
      return <StoryCard stopId={m.stopId} index={m.index} />;
    case 'finish':
      return <FinishCard />;
  }
}

function Bubble({ role, text }: { role: 'guide' | 'user'; text: string }) {
  const c = useTheme();
  const mine = role === 'user';
  return (
    <View style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '86%' }}>
      <View
        style={{
          backgroundColor: mine ? c.userBubble : c.surface, borderRadius: 18,
          borderBottomRightRadius: mine ? 6 : 18, borderBottomLeftRadius: mine ? 18 : 6,
          paddingVertical: 10, paddingHorizontal: 14, borderWidth: mine ? 0 : 1, borderColor: c.border,
        }}>
        <Text style={{ fontFamily: font.ui, fontSize: 16, lineHeight: 23, color: mine ? c.onUser : c.text }}>{text}</Text>
      </View>
    </View>
  );
}
