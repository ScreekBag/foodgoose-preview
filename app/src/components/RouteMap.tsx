import MapView, { Marker, Polyline } from 'react-native-maps';
import { route } from '../lib/route';
import { useTheme } from '../lib/theme';

export type RouteMapProps = {
  center: { lat: number; lng: number; delta: number };
  targetId?: string;
  heard?: string[];
  showUser?: boolean;
};

export default function RouteMap({ center, targetId, heard = [], showUser }: RouteMapProps) {
  const c = useTheme();
  return (
    <MapView
      style={{ flex: 1 }}
      initialRegion={{ latitude: center.lat, longitude: center.lng, latitudeDelta: center.delta, longitudeDelta: center.delta }}
      showsUserLocation={showUser}
      showsPointsOfInterests={false}>
      <Polyline coordinates={route.stops.map((s) => ({ latitude: s.lat, longitude: s.lng }))} strokeColor={c.accent} strokeWidth={3} lineDashPattern={[8, 6]} />
      {route.stops.map((s) => (
        <Marker
          key={s.id}
          coordinate={{ latitude: s.lat, longitude: s.lng }}
          title={`${s.order}. ${s.title}`}
          pinColor={s.id === targetId ? c.sadu : heard.includes(s.id) ? c.success : s.optional ? c.muted : c.accent}
        />
      ))}
    </MapView>
  );
}
