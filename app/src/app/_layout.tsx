import { GolosText_400Regular, GolosText_500Medium, GolosText_600SemiBold } from '@expo-google-fonts/golos-text';
import { Literata_400Regular } from '@expo-google-fonts/literata';
import { Unbounded_600SemiBold, Unbounded_700Bold } from '@expo-google-fonts/unbounded';
import { setAudioModeAsync } from 'expo-audio';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { LocationProvider } from '../lib/location';
import { font, useTheme } from '../lib/theme';
import { TourProvider, useTour } from '../lib/tour';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Shell() {
  const c = useTheme();
  const scheme = useColorScheme();
  const tour = useTour();
  const [fontsLoaded] = useFonts({ GolosText_400Regular, GolosText_500Medium, GolosText_600SemiBold, Literata_400Regular, Unbounded_600SemiBold, Unbounded_700Bold });

  useEffect(() => {
    // Narration keeps playing with the silent switch on and, in the full app, with the screen locked.
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'duckOthers' }).catch(() => {});
  }, []);

  const ready = fontsLoaded && tour.ready;
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);
  if (!ready) return null;

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: c.bg },
          headerTintColor: c.accent,
          headerTitleStyle: { fontFamily: font.uiBold, color: c.text },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: c.bg },
          headerBackTitle: 'Назад',
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="map" options={{ title: 'Карта' }} />
        <Stack.Screen name="stop/[id]" options={{ title: '' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <TourProvider>
      <LocationProvider>
        <Shell />
      </LocationProvider>
    </TourProvider>
  );
}
