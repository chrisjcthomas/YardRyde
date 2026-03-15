export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
export const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';
export const GOOGLE_MAPS_BROWSER_KEY = import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY || '';

export const KINGSTON_CENTER = [18.0129, -76.7941];
export const NYC_CENTER = [40.758, -73.9855];
export const NYC_FALLBACK_ORIGIN = {
  lat: 40.758,
  lng: -73.9855,
  label: 'Times Square, Manhattan',
  source: 'fallback',
};

export const MAP_CENTER = KINGSTON_CENTER;
export const DEFAULT_ZOOM = 13;

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
    name: 'Portmore to Half Way Tree',
    coordinates: [
      [17.9718, -76.8722],
      [17.9838, -76.8396],
      [17.997, -76.7937],
      [18.0066, -76.7836],
      [18.0129, -76.7941],
    ],
    stops: [
      { name: 'Portmore', lat: 17.9718, lng: -76.8722, coordinateIndex: 0 },
      { name: 'Downtown', lat: 17.997, lng: -76.7937, coordinateIndex: 2 },
      { name: 'Cross Roads', lat: 18.0066, lng: -76.7836, coordinateIndex: 3 },
      { name: 'Half Way Tree', lat: 18.0129, lng: -76.7941, coordinateIndex: 4 },
    ],
  },
  {
    id: 'route-76',
    number: '76',
    name: 'Half Way Tree to Downtown',
    coordinates: [
      [18.0129, -76.7941],
      [18.0066, -76.7836],
      [17.997, -76.7937],
    ],
    stops: [
      { name: 'Half Way Tree', lat: 18.0129, lng: -76.7941, coordinateIndex: 0 },
      { name: 'Cross Roads', lat: 18.0066, lng: -76.7836, coordinateIndex: 1 },
      { name: 'Downtown', lat: 17.997, lng: -76.7937, coordinateIndex: 2 },
    ],
  },
  {
    id: 'route-42',
    number: '42',
    name: 'Half Way Tree to Papine',
    coordinates: [
      [18.0129, -76.7941],
      [18.005, -76.7498],
      [18.012, -76.7442],
    ],
    stops: [
      { name: 'Half Way Tree', lat: 18.0129, lng: -76.7941, coordinateIndex: 0 },
      { name: 'UTech', lat: 18.005, lng: -76.7498, coordinateIndex: 1 },
      { name: 'Papine', lat: 18.012, lng: -76.7442, coordinateIndex: 2 },
    ],
  },
  {
    id: 'route-900',
    number: '900',
    name: 'Half Way Tree to Portmore',
    coordinates: [
      [18.0129, -76.7941],
      [18.0066, -76.7836],
      [17.997, -76.7937],
      [17.9838, -76.8396],
      [17.9718, -76.8722],
    ],
    stops: [
      { name: 'Half Way Tree', lat: 18.0129, lng: -76.7941, coordinateIndex: 0 },
      { name: 'Cross Roads', lat: 18.0066, lng: -76.7836, coordinateIndex: 1 },
      { name: 'Downtown', lat: 17.997, lng: -76.7937, coordinateIndex: 2 },
      { name: 'Portmore', lat: 17.9718, lng: -76.8722, coordinateIndex: 4 },
    ],
  },
  {
    id: 'route-83',
    number: '83',
    name: 'Stony Hill to Downtown',
    coordinates: [
      [18.0613, -76.785],
      [18.0407, -76.7918],
      [18.0129, -76.7941],
      [17.997, -76.7937],
    ],
    stops: [
      { name: 'Stony Hill', lat: 18.0613, lng: -76.785, coordinateIndex: 0 },
      { name: 'Constant Spring', lat: 18.0407, lng: -76.7918, coordinateIndex: 1 },
      { name: 'Half Way Tree', lat: 18.0129, lng: -76.7941, coordinateIndex: 2 },
      { name: 'Downtown', lat: 17.997, lng: -76.7937, coordinateIndex: 3 },
    ],
  },
];

export const JAMAICA_PLACES = [
  {
    id: 'half-way-tree',
    label: 'Half Way Tree Transport Centre',
    description: 'Main transfer hub in St. Andrew',
    stopNames: ['Half Way Tree'],
  },
  {
    id: 'downtown',
    label: 'Downtown Kingston',
    description: 'Parade and the major work district',
    stopNames: ['Downtown'],
  },
  {
    id: 'cross-roads',
    label: 'Cross Roads',
    description: 'Central junction for quick transfers',
    stopNames: ['Cross Roads'],
  },
  {
    id: 'portmore',
    label: 'Portmore',
    description: 'Commuter corridor into Kingston',
    stopNames: ['Portmore'],
  },
  {
    id: 'utech',
    label: 'UTech',
    description: 'University area along the Papine corridor',
    stopNames: ['UTech'],
  },
  {
    id: 'papine',
    label: 'Papine',
    description: 'Campus and town-centre destination',
    stopNames: ['Papine'],
  },
  {
    id: 'constant-spring',
    label: 'Constant Spring',
    description: 'Busy northbound corridor',
    stopNames: ['Constant Spring'],
  },
  {
    id: 'stony-hill',
    label: 'Stony Hill',
    description: 'Upper St. Andrew route terminus',
    stopNames: ['Stony Hill'],
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
