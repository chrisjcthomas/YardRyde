export const SOCKET_URL = __DEV__
  ? 'http://10.0.2.2:3001' // Android emulator localhost
  : 'http://localhost:3001';

export const KINGSTON_CENTER = { latitude: 18.0179, longitude: -76.8099 };
export const DEFAULT_ZOOM_DELTA = { latitudeDelta: 0.05, longitudeDelta: 0.05 };

export const ROUTE_COLORS: Record<string, string> = {
  '800': '#17a14e',
  '76': '#3b82f6',
  '42': '#f97316',
  '900': '#8b5cf6',
  '83': '#ef4444',
};

export const ROUTES = [
  {
    id: 'route-800',
    number: '800',
    name: 'Half-Way-Tree \u2192 Portmore',
    coordinates: [
      { latitude: 18.0185, longitude: -76.7975 },
      { latitude: 18.02, longitude: -76.8 },
      { latitude: 18.015, longitude: -76.82 },
      { latitude: 18.01, longitude: -76.84 },
      { latitude: 18.005, longitude: -76.86 },
    ],
    stops: [
      { name: 'Half Way Tree', latitude: 18.0185, longitude: -76.7975 },
      { name: 'Portmore', latitude: 18.005, longitude: -76.86 },
    ],
  },
  {
    id: 'route-76',
    number: '76',
    name: 'Cross Roads \u2192 Downtown',
    coordinates: [
      { latitude: 18.015, longitude: -76.785 },
      { latitude: 18.01, longitude: -76.79 },
      { latitude: 18.005, longitude: -76.795 },
      { latitude: 18.0, longitude: -76.8 },
    ],
    stops: [
      { name: 'Cross Roads', latitude: 18.015, longitude: -76.785 },
      { name: 'Downtown', latitude: 18.0, longitude: -76.8 },
    ],
  },
  {
    id: 'route-42',
    number: '42',
    name: 'UTech \u2192 Constant Spring',
    coordinates: [
      { latitude: 18.005, longitude: -76.745 },
      { latitude: 18.01, longitude: -76.75 },
      { latitude: 18.02, longitude: -76.76 },
      { latitude: 18.03, longitude: -76.77 },
    ],
    stops: [
      { name: 'UTech', latitude: 18.005, longitude: -76.745 },
      { name: 'Constant Spring', latitude: 18.03, longitude: -76.77 },
    ],
  },
  {
    id: 'route-900',
    number: '900',
    name: 'Portmore \u2192 Half-Way-Tree',
    coordinates: [
      { latitude: 18.005, longitude: -76.86 },
      { latitude: 18.01, longitude: -76.84 },
      { latitude: 18.015, longitude: -76.82 },
      { latitude: 18.02, longitude: -76.8 },
      { latitude: 18.0185, longitude: -76.7975 },
    ],
    stops: [
      { name: 'Portmore', latitude: 18.005, longitude: -76.86 },
      { name: 'Half Way Tree', latitude: 18.0185, longitude: -76.7975 },
    ],
  },
  {
    id: 'route-83',
    number: '83',
    name: 'Stony Hill \u2192 Downtown',
    coordinates: [
      { latitude: 18.05, longitude: -76.78 },
      { latitude: 18.04, longitude: -76.785 },
      { latitude: 18.03, longitude: -76.79 },
      { latitude: 18.02, longitude: -76.795 },
      { latitude: 18.0, longitude: -76.8 },
    ],
    stops: [
      { name: 'Stony Hill', latitude: 18.05, longitude: -76.78 },
      { name: 'Downtown', latitude: 18.0, longitude: -76.8 },
    ],
  },
];

export const REPORT_TYPES = {
  DELAY: { id: 'delay', label: 'Delay', icon: '\u23F1\uFE0F', color: '#FCD34D' },
  CROWDED: { id: 'crowded', label: 'Crowded', icon: '\uD83D\uDC65', color: '#60A5FA' },
  COLD_AC: { id: 'cold_ac', label: 'Cold AC', icon: '\u2744\uFE0F', color: '#22D3EE' },
  STANDING: { id: 'standing', label: 'Standing Room', icon: '\uD83E\uDDCD', color: '#FB923C' },
};

export const AVERAGE_BUS_SPEED = 20;
