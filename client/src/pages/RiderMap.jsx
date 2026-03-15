import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import Toast from '../components/Toast';
import { RouteTrails } from '../components/RouteTrail';
import { checkProximityAndNotify, getPermissionState, requestPermission } from '../services/notifications';
import { Icon, divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import socket from '../services/socket';
import {
  AVERAGE_BUS_SPEED,
  DARK_TILE_URL,
  DEFAULT_ZOOM,
  MAP_CENTER,
  REPORT_TYPES,
  ROUTES,
  ROUTE_COLORS,
  TILE_URL,
} from '../constants';


const REPORT_TYPE_LIST = Object.values(REPORT_TYPES);

const busIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function calculateDistance(lat1, lng1, lat2, lng2) {
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

function calculateETA(busLat, busLng, targetLat, targetLng) {
  const distance = calculateDistance(busLat, busLng, targetLat, targetLng);
  const timeInHours = distance / AVERAGE_BUS_SPEED;
  return Math.max(1, Math.round(timeInHours * 60));
}

function formatRelativeTime(timestamp) {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

function formatRouteName(name) {
  return name.replace(/â†’|→/g, 'to');
}

function isReportNearRoute(report, route) {
  return route.coordinates.some(([lat, lng]) => calculateDistance(report.lat, report.lng, lat, lng) < 1);
}

function getAllStops() {
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

  return Array.from(stopMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function findConnectingRoutes(fromStop, toStop) {
  return ROUTES.filter((route) => {
    const stopNames = route.stops.map((stop) => stop.name);
    return stopNames.includes(fromStop) && stopNames.includes(toStop);
  });
}

function describeNotificationState(state) {
  if (state === 'granted') return 'Alerts on';
  if (state === 'denied') return 'Alerts blocked';
  if (state === 'unsupported') return 'Alerts unavailable';
  return 'Alerts off';
}

function findClosestRouteNumber(report) {
  let closest = null;

  ROUTES.forEach((route) => {
    route.coordinates.forEach(([lat, lng]) => {
      const distance = calculateDistance(report.lat, report.lng, lat, lng);
      if (!closest || distance < closest.distance) {
        closest = { routeNumber: route.number, distance };
      }
    });
  });

  return closest?.routeNumber ?? null;
}

function MapController({ focusTarget }) {
  const map = useMap();

  useEffect(() => {
    if (!focusTarget) return;

    if (focusTarget.bounds) {
      map.fitBounds(focusTarget.bounds, { padding: [48, 48], maxZoom: 14 });
      return;
    }

    if (focusTarget.center) {
      map.setView(focusTarget.center, focusTarget.zoom ?? map.getZoom(), { animate: true });
    }
  }, [focusTarget, map]);

  return null;
}

function RiderMap() {
  const initialRoute = ROUTES[0]?.number ?? null;
  const [vehicles, setVehicles] = useState([]);
  const [reports, setReports] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [locationStatus, setLocationStatus] = useState('loading');
  const [userLocation, setUserLocation] = useState(MAP_CENTER);
  const [activePanel, setActivePanel] = useState('routes');
  const [tripFromStop, setTripFromStop] = useState('');
  const [tripToStop, setTripToStop] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedRoute, setSelectedRoute] = useState(initialRoute);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [notificationState, setNotificationState] = useState(() => getPermissionState());
  const [watchedRoutes, setWatchedRoutes] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('watchedRoutes') || '[]'));
    } catch {
      return new Set();
    }
  });
  const [mapFocus, setMapFocus] = useState(() => {
    const route = ROUTES.find((item) => item.number === initialRoute);
    return route ? { bounds: route.coordinates } : { center: MAP_CENTER, zoom: DEFAULT_ZOOM };
  });

  const vehiclesRef = useRef(vehicles);
  const allStops = useMemo(() => getAllStops(), []);

  useEffect(() => {
    vehiclesRef.current = vehicles;
  }, [vehicles]);

  useEffect(() => {
    document.body.dataset.theme = darkMode ? 'dark' : 'light';
    localStorage.setItem('darkMode', String(darkMode));
    return () => {
      delete document.body.dataset.theme;
    };
  }, [darkMode]);

  useEffect(() => {
    if (watchedRoutes.size === 0) return undefined;
    const interval = setInterval(() => {
      checkProximityAndNotify(vehiclesRef.current, userLocation, watchedRoutes);
    }, 10000);
    return () => clearInterval(interval);
  }, [watchedRoutes, userLocation]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('fallback');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
        setLocationStatus('ready');
      },
      () => {
        setLocationStatus('fallback');
      }
    );
  }, []);

  useEffect(() => {
    const handleVehicles = (data) => setVehicles(data);
    const handleReports = (data) => setReports(data);
    const handleConnect = () => {
      setConnectionStatus('live');
      socket.emit('rider:subscribe');
    };
    const handleDisconnect = () => setConnectionStatus('offline');

    socket.on('vehicles:state', handleVehicles);
    socket.on('reports:state', handleReports);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    if (socket.connected) {
      queueMicrotask(() => {
        setConnectionStatus('live');
        socket.emit('rider:subscribe');
      });
    }

    return () => {
      socket.off('vehicles:state', handleVehicles);
      socket.off('reports:state', handleReports);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, []);

  const pushToast = useCallback((message) => {
    setToastMessage(message);
    setShowToast(true);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((previous) => !previous);
  }, []);

  const focusAllRoutes = useCallback(() => {
    setSelectedRoute(null);
    setMapFocus({ center: MAP_CENTER, zoom: DEFAULT_ZOOM });
  }, []);

  const focusRoute = useCallback((routeNumber) => {
    const route = ROUTES.find((item) => item.number === routeNumber);
    if (!route) return;
    setSelectedRoute(routeNumber);
    setActivePanel('routes');
    setMapFocus({ bounds: route.coordinates });
  }, []);

  const focusStop = useCallback((stop, routeNumber) => {
    if (routeNumber) {
      setSelectedRoute(routeNumber);
    }
    setMapFocus({ center: [stop.lat, stop.lng], zoom: 15 });
  }, []);

  const focusVehicle = useCallback((vehicle) => {
    setSelectedRoute(vehicle.route);
    setMapFocus({ center: [vehicle.lat, vehicle.lng], zoom: 15 });
  }, []);

  const focusUserLocation = useCallback(() => {
    setMapFocus({ center: userLocation, zoom: 15 });
  }, [userLocation]);

  const toggleWatchRoute = useCallback(
    async (routeNumber) => {
      const granted = await requestPermission();
      setNotificationState(getPermissionState());

      if (!granted) {
        pushToast('Enable browser notifications to watch a route.');
        return;
      }

      let nextMessage = '';

      setWatchedRoutes((previous) => {
        const next = new Set(previous);
        if (next.has(routeNumber)) {
          next.delete(routeNumber);
          nextMessage = `Stopped watching route ${routeNumber}.`;
        } else {
          next.add(routeNumber);
          nextMessage = `Watching route ${routeNumber} for nearby buses.`;
        }
        localStorage.setItem('watchedRoutes', JSON.stringify([...next]));
        return next;
      });

      pushToast(nextMessage);
    },
    [pushToast]
  );

  const submitReport = useCallback(
    (reportType) => {
      if (connectionStatus !== 'live') {
        pushToast('Reconnect to share a live rider report.');
        return;
      }

      socket.emit('report:create', {
        type: reportType.id,
        lat: userLocation[0],
        lng: userLocation[1],
      });

      pushToast(`${reportType.label} report shared.`);
    },
    [connectionStatus, pushToast, userLocation]
  );

  const reportCountsByRoute = useMemo(
    () =>
      Object.fromEntries(
        ROUTES.map((route) => {
          const counts = {};
          reports.forEach((report) => {
            if (!isReportNearRoute(report, route)) return;
            counts[report.type] = (counts[report.type] || 0) + 1;
          });
          return [route.number, counts];
        })
      ),
    [reports]
  );

  const routeCards = useMemo(
    () =>
      ROUTES.map((route) => {
        const activeVehicles = vehicles.filter((vehicle) => vehicle.route === route.number);
        const reportCounts = reportCountsByRoute[route.number] || {};
        const totalReports = Object.values(reportCounts).reduce((sum, count) => sum + count, 0);
        const nextEta = activeVehicles.length
          ? Math.min(
              ...activeVehicles.map((vehicle) =>
                calculateETA(vehicle.lat, vehicle.lng, userLocation[0], userLocation[1])
              )
            )
          : null;

        return {
          ...route,
          activeVehicles,
          reportCounts,
          totalReports,
          nextEta,
          isWatched: watchedRoutes.has(route.number),
        };
      }).sort((left, right) => {
        if (right.activeVehicles.length !== left.activeVehicles.length) {
          return right.activeVehicles.length - left.activeVehicles.length;
        }
        if (left.nextEta === null && right.nextEta !== null) return 1;
        if (right.nextEta === null && left.nextEta !== null) return -1;
        return left.number.localeCompare(right.number);
      }),
    [reportCountsByRoute, userLocation, vehicles, watchedRoutes]
  );

  const selectedRouteData = useMemo(
    () => routeCards.find((route) => route.number === selectedRoute) ?? null,
    [routeCards, selectedRoute]
  );

  const filteredVehicles = useMemo(
    () => (selectedRoute ? vehicles.filter((vehicle) => vehicle.route === selectedRoute) : vehicles),
    [selectedRoute, vehicles]
  );

  const selectedRouteVehicles = useMemo(() => {
    const source = selectedRouteData?.activeVehicles ?? filteredVehicles;
    return [...source]
      .map((vehicle) => ({
        ...vehicle,
        eta: calculateETA(vehicle.lat, vehicle.lng, userLocation[0], userLocation[1]),
      }))
      .sort((left, right) => left.eta - right.eta);
  }, [filteredVehicles, selectedRouteData, userLocation]);

  const visibleReports = useMemo(() => {
    if (!selectedRouteData) return reports;
    return reports.filter((report) => isReportNearRoute(report, selectedRouteData));
  }, [reports, selectedRouteData]);

  const recentReports = useMemo(
    () =>
      [...reports]
        .sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp))
        .slice(0, 6)
        .map((report) => ({ ...report, routeNumber: findClosestRouteNumber(report) })),
    [reports]
  );

  const reportSummary = useMemo(
    () =>
      REPORT_TYPE_LIST.map((type) => ({
        ...type,
        count: reports.filter((report) => report.type === type.id).length,
      })),
    [reports]
  );

  const closestStop = useMemo(() => {
    if (!allStops.length) return null;
    return allStops
      .map((stop) => ({
        ...stop,
        distanceKm: calculateDistance(userLocation[0], userLocation[1], stop.lat, stop.lng),
      }))
      .sort((left, right) => left.distanceKm - right.distanceKm)[0];
  }, [allStops, userLocation]);

  useEffect(() => {
    if (!closestStop || tripFromStop) return;
    setTripFromStop(closestStop.name);
  }, [closestStop, tripFromStop]);

  const tripResults = useMemo(() => {
    if (!tripFromStop || !tripToStop || tripFromStop === tripToStop) return [];

    return findConnectingRoutes(tripFromStop, tripToStop).map((route) => {
      const fromStop = route.stops.find((stop) => stop.name === tripFromStop);
      const activeVehicles = vehicles.filter((vehicle) => vehicle.route === route.number);
      const nextVehicle = activeVehicles
        .map((vehicle) => ({
          ...vehicle,
          eta: calculateETA(vehicle.lat, vehicle.lng, fromStop.lat, fromStop.lng),
        }))
        .sort((left, right) => left.eta - right.eta)[0];

      return {
        ...route,
        busCount: activeVehicles.length,
        eta: nextVehicle?.eta ?? null,
      };
    });
  }, [tripFromStop, tripToStop, vehicles]);

  const showEtaLabels = selectedRoute !== null || filteredVehicles.length <= 3;

  const createEtaIcon = useCallback(
    (eta) =>
      divIcon({
        className: 'custom-eta-label',
        html: `<div style="
          background: ${darkMode ? '#111827' : '#ffffff'};
          color: ${darkMode ? '#f9fafb' : '#111827'};
          border: 1px solid ${darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.08)'};
          padding: 4px 8px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          box-shadow: 0 8px 18px rgba(15,23,42,0.18);
          white-space: nowrap;
        ">~${eta} min</div>`,
        iconSize: [68, 26],
        iconAnchor: [34, 44],
      }),
    [darkMode]
  );

  const routePanel = (
    <div className="panel-stack">
      <div className="panel-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Route board</p>
            <h2 className="section-title">Pick a route with a reason</h2>
          </div>
          <button type="button" className="text-action" onClick={focusAllRoutes}>
            Show all lines
          </button>
        </div>

        <div className="route-grid">
          {routeCards.map((route) => (
            <div
              key={route.id}
              className={`route-card ${selectedRoute === route.number ? 'is-active' : ''}`}
              style={{ '--route-color': ROUTE_COLORS[route.number] || '#6b7280' }}
            >
              <button type="button" className="route-card-select" onClick={() => focusRoute(route.number)}>
                <div className="route-card-header">
                  <span className="route-pill">{route.number}</span>
                  <span className="route-meta">{route.activeVehicles.length} live</span>
                </div>

                <strong className="route-card-title">{formatRouteName(route.name)}</strong>

                <div className="route-card-stats">
                  <span>{route.stops.length} stops</span>
                  <span>{route.totalReports} reports</span>
                  <span>{route.nextEta ? `~${route.nextEta} min` : 'No bus nearby'}</span>
                </div>
              </button>

              <button
                type="button"
                className={`route-watch ${route.isWatched ? 'is-active' : ''}`}
                onClick={() => toggleWatchRoute(route.number)}
              >
                {route.isWatched ? 'Watching' : 'Watch'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="panel-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Active detail</p>
            <h2 className="section-title">{selectedRouteData ? `Route ${selectedRouteData.number}` : 'Network overview'}</h2>
          </div>

          <div className="section-actions">
            {selectedRouteData && (
              <button
                type="button"
                className="ghost-action"
                onClick={() => setMapFocus({ bounds: selectedRouteData.coordinates })}
              >
                Fit route
              </button>
            )}
            <button type="button" className="ghost-action" onClick={focusUserLocation}>
              My location
            </button>
          </div>
        </div>

        {selectedRouteData ? (
          <>
            <p className="section-copy">{formatRouteName(selectedRouteData.name)}</p>

            <div className="detail-metrics">
              <div className="detail-chip">
                <span className="detail-chip-label">Buses</span>
                <strong>{selectedRouteData.activeVehicles.length}</strong>
              </div>
              <div className="detail-chip">
                <span className="detail-chip-label">Stops</span>
                <strong>{selectedRouteData.stops.length}</strong>
              </div>
              <div className="detail-chip">
                <span className="detail-chip-label">Reports</span>
                <strong>{selectedRouteData.totalReports}</strong>
              </div>
            </div>

            <div className="subsection">
              <h3 className="subsection-title">Next arrivals to you</h3>

              {selectedRouteVehicles.length > 0 ? (
                <div className="vehicle-list">
                  {selectedRouteVehicles.map((vehicle) => (
                    <button key={vehicle.id} type="button" className="vehicle-card" onClick={() => focusVehicle(vehicle)}>
                      <div>
                        <strong>Bus {vehicle.id}</strong>
                        <p>{vehicle.accessible ? 'Accessible vehicle' : 'Standard boarding'}</p>
                      </div>
                      <span className="vehicle-eta">~{vehicle.eta} min</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="empty-state">No live vehicles are broadcasting on this route right now.</div>
              )}
            </div>

            <div className="subsection">
              <h3 className="subsection-title">Stops on this route</h3>

              <div className="stop-list">
                {selectedRouteData.stops.map((stop) => (
                  <button
                    key={`${selectedRouteData.id}-${stop.name}`}
                    type="button"
                    className="stop-chip"
                    onClick={() => focusStop(stop, selectedRouteData.number)}
                  >
                    <span>{stop.name}</span>
                    <small>Focus map</small>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            View the full network or pick a route to see arrivals, stops, and rider context.
          </div>
        )}
      </div>
    </div>
  );

  const tripPanel = (
    <div className="panel-stack">
      <div className="panel-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Trip planner</p>
            <h2 className="section-title">Find a direct route fast</h2>
          </div>
          {closestStop && (
            <button type="button" className="text-action" onClick={() => setTripFromStop(closestStop.name)}>
              Use closest stop
            </button>
          )}
        </div>

        <div className="form-grid">
          <label className="field">
            <span className="field-label">From</span>
            <select value={tripFromStop} onChange={(event) => setTripFromStop(event.target.value)}>
              <option value="">Select stop</option>
              {allStops.map((stop) => (
                <option key={`from-${stop.name}`} value={stop.name}>
                  {stop.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field-label">To</span>
            <select value={tripToStop} onChange={(event) => setTripToStop(event.target.value)}>
              <option value="">Select stop</option>
              {allStops
                .filter((stop) => stop.name !== tripFromStop)
                .map((stop) => (
                  <option key={`to-${stop.name}`} value={stop.name}>
                    {stop.name}
                  </option>
                ))}
            </select>
          </label>
        </div>
      </div>

      <div className="panel-section">
        <h3 className="subsection-title">Best direct options</h3>

        {tripFromStop && tripToStop && tripResults.length === 0 && (
          <div className="empty-state">No direct route connects those stops in the current demo data.</div>
        )}

        {!tripFromStop || !tripToStop ? (
          <div className="empty-state">Choose both stops to get a live route recommendation.</div>
        ) : null}

        {tripResults.length > 0 && (
          <div className="trip-results">
            {tripResults.map((route) => (
              <div
                key={route.id}
                className="trip-card"
                style={{ '--route-color': ROUTE_COLORS[route.number] || '#6b7280' }}
              >
                <div>
                  <div className="route-card-header">
                    <span className="route-pill">{route.number}</span>
                    <span className="route-meta">{route.busCount} live</span>
                  </div>
                  <strong className="route-card-title">{formatRouteName(route.name)}</strong>
                  <p className="trip-card-copy">
                    {route.eta
                      ? `Closest bus reaches ${tripFromStop} in about ${route.eta} min.`
                      : 'No active bus on this route right now.'}
                  </p>
                </div>

                <button type="button" className="ghost-action" onClick={() => focusRoute(route.number)}>
                  Show on map
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const reportPanel = (
    <div className="panel-stack">
      <div className="panel-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Crowd reports</p>
            <h2 className="section-title">Share the ride condition</h2>
          </div>
          <span className="section-note">
            {connectionStatus === 'live' ? 'Uses your current location' : 'Reconnect to send live updates'}
          </span>
        </div>

        <div className="report-grid">
          {reportSummary.map((reportType) => (
            <button
              key={reportType.id}
              type="button"
              className="report-card"
              style={{ '--report-color': reportType.color }}
              onClick={() => submitReport(reportType)}
              disabled={connectionStatus !== 'live'}
            >
              <span className="report-count">{reportType.count}</span>
              <strong>{reportType.label}</strong>
              <span className="report-caption">
                {reportType.count === 1 ? '1 active report' : `${reportType.count} active reports`}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="panel-section">
        <h3 className="subsection-title">Latest rider activity</h3>

        {recentReports.length > 0 ? (
          <div className="activity-list">
            {recentReports.map((report) => {
              const reportType = REPORT_TYPE_LIST.find((type) => type.id === report.type);
              return (
                <button
                  key={report.id}
                  type="button"
                  className="activity-item"
                  onClick={() => setMapFocus({ center: [report.lat, report.lng], zoom: 15 })}
                >
                  <span className="activity-dot" style={{ backgroundColor: reportType?.color || '#f59e0b' }} />
                  <div className="activity-copy">
                    <strong>{reportType?.label || 'Report'}</strong>
                    <p>
                      {report.routeNumber ? `Near route ${report.routeNumber}` : 'General map area'} ·{' '}
                      {formatRelativeTime(report.timestamp)}
                    </p>
                  </div>
                  <span className="activity-action">Locate</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">No active rider reports right now.</div>
        )}
      </div>
    </div>
  );

  const mapPanel = (
    <section className="rider-map-card">
      <div className="map-topbar">
        <div>
          <p className="eyebrow">Live map</p>
          <h2 className="section-title">{selectedRouteData ? `Route ${selectedRouteData.number}` : 'Full network'}</h2>
        </div>

        <div className="section-actions">
          {selectedRouteData && (
            <button
              type="button"
              className="ghost-action ghost-action--chrome"
              onClick={() => setMapFocus({ bounds: selectedRouteData.coordinates })}
            >
              Fit route
            </button>
          )}
          <button type="button" className="ghost-action ghost-action--chrome" onClick={focusUserLocation}>
            My location
          </button>
        </div>
      </div>

      <div className="map-stage">
        <MapContainer center={MAP_CENTER} zoom={DEFAULT_ZOOM} className="map-canvas">
          <TileLayer
            key={darkMode ? 'dark' : 'light'}
            attribution={
              darkMode
                ? '&copy; <a href="https://carto.com/">CARTO</a>'
                : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }
            url={darkMode ? DARK_TILE_URL : TILE_URL}
          />

          <MapController focusTarget={mapFocus} />

          <CircleMarker center={userLocation} radius={8} fillColor="#2563eb" fillOpacity={0.85} stroke={false} />
          <CircleMarker center={userLocation} radius={18} fillColor="#2563eb" fillOpacity={0.22} stroke={false} />

          <RouteTrails
          selectedRoute={selectedRoute}
          onRouteClick={focusRoute}
          formatRouteName={formatRouteName}
          />

          {(selectedRouteData?.stops ?? []).map((stop) => (
            <CircleMarker
              key={`${selectedRouteData.id}-${stop.name}`}
              center={[stop.lat, stop.lng]}
              radius={7}
              fillColor="#ffffff"
              fillOpacity={1}
              stroke
              color={ROUTE_COLORS[selectedRouteData.number] || '#6b7280'}
              weight={3}
              eventHandlers={{ click: () => focusStop(stop, selectedRouteData.number) }}
            >
              <Popup>
                <div className="map-popup">
                  <strong>{stop.name}</strong>
                  <p>Route {selectedRouteData.number}</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {filteredVehicles.flatMap((vehicle) => {
            const eta = calculateETA(vehicle.lat, vehicle.lng, userLocation[0], userLocation[1]);
            const markers = [];

            if (showEtaLabels) {
              markers.push(
                <Marker
                  key={`${vehicle.id}-eta`}
                  position={[vehicle.lat, vehicle.lng]}
                  icon={createEtaIcon(eta)}
                  zIndexOffset={1000}
                />
              );
            }

            markers.push(
              <Marker key={vehicle.id} position={[vehicle.lat, vehicle.lng]} icon={busIcon}>
                <Popup>
                  <div className="map-popup">
                    <strong>Route {vehicle.route}</strong>
                    <p>{formatRouteName(ROUTES.find((route) => route.number === vehicle.route)?.name || 'Unknown route')}</p>
                    <p>ETA to you: ~{eta} min</p>
                    {vehicle.accessible && <p>Accessible vehicle</p>}
                  </div>
                </Popup>
              </Marker>
            );

            return markers;
          })}

          {visibleReports.map((report) => {
            const reportType = REPORT_TYPE_LIST.find((type) => type.id === report.type);

            return (
              <CircleMarker
                key={report.id}
                center={[report.lat, report.lng]}
                radius={10}
                fillColor={reportType?.color || '#f59e0b'}
                fillOpacity={0.85}
                stroke
                color="#ffffff"
                weight={2}
              >
                <Popup>
                  <div className="map-popup">
                    <strong>{reportType?.label || 'Report'}</strong>
                    <p>{formatRelativeTime(report.timestamp)}</p>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      <div className="map-overlay">
        <div>
          <strong>
            {selectedRouteData
              ? `${selectedRouteData.activeVehicles.length} buses on route ${selectedRouteData.number}`
              : `${vehicles.length} buses across ${ROUTES.length} routes`}
          </strong>
          <p>
            {selectedRouteData
              ? `${selectedRouteData.totalReports} rider reports near this line`
              : `${reports.length} active rider reports network-wide`}
          </p>
        </div>

        {selectedRouteData ? (
          <button type="button" className="ghost-action ghost-action--chrome" onClick={focusAllRoutes}>
            Back to all routes
          </button>
        ) : null}
      </div>
    </section>
  );

  return (
    <div className="rider-shell">
      <aside className="rider-sidebar">
        <header className="dashboard-card dashboard-card--hero">
          <div className="hero-topline">
            <div>
              <p className="eyebrow">Live rider desk</p>
              <h1 className="hero-title">Kingston Transit Tracker</h1>
            </div>
            <button className="theme-toggle" type="button" onClick={toggleDarkMode}>
              {darkMode ? 'Light map' : 'Dark map'}
            </button>
          </div>

          <p className="hero-copy">
            Plan the trip, watch the route, and send rider updates without hunting through floating buttons.
          </p>

          <div className="summary-grid">
            <div className="metric-card">
              <span className="metric-label">Connection</span>
              <strong className="metric-value">
                {connectionStatus === 'live' ? 'Live' : connectionStatus === 'connecting' ? 'Connecting' : 'Offline'}
              </strong>
              <span className="metric-subtle">{vehicles.length} buses updating now</span>
            </div>

            <div className="metric-card">
              <span className="metric-label">Rider reports</span>
              <strong className="metric-value">{reports.length}</strong>
              <span className="metric-subtle">Shared conditions still active</span>
            </div>

            <div className="metric-card">
              <span className="metric-label">Closest stop</span>
              <strong className="metric-value">{closestStop ? closestStop.name : 'Finding...'}</strong>
              <span className="metric-subtle">
                {closestStop
                  ? `${closestStop.distanceKm.toFixed(1)} km away`
                  : locationStatus === 'fallback'
                    ? 'Using Kingston center'
                    : 'Waiting for location'}
              </span>
            </div>

            <div className="metric-card">
              <span className="metric-label">Route alerts</span>
              <strong className="metric-value">{watchedRoutes.size}</strong>
              <span className="metric-subtle">{describeNotificationState(notificationState)}</span>
            </div>
          </div>
        </header>

        <section className="dashboard-card dashboard-card--tabs">
          <div className="panel-tabs" role="tablist" aria-label="Rider tools">
            {[
              ['routes', 'Routes'],
              ['trip', 'Trip'],
              ['report', 'Report'],
            ].map(([panelId, label]) => (
              <button
                key={panelId}
                type="button"
                className={`panel-tab ${activePanel === panelId ? 'is-active' : ''}`}
                onClick={() => setActivePanel(panelId)}
              >
                {label}
              </button>
            ))}
          </div>

          {activePanel === 'routes' && routePanel}
          {activePanel === 'trip' && tripPanel}
          {activePanel === 'report' && reportPanel}
        </section>
      </aside>

      <main className="rider-map-panel">{mapPanel}</main>

      <Toast message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
    </div>
  );
}

export default RiderMap;
