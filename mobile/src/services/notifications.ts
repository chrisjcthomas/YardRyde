import notifee, { AndroidImportance } from '@notifee/react-native';
import { calculateDistance } from './eta';

const THROTTLE_MS = 5 * 60 * 1000;
const PROXIMITY_KM = 0.5;
const lastNotified = new Map<string, number>();

export async function setupNotificationChannel(): Promise<void> {
  await notifee.createChannel({
    id: 'transit',
    name: 'Transit Alerts',
    importance: AndroidImportance.HIGH,
  });
}

interface VehicleData {
  route: string;
  lat: number;
  lng: number;
}

export function checkProximityAndNotify(
  vehicles: VehicleData[],
  userLat: number,
  userLng: number,
  watchedRoutes: Set<string>,
): void {
  if (watchedRoutes.size === 0) return;
  const now = Date.now();

  vehicles.forEach((bus) => {
    if (!watchedRoutes.has(bus.route)) return;

    const dist = calculateDistance(userLat, userLng, bus.lat, bus.lng);
    if (dist > PROXIMITY_KM) return;

    const lastTime = lastNotified.get(bus.route) || 0;
    if (now - lastTime < THROTTLE_MS) return;

    const etaMin = Math.max(1, Math.round((dist / 20) * 60));
    notifee.displayNotification({
      title: 'Kingston Transit',
      body: `Route ${bus.route} is ~${etaMin} min away from you`,
      android: { channelId: 'transit', smallIcon: 'ic_launcher' },
    });
    lastNotified.set(bus.route, now);
  });
}
