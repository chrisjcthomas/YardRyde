const THROTTLE_MS = 5 * 60 * 1000;
const PROXIMITY_KM = 0.5;

const lastNotified = new Map();

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function requestPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function getPermissionState() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export function checkProximityAndNotify(vehicles, userLocation, watchedRoutes) {
  if (Notification.permission !== 'granted') return;
  if (!userLocation || watchedRoutes.size === 0) return;

  const now = Date.now();
  const [userLat, userLng] = userLocation;

  vehicles.forEach((bus) => {
    if (!watchedRoutes.has(bus.route)) return;

    const dist = haversineDistance(userLat, userLng, bus.lat, bus.lng);
    if (dist > PROXIMITY_KM) return;

    const lastTime = lastNotified.get(bus.route) || 0;
    if (now - lastTime < THROTTLE_MS) return;

    const etaMin = Math.max(1, Math.round((dist / 20) * 60));
    new Notification('Kingston Transit', {
      body: `Route ${bus.route} is ~${etaMin} min away from you`,
      icon: '🚌',
      tag: `route-${bus.route}`
    });
    lastNotified.set(bus.route, now);
  });
}
