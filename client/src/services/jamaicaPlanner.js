import { AVERAGE_BUS_SPEED, ROUTES } from '../constants';

const WALKING_SPEED_KMH = 5;
const TRANSFER_PENALTY_MINUTES = 6;
const FALLBACK_WAIT_MINUTES = 18;

export function distanceKm(lat1, lng1, lat2, lng2) {
  const earthRadiusKm = 6371;
  const deltaLat = (lat2 - lat1) * Math.PI / 180;
  const deltaLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getAllStops() {
  const stopMap = new Map();

  ROUTES.forEach((route) => {
    route.stops.forEach((stop) => {
      const existing = stopMap.get(stop.name);
      if (!existing) {
        stopMap.set(stop.name, { ...stop, routes: [route.number] });
        return;
      }

      if (!existing.routes.includes(route.number)) {
        existing.routes.push(route.number);
      }
    });
  });

  return [...stopMap.values()].sort((left, right) => left.name.localeCompare(right.name));
}

export function getNearestStop(userLocation, stops = getAllStops()) {
  return [...stops]
    .map((stop) => ({
      ...stop,
      distanceKm: distanceKm(userLocation.lat, userLocation.lng, stop.lat, stop.lng),
    }))
    .sort((left, right) => left.distanceKm - right.distanceKm)[0] ?? null;
}

export function formatMinutes(minutes) {
  if (minutes === null || minutes === undefined) {
    return 'Timing up';
  }

  if (minutes <= 0) {
    return 'Due';
  }

  return `${minutes} min`;
}

export function formatDistance(distance) {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }

  return `${distance.toFixed(1)} km`;
}

export function getNextBusesForStop(stopName, vehicles, limit = 3) {
  return ROUTES
    .filter((route) => route.stops.some((stop) => stop.name === stopName))
    .flatMap((route) =>
      vehicles
        .filter((vehicle) => vehicle.route === route.number)
        .map((vehicle) => {
          const etaMinutes = estimateVehicleEtaToStop(vehicle, route, stopName);
          return {
            id: `${vehicle.id}-${stopName}`,
            routeNumber: route.number,
            routeName: route.name,
            destination: getHeadsign(route, vehicle.direction),
            etaMinutes,
            accessible: Boolean(vehicle.accessible),
          };
        })
    )
    .sort((left, right) => left.etaMinutes - right.etaMinutes)
    .slice(0, limit);
}

export function buildJourneyRecommendation(userLocation, destinationPlace, vehicles) {
  if (!destinationPlace) {
    return null;
  }

  const stops = getAllStops();
  const candidateStops = [...stops]
    .map((stop) => ({
      ...stop,
      walkingDistanceKm: distanceKm(userLocation.lat, userLocation.lng, stop.lat, stop.lng),
    }))
    .sort((left, right) => left.walkingDistanceKm - right.walkingDistanceKm)
    .slice(0, 6);

  const options = candidateStops.flatMap((originStop) =>
    destinationPlace.stopNames.flatMap((targetStopName) =>
      getDirectOptions(originStop.name, targetStopName).map((option) =>
        scoreJourneyOption(option, originStop, userLocation, vehicles)
      )
    )
  );

  const viableOptions = options.filter(Boolean).sort((left, right) => left.score - right.score);
  return viableOptions[0] ?? null;
}

function getDirectOptions(originStopName, targetStopName) {
  if (originStopName === targetStopName) {
    return [
      {
        type: 'walk',
        legs: [],
        originStopName,
        targetStopName,
      },
    ];
  }

  const directRoutes = ROUTES.filter((route) => hasStop(route, originStopName) && hasStop(route, targetStopName))
    .map((route) => ({
      type: 'direct',
      originStopName,
      targetStopName,
      legs: [
        {
          routeNumber: route.number,
          boardStopName: originStopName,
          exitStopName: targetStopName,
        },
      ],
    }));

  if (directRoutes.length > 0) {
    return directRoutes;
  }

  const transferOptions = [];

  ROUTES.filter((route) => hasStop(route, originStopName)).forEach((firstRoute) => {
    firstRoute.stops.forEach((transferStop) => {
      if (transferStop.name === originStopName) {
        return;
      }

      ROUTES.filter(
        (candidateRoute) =>
          candidateRoute.number !== firstRoute.number &&
          hasStop(candidateRoute, transferStop.name) &&
          hasStop(candidateRoute, targetStopName)
      ).forEach((secondRoute) => {
        transferOptions.push({
          type: 'transfer',
          originStopName,
          targetStopName,
          transferStopName: transferStop.name,
          legs: [
            {
              routeNumber: firstRoute.number,
              boardStopName: originStopName,
              exitStopName: transferStop.name,
            },
            {
              routeNumber: secondRoute.number,
              boardStopName: transferStop.name,
              exitStopName: targetStopName,
            },
          ],
        });
      });
    });
  });

  return dedupeOptions(transferOptions);
}

