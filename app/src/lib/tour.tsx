import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { narrator } from './narrator';
import { route, stopById } from './route';

export type Chip = { label: string; action: string };
export type Message =
  | { id: string; kind: 'text'; role: 'guide' | 'user'; text: string; chips?: Chip[] }
  | { id: string; kind: 'brief'; chips?: Chip[] }
  | { id: string; kind: 'route'; chips?: Chip[] }
  | { id: string; kind: 'stop'; stopId: string; chips?: Chip[] }
  | { id: string; kind: 'walk'; stopId: string; chips?: Chip[] }
  | { id: string; kind: 'story'; stopId: string; index: number; chips?: Chip[] }
  | { id: string; kind: 'finish'; chips?: Chip[] };

type Settings = { rate: number; autoOffer: boolean };
type TourState = {
  onboarded: boolean;
  started: boolean;
  finished: boolean;
  target: number; // index of the stop we are walking to
  heard: string[];
  arrived: string[];
  messages: Message[];
  settings: Settings;
};

const KEY = 'kut.tour.v1';
const initial: TourState = {
  onboarded: false, started: false, finished: false, target: 0,
  heard: [], arrived: [], messages: [], settings: { rate: 1, autoOffer: true },
};

let counter = 0;
const id = () => `${Date.now().toString(36)}-${(counter++).toString(36)}`;
const stopAt = (i: number) => route.stops[i];

type Ctx = TourState & {
  ready: boolean;
  act: (action: string) => void;
  ask: (question: string) => void;
  arrive: (stopId: string) => void;
  finishOnboarding: () => void;
  updateSettings: (s: Partial<Settings>) => void;
  reset: () => void;
};
const TourContext = createContext<Ctx | null>(null);

function guide(text: string, chips?: Chip[]): Message {
  return { id: id(), kind: 'text', role: 'guide', text, chips };
}

function stopChips(stopId: string): Chip[] {
  return [
    { label: 'Слушать', action: `play:${stopId}` },
    { label: 'Позже', action: `later:${stopId}` },
  ];
}

function afterStopChips(stopId: string, isLast: boolean): Chip[] {
  const s = stopById(stopId)!;
  const chips: Chip[] = [];
  if (s.more[0]) chips.push({ label: 'Расскажи ещё', action: `more:${stopId}:0` });
  if (s.faq.length) chips.push({ label: 'Вопросы', action: `faq:${stopId}` });
  chips.push(isLast ? { label: 'Завершить', action: 'finish' } : { label: 'Дальше', action: 'next' });
  return chips;
}

/** Very small offline "ask the guide": matches the question against prepared answers. */
function findAnswer(question: string, preferStop?: string) {
  const words = (t: string) =>
    t.toLowerCase().replace(/ё/g, 'е').replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter((w) => w.length > 3);
  const q = new Set(words(question).map((w) => w.slice(0, 5)));
  let best: { score: number; text: string } = { score: 0, text: '' };
  for (const s of route.stops) {
    for (const f of s.faq) {
      let score = words(f.q + ' ' + s.title).reduce((n, w) => n + (q.has(w.slice(0, 5)) ? 1 : 0), 0);
      if (s.id === preferStop) score += 0.5;
      if (score > best.score) best = { score, text: f.a };
    }
  }
  return best.score >= 1.5 ? best.text : null;
}

