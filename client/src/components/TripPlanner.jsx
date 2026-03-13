import { useState, useMemo } from 'react';
import { ROUTES } from '../constants';

function getAllStops() {
  const stopMap = new Map();
  ROUTES.forEach((route) => {
    route.stops.forEach((stop) => {
      const key = stop.name;
      if (!stopMap.has(key)) {
        stopMap.set(key, { ...stop, routes: [route.number] });
      } else {
        stopMap.get(key).routes.push(route.number);
      }
    });
  });
  return Array.from(stopMap.values());
}

function findConnectingRoutes(from, to) {
  const results = [];
  ROUTES.forEach((route) => {
    const stopNames = route.stops.map(s => s.name);
    if (stopNames.includes(from) && stopNames.includes(to)) {
      results.push(route);
    }
  });
  return results;
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function TripPlanner({ isOpen, onClose, vehicles, darkMode }) {
  const [fromStop, setFromStop] = useState('');
  const [toStop, setToStop] = useState('');

  const allStops = useMemo(() => getAllStops(), []);

  const results = useMemo(() => {
    if (!fromStop || !toStop || fromStop === toStop) return null;
    const routes = findConnectingRoutes(fromStop, toStop);
    return routes.map((route) => {
      const fromStopData = route.stops.find(s => s.name === fromStop);
      const nearestBus = vehicles
        .filter(v => v.route === route.number)
        .map(v => ({
          ...v,
          dist: haversine(v.lat, v.lng, fromStopData.lat, fromStopData.lng)
        }))
        .sort((a, b) => a.dist - b.dist)[0];
      const eta = nearestBus ? Math.max(1, Math.round((nearestBus.dist / 20) * 60)) : null;
      return { route, eta, hasBus: !!nearestBus };
    });
  }, [fromStop, toStop, vehicles]);

  if (!isOpen) return null;

  const bg = darkMode ? '#1e1e1e' : 'white';
  const text = darkMode ? '#f3f4f6' : '#111827';
  const subtext = darkMode ? '#9ca3af' : '#6b7280';
  const border = darkMode ? '#374151' : '#f3f4f6';
  const inputBg = darkMode ? '#2a2a2a' : '#f9fafb';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />
      <div style={{
        position: 'relative', width: '100%', maxWidth: '420px', backgroundColor: bg,
        borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        border: `1px solid ${border}`, overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: `1px solid ${border}` }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: text, margin: 0 }}>Trip Planner</h2>
            <p style={{ fontSize: '14px', color: subtext, margin: '4px 0 0' }}>Find your route</p>
          </div>
          <button onClick={onClose} style={{ padding: '8px', borderRadius: '50%', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#9ca3af', fontSize: '24px' }}>
            ✕
          </button>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: subtext, textTransform: 'uppercase', letterSpacing: '0.05em' }}>From</label>
            <select value={fromStop} onChange={e => setFromStop(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${border}`, backgroundColor: inputBg, color: text, fontSize: '14px', marginTop: '4px' }}>
              <option value="">Select stop...</option>
              {allStops.map(s => <option key={`from-${s.name}`} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: subtext, textTransform: 'uppercase', letterSpacing: '0.05em' }}>To</label>
            <select value={toStop} onChange={e => setToStop(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${border}`, backgroundColor: inputBg, color: text, fontSize: '14px', marginTop: '4px' }}>
              <option value="">Select stop...</option>
              {allStops.filter(s => s.name !== fromStop).map(s => <option key={`to-${s.name}`} value={s.name}>{s.name}</option>)}
            </select>
          </div>

          {results && results.length === 0 && (
            <div style={{ textAlign: 'center', padding: '16px', color: subtext }}>
              No direct routes found between these stops.
            </div>
          )}

          {results && results.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {results.map(({ route, eta, hasBus }) => (
                <div key={route.id} style={{
                  padding: '12px 16px', borderRadius: '12px',
                  border: `1px solid ${border}`, backgroundColor: inputBg,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 'bold', color: text }}>Route {route.number}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '13px', color: subtext }}>{route.name}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {hasBus ? (
                      <p style={{ margin: 0, fontWeight: 'bold', color: '#17a14e', fontSize: '16px' }}>~{eta} min</p>
                    ) : (
                      <p style={{ margin: 0, fontSize: '13px', color: subtext }}>No bus active</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TripPlanner;
