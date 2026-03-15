import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './JamaicaDemoPage.css';
import {
  DARK_TILE_URL,
  DEFAULT_ZOOM,
  JAMAICA_PLACES,
  KINGSTON_CENTER,
  ROUTE_COLORS,
  ROUTES,
  TILE_URL,
} from '../constants';
import {
  buildJourneyRecommendation,
  formatDistance,
  formatMinutes,
  getAllStops,
  getNearestStop,
  getNextBusesForStop,
} from '../services/jamaicaPlanner';

const JAMAICA_BOUNDS = {
  latMin: 17.94,
  latMax: 18.08,
  lngMin: -76.9,
  lngMax: -76.72,
};

const DEFAULT_USER_LOCATION = {
  lat: KINGSTON_CENTER[0],
  lng: KINGSTON_CENTER[1],
  label: 'Half Way Tree Transport Centre',
  source: 'demo',
};

const SIMULATION_INTERVAL_MS = 2500;
const ALL_STOPS = getAllStops();
const ROUTES_BY_NUMBER = new Map(ROUTES.map((route) => [route.number, route]));
const STOPS_BY_NAME = new Map(ALL_STOPS.map((stop) => [stop.name, stop]));

const SIMULATION_FLEET = [
  { id: 'yard-800-1', route: '800', currentIndex: 1, direction: 1, accessible: true },
  { id: 'yard-900-1', route: '900', currentIndex: 2, direction: 1, accessible: false },
  { id: 'yard-76-1', route: '76', currentIndex: 0, direction: 1, accessible: true },
  { id: 'yard-42-1', route: '42', currentIndex: 1, direction: 1, accessible: true },
  { id: 'yard-83-1', route: '83', currentIndex: 0, direction: 1, accessible: false },
];

function isWithinKingston(lat, lng) {
  return (
    lat >= JAMAICA_BOUNDS.latMin &&
    lat <= JAMAICA_BOUNDS.latMax &&
    lng >= JAMAICA_BOUNDS.lngMin &&
    lng <= JAMAICA_BOUNDS.lngMax
  );
}

function createSimulationVehicle(seed) {
  const route = ROUTES_BY_NUMBER.get(seed.route);
  const [lat, lng] = route.coordinates[seed.currentIndex];

  return {
    ...seed,
    lat,
    lng,
    timestamp: new Date().toISOString(),
  };
}

function moveSimulationVehicle(vehicle) {
  const route = ROUTES_BY_NUMBER.get(vehicle.route);
  let nextDirection = vehicle.direction;
  let nextIndex = vehicle.currentIndex + vehicle.direction;

  if (nextIndex >= route.coordinates.length) {
    nextDirection = -1;
    nextIndex = route.coordinates.length - 2;
  } else if (nextIndex < 0) {
    nextDirection = 1;
    nextIndex = 1;
  }

  return createSimulationVehicle({
    ...vehicle,
    currentIndex: nextIndex,
    direction: nextDirection,
  });
}

function getFocusTarget(userLocation, recommendation) {
  if (!recommendation?.routeNumbers?.length) {
    return {
      center: [userLocation.lat, userLocation.lng],
      zoom: DEFAULT_ZOOM,
    };
  }

  const points = recommendation.routeNumbers.flatMap(
    (routeNumber) => ROUTES_BY_NUMBER.get(routeNumber)?.coordinates ?? []
  );

  points.push([userLocation.lat, userLocation.lng]);

  if (recommendation.originStop) {
    points.push([recommendation.originStop.lat, recommendation.originStop.lng]);
  }

  recommendation.legs?.forEach((leg) => {
    const boardStop = STOPS_BY_NAME.get(leg.boardStopName);
    const exitStop = STOPS_BY_NAME.get(leg.exitStopName);

    if (boardStop) {
      points.push([boardStop.lat, boardStop.lng]);
    }

    if (exitStop) {
      points.push([exitStop.lat, exitStop.lng]);
    }
  });

  return { bounds: points };
}

function MapController({ focusTarget }) {
  const map = useMap();

  useEffect(() => {
    if (!focusTarget) {
      return;
    }

    if (focusTarget.bounds) {
      map.fitBounds(focusTarget.bounds, { padding: [40, 40], maxZoom: 14 });
      return;
    }

    if (focusTarget.center) {
      map.setView(focusTarget.center, focusTarget.zoom ?? map.getZoom(), { animate: true });
    }
  }, [focusTarget, map]);

  return null;
}

