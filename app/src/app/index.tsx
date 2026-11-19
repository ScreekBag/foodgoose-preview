import { Redirect } from 'expo-router';
import { useTour } from '../lib/tour';

export default function Index() {
  const tour = useTour();
  return <Redirect href={tour.onboarded ? '/(tabs)' : '/welcome'} />;
}
