import { useEffect, useRef } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageView } from '../../components/cards';
import { InputBar, MiniPlayer } from '../../components/player';
import { Chips } from '../../components/ui';
import { route } from '../../lib/route';
import { font, space, useTheme } from '../../lib/theme';
import { useTour } from '../../lib/tour';

export default function Thread() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const tour = useTour();
  const list = useRef<FlatList>(null);
  const lastWalkId = [...tour.messages].reverse().find((m) => m.kind === 'walk')?.id;
  const last = tour.messages.at(-1);

  useEffect(() => {
    const t = setTimeout(() => list.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(t);
  }, [tour.messages.length]);

  const status = !tour.started
    ? `${route.title} · не начато`
    : tour.finished
      ? 'Маршрут пройден'
      : `Остановка ${tour.target + 1} из ${route.stops.length} · прослушано ${tour.heard.length}`;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ paddingTop: insets.top + space.sm, paddingHorizontal: space.lg, paddingBottom: space.sm, borderBottomWidth: 1, borderColor: c.border, backgroundColor: c.bg }}>
        <Text style={{ fontFamily: font.displayBold, fontSize: 22, color: c.accent }}>Кут</Text>
        <Text style={{ fontFamily: font.ui, fontSize: 13, color: c.muted }}>{status}</Text>
      </View>
      <FlatList
        ref={list}
        data={tour.messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: space.xxl + space.lg }}
        renderItem={({ item }) => <MessageView m={item} isLastWalk={item.id === lastWalkId} />}
        ListFooterComponent={last?.chips?.length ? <View style={{ marginTop: space.xs }}><Chips chips={last.chips} onPress={tour.act} /></View> : undefined}
        onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}
        keyboardDismissMode="interactive"
      />
      <MiniPlayer />
      <InputBar onSend={tour.ask} />
    </KeyboardAvoidingView>
  );
}
