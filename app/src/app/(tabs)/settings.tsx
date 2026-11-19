import { useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { Body, Card, Label } from '../../components/ui';
import { font, radius, space, useTheme } from '../../lib/theme';
import { useTour } from '../../lib/tour';

const speeds = [0.8, 0.9, 1, 1.1, 1.25];

export default function Settings() {
  const c = useTheme();
  const tour = useTour();
  const [confirm, setConfirm] = useState(false);
  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
      <Card>
        <Label color={c.accent}>Скорость рассказа</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {speeds.map((s) => {
            const on = tour.settings.rate === s;
            return (
              <Pressable key={s} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => tour.updateSettings({ rate: s })}
                style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1.5, borderColor: c.accent, backgroundColor: on ? c.accent : 'transparent' }}>
                <Text style={{ fontFamily: font.uiMedium, color: on ? c.onAccent : c.accent }}>{String(s).replace('.', ',')}×</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontFamily: font.uiBold, fontSize: 16, color: c.text }}>Подсказывать у остановки</Text>
            <Body muted style={{ fontSize: 14 }}>Когда вы подойдёте к месту, приложение предложит рассказ</Body>
          </View>
          <Switch value={tour.settings.autoOffer} onValueChange={(v) => tour.updateSettings({ autoOffer: v })} trackColor={{ true: c.accent }} />
        </View>
      </Card>
      <Card>
        <Label color={c.accent}>Голос</Label>
        <Body>Если профессиональная озвучка ещё не загружена, рассказ читает встроенный голос iPhone.</Body>
        <Body muted style={{ fontSize: 14 }}>Совет: в Настройках iPhone → Универсальный доступ → Устная речь можно скачать улучшенный русский голос, он звучит естественнее.</Body>
      </Card>
      <Card>
        <Label>Начать заново</Label>
        <Body muted>Сотрёт отметки о прослушанных остановках.</Body>
        {confirm ? (
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Pressable accessibilityRole="button" onPress={() => { tour.reset(); setConfirm(false); }} style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: radius.pill, backgroundColor: c.sadu }}>
              <Text style={{ fontFamily: font.uiBold, color: '#FFFFFF' }}>Да, стереть</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setConfirm(false)} style={{ paddingVertical: 10, paddingHorizontal: 16 }}>
              <Text style={{ fontFamily: font.uiMedium, color: c.accent }}>Отмена</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable accessibilityRole="button" onPress={() => setConfirm(true)}>
            <Text style={{ fontFamily: font.uiMedium, color: c.sadu }}>Сбросить прогресс</Text>
          </Pressable>
        )}
      </Card>
      <Body muted style={{ fontSize: 13, textAlign: 'center' }}>Кут · версия 0.1 · тексты проверены 19.11.2026</Body>
    </ScrollView>
  );
}
