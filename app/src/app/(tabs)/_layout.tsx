import { Tabs } from 'expo-router/js-tabs';
import { ColorValue, Text } from 'react-native';
import { font, useTheme } from '../../lib/theme';

const glyph = (g: string) => ({ color }: { color: ColorValue }) => <Text style={{ color, fontSize: 20 }}>{g}</Text>;

export default function TabsLayout() {
  const c = useTheme();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.muted,
        tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.border },
        tabBarLabelStyle: { fontFamily: font.uiMedium, fontSize: 11 },
        headerStyle: { backgroundColor: c.bg },
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: font.uiBold, color: c.text },
        sceneStyle: { backgroundColor: c.bg },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Экскурсия', headerShown: false, tabBarIcon: glyph('◉') }} />
      <Tabs.Screen name="settings" options={{ title: 'Настройки', tabBarIcon: glyph('⚙') }} />
    </Tabs>
  );
}
