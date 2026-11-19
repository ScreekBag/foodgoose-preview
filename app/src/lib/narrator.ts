import { AudioPlayer, AudioStatus, createAudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';
import { useSyncExternalStore } from 'react';
import { audio } from '../content/audio';

/**
 * Plays a "track" (a list of paragraphs). Uses the recorded voice-over when it
 * exists (one MP3 per paragraph) and the phone's built-in Russian voice otherwise.
 */
export type NarratorState = {
  trackId: string | null;
  title: string;
  paragraphs: string[];
  index: number;
  status: 'idle' | 'playing' | 'paused' | 'done';
  recorded: boolean;
};

let state: NarratorState = { trackId: null, title: '', paragraphs: [], index: 0, status: 'idle', recorded: false };
let rate = 1;
let voiceId: string | undefined;
let voiceChecked = false;
let session = 0;
let player: AudioPlayer | null = null;
const listeners = new Set<() => void>();
const doneHandlers = new Set<(trackId: string) => void>();

function set(next: Partial<NarratorState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function finishTrack() {
  const id = state.trackId;
  set({ status: 'done', index: Math.max(0, state.paragraphs.length - 1) });
  if (id) doneHandlers.forEach((h) => h(id));
}

// ---- recorded voice ----
function getPlayer() {
  if (!player) {
    player = createAudioPlayer(null, { updateInterval: 500 });
    player.addListener('playbackStatusUpdate', (s: AudioStatus) => {
      if (!s.didJustFinish || !state.recorded) return;
      const my = session;
      playRecorded(state.index + 1, my);
    });
  }
  return player;
}

function playRecorded(index: number, my: number) {
  if (my !== session) return;
  const files = state.trackId ? audio[state.trackId] : undefined;
  if (!files || index >= files.length) return finishTrack();
  const p = getPlayer();
  set({ index, status: 'playing' });
  p.replace(files[index]);
  p.setPlaybackRate(rate);
  p.play();
}

// ---- built-in voice fallback ----
async function pickVoice() {
  if (voiceChecked) return;
  voiceChecked = true;
  try {
    const ru = (await Speech.getAvailableVoicesAsync()).filter((v) => v.language?.toLowerCase().startsWith('ru'));
    voiceId = (ru.find((v) => String(v.quality).toLowerCase().includes('enhanced')) ?? ru[0])?.identifier;
  } catch {
    voiceId = undefined;
  }
}
const forSpeech = (t: string) => t.replace(/́/g, '');
function speakFrom(index: number, my: number) {
  if (my !== session) return;
  if (index >= state.paragraphs.length) return finishTrack();
  set({ index, status: 'playing' });
  Speech.speak(forSpeech(state.paragraphs[index]), {
    language: 'ru-RU', voice: voiceId, rate,
    onDone: () => speakFrom(index + 1, my),
    onError: () => set({ status: 'idle' }),
  });
}

async function halt() {
  session += 1;
  await Speech.stop();
  player?.pause();
}

function startAt(index: number) {
  if (state.recorded) {
    player?.setActiveForLockScreen(true, { title: state.title, artist: 'Кут · Старый Кувейт-Сити' });
    playRecorded(index, session);
  } else {
    speakFrom(index, session);
  }
}

export const narrator = {
  async play(trackId: string, title: string, paragraphs: string[], fromIndex = 0) {
    await halt();
    const recorded = (audio[trackId]?.length ?? 0) === paragraphs.length && paragraphs.length > 0;
    if (!recorded) await pickVoice();
    set({ trackId, title, paragraphs, index: fromIndex, status: 'playing', recorded });
    startAt(fromIndex);
  },
  async pause() {
    if (state.status !== 'playing') return;
    if (state.recorded) player?.pause();
    else await Speech.pause();
    set({ status: 'paused' });
  },
  async resume() {
    if (state.status === 'paused') {
      if (state.recorded) player?.play();
      else await Speech.resume();
      set({ status: 'playing' });
    } else if (state.status === 'done' && state.trackId) {
      narrator.play(state.trackId, state.title, state.paragraphs, 0);
    }
  },
  toggle() {
    return state.status === 'playing' ? narrator.pause() : narrator.resume();
  },
  async skip(delta: number) {
    if (!state.trackId) return;
    const target = Math.min(Math.max(state.index + delta, 0), state.paragraphs.length - 1);
    await halt();
    startAt(target);
  },
  async stop() {
    await halt();
    player?.setActiveForLockScreen(false);
    set({ trackId: null, title: '', paragraphs: [], index: 0, status: 'idle', recorded: false });
  },
  setRate(r: number) {
    rate = r;
    if (state.recorded) player?.setPlaybackRate(r);
  },
  onDone(handler: (trackId: string) => void) {
    doneHandlers.add(handler);
    return () => {
      doneHandlers.delete(handler);
    };
  },
  get state() {
    return state;
  },
};

export function useNarrator() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}
