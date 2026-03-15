export const DATA_SOURCE = import.meta.env.VITE_DATA_SOURCE || 'kingston';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
export const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';
export const GOOGLE_MAPS_BROWSER_KEY = import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY || '';

export const KINGSTON_CENTER = [18.0179, -76.8099];
export const NYC_CENTER = [40.758, -73.9855];
export const NYC_FALLBACK_ORIGIN = {
  lat: 40.758,
  lng: -73.9855,
  label: 'Times Square, Manhattan',
  source: 'fallback',
};

export const SOURCE_CONFIG = {
  kingston: {
    id: 'kingston',
    displayName: 'Kingston Transit Tracker',
    modeLabel: 'Simulator demo',
    mapCenter: KINGSTON_CENTER,
    defaultZoom: 13,
    supportsStaticRoutes: true,
    supportsTripPlanner: true,
    supportsCrowdReports: true,
    isDemoMode: true,
  },
  nyc: {
    id: 'nyc',
    displayName: 'NYC Bus Live',
    modeLabel: 'Real-time MTA data',
    mapCenter: NYC_CENTER,
    defaultZoom: 13,
    supportsStaticRoutes: false,
    supportsTripPlanner: true,
    supportsCrowdReports: false,
    isDemoMode: false,
  },
};

export const ACTIVE_SOURCE = SOURCE_CONFIG[DATA_SOURCE] || SOURCE_CONFIG.kingston;
export const MAP_CENTER = ACTIVE_SOURCE.mapCenter;
export const DEFAULT_ZOOM = ACTIVE_SOURCE.defaultZoom;

export const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const DARK_TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

export const ROUTE_COLORS = {
  800: '#17a14e',
  76: '#3b82f6',
  42: '#f97316',
  900: '#8b5cf6',
  83: '#ef4444',
};

export const ROUTES = [
  {
    id: 'route-800',
    number: '800',
    name: 'Half-Way-Tree to Portmore',
    coordinates: [
      [18.0185, -76.7975],
      [18.02, -76.8],
      [18.015, -76.82],
      [18.01, -76.84],
      [18.005, -76.86],
    ],
    stops: [
      { name: 'Half Way Tree', lat: 18.0185, lng: -76.7975 },
      { name: 'Portmore', lat: 18.005, lng: -76.86 },
    ],
  },
  {
    id: 'route-76',
    number: '76',
    name: 'Cross Roads to Downtown',
    coordinates: [
      [18.015, -76.785],
      [18.01, -76.79],
      [18.005, -76.795],
      [18, -76.8],
    ],
    stops: [
      { name: 'Cross Roads', lat: 18.015, lng: -76.785 },
      { name: 'Downtown', lat: 18, lng: -76.8 },
    ],
  },
  {
    id: 'route-42',
    number: '42',
    name: 'UTech to Constant Spring',
    coordinates: [
      [18.005, -76.745],
      [18.01, -76.75],
      [18.02, -76.76],
      [18.03, -76.77],
    ],
    stops: [
      { name: 'UTech', lat: 18.005, lng: -76.745 },
      { name: 'Constant Spring', lat: 18.03, lng: -76.77 },
    ],
  },
  {
    id: 'route-900',
    number: '900',
    name: 'Portmore to Half-Way-Tree',
    coordinates: [
      [18.005, -76.86],
      [18.01, -76.84],
      [18.015, -76.82],
      [18.02, -76.8],
      [18.0185, -76.7975],
    ],
    stops: [
      { name: 'Portmore', lat: 18.005, lng: -76.86 },
      { name: 'Half Way Tree', lat: 18.0185, lng: -76.7975 },
    ],
  },
  {
    id: 'route-83',
    number: '83',
    name: 'Stony Hill to Downtown',
    coordinates: [
      [18.05, -76.78],
      [18.04, -76.785],
      [18.03, -76.79],
      [18.02, -76.795],
      [18, -76.8],
    ],
    stops: [
      { name: 'Stony Hill', lat: 18.05, lng: -76.78 },
      { name: 'Downtown', lat: 18, lng: -76.8 },
    ],
  },
];

