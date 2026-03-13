import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import PlaceAutocompleteInput from '../components/PlaceAutocompleteInput';
import Toast from '../components/Toast';
import {
  ACTIVE_SOURCE,
  GOOGLE_MAPS_BROWSER_KEY,
  MAPBOX_ACCESS_TOKEN,
  NYC_FALLBACK_ORIGIN,
} from '../constants';
import { requestTransitDirections } from '../services/googleMaps';
import { fetchNearbyTransit } from '../services/nycApi';

const NEARBY_POLL_INTERVAL_MS = 20000;
const ORIGIN_MOVE_REFRESH_KM = 0.25;
const DEFAULT_QUERY_SPAN = 0.02;

function distanceKm(lat1, lng1, lat2, lng2) {
  const earthRadiusKm = 6371;
  const deltaLat = (lat2 - lat1) * Math.PI / 180;
  const deltaLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function formatRelativeTimestamp(timestamp) {
  if (!timestamp) {
    return 'Waiting for data';
  }

  const deltaSeconds = Math.max(0, Math.round((Date.now() - new Date(timestamp).getTime()) / 1000));
  if (deltaSeconds < 5) {
    return 'Updated just now';
  }
  if (deltaSeconds < 60) {
    return `Updated ${deltaSeconds}s ago`;
  }
  return `Updated ${Math.round(deltaSeconds / 60)}m ago`;
}

function formatEta(minutes) {
  if (minutes === null || minutes === undefined) {
    return 'No ETA';
  }
  if (minutes <= 0) {
    return 'Due';
  }
  return `${minutes} min`;
}

function stripHtml(html) {
  return html ? html.replace(/<[^>]*>/g, '').trim() : '';
}

function summarizeDuration(seconds) {
  const totalMinutes = Math.max(1, Math.round(seconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (!hours) {
    return `${minutes} min`;
  }

  return `${hours}h ${minutes}m`;
}

function getMarkerColor(routeId) {
  const palette = ['#2563eb', '#7c3aed', '#dc2626', '#0f766e', '#ea580c', '#0891b2', '#be123c'];
  const seed = `${routeId || ''}`.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palette[seed % palette.length];
}

function buildStopGeoJson(stops) {
  return {
    type: 'FeatureCollection',
    features: (stops || []).map((stop) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [stop.lng, stop.lat],
      },
      properties: {
        id: stop.id,
        name: stop.name,
      },
    })),
  };
}

function buildRouteGeoJson(routeOption) {
  if (!routeOption) {
    return {
      type: 'FeatureCollection',
      features: [],
    };
  }

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: routeOption.polyline,
        },
        properties: {
          id: routeOption.id,
        },
      },
    ],
  };
}

function normalizeDirectionsRoute(route, index) {
  const steps = route.legs.flatMap((leg) => leg.steps || []);
  const transitLegs = steps
    .filter((step) => step.travel_mode === 'TRANSIT' && step.transit)
    .map((step) => ({
      routeLabel: step.transit.line?.short_name || step.transit.line?.name || 'Bus',
      headsign: step.transit.headsign || 'Direction unavailable',
      departureStop: step.transit.departure_stop?.name || 'Stop unavailable',
      departureLocation: step.transit.departure_stop?.location
        ? {
            lat: step.transit.departure_stop.location.lat(),
            lng: step.transit.departure_stop.location.lng(),
          }
        : null,
      arrivalStop: step.transit.arrival_stop?.name || 'Stop unavailable',
      numStops: step.transit.num_stops || 0,
      durationText: step.duration?.text || '',
    }));

  const walkingLegs = steps
    .filter((step) => step.travel_mode === 'WALKING')
    .map((step) => ({
      instructions: stripHtml(step.instructions),
      durationText: step.duration?.text || '',
      distanceText: step.distance?.text || '',
    }));

  return {
    id: `trip-route-${index}`,
    summary: route.summary || transitLegs.map((leg) => leg.routeLabel).join(' -> ') || `Option ${index + 1}`,
    totalDurationSeconds: route.legs.reduce((sum, leg) => sum + (leg.duration?.value || 0), 0),
    totalDurationText: summarizeDuration(route.legs.reduce((sum, leg) => sum + (leg.duration?.value || 0), 0)),
    transitLegs,
    walkingLegs,
    transferCount: Math.max(0, transitLegs.length - 1),
    polyline: (route.overview_path || []).map((point) => [point.lng(), point.lat()]),
  };
}