function scoreJourneyOption(option, originStop, userLocation, vehicles) {
  const walkingMinutes = Math.max(
    1,
    Math.round((originStop.walkingDistanceKm / WALKING_SPEED_KMH) * 60)
  );

  if (option.type === 'walk') {
    return {
      ...option,
      score: walkingMinutes,
      walkingMinutes,
      originStop,
      targetStopName: option.targetStopName,
      routeNumbers: [],
      liveEtaMinutes: [],
      travelMinutes: 0,
      transferCount: 0,
    };
  }

  const liveEtaMinutes = [];
  const travelMinutes = option.legs.reduce((sum, leg) => {
    const route = ROUTES.find((candidateRoute) => candidateRoute.number === leg.routeNumber);
    if (!route) {
      return sum;
    }

    const bestLiveEta = getBestEtaForRouteAtStop(leg.routeNumber, leg.boardStopName, vehicles);
    liveEtaMinutes.push(bestLiveEta);

    return sum + estimateRideMinutes(route, leg.boardStopName, leg.exitStopName);
  }, 0);

  const waitMinutes = liveEtaMinutes.reduce(
    (sum, value) => sum + (value === null ? FALLBACK_WAIT_MINUTES : value),
    0
  );

  return {
    ...option,
    score: walkingMinutes + waitMinutes + travelMinutes + (option.type === 'transfer' ? TRANSFER_PENALTY_MINUTES : 0),
    walkingMinutes,
    originStop,
    routeNumbers: option.legs.map((leg) => leg.routeNumber),
    liveEtaMinutes,
    travelMinutes,
    transferCount: option.type === 'transfer' ? 1 : 0,
  };
}

function dedupeOptions(options) {
  const seen = new Set();
  return options.filter((option) => {
    const signature = option.legs
      .map((leg) => `${leg.routeNumber}:${leg.boardStopName}->${leg.exitStopName}`)
      .join('|');

    if (seen.has(signature)) {
      return false;
    }

    seen.add(signature);
    return true;
  });
}

function getBestEtaForRouteAtStop(routeNumber, stopName, vehicles) {
  const route = ROUTES.find((candidateRoute) => candidateRoute.number === routeNumber);
  if (!route) {
    return null;
  }

  const routeEtas = vehicles
    .filter((vehicle) => vehicle.route === routeNumber)
    .map((vehicle) => estimateVehicleEtaToStop(vehicle, route, stopName))
    .filter((eta) => eta !== null);

  return routeEtas.length > 0 ? Math.min(...routeEtas) : null;
}

function estimateVehicleEtaToStop(vehicle, route, stopName) {
  const stop = route.stops.find((candidateStop) => candidateStop.name === stopName);
  if (!stop) {
    return null;
  }

  const currentIndex = vehicle.currentIndex ?? findNearestCoordinateIndex(route, vehicle.lat, vehicle.lng);
  const direction = vehicle.direction ?? 1;
  const stopIndex = stop.coordinateIndex ?? findNearestCoordinateIndex(route, stop.lat, stop.lng);
  const segmentDistance = distanceAlongRoute(route, currentIndex, stopIndex, direction);

  return Math.max(1, Math.round((segmentDistance / AVERAGE_BUS_SPEED) * 60));
}

function estimateRideMinutes(route, fromStopName, toStopName) {
  const fromStop = route.stops.find((stop) => stop.name === fromStopName);
  const toStop = route.stops.find((stop) => stop.name === toStopName);

  if (!fromStop || !toStop) {
    return FALLBACK_WAIT_MINUTES;
  }

  const fromIndex = fromStop.coordinateIndex ?? findNearestCoordinateIndex(route, fromStop.lat, fromStop.lng);
  const toIndex = toStop.coordinateIndex ?? findNearestCoordinateIndex(route, toStop.lat, toStop.lng);
  const routeDistance = distanceAlongRoute(route, fromIndex, toIndex, fromIndex <= toIndex ? 1 : -1);

  return Math.max(2, Math.round((routeDistance / AVERAGE_BUS_SPEED) * 60));
}

function distanceAlongRoute(route, currentIndex, targetIndex, direction) {
  const lastIndex = route.coordinates.length - 1;

  if (currentIndex === targetIndex) {
    return 0.2;
  }

  if (direction > 0 && targetIndex >= currentIndex) {
    return sumSegments(route.coordinates, currentIndex, targetIndex);
  }

  if (direction < 0 && targetIndex <= currentIndex) {
    return sumSegments(route.coordinates, targetIndex, currentIndex);
  }

  if (direction > 0) {
    return sumSegments(route.coordinates, currentIndex, lastIndex) + sumSegments(route.coordinates, targetIndex, lastIndex);
  }

  return sumSegments(route.coordinates, 0, currentIndex) + sumSegments(route.coordinates, 0, targetIndex);
}

function sumSegments(coordinates, startIndex, endIndex) {
  const safeStart = Math.max(0, Math.min(startIndex, endIndex));
  const safeEnd = Math.max(startIndex, endIndex);
  let total = 0;

  for (let index = safeStart; index < safeEnd; index += 1) {
    const [startLat, startLng] = coordinates[index];
    const [endLat, endLng] = coordinates[index + 1];
    total += distanceKm(startLat, startLng, endLat, endLng);
  }

  return total;
}

function findNearestCoordinateIndex(route, lat, lng) {
  let closestIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;

  route.coordinates.forEach(([coordinateLat, coordinateLng], index) => {
    const nextDistance = distanceKm(lat, lng, coordinateLat, coordinateLng);
    if (nextDistance < closestDistance) {
      closestDistance = nextDistance;
      closestIndex = index;
    }
  });

  return closestIndex;
}

function hasStop(route, stopName) {
  return route.stops.some((stop) => stop.name === stopName);
}

function getHeadsign(route, direction = 1) {
  if (direction >= 0) {
    return route.stops.at(-1)?.name ?? route.name;
  }

  return route.stops[0]?.name ?? route.name;
}
