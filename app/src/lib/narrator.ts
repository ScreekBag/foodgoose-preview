import * as Speech from 'expo-speech';
import { useSyncExternalStore } from 'react';

/**
 * Plays a "track" (a list of paragraphs) with the phone's built-in Russian voice.
 * Interim voice for the first preview; the same interface will later play
 * professionally voiced MP3 files.
 */
export type NarratorState = {
  trackId: string | null;
  title: string;
  paragraphs: string[];
  index: number; // paragraph being spoken
  status: 'idle' | 'playing' | 'paused' | 'done';
};

let state: NarratorState = { trackId: null, title: '', paragraphs: [], index: 0, status: 'idle' };
let rate = 1;
let voiceId: string | undefined;
let voiceChecked = false;
let session = 0; // ignores callbacks from a stopped track
const listeners = new Set<() => void>();
const doneHandlers = new Set<(trackId: string) => void>();

function set(next: Partial<NarratorState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

async function pickVoice() {
  if (voiceChecked) return;
  voiceChecked = true;
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    const ru = voices.filter((v) => v.language?.toLowerCase().startsWith('ru'));
    const best = ru.find((v) => String(v.quality).toLowerCase().includes('enhanced')) ?? ru[0];
    voiceId = best?.identifier;
  } catch {
    voiceId = undefined;
  }
}

// Stress marks help a reader but some voices pause on them.
const forSpeech = (t: string) => t.replace(/́/g, '');

function speakFrom(index: number, my: number) {
  if (my !== session) return;
  if (index >= state.paragraphs.length) {
    const id = state.trackId;
    set({ status: 'done', index: state.paragraphs.length - 1 });
    if (id) doneHandlers.forEach((h) => h(id));
    return;
  }
  set({ index, status: 'playing' });
  Speech.speak(forSpeech(state.paragraphs[index]), {
    language: 'ru-RU',
    voice: voiceId,
    rate,
    onDone: () => speakFrom(index + 1, my),
    onError: () => set({ status: 'idle' }),
  });
}

export const narrator = {
  async play(trackId: string, title: string, paragraphs: string[], fromIndex = 0) {
    await pickVoice();
    session += 1;
    await Speech.stop();
    set({ trackId, title, paragraphs, index: fromIndex, status: 'playing' });
    speakFrom(fromIndex, session);
  },
  async pause() {
    if (state.status !== 'playing') return;
    await Speech.pause();
    set({ status: 'paused' });
  },
  async resume() {
    if (state.status === 'paused') {
      await Speech.resume();
      set({ status: 'playing' });
    } else if (state.status === 'done' && state.trackId) {
      narrator.play(state.trackId, state.title, state.paragraphs, 0);
    }
  },
  async toggle() {
    if (state.status === 'playing') return narrator.pause();
    return narrator.resume();
  },
  /** Jump by whole paragraphs (the built-in voice cannot seek by seconds). */
  async skip(delta: number) {
    if (!state.trackId) return;
    const target = Math.min(Math.max(state.index + delta, 0), state.paragraphs.length - 1);
    session += 1;
    await Speech.stop();
    speakFrom(target, session);
  },
  async stop() {
    session += 1;
    await Speech.stop();
    set({ trackId: null, title: '', paragraphs: [], index: 0, status: 'idle' });
  },
  setRate(r: number) {
    rate = r;
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
