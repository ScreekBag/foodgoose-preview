import { useColorScheme } from 'react-native';

// Values mirror replica/design/tokens.json and tokens.dark.json (contrast-checked, 0 AA failures).
const light = {
  bg: '#F2F4F3', surface: '#FFFFFF', border: '#D5DDDC', borderInput: '#7A8B8E',
  text: '#13262B', muted: '#56686C', accent: '#0C5263', onAccent: '#FFFFFF',
  accentSoft: '#E1EEF0', sadu: '#A8322D', success: '#1F6B45', userBubble: '#0C5263', onUser: '#FFFFFF',
};
const dark: typeof light = {
  bg: '#0E1719', surface: '#152225', border: '#29393C', borderInput: '#6E8285',
  text: '#E4ECEC', muted: '#9AAEB1', accent: '#7CC3D2', onAccent: '#0B2328',
  accentSoft: '#17323A', sadu: '#E2766C', success: '#6CC69A', userBubble: '#7CC3D2', onUser: '#0B2328',
};
export type Colors = typeof light;

export const font = {
  display: 'Unbounded_600SemiBold',
  displayBold: 'Unbounded_700Bold',
  ui: 'GolosText_400Regular',
  uiMedium: 'GolosText_500Medium',
  uiBold: 'GolosText_600SemiBold',
  read: 'Literata_400Regular',
};
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 6, md: 10, lg: 16, pill: 999 };

export function useTheme() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? dark : light;
}