function NycTransitPage() {
  const [gpsStatus, setGpsStatus] = useState('pending');
  const [origin, setOrigin] = useState(NYC_FALLBACK_ORIGIN);
  const [mapReady, setMapReady] = useState(false);
  const [nearbyStatus, setNearbyStatus] = useState('idle');
  const [nearbyData, setNearbyData] = useState(null);
  const [nearbyError, setNearbyError] = useState('');
  const [nearbyPollingPaused, setNearbyPollingPaused] = useState(false);
  const [selectedTab, setSelectedTab] = useState('nearby');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [originQuery, setOriginQuery] = useState('');
  const [showOriginEditor, setShowOriginEditor] = useState(false);
  const [tripStatus, setTripStatus] = useState('idle');
  const [tripOptions, setTripOptions] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [tripError, setTripError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const requestOriginRef = useRef(origin);
  const geolocationWatchIdRef = useRef(null);

  const selectedTrip = useMemo(
    () => tripOptions.find((option) => option.id === selectedTripId) || null,
    [selectedTripId, tripOptions]
  );

  const pushToast = useCallback((message) => {
    setToastMessage(message);
    setToastVisible(true);
  }, []);

  const syncOrigin = useCallback((nextOrigin) => {
    requestOriginRef.current = nextOrigin;
    setOrigin(nextOrigin);
  }, []);

  const updateTripRouteLayer = useCallback((routeOption) => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) {
      return;
    }

    const source = map.getSource('nyc-trip-route');
    if (source) {
      source.setData(buildRouteGeoJson(routeOption));
    }

    if (routeOption?.polyline?.length > 1) {
      const bounds = routeOption.polyline.reduce(
        (result, [lng, lat]) => result.extend([lng, lat]),
        new mapboxgl.LngLatBounds(routeOption.polyline[0], routeOption.polyline[0])
      );
      map.fitBounds(bounds, { padding: 64, maxZoom: 15 });
    }
  }, []);

  const focusMapPoint = useCallback((lng, lat, zoom = 15) => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    map.flyTo({
      center: [lng, lat],
      zoom,
      essential: true,
    });
  }, []);

  const refreshNearby = useCallback(async (nextOrigin, signal) => {
    setNearbyStatus((current) => (current === 'idle' ? 'loading' : 'refreshing'));
    setNearbyError('');

    try {
      const data = await fetchNearbyTransit({
        lat: nextOrigin.lat,
        lng: nextOrigin.lng,
        latSpan: DEFAULT_QUERY_SPAN,
        lonSpan: DEFAULT_QUERY_SPAN,
        source: nextOrigin.source,
        signal,
      });

      setNearbyData(data);
      setNearbyPollingPaused(false);
      setNearbyStatus('ready');
    } catch (error) {
      if (error.name === 'AbortError') {
        return;
      }

      setNearbyError(error.message || 'Unable to load nearby bus activity.');
      setNearbyPollingPaused(error.type === 'CONFIGURATION');
      setNearbyStatus('error');
    }
  }, []);

  const recenterToGps = useCallback(() => {
    if (!navigator.geolocation) {
      pushToast('Live location is not available in this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextOrigin = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          label: 'Current location',
          source: 'gps',
        };
        setGpsStatus('granted');
        syncOrigin(nextOrigin);
        focusMapPoint(nextOrigin.lng, nextOrigin.lat, 14);
      },
      () => {
        pushToast('Location access is still blocked. Using the current fallback origin.');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 20000,
      }
    );
  }, [focusMapPoint, pushToast, syncOrigin]);

  useEffect(() => {
    if (!MAPBOX_ACCESS_TOKEN || !mapContainerRef.current || mapRef.current) {
      return undefined;
    }

    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [origin.lng, origin.lat],
      zoom: 13,
      attributionControl: true,
    });

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: false }), 'top-right');

    map.on('load', () => {
      map.addSource('nyc-nearby-stops', {
        type: 'geojson',
        data: buildStopGeoJson([]),
      });

      map.addLayer({
        id: 'nyc-nearby-stops-circle',
        type: 'circle',
        source: 'nyc-nearby-stops',
        paint: {
          'circle-radius': 5,
          'circle-color': '#facc15',
          'circle-stroke-color': '#0f172a',
          'circle-stroke-width': 2,
        },
      });

      map.addSource('nyc-trip-route', {
        type: 'geojson',
        data: buildRouteGeoJson(null),
      });

      map.addLayer({
        id: 'nyc-trip-route-line',
        type: 'line',
        source: 'nyc-trip-route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#4dd187',
          'line-width': 5,
          'line-opacity': 0.92,
        },
      });

      setMapReady(true);
    });

    mapRef.current = map;

    return () => {
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus('unavailable');
      syncOrigin(NYC_FALLBACK_ORIGIN);
      return undefined;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextOrigin = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          label: 'Current location',
          source: 'gps',
        };
        setGpsStatus('granted');
        syncOrigin(nextOrigin);
      },
      () => {
        setGpsStatus('denied');
        syncOrigin(NYC_FALLBACK_ORIGIN);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 20000,
      }
    );

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const nextOrigin = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          label: 'Current location',
          source: 'gps',
        };

        setGpsStatus('granted');

        if (
          requestOriginRef.current.source === 'gps' &&
          distanceKm(requestOriginRef.current.lat, requestOriginRef.current.lng, nextOrigin.lat, nextOrigin.lng) >=
            ORIGIN_MOVE_REFRESH_KM
        ) {
          syncOrigin(nextOrigin);
        }
      },
      () => {},
      {
        enableHighAccuracy: false,
        maximumAge: 30000,
      }
    );

    geolocationWatchIdRef.current = watchId;

    return () => {
      if (geolocationWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(geolocationWatchIdRef.current);
      }
    };
  }, [syncOrigin]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    focusMapPoint(origin.lng, origin.lat, 13);
  }, [focusMapPoint, origin.lng, origin.lat]);

  useEffect(() => {
    const controller = new AbortController();
    refreshNearby(origin, controller.signal);

    const intervalId = window.setInterval(() => {
      if (!document.hidden && !nearbyPollingPaused) {
        refreshNearby(requestOriginRef.current);
      }
    }, NEARBY_POLL_INTERVAL_MS);

    return () => {
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, [nearbyPollingPaused, origin.lat, origin.lng, origin.source, refreshNearby]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map?.isStyleLoaded()) {
      return;
    }

    const stopSource = map.getSource('nyc-nearby-stops');
    if (stopSource) {
      stopSource.setData(buildStopGeoJson(nearbyData?.nearbyStops || []));
    }
  }, [mapReady, nearbyData]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) {
      return;
    }

    const markerStore = markersRef.current;
    const nextVehicles = nearbyData?.vehicles || [];
    const nextIds = new Set(nextVehicles.map((vehicle) => vehicle.id));

    markerStore.forEach(({ marker }, vehicleId) => {
      if (!nextIds.has(vehicleId)) {
        marker.remove();
        markerStore.delete(vehicleId);
      }
    });

    nextVehicles.forEach((vehicle) => {
      const existing = markerStore.get(vehicle.id);
      const nextLngLat = [vehicle.lng, vehicle.lat];

      if (!existing) {
        const element = document.createElement('button');
        element.type = 'button';
        element.className = 'nyc-bus-marker';
        element.style.borderColor = getMarkerColor(vehicle.routeId);
        element.textContent = vehicle.routeId || '?';
        element.title = `${vehicle.routeId || 'Route'} ${vehicle.destination ? `to ${vehicle.destination}` : ''}`.trim();
        element.addEventListener('click', () => focusMapPoint(vehicle.lng, vehicle.lat, 15));

        const marker = new mapboxgl.Marker({ element, anchor: 'center' })
          .setLngLat(nextLngLat)
          .addTo(map);

        markerStore.set(vehicle.id, { marker, lngLat: nextLngLat });
        return;
      }

      const startLngLat = existing.lngLat;
      const animationStart = performance.now();
      const animationDuration = 900;

      const animate = (timestamp) => {
        const progress = Math.min(1, (timestamp - animationStart) / animationDuration);
        const interpolatedLng = startLngLat[0] + (nextLngLat[0] - startLngLat[0]) * progress;
        const interpolatedLat = startLngLat[1] + (nextLngLat[1] - startLngLat[1]) * progress;
        existing.marker.setLngLat([interpolatedLng, interpolatedLat]);

        if (progress < 1) {
          window.requestAnimationFrame(animate);
        }
      };

      existing.marker.getElement().textContent = vehicle.routeId || '?';
      existing.marker.getElement().style.borderColor = getMarkerColor(vehicle.routeId);
      existing.marker.getElement().title = `${vehicle.routeId || 'Route'} ${vehicle.destination ? `to ${vehicle.destination}` : ''}`.trim();
      existing.lngLat = nextLngLat;
      window.requestAnimationFrame(animate);
    });
  }, [focusMapPoint, mapReady, nearbyData?.vehicles]);

  useEffect(() => {
    updateTripRouteLayer(selectedTrip);
  }, [mapReady, selectedTrip, updateTripRouteLayer]);

  const handleOriginSelected = useCallback(
    (place) => {
      const nextOrigin = {
        lat: place.lat,
        lng: place.lng,
        label: place.label,
        source: 'manual',
      };
      setOriginQuery(place.label);
      setShowOriginEditor(false);
      syncOrigin(nextOrigin);
      focusMapPoint(place.lng, place.lat, 14);
    },
    [focusMapPoint, syncOrigin]
  );

  const handleDestinationSelected = useCallback((place) => {
    setDestinationQuery(place.label);
    setSelectedDestination(place);
  }, []);

  const handlePlanTrip = useCallback(async () => {
    if (!selectedDestination) {
      setTripStatus('error');
      setTripError('Choose a destination from the search suggestions first.');
      return;
    }

    setTripStatus('loading');
    setTripError('');

    try {
      const result = await requestTransitDirections({
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: selectedDestination.lat, lng: selectedDestination.lng },
      });

      const normalizedRoutes = (result.routes || []).slice(0, 3).map(normalizeDirectionsRoute);
      if (normalizedRoutes.length === 0) {
        setTripOptions([]);
        setSelectedTripId(null);
        setTripStatus('empty');
        updateTripRouteLayer(null);
        return;
      }

      setTripOptions(normalizedRoutes);
      setSelectedTripId(normalizedRoutes[0].id);
      setTripStatus('ready');
      setSelectedTab('trip');
    } catch (error) {
      setTripOptions([]);
      setSelectedTripId(null);
      setTripStatus('error');
      setTripError(error.message || 'No transit route was found.');
      updateTripRouteLayer(null);
    }
  }, [origin.lat, origin.lng, selectedDestination, updateTripRouteLayer]);

  const handleRetryNearby = useCallback(() => {
    setNearbyPollingPaused(false);
    refreshNearby(requestOriginRef.current);
  }, [refreshNearby]);

  const nearbyList = nearbyData?.arrivals || [];
  const hasMapboxToken = Boolean(MAPBOX_ACCESS_TOKEN);
  const hasGoogleKey = Boolean(GOOGLE_MAPS_BROWSER_KEY);

  return (
    <div className="nyc-shell">
      {!hasMapboxToken || !hasGoogleKey ? (
        <div className="nyc-config-card">
          <h1>{ACTIVE_SOURCE.displayName}</h1>
          <p>
            Missing configuration:
            {!hasMapboxToken ? ' VITE_MAPBOX_ACCESS_TOKEN' : ''}
            {!hasMapboxToken && !hasGoogleKey ? ' and' : ''}
            {!hasGoogleKey ? ' VITE_GOOGLE_MAPS_BROWSER_KEY' : ''}
          </p>
        </div>
      ) : null}

      <div ref={mapContainerRef} className="nyc-map" />

      <header className="nyc-topbar">
        <div className="nyc-brand">
          <span className="nyc-mode-tag">{ACTIVE_SOURCE.modeLabel}</span>
          <h1>{ACTIVE_SOURCE.displayName}</h1>
          <p>{gpsStatus === 'granted' ? origin.label : `Using ${origin.label}`}</p>
        </div>

        <div className="nyc-topbar-actions">
          <button type="button" className="nyc-secondary-button" onClick={recenterToGps}>
            Use my location
          </button>
          <button
            type="button"
            className="nyc-secondary-button"
            onClick={() => setShowOriginEditor((current) => !current)}
          >
            {showOriginEditor ? 'Hide origin' : 'Change origin'}
          </button>
        </div>

        <div className="nyc-toolbar-grid">
          {(showOriginEditor || origin.source !== 'gps') && (
            <PlaceAutocompleteInput
              id="origin-search"
              label="Origin"
              value={originQuery}
              placeholder="Search for a pickup area"
              onChange={setOriginQuery}
              onPlaceSelected={handleOriginSelected}
              disabled={!hasGoogleKey}
            />
          )}

          <PlaceAutocompleteInput
            id="destination-search"
            label="Destination"
            value={destinationQuery}
            placeholder="Where are you going?"
            onChange={setDestinationQuery}
            onPlaceSelected={handleDestinationSelected}
            disabled={!hasGoogleKey}
          />
        </div>

        <div className="nyc-status-row">
          <span>{formatRelativeTimestamp(nearbyData?.updatedAt)}</span>
          <span>{nearbyData?.closestStop ? `Closest stop: ${nearbyData.closestStop.name}` : 'No stop found yet'}</span>
        </div>
      </header>

      <section className="nyc-panel">
        <div className="nyc-panel-tabs" role="tablist" aria-label="NYC transit tools">
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
                <strong>{nearbyData?.nearbyStops?.length || 0}</strong>
              </div>
              <div className="nyc-summary-card">
                <span className="nyc-summary-label">Live buses</span>
                <strong>{nearbyData?.vehicles?.length || 0}</strong>
              </div>
            </div>

            {nearbyStatus === 'error' && (
              <div className="nyc-empty-state">
                <p>{nearbyError}</p>
                <button type="button" className="nyc-primary-button" onClick={handleRetryNearby}>
                  Retry
                </button>
              </div>
            )}

            {nearbyStatus !== 'error' && !nearbyData?.closestStop && nearbyStatus !== 'loading' && nearbyStatus !== 'refreshing' && (
              <div className="nyc-empty-state">
                <p>No nearby bus stops were found in this area yet.</p>
              </div>
            )}

            {nearbyData?.closestStop && (
              <div className="nyc-section">
                <div className="nyc-section-header">
                  <div>
                    <h2>Closest stop</h2>
                    <p>{nearbyData.closestStop.name}</p>
                  </div>
                  <button
                    type="button"
                    className="nyc-secondary-button"
                    onClick={() => focusMapPoint(nearbyData.closestStop.lng, nearbyData.closestStop.lat, 15)}
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
                  <p>Live arrivals derived from the current stop board.</p>
                </div>
              </div>

              {nearbyList.length === 0 && nearbyStatus === 'ready' ? (
                <div className="nyc-empty-state">
                  <p>No buses are currently approaching this stop.</p>
                </div>
              ) : (
                <div className="nyc-arrivals-list">
                  {nearbyList.map((arrival) => (
                    <button
                      key={`${arrival.routeId}-${arrival.vehicleId || arrival.expectedArrivalTime}`}
                      type="button"
                      className="nyc-arrival-card"
                      onClick={() => {
                        const vehicle = nearbyData?.vehicles?.find((item) => item.id === arrival.vehicleId);
                        if (vehicle) {
                          focusMapPoint(vehicle.lng, vehicle.lat, 15);
                        } else if (nearbyData?.closestStop) {
                          focusMapPoint(nearbyData.closestStop.lng, nearbyData.closestStop.lat, 15);
                        }
                      }}
                    >
                      <div>
                        <div className="nyc-arrival-title">
                          <span className="nyc-route-pill">{arrival.routeId}</span>
                          <strong>{arrival.destination || 'Destination pending'}</strong>
                        </div>
                        <p>{arrival.stopName}</p>
                      </div>
                      <span className="nyc-eta-pill">{formatEta(arrival.etaMinutes)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {selectedTab === 'trip' && (
          <div className="nyc-panel-body">
            <div className="nyc-section-header">
              <div>
                <h2>Bus trip planner</h2>
                <p>Transit directions are searched from your active origin.</p>
              </div>
              <button type="button" className="nyc-primary-button" onClick={handlePlanTrip}>
                Plan trip
              </button>
            </div>

            {tripStatus === 'error' && (
              <div className="nyc-empty-state">
                <p>{tripError}</p>
              </div>
            )}

            {tripStatus === 'empty' && (
              <div className="nyc-empty-state">
                <p>No transit route was found for that destination.</p>
              </div>
            )}

            {tripStatus === 'loading' && (
              <div className="nyc-empty-state">
                <p>Searching transit options...</p>
              </div>
            )}

            {tripStatus !== 'loading' && tripOptions.length === 0 && tripStatus !== 'error' && tripStatus !== 'empty' && (
              <div className="nyc-empty-state">
                <p>Pick a destination to see live bus options and draw the route on the map.</p>
              </div>
            )}

            {tripOptions.length > 0 && (
              <div className="nyc-trip-list">
                {tripOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`nyc-trip-card ${selectedTripId === option.id ? 'is-active' : ''}`}
                    onClick={() => setSelectedTripId(option.id)}
                  >
                    <div className="nyc-trip-topline">
                      <strong>{option.summary}</strong>
                      <span className="nyc-eta-pill">{option.totalDurationText}</span>
                    </div>

                    <p className="nyc-trip-copy">
                      Board {option.transitLegs.map((leg) => leg.routeLabel).join(', ') || 'No bus legs detected'}.
                    </p>

                    <div className="nyc-trip-meta">
                      <span>{option.transferCount} transfer{option.transferCount === 1 ? '' : 's'}</span>
                      {option.transferCount >= 2 && <span className="nyc-warning-pill">2+ transfers</span>}
                    </div>

                    <div className="nyc-trip-steps">
                      {option.transitLegs.map((leg, index) => (
                        <div key={`${option.id}-${leg.routeLabel}-${index}`} className="nyc-trip-step">
                          <strong>{leg.routeLabel}</strong>
                          <p>
                            Board at {leg.departureStop} toward {leg.headsign}. Ride for {leg.numStops} stops.
                          </p>
                        </div>
                      ))}
                      {option.walkingLegs.slice(0, 2).map((leg, index) => (
                        <div key={`${option.id}-walk-${index}`} className="nyc-trip-step nyc-trip-step--walking">
                          <strong>Walk</strong>
                          <p>{leg.instructions || 'Walking leg'} {leg.durationText ? `(${leg.durationText})` : ''}</p>
                        </div>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <Toast message={toastMessage} isVisible={toastVisible} onClose={() => setToastVisible(false)} />
    </div>
  );
}

export default NycTransitPage;
