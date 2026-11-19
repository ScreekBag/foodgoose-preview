import data from '../content/route.json';

export type Story = { title: string; text: string[] };
export type Faq = { q: string; a: string };
export type Stop = {
  order: number; id: string; title: string; subtitle: string;
  lat: number; lng: number; radius: number; optional: boolean;
  walk: string; practical: string[]; imagePage: string; imageCredit: string;
  script: string[]; more: Story[]; faq: Faq[];
};
export type Route = {
  id: string; city: string; title: string; subtitle: string; distanceKm: number;
  durationText: string; bestTime: string; intro: string[]; outro: string[];
  tips: string[]; safety: string; eat: { name: string; note: string; unsure: boolean }[]; stops: Stop[];
};

export const route = data as Route;
export const stopById = (id: string) => route.stops.find((s) => s.id === id);

/** Wikimedia Commons file page -> direct image URL at a given width. */
export function imageUrl(stop: Stop, width = 1200) {
  const name = decodeURIComponent(stop.imagePage.split('/wiki/File:')[1] ?? '');
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}?width=${width}`;
}

/** Metres between two points (haversine). */
export function distanceM(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(m: number) {
  if (m < 1000) return `${Math.round(m / 10) * 10} м`;
  return `${(m / 1000).toFixed(1).replace('.', ',')} км`;
}

/** Rough spoken length: ~140 Russian words per minute. */
export function minutes(paragraphs: string[]) {
  const words = paragraphs.join(' ').split(/\s+/).length;
  return Math.max(1, Math.round(words / 140));
}