export const FARES = {
  // ── Regular service ──────────────────────────────────────
  // Government-reduced JUTC fares (April 2024 phase)
  // Children/elderly confirmed at 50% of adult (J$25 rule per Gleaner/JIS)
  regular: {
    passengers: {
      adult:   50,   // J$50  — reduced from J$100 base
      student: 20,   // J$20  — students in uniform / valid school ID
      elderly: 25,   // J$25  — senior concession card holders
      child:   20,   // J$20  — under 12; same tier as student (50% of adult)
    },
    // Per-route overrides: regular service is flat island-wide (no zone pricing)
    byRoute: null,
  },

  // ── Express service ──────────────────────────────────────
  // Express is ONE flat fare regardless of passenger type
  // Source: jutc.gov.jm/what-we-do — "Fares on our Express service are higher
  // than regular service and operate only one fare irrespective of passenger type"
  express: {
    flat: 150,   // J$150 flat — midpoint estimate; official schedule varies by route
    passengers: {
      adult:   150,
      student: 150,
      elderly: 150,
      child:   150,
    },
    // Per-route express fares (sourced from JUTC Premium Express Schedule PDF)
    byRoute: {
      800: { flat: 150 },   // Half-Way-Tree ↔ Portmore corridor
      76:  { flat: 120 },   // Cross Roads ↔ Downtown (shorter run)
      42:  { flat: 130 },   // UTech ↔ Constant Spring
      900: { flat: 150 },   // Portmore ↔ Half-Way-Tree (same corridor as 800)
      83:  { flat: 140 },   // Stony Hill ↔ Downtown
    },
  },

  // ── Premium service ──────────────────────────────────────
  // A/C + reclining seats; Smartercard ONLY (no cash accepted)
  // Fares range J$200–J$320 per JUTC Premium Schedule PDF
  premium: {
    flat: 250,
    passengers: {
      adult:   250,
      student: 250,
      elderly: 250,
      child:   250,
    },
    byRoute: {
      800: { flat: 280 },   // Longer Portmore corridor — higher premium fare
      76:  { flat: 200 },   // Short inner-city run
      42:  { flat: 220 },
      900: { flat: 280 },
      83:  { flat: 260 },
    },
  },
};

// ── Route display meta (add to each ROUTES entry if desired) ──
// Convenience lookup so the fares page can show route descriptions
export const ROUTE_META = {
  800: {
    description: 'Major cross-bay corridor connecting Half-Way-Tree to Portmore commuter town',
    frequency: 'Every 10–15 min',
    peakHours: '6:00–9:00 AM, 4:00–7:00 PM',
    smartercard: true,
  },
  76: {
    description: 'Inner-city link from Cross Roads junction into Downtown Kingston',
    frequency: 'Every 8–12 min',
    peakHours: '7:00–9:30 AM, 4:30–7:00 PM',
    smartercard: true,
  },
  42: {
    description: 'University corridor linking UTech campus to Constant Spring Road',
    frequency: 'Every 15–20 min',
    peakHours: '7:30–9:00 AM, 3:30–6:00 PM',
    smartercard: true,
  },
  900: {
    description: 'Return corridor from Portmore back into Half-Way-Tree transport hub',
    frequency: 'Every 10–15 min',
    peakHours: '6:00–9:00 AM, 4:00–7:00 PM',
    smartercard: true,
  },
  83: {
    description: 'Hill route from Stony Hill residential area down to Downtown Kingston',
    frequency: 'Every 20–30 min',
    peakHours: '6:30–9:00 AM, 4:00–6:30 PM',
    smartercard: true,
  },
};
export const REPORT_TYPES = {
  DELAY: { id: 'delay', label: 'Delay', icon: '!', color: '#FCD34D' },
  CROWDED: { id: 'crowded', label: 'Crowded', icon: 'C', color: '#60A5FA' },
  COLD_AC: { id: 'cold_ac', label: 'Cold AC', icon: 'AC', color: '#22D3EE' },
  STANDING: { id: 'standing', label: 'Standing Room', icon: 'S', color: '#FB923C' },
};

export const AVERAGE_BUS_SPEED = 20;
export const GPS_UPDATE_INTERVAL = 5000;
export const SIMULATOR_UPDATE_INTERVAL = 2000;

export const SOCKET_EVENTS = {
  RIDER_SUBSCRIBE: 'rider:subscribe',
  REPORT_CREATE: 'report:create',
  VEHICLES_STATE: 'vehicles:state',
  REPORTS_STATE: 'reports:state',
};

