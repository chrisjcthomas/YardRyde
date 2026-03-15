import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
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

// --- Smooth simulation config ---
// Each "tick" is 100ms; the bus interpolates over INTERPOLATION_STEPS ticks
// between two coordinates, giving a slow, steady movement.
const TICK_INTERVAL_MS = 100;
const INTERPOLATION_STEPS = 150; // ~15 seconds per short road segment — smooth, road-following crawl

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

// Create a vehicle with interpolation state
function createSmoothVehicle(seed) {
  const route = ROUTES_BY_NUMBER.get(seed.route);
  const [lat, lng] = route.coordinates[seed.currentIndex];

  return {
    ...seed,
    lat,
    lng,
    // interpolation state
    fromIndex: seed.currentIndex,
    toIndex: seed.currentIndex,
    progress: 0,
    timestamp: new Date().toISOString(),
  };
}

// Advance a vehicle one tiny interpolation step
function tickVehicle(vehicle) {
  const route = ROUTES_BY_NUMBER.get(vehicle.route);
  const coords = route.coordinates;

  let { fromIndex, toIndex, progress, direction, currentIndex } = vehicle;

  // If we haven't set a target segment yet, pick the next one
  if (fromIndex === toIndex) {
    let nextIndex = currentIndex + direction;
    if (nextIndex >= coords.length) {
      direction = -1;
      nextIndex = coords.length - 2;
    } else if (nextIndex < 0) {
      direction = 1;
      nextIndex = 1;
    }
    fromIndex = currentIndex;
    toIndex = nextIndex;
    progress = 0;
  }

  // Advance progress
  progress += 1;

  if (progress >= INTERPOLATION_STEPS) {
    // Arrived at target coordinate
    const [lat, lng] = coords[toIndex];
    return {
      ...vehicle,
      lat,
      lng,
      currentIndex: toIndex,
      fromIndex: toIndex,
      toIndex: toIndex,
      progress: 0,
      direction,
      timestamp: new Date().toISOString(),
    };
  }

  // Interpolate between fromIndex and toIndex
  const t = progress / INTERPOLATION_STEPS;
  const [fromLat, fromLng] = coords[fromIndex];
  const [toLat, toLng] = coords[toIndex];
  const lat = fromLat + (toLat - fromLat) * t;
  const lng = fromLng + (toLng - fromLng) * t;

  return {
    ...vehicle,
    lat,
    lng,
    fromIndex,
    toIndex,
    progress,
    direction,
    currentIndex: vehicle.currentIndex,
    timestamp: new Date().toISOString(),
  };
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

function getMarkerColor(routeId) {
  const palette = ['#2563eb', '#7c3aed', '#dc2626', '#0f766e', '#ea580c', '#0891b2', '#be123c'];
  const seed = `${routeId || ''}`.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palette[seed % palette.length];
}

function JamaicaDemoPage() {
  const [selectedPlaceId, setSelectedPlaceId] = useState('');
  const [userLocation, setUserLocation] = useState(DEFAULT_USER_LOCATION);
  const [locationMessage, setLocationMessage] = useState('');
  const [vehicles, setVehicles] = useState(() => SIMULATION_FLEET.map(createSmoothVehicle));
  const [selectedTab, setSelectedTab] = useState('nearby');
  const [mapFocus, setMapFocus] = useState({ center: KINGSTON_CENTER, zoom: DEFAULT_ZOOM });

  const vehiclesRef = useRef(vehicles);
  vehiclesRef.current = vehicles;

  useEffect(() => {
    document.title = 'Kingston Bus Lab';
  }, []);

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationMessage('This browser cannot share location.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLat = position.coords.latitude;
        const nextLng = position.coords.longitude;

        if (!isWithinKingston(nextLat, nextLng)) {
          setUserLocation(DEFAULT_USER_LOCATION);
          setLocationMessage('Outside Kingston — using Half Way Tree.');
          return;
        }

        setUserLocation({
          lat: nextLat,
          lng: nextLng,
          label: 'Current location',
          source: 'gps',
        });
        setLocationMessage('Using your current location.');
      },
      () => {
        setLocationMessage('Location access blocked — using Half Way Tree.');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout: 10000,
      }
    );
  }, []);

  // Smooth animation loop — runs every 100ms, interpolating bus positions
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setVehicles((currentVehicles) => currentVehicles.map(tickVehicle));
    }, TICK_INTERVAL_MS);

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

  const focusMapPoint = useCallback((lng, lat, zoom = 17) => {
    setMapFocus({ center: [lat, lng], zoom });
  }, []);

  return (
    <div className="nyc-shell">
      {/* Full-screen map — using same LIGHT tiles as NYC */}
      <div className="nyc-map">
        <MapContainer center={KINGSTON_CENTER} zoom={DEFAULT_ZOOM} className="map-canvas" zoomControl={false} attributionControl={false}>
          <TileLayer
            key="light"
            url={TILE_URL}
          />
          <MapController focusTarget={mapFocus} />

          {/* User location */}
          <CircleMarker center={[userLocation.lat, userLocation.lng]} radius={8} fillColor="#2563eb" fillOpacity={0.85} stroke={false} />

          {/* Nearby stops (yellow/black dots like NYC) */}
          {highlightedStops.map((stop) => (
            <CircleMarker
              key={`${stop.kind}-${stop.name}`}
              center={[stop.lat, stop.lng]}
              radius={5}
              fillColor={stop.kind === 'closest' ? '#facc15' : '#ffffff'}
              fillOpacity={1}
              color="#0f172a"
              weight={2}
            >
              <Popup>
                <div className="map-popup">
                  <strong>{stop.name}</strong>
                  <p>{stop.kind === 'closest' ? 'Nearest stop' : 'Trip marker'}</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* Bus vehicles — styled as NYC-style white circles with route label */}
          {vehicles.map((vehicle) => (
            <Marker
              key={vehicle.id}
              position={[vehicle.lat, vehicle.lng]}
              icon={divIcon({
                className: 'nyc-bus-marker-wrapper',
                html: `<button class="nyc-bus-marker" style="border-color: ${getMarkerColor(vehicle.route)};">
                         ${vehicle.route}
                       </button>`,
                iconSize: [28, 28],
                iconAnchor: [14, 14],
              })}
              eventHandlers={{
                click: () => focusMapPoint(vehicle.lng, vehicle.lat, 15),
              }}
            >
              <Popup>
                <div className="map-popup">
                  <strong>Route {vehicle.route}</strong>
                  <p>{ROUTES_BY_NUMBER.get(vehicle.route)?.name ?? 'Simulation bus'}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Dark sidebar overlay (identical to NYC lab) */}
      <div className="nyc-controls">
        <header className="nyc-topbar">
          <div className="nyc-brand">
            <span className="nyc-mode-tag">Kingston pilot simulation</span>
            <h1>Kingston Bus Lab</h1>
            <p>{userLocation.source === 'gps' ? userLocation.label : `Using ${userLocation.label}`}</p>
          </div>

          <div className="nyc-topbar-actions">
            <button type="button" className="nyc-secondary-button" onClick={handleUseMyLocation}>
              Use my location
            </button>
            <button
              type="button"
              className="nyc-secondary-button"
              onClick={() => {
                setUserLocation(DEFAULT_USER_LOCATION);
                setMapFocus({ center: KINGSTON_CENTER, zoom: DEFAULT_ZOOM });
                setLocationMessage('');
              }}
            >
              Half Way Tree
            </button>
          </div>

          <div className="nyc-status-row">
            <span>Updated just now</span>
            <span>{closestStop ? `Closest stop: ${closestStop.name}` : 'Finding nearest stop...'}</span>
          </div>

          {locationMessage && (
            <div className="nyc-empty-state" style={{ marginTop: 0 }}>
              <p>{locationMessage}</p>
            </div>
          )}
        </header>

        <section className="nyc-panel">
          <div className="nyc-panel-tabs" role="tablist" aria-label="Kingston transit tools">
            <button
              type="button"
              className={`nyc-panel-tab ${selectedTab === 'nearby' ? 'is-active' : ''}`}
              onClick={() => setSelectedTab('nearby')}
            >
              Nearby
            </button>
            <button
              type="button"
              className={`nyc-panel-tab ${selectedTab === 'trip' ? 'is-active' : ''}`}
              onClick={() => setSelectedTab('trip')}
            >
              Trip
            </button>
          </div>

          {selectedTab === 'nearby' && (
            <div className="nyc-panel-body">
              <div className="nyc-summary-row">
                <div className="nyc-summary-card">
                  <span className="nyc-summary-label">Nearby stops</span>
                  <strong>{ALL_STOPS.length}</strong>
                </div>
                <div className="nyc-summary-card">
                  <span className="nyc-summary-label">Live buses</span>
                  <strong>{vehicles.length}</strong>
                </div>
              </div>

              {closestStop && (
                <div className="nyc-section">
                  <div className="nyc-section-header">
                    <div>
                      <h2>Closest stop</h2>
                      <p>{closestStop.name} — {formatDistance(closestStop.distanceKm)} away ({walkingMinutes} min walk)</p>
                    </div>
                    <button
                      type="button"
                      className="nyc-secondary-button"
                      onClick={() => focusMapPoint(closestStop.lng, closestStop.lat, 17)}
                    >
                      Focus stop
                    </button>
                  </div>
                </div>
              )}

              <div className="nyc-section">
                <div className="nyc-section-header">
                  <div>
                    <h2>Arrivals at your closest stop</h2>
                    <p>Live arrivals from the simulation buses.</p>
                  </div>
                </div>

                {nextBuses.length === 0 ? (
                  <div className="nyc-empty-state">
                    <p>The simulation is warming up. Buses will appear here as they approach.</p>
                  </div>
                ) : (
                  <div className="nyc-arrivals-list">
                    {nextBuses.map((bus) => (
                      <button
                        key={bus.id}
                        type="button"
                        className="nyc-arrival-card"
                        onClick={() => {
                          const vehicle = vehicles.find((v) => v.route === bus.routeNumber);
                          if (vehicle) {
                            focusMapPoint(vehicle.lng, vehicle.lat, 17);
                          }
                        }}
                      >
                        <div>
                          <div className="nyc-arrival-title">
                            <span className="nyc-route-pill">{bus.routeNumber}</span>
                            <strong>{bus.destination || 'Destination pending'}</strong>
                          </div>
                          <p>{bus.routeName}</p>
                        </div>
                        <span className="nyc-eta-pill">{formatMinutes(bus.etaMinutes)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedTab === 'trip' && (
            <div className="nyc-panel-body">
              <div className="nyc-section">
                <div className="nyc-section-header">
                  <div>
                    <h2>Bus trip planner</h2>
                    <p>Choose a Kingston destination to see the best route recommendation.</p>
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <label className="nyc-field-label" htmlFor="yard-destination" style={{ display: 'block', marginBottom: 8 }}>
                    Where are you going?
                  </label>
                  <select
                    id="yard-destination"
                    className="nyc-input"
                    value={selectedPlaceId}
                    onChange={(event) => setSelectedPlaceId(event.target.value)}
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="">Choose a common Kingston destination</option>
                    {JAMAICA_PLACES.map((place) => (
                      <option key={place.id} value={place.id}>
                        {place.label}
                      </option>
                    ))}
                  </select>
                </div>

                {!selectedPlace && (
                  <div className="nyc-empty-state">
                    <p>Pick a landmark or major stop to see which bus to board from your nearest stop.</p>
                  </div>
                )}

                {selectedPlace && recommendation && (
                  <div className="nyc-trip-list" style={{ marginTop: 14 }}>
                    <button type="button" className="nyc-trip-card is-active">
                      <div className="nyc-trip-topline">
                        <strong>{selectedPlace.label}</strong>
                        <span className="nyc-eta-pill">
                          {recommendation.transferCount === 0 ? 'Direct' : '1 transfer'}
                        </span>
                      </div>

                      <p className="nyc-trip-copy">
                        Walk to <strong>{recommendation.originStop.name}</strong>, then{' '}
                        {recommendation.type === 'walk'
                          ? 'you are already at the destination stop.'
                          : recommendation.transferCount === 0
                            ? `take route ${recommendation.routeNumbers[0]} to ${recommendation.targetStopName}.`
                            : `take route ${recommendation.routeNumbers[0]} → transfer to route ${recommendation.routeNumbers[1]}.`}
                      </p>

                      <div className="nyc-trip-steps">
                        {recommendation.type === 'walk' ? (
                          <div className="nyc-trip-step">
                            <strong>Walk only</strong>
                            <p>Already close enough to walk to the destination stop.</p>
                          </div>
                        ) : (
                          recommendation.legs.map((leg, index) => (
                            <div key={`${leg.routeNumber}-${leg.boardStopName}-${leg.exitStopName}`} className="nyc-trip-step">
                              <strong>
                                <span className="nyc-route-pill" style={{ marginRight: 8 }}>{leg.routeNumber}</span>
                                {index === 0 ? `Board at ${leg.boardStopName}` : `Transfer at ${leg.boardStopName}`}
                              </strong>
                              <p>
                                Ride until {leg.exitStopName}.{' '}
                                {recommendation.liveEtaMinutes[index] === null
                                  ? 'Bus is still looping into view.'
                                  : `Next bus in ~${formatMinutes(recommendation.liveEtaMinutes[index])}.`}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default JamaicaDemoPage;
