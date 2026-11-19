import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { narrator, useNarrator } from '../lib/narrator';
import { font, radius, space, useTheme } from '../lib/theme';

export function PlayPause({ size = 44 }: { size?: number }) {
  const c = useTheme();
  const n = useNarrator();
  const playing = n.status === 'playing';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={playing ? 'Пауза' : 'Слушать'}
      onPress={() => narrator.toggle()}
      style={({ pressed }) => ({ width: size, height: size, borderRadius: size / 2, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1 })}>
      <Text style={{ color: c.onAccent, fontSize: size * 0.38, marginLeft: playing ? 0 : size * 0.06 }}>{playing ? '❚❚' : '▶'}</Text>
    </Pressable>
  );
}

export function MiniPlayer() {
  const c = useTheme();
  const n = useNarrator();
  if (!n.trackId || n.status === 'idle') return null;
  const [kind, stopId, story] = n.trackId.split(':');
  const open = () => {
    if (kind === 'stop') router.push(`/stop/${stopId}`);
    if (kind === 'story') router.push({ pathname: '/stop/[id]', params: { id: stopId, story } });
  };
  const canOpen = kind === 'stop' || kind === 'story';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: c.surface, borderTopWidth: 1, borderColor: c.border, paddingHorizontal: space.lg, paddingVertical: space.sm }}>
      <PlayPause size={40} />
      <Pressable style={{ flex: 1 }} onPress={open} disabled={!canOpen} accessibilityRole="button" accessibilityLabel="Открыть текст рассказа">
        <Text numberOfLines={1} style={{ fontFamily: font.uiBold, color: c.text, fontSize: 15 }}>{n.title}</Text>
        <Text style={{ fontFamily: font.ui, color: c.muted, fontSize: 13 }}>
          {n.status === 'done' ? 'Дослушано' : `Часть ${n.index + 1} из ${n.paragraphs.length}`}
        </Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Остановить" onPress={() => narrator.stop()} hitSlop={12}>
        <Text style={{ color: c.muted, fontSize: 20 }}>✕</Text>
      </Pressable>
    </View>
  );
}
