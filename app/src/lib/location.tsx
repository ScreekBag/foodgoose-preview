import * as Location from 'expo-location';
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { distanceM, route } from './route';
import { useTour } from './tour';

type Pos = { lat: number; lng: number; accuracy: number | null };
type LocState = { permission: 'unknown' | 'granted' | 'denied'; pos: Pos | null; request: () => Promise<void> };
const LocContext = createContext<LocState>({ permission: 'unknown', pos: null, request: async () => {} });

/** Watches the phone's position while a walk is on and tells the tour when you reach the next stop. */
export function LocationProvider({ children }: { children: ReactNode }) {
  const tour = useTour();
  const [permission, setPermission] = useState<LocState['permission']>('unknown');
  const [pos, setPos] = useState<Pos | null>(null);
  const insideCount = useRef<Record<string, number>>({});
  const tourRef = useRef(tour);
  tourRef.current = tour;

  useEffect(() => {
    Location.getForegroundPermissionsAsync()
      .then((p) => setPermission(p.granted ? 'granted' : p.canAskAgain ? 'unknown' : 'denied'))
      .catch(() => {});
  }, []);

  const request = async () => {
    try {
      const p = await Location.requestForegroundPermissionsAsync();
      setPermission(p.granted ? 'granted' : 'denied');
    } catch {
      setPermission('denied');
    }
  };

  const active = tour.started && !tour.finished && permission === 'granted';
  useEffect(() => {
    if (!active) return;
    let sub: Location.LocationSubscription | null = null;
    let cancelled = false;
    Location.watchPositionAsync({ accuracy: Location.Accuracy.High, distanceInterval: 8, timeInterval: 4000 }, (loc) => {
      const p = { lat: loc.coords.latitude, lng: loc.coords.longitude, accuracy: loc.coords.accuracy };
      setPos(p);
      const t = tourRef.current;
      const stop = route.stops[t.target];
      if (!stop || !t.settings.autoOffer || t.arrived.includes(stop.id)) return;
      // Two readings in a row inside the zone, so one jumpy GPS fix does not trigger a story.
      const inside = distanceM(p, stop) <= stop.radius + Math.min(p.accuracy ?? 0, 30);
      insideCount.current[stop.id] = inside ? (insideCount.current[stop.id] ?? 0) + 1 : 0;
      if (insideCount.current[stop.id] >= 2) t.arrive(stop.id);
    })
      .then((s) => {
        if (cancelled) s.remove();
        else sub = s;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [active]);

  return <LocContext.Provider value={{ permission, pos, request }}>{children}</LocContext.Provider>;
}

export const useLocation = () => useContext(LocContext);
