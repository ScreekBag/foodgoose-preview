import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { narrator } from './narrator';
import { route } from './route';

type Settings = { rate: number; autoOffer: boolean };
type TourState = {
  onboarded: boolean;
  started: boolean;
  heard: string[]; // stop ids whose main story finished
  nearby: string | null; // stop the walker has just reached (GPS or "I'm here")
  arrived: string[];
  settings: Settings;
};

const KEY = 'kut.tour.v2';
const initial: TourState = { onboarded: false, started: false, heard: [], nearby: null, arrived: [], settings: { rate: 1, autoOffer: true } };

type Ctx = TourState & {
  ready: boolean;
  /** Index of the first stop not yet heard (the one to walk to). */
  target: number;
  finished: boolean;
  playIntro: () => void;
  playStop: (stopId: string) => void;
  playStory: (stopId: string, index: number) => void;
  playOutro: () => void;
  arrive: (stopId: string) => void;
  dismissNearby: () => void;
  finishOnboarding: () => void;
  updateSettings: (s: Partial<Settings>) => void;
  reset: () => void;
};
const TourContext = createContext<Ctx | null>(null);

export function TourProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TourState>(initial);
  const [ready, setReady] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => raw && setState({ ...initial, ...JSON.parse(raw) }))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
    narrator.setRate(state.settings.rate);
  }, [state, ready]);

  // A stop counts as heard when its main story plays to the end.
  useEffect(
    () =>
      narrator.onDone((trackId) => {
        if (!trackId.startsWith('stop:')) return;
        const id = trackId.slice(5);
        setState((s) => ({ ...s, heard: s.heard.includes(id) ? s.heard : [...s.heard, id], nearby: s.nearby === id ? null : s.nearby }));
      }),
    [],
  );

  const target = useMemo(() => {
    const i = route.stops.findIndex((s) => !state.heard.includes(s.id) && !s.optional);
    return i === -1 ? route.stops.length - 1 : i;
  }, [state.heard]);
  const finished = route.stops.filter((s) => !s.optional).every((s) => state.heard.includes(s.id));

  const playIntro = useCallback(() => {
    setState((s) => ({ ...s, started: true }));
    narrator.play('intro', 'Вступление', route.intro);
  }, []);
  const playStop = useCallback((stopId: string) => {
    const stop = route.stops.find((s) => s.id === stopId)!;
    setState((s) => ({ ...s, started: true, nearby: s.nearby === stopId ? null : s.nearby }));
    narrator.play(`stop:${stopId}`, stop.title, stop.script);
  }, []);
  const playStory = useCallback((stopId: string, index: number) => {
    const story = route.stops.find((s) => s.id === stopId)!.more[index];
    narrator.play(`story:${stopId}:${index}`, story.title, story.text);
  }, []);
  const playOutro = useCallback(() => narrator.play('outro', 'Финал', route.outro), []);

  const arrive = useCallback((stopId: string) => {
    const s = stateRef.current;
    if (s.arrived.includes(stopId) || s.heard.includes(stopId)) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setState((st) => ({ ...st, nearby: stopId, arrived: [...st.arrived, stopId] }));
  }, []);
  const dismissNearby = useCallback(() => setState((s) => ({ ...s, nearby: null })), []);
  const finishOnboarding = useCallback(() => setState((s) => ({ ...s, onboarded: true })), []);
  const updateSettings = useCallback((patch: Partial<Settings>) => setState((s) => ({ ...s, settings: { ...s.settings, ...patch } })), []);
  const reset = useCallback(() => {
    narrator.stop();
    setState((s) => ({ ...initial, onboarded: true, settings: s.settings }));
  }, []);

  const value = useMemo(
    () => ({ ...state, ready, target, finished, playIntro, playStop, playStory, playOutro, arrive, dismissNearby, finishOnboarding, updateSettings, reset }),
    [state, ready, target, finished, playIntro, playStop, playStory, playOutro, arrive, dismissNearby, finishOnboarding, updateSettings, reset],
  );
  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be inside TourProvider');
  return ctx;
}