export function TourProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TourState>(initial);
  const [ready, setReady] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setState({ ...initial, ...JSON.parse(raw) });
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
    narrator.setRate(state.settings.rate);
  }, [state, ready]);

  const push = useCallback((update: (s: TourState) => Partial<TourState>, ...msgs: Message[]) => {
    setState((s) => {
      const patch = update(s);
      const base = (patch.messages ?? s.messages).map((m) => (m.chips ? { ...m, chips: undefined } : m));
      return { ...s, ...patch, messages: [...base, ...msgs] as Message[] };
    });
  }, []);

  // When a stop's story ends, offer what comes next.
  useEffect(() => {
    return narrator.onDone((trackId) => {
      const s = stateRef.current;
      if (trackId === 'intro') {
        const first = stopAt(0);
        push(() => ({}), guide(`Идём к первой остановке — ${first.title}. Как только подойдёте, я сам начну рассказ.`), {
          id: id(), kind: 'walk', stopId: first.id,
        });
        return;
      }
      if (trackId.startsWith('stop:')) {
        const stopId = trackId.slice(5);
        const idx = route.stops.findIndex((x) => x.id === stopId);
        const isLast = idx === route.stops.length - 1;
        if (s.messages.at(-1)?.chips?.some((c) => c.action === 'next' || c.action === 'finish')) return;
        push(
          (st) => ({ heard: st.heard.includes(stopId) ? st.heard : [...st.heard, stopId] }),
          guide(
            isLast ? 'Вот и последняя история. Можем подвести итоги.' : 'Если хотите, расскажу ещё одну историю. Или идём дальше.',
            afterStopChips(stopId, isLast),
          ),
        );
      }
    });
  }, [push]);

  const offerStop = useCallback(
    (stopId: string, viaGps: boolean) => {
      const s = stopById(stopId)!;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      push(
        (st) => ({ arrived: st.arrived.includes(stopId) ? st.arrived : [...st.arrived, stopId] }),
        guide(viaGps ? `Вы у цели: ${s.title}. Рассказать?` : `Отлично, вы у остановки «${s.title}». Рассказать?`),
        { id: id(), kind: 'stop', stopId, chips: stopChips(stopId) },
      );
    },
    [push],
  );

  const arrive = useCallback(
    (stopId: string) => {
      if (stateRef.current.arrived.includes(stopId)) return;
      offerStop(stopId, true);
    },
    [offerStop],
  );

  const act = useCallback(
    (action: string) => {
      const [verb, a, b] = action.split(':');
      const s = stateRef.current;
      switch (verb) {
        case 'start': {
          push(() => ({ started: true, target: 0 }), { id: id(), kind: 'text', role: 'user', text: 'Начинаем!' },
            guide('Отлично! Сначала короткое вступление, а потом пойдём к первой остановке.'));
          narrator.play('intro', 'Вступление', route.intro);
          break;
        }
        case 'skipintro': {
          narrator.stop();
          const first = stopAt(0);
          push(() => ({ started: true, target: 0 }), guide(`Идём к первой остановке — ${first.title}.`), { id: id(), kind: 'walk', stopId: first.id });
          break;
        }
        case 'here': {
          if (!s.arrived.includes(a)) offerStop(a, false);
          break;
        }
        case 'play': {
          const stop = stopById(a)!;
          push(() => ({}), { id: id(), kind: 'text', role: 'user', text: 'Слушаю' });
          narrator.play(`stop:${a}`, stop.title, stop.script);
          break;
        }
        case 'later': {
          push(() => ({}), guide('Хорошо. Рассказ сохранён в карточке, нажмите на неё, когда будете готовы.', afterStopChips(a, a === route.stops.at(-1)!.id)));
          break;
        }
        case 'more': {
          const stop = stopById(a)!;
          const i = Number(b);
          const story = stop.more[i];
          const nextChips: Chip[] = [];
          if (stop.more[i + 1]) nextChips.push({ label: 'Ещё одну', action: `more:${a}:${i + 1}` });
          nextChips.push(...afterStopChips(a, a === route.stops.at(-1)!.id).filter((c) => !c.action.startsWith('more')));
          push(() => ({}), { id: id(), kind: 'text', role: 'user', text: 'Расскажи ещё' }, { id: id(), kind: 'story', stopId: a, index: i, chips: nextChips });
          narrator.play(`story:${a}:${i}`, story.title, story.text);
          break;
        }
        case 'faq': {
          const stop = stopById(a)!;
          push(() => ({}), guide('Вот что чаще всего спрашивают здесь:', [
            ...stop.faq.map((f, i) => ({ label: f.q, action: `q:${a}:${i}` })),
            { label: 'Дальше', action: a === route.stops.at(-1)!.id ? 'finish' : 'next' },
          ]));
          break;
        }
        case 'q': {
          const f = stopById(a)!.faq[Number(b)];
          push(() => ({}), { id: id(), kind: 'text', role: 'user', text: f.q }, guide(f.a, afterStopChips(a, a === route.stops.at(-1)!.id)));
          break;
        }
        case 'next': {
          narrator.stop();
          const nextIndex = Math.min(s.target + 1, route.stops.length - 1);
          const next = stopAt(nextIndex);
          const text = next.optional
            ? `Последняя остановка — по желанию: ${next.title}. ${next.walk} Или можно закончить прогулку здесь.`
            : `Следующая остановка — ${next.title}. ${next.walk}`;
          push(() => ({ target: nextIndex }), guide(text, next.optional ? [{ label: 'Закончить здесь', action: 'finish' }] : undefined), {
            id: id(), kind: 'walk', stopId: next.id,
          });
          break;
        }
        case 'finish': {
          push(() => ({ finished: true }), { id: id(), kind: 'finish', chips: [{ label: 'Пройти заново', action: 'restart' }] });
          narrator.play('outro', 'Финал', route.outro);
          break;
        }
        case 'restart': {
          narrator.stop();
          push(() => ({ started: false, finished: false, target: 0, heard: [], arrived: [], messages: [] }), ...welcomeMessages());
          break;
        }
      }
    },
    [push, offerStop],
  );

  const ask = useCallback(
    (question: string) => {
      const s = stateRef.current;
      const current = route.stops[s.target]?.id;
      const answer = findAnswer(question, current);
      push(() => ({}), { id: id(), kind: 'text', role: 'user', text: question },
        guide(answer ?? 'Пока я отвечаю только на вопросы, которые знаю заранее. Скоро смогу отвечать на любые — для этого понадобится интернет. Попробуйте кнопку «Вопросы» у остановки.'));
    },
    [push],
  );

  const finishOnboarding = useCallback(() => {
    setState((s) => ({ ...s, onboarded: true, messages: s.messages.length ? s.messages : welcomeMessages() }));
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  const reset = useCallback(() => {
    narrator.stop();
    setState(initial);
  }, []);

  const value = useMemo(
    () => ({ ...state, ready, act, ask, arrive, finishOnboarding, updateSettings, reset }),
    [state, ready, act, ask, arrive, finishOnboarding, updateSettings, reset],
  );
  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

function welcomeMessages(): Message[] {
  return [
    guide('Салам! Я ваш гид по старому Кувейт-Сити. Поведу пешком от залива до старого рынка и расскажу истории у каждой остановки.'),
    { id: id(), kind: 'brief' },
    { id: id(), kind: 'route', chips: [{ label: 'Начать прогулку', action: 'start' }, { label: 'Без вступления', action: 'skipintro' }] },
  ];
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be inside TourProvider');
  return ctx;
}
