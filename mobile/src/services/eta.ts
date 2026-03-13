import { AVERAGE_BUS_SPEED } from '../constants';

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calculateETA(
  busLat: number,
  busLng: number,
  userLat: number,
  userLng: number,
): number {
  const distance = calculateDistance(busLat, busLng, userLat, userLng);
  return Math.max(1, Math.round((distance / AVERAGE_BUS_SPEED) * 60));
}