function createBusIcon(routeNumber) {
  const color = ROUTE_COLORS[routeNumber] || '#0f172a';

  return divIcon({
    className: 'yard-bus-icon-wrapper',
    html: `<span class="yard-bus-icon" style="--route-color:${color};">${routeNumber}</span>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

function JamaicaDemoPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState('');
  const [userLocation, setUserLocation] = useState(DEFAULT_USER_LOCATION);
  const [locationMessage, setLocationMessage] = useState('Using a Kingston demo starting point.');
  const [vehicles, setVehicles] = useState(() => SIMULATION_FLEET.map(createSimulationVehicle));

  useEffect(() => {
    document.title = 'YardRyde';
  }, []);

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationMessage('This browser cannot share location, so the demo stays in Half Way Tree.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLat = position.coords.latitude;
        const nextLng = position.coords.longitude;

        if (!isWithinKingston(nextLat, nextLng)) {
          setUserLocation(DEFAULT_USER_LOCATION);
          setLocationMessage('Your phone is outside Kingston, so the demo starts in Half Way Tree.');
          return;
        }

        setUserLocation({
          lat: nextLat,
          lng: nextLng,
          label: 'Your current location',
          source: 'gps',
        });
        setLocationMessage('Using your current location inside Kingston / St. Andrew.');
      },
      () => {
        setLocationMessage('Location access is blocked, so the demo starts in Half Way Tree.');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout: 10000,
      }
    );
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setVehicles((currentVehicles) => currentVehicles.map(moveSimulationVehicle));
    }, SIMULATION_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    handleUseMyLocation();
  }, [handleUseMyLocation]);

  const selectedPlace = useMemo(
    () => JAMAICA_PLACES.find((place) => place.id === selectedPlaceId) ?? null,
    [selectedPlaceId]
  );

  const closestStop = useMemo(() => getNearestStop(userLocation, ALL_STOPS), [userLocation]);
  const nextBuses = useMemo(
    () => (closestStop ? getNextBusesForStop(closestStop.name, vehicles) : []),
    [closestStop, vehicles]
  );
  const recommendation = useMemo(
    () => buildJourneyRecommendation(userLocation, selectedPlace, vehicles),
    [selectedPlace, userLocation, vehicles]
  );

  const focusTarget = useMemo(
    () => getFocusTarget(userLocation, recommendation),
    [recommendation, userLocation]
  );

  const highlightedRoutes = useMemo(() => {
    if (recommendation?.routeNumbers?.length) {
      return new Set(recommendation.routeNumbers);
    }

    if (nextBuses.length > 0) {
      return new Set(nextBuses.map((bus) => bus.routeNumber));
    }

    return new Set();
  }, [nextBuses, recommendation]);

  const highlightedStops = useMemo(() => {
    const nextStops = new Map();

    if (closestStop) {
      nextStops.set(closestStop.name, { ...closestStop, kind: 'closest' });
    }

    if (selectedPlace) {
      selectedPlace.stopNames.forEach((stopName) => {
        const stop = STOPS_BY_NAME.get(stopName);
        if (stop) {
          nextStops.set(stop.name, { ...stop, kind: 'destination' });
        }
      });
    }

    recommendation?.legs?.forEach((leg, index) => {
      const boardStop = STOPS_BY_NAME.get(leg.boardStopName);
      const exitStop = STOPS_BY_NAME.get(leg.exitStopName);

      if (boardStop) {
        nextStops.set(boardStop.name, { ...boardStop, kind: index === 0 ? 'boarding' : 'transfer' });
      }

      if (exitStop) {
        nextStops.set(exitStop.name, { ...exitStop, kind: index === recommendation.legs.length - 1 ? 'destination' : 'transfer' });
      }
    });

    return [...nextStops.values()];
  }, [closestStop, recommendation, selectedPlace]);

  const walkingMinutes = closestStop ? Math.max(1, Math.round((closestStop.distanceKm / 5) * 60)) : null;

  return (
    <div className={`yard-shell ${darkMode ? 'is-dark' : ''}`}>
      <aside className="yard-panel">
        <section className="yard-card yard-card--hero">
          <div className="yard-hero-topline">
            <span className="yard-badge">Pilot simulation</span>
            <Link className="yard-lab-link" to="/lab/nyc">
              NYC live lab
            </Link>
          </div>

          <h1>YardRyde</h1>
          <p className="yard-hero-copy">
            See the next JUTC bus near you, then get a simple bus recommendation for where you need to go.
          </p>

          <div className="yard-hero-actions">
            <button type="button" className="yard-button yard-button--primary" onClick={handleUseMyLocation}>
              Use my location
            </button>
            <button type="button" className="yard-button" onClick={() => setDarkMode((current) => !current)}>
              {darkMode ? 'Light map' : 'Dark map'}
            </button>
            <button
              type="button"
              className="yard-button"
              onClick={() => {
                setUserLocation(DEFAULT_USER_LOCATION);
                setLocationMessage('Using Half Way Tree as the Jamaica demo starting point.');
              }}
            >
              Half Way Tree demo
            </button>
          </div>

          <p className="yard-helper-copy">{locationMessage}</p>
        </section>

        <section className="yard-card">
          <div className="yard-section-heading">
            <div>
              <p className="yard-eyebrow">Nearest stop to you</p>
              <h2>{closestStop?.name ?? 'Finding the closest stop...'}</h2>
            </div>
            {closestStop ? <span className="yard-distance-pill">{walkingMinutes} min walk</span> : null}
          </div>

          {closestStop ? (
            <p className="yard-supporting-copy">{formatDistance(closestStop.distanceKm)} away from your current demo location.</p>
          ) : null}

          <div className="yard-arrival-list">
            {nextBuses.length > 0 ? (
              nextBuses.map((bus) => (
                <article key={bus.id} className="yard-arrival-card">
                  <div>
                    <div className="yard-arrival-title">
                      <span className="yard-route-pill" style={{ '--route-color': ROUTE_COLORS[bus.routeNumber] || '#0f172a' }}>
                        {bus.routeNumber}
                      </span>
                      <strong>{bus.destination}</strong>
                    </div>
                    <p>{bus.routeName}</p>
                  </div>
                  <span className="yard-eta-pill">{formatMinutes(bus.etaMinutes)}</span>
                </article>
              ))
            ) : (
              <div className="yard-empty-state">
                The simulation is warming up. Your next buses will appear here as the demo vehicles move.
              </div>
            )}
          </div>
        </section>

        <section className="yard-card">
          <p className="yard-eyebrow">Best bus to take</p>
          <label className="yard-field" htmlFor="yard-destination">
            <span>Where are you going?</span>
            <select
              id="yard-destination"
              value={selectedPlaceId}
              onChange={(event) => setSelectedPlaceId(event.target.value)}
            >
              <option value="">Choose a common Kingston destination</option>
              {JAMAICA_PLACES.map((place) => (
                <option key={place.id} value={place.id}>
                  {place.label}
                </option>
              ))}
            </select>
          </label>

          {!selectedPlace ? (
            <div className="yard-empty-state">
              Pick a landmark or major stop to see which bus to board from your nearest useful stop.
            </div>
          ) : null}

          {selectedPlace && recommendation ? (
            <article className="yard-recommendation-card">
              <div className="yard-section-heading">
                <div>
                  <h3>{selectedPlace.label}</h3>
                  <p>{selectedPlace.description}</p>
                </div>
                <span className="yard-score-pill">
                  {recommendation.transferCount === 0 ? 'Direct trip' : '1 transfer'}
                </span>
              </div>

              <p className="yard-plan-summary">
                Walk to <strong>{recommendation.originStop.name}</strong>, then{' '}
                {recommendation.type === 'walk'
                  ? 'you are already at the destination stop.'
                  : recommendation.transferCount === 0
                    ? `take route ${recommendation.routeNumbers[0]} straight to ${recommendation.targetStopName}.`
                    : `take route ${recommendation.routeNumbers[0]} and transfer once to route ${recommendation.routeNumbers[1]}.`}
              </p>

              <div className="yard-leg-list">
                {recommendation.type === 'walk' ? (
                  <div className="yard-leg-card">
                    <strong>Walk only</strong>
                    <p>You are already close enough to the destination stop to walk there in the demo.</p>
                  </div>
                ) : (
                  recommendation.legs.map((leg, index) => (
                    <div key={`${leg.routeNumber}-${leg.boardStopName}-${leg.exitStopName}`} className="yard-leg-card">
                      <div className="yard-arrival-title">
                        <span className="yard-route-pill" style={{ '--route-color': ROUTE_COLORS[leg.routeNumber] || '#0f172a' }}>
                          {leg.routeNumber}
                        </span>
                        <strong>
                          {index === 0 ? `Board at ${leg.boardStopName}` : `Transfer at ${leg.boardStopName}`}
                        </strong>
                      </div>
                      <p>Ride until {leg.exitStopName}.</p>
                      <span className="yard-inline-note">
                        {recommendation.liveEtaMinutes[index] === null
                          ? 'Next simulated bus is still looping into view.'
                          : `Next bus reaches ${leg.boardStopName} in about ${formatMinutes(recommendation.liveEtaMinutes[index])}.`}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </article>
          ) : null}
        </section>
      </aside>

      <main className="yard-map-panel">
        <div className="yard-map-topbar">
          <div>
            <p className="yard-eyebrow">Jamaica hackathon demo</p>
            <strong>Kingston / St. Andrew bus simulation</strong>
          </div>
          <span className="yard-map-badge">{vehicles.length} buses moving now</span>
        </div>

        <div className="yard-map-stage">
          <MapContainer center={KINGSTON_CENTER} zoom={DEFAULT_ZOOM} className="yard-map-canvas" zoomControl={false}>
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              key={darkMode ? 'dark' : 'light'}
              url={darkMode ? DARK_TILE_URL : TILE_URL}
            />
            <MapController focusTarget={focusTarget} />

            {ROUTES.map((route) => {
              const isHighlighted = highlightedRoutes.size === 0 || highlightedRoutes.has(route.number);
              return (
                <Polyline
                  key={route.id}
                  positions={route.coordinates}
                  color={ROUTE_COLORS[route.number] || '#475569'}
                  weight={isHighlighted ? 6 : 3}
                  opacity={isHighlighted ? 0.88 : 0.22}
                >
                  <Popup>
                    <div className="yard-map-popup">
                      <strong>Route {route.number}</strong>
                      <p>{route.name}</p>
                    </div>
                  </Popup>
                </Polyline>
              );
            })}

            <CircleMarker
              center={[userLocation.lat, userLocation.lng]}
              radius={8}
              fillColor="#2563eb"
              fillOpacity={1}
              stroke={false}
            >
              <Popup>
                <div className="yard-map-popup">
                  <strong>You are here</strong>
                  <p>{userLocation.label}</p>
                </div>
              </Popup>
            </CircleMarker>
            <CircleMarker
              center={[userLocation.lat, userLocation.lng]}
              radius={18}
              fillColor="#2563eb"
              fillOpacity={0.18}
              stroke={false}
            />

            {highlightedStops.map((stop) => (
              <CircleMarker
                key={`${stop.kind}-${stop.name}`}
                center={[stop.lat, stop.lng]}
                radius={stop.kind === 'closest' ? 9 : 7}
                fillColor={stop.kind === 'closest' ? '#f59e0b' : '#ffffff'}
                fillOpacity={1}
                color={stop.kind === 'destination' ? '#0f766e' : '#0f172a'}
                weight={3}
              >
                <Popup>
                  <div className="yard-map-popup">
                    <strong>{stop.name}</strong>
                    <p>{stop.kind === 'closest' ? 'Nearest stop to you' : 'Trip marker'}</p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {vehicles.map((vehicle) => (
              <Marker
                key={vehicle.id}
                position={[vehicle.lat, vehicle.lng]}
                icon={createBusIcon(vehicle.route)}
              >
                <Popup>
                  <div className="yard-map-popup">
                    <strong>Route {vehicle.route}</strong>
                    <p>{ROUTES_BY_NUMBER.get(vehicle.route)?.name ?? 'Simulation bus'}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </main>
    </div>
  );
}

export default JamaicaDemoPage;
