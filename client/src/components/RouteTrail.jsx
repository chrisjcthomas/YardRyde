// RouteTrail.jsx
// Drop-in replacement / enhancement for the Polyline route rendering in RiderMap.jsx
//
// Usage: replace the existing ROUTES.map Polyline block in RiderMap with <RouteTrails />
//
// Features:
//  • Colour-coded route polylines matching ROUTE_COLORS
//  • Animated dashed "flow" overlay showing travel direction
//  • Chevron arrow decorators at regular intervals (Google Maps style)
//  • Active route is full-weight; inactive routes fade back
//  • Clicking a route line calls onRouteClick(routeNumber)

import { useEffect, useRef } from 'react';
import { Polyline, useMap, Popup } from 'react-leaflet';
import L from 'leaflet';
import { ROUTES, ROUTE_COLORS } from '../constants';

// ── Utility: place arrow markers along a polyline ─────────────────────────────
function createArrowMarker(color) {
  return L.divIcon({
    className: '',
    html: `<svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
      <polygon points="7,1 13,13 7,9 1,13" fill="${color}" opacity="0.9"/>
    </svg>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function bearing(from, to) {
  const lat1 = (from[0] * Math.PI) / 180;
  const lat2 = (to[0] * Math.PI) / 180;
  const dLng = ((to[1] - from[1]) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function interpolate(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function placeArrows(map, coords, color, interval = 0.25) {
  const markers = [];
  // Walk segments and place an arrow every `interval` fraction of total length
  for (let i = 0; i < coords.length - 1; i++) {
    const from = coords[i];
    const to = coords[i + 1];
    const mid = interpolate(from, to, 0.5);
    const deg = bearing(from, to);

    const icon = L.divIcon({
      className: '',
      html: `<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"
              style="transform: rotate(${deg}deg); transform-origin: 8px 8px;">
        <path d="M8 2 L13 12 L8 9 L3 12 Z" fill="${color}" opacity="0.85"/>
      </svg>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    const marker = L.marker(mid, { icon, interactive: false, keyboard: false });
    markers.push(marker);
    marker.addTo(map);
  }
  return markers;
}

// ── Component ─────────────────────────────────────────────────────────────────
function RouteArrows({ route, isActive }) {
  const map = useMap();
  const markersRef = useRef([]);
  const color = ROUTE_COLORS[route.number] || '#6b7280';

  useEffect(() => {
    // Remove old arrows
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (!isActive) return;

    const arrows = placeArrows(map, route.coordinates, color);
    markersRef.current = arrows;

    return () => {
      arrows.forEach((m) => m.remove());
    };
  }, [isActive, map, route, color]);

  return null;
}

// Animated dashed flow line (CSS animation via a custom Leaflet layer)
function AnimatedFlowLine({ route, isActive }) {
  const map = useMap();
  const layerRef = useRef(null);
  const color = ROUTE_COLORS[route.number] || '#6b7280';

  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }
    if (!isActive) return;

    const latlngs = route.coordinates.map(([lat, lng]) => [lat, lng]);
    const layer = L.polyline(latlngs, {
      color,
      weight: 3,
      opacity: 0.5,
      dashArray: '10 14',
      dashOffset: '0',
      className: `route-flow-line route-flow-${route.number}`,
    });

    layer.addTo(map);
    layerRef.current = layer;

    // CSS keyframe animation for the dash offset
    const styleId = `flow-style-${route.number}`;
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .route-flow-${route.number} {
          animation: routeFlow${route.number} 1.4s linear infinite;
        }
        @keyframes routeFlow${route.number} {
          to { stroke-dashoffset: -24; }
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      map.removeLayer(layer);
    };
  }, [isActive, map, route, color]);

  return null;
}

// ── Main export ───────────────────────────────────────────────────────────────
export function RouteTrails({ selectedRoute, onRouteClick, formatRouteName }) {
  return ROUTES.map((route) => {
    const color = ROUTE_COLORS[route.number] || '#6b7280';
    const isActive = !selectedRoute || selectedRoute === route.number;
    const isSelected = selectedRoute === route.number;

    return (
      <span key={route.id}>
        {/* ── Base solid line (full route path) ── */}
        <Polyline
          positions={route.coordinates}
          pathOptions={{
            color,
            weight: isSelected ? 6 : isActive ? 4 : 2,
            opacity: isActive ? 0.9 : 0.18,
            lineCap: 'round',
            lineJoin: 'round',
          }}
          eventHandlers={{
            click: () => onRouteClick(route.number),
            mouseover: (e) => {
              e.target.setStyle({ weight: isSelected ? 6 : 5, opacity: 1 });
            },
            mouseout: (e) => {
              e.target.setStyle({
                weight: isSelected ? 6 : isActive ? 4 : 2,
                opacity: isActive ? 0.9 : 0.18,
              });
            },
          }}
        >
          <Popup>
            <div className="map-popup">
              <strong>Route {route.number}</strong>
              <p>{formatRouteName(route.name)}</p>
            </div>
          </Popup>
        </Polyline>

        {/* ── Animated dashed flow overlay ── */}
        <AnimatedFlowLine route={route} isActive={isActive} />

        {/* ── Direction arrow decorators ── */}
        <RouteArrows route={route} isActive={isSelected} />
      </span>
    );
  });
}
