import { createElement } from 'react';
import { View } from 'react-native';
import { route } from '../lib/route';
import type { RouteMapProps } from './RouteMap';

/** Browser preview: OpenStreetMap embed (the phone app uses Apple Maps). */
export default function RouteMap({ center, targetId }: RouteMapProps) {
  const target = route.stops.find((s) => s.id === targetId);
  const d = center.delta / 2;
  const bbox = [center.lng - d, center.lat - d * 0.85, center.lng + d, center.lat + d * 0.85].join(',');
  const marker = target ? `&marker=${target.lat},${target.lng}` : '';
  return (
    <View style={{ flex: 1 }}>
      {createElement('iframe', {
        title: 'Карта маршрута',
        src: `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik${marker}`,
        style: { border: 0, width: '100%', height: '100%' },
        loading: 'lazy',
      })}
    </View>
  );
}
