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
