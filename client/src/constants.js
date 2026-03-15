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
      // Portmore (Braeton Pkwy area)
      [17.9718, -76.8722],
      // Portmore Toll — heading onto Mandela Hwy
      [17.9735, -76.8620],
      [17.9760, -76.8530],
      [17.9785, -76.8440],
      // Mandela Hwy approaching Causeway
      [17.9810, -76.8350],
      [17.9838, -76.8280],
      // Hunts Bay / Causeway exit
      [17.9855, -76.8200],
      [17.9870, -76.8120],
      // Spanish Town Road corridor
      [17.9890, -76.8050],
      [17.9910, -76.7995],
      // Downtown Kingston (Parade area)
      [17.9940, -76.7960],
      [17.9970, -76.7937],
      // North along East Queen St / Slipe Rd
      [17.9995, -76.7920],
      [18.0020, -76.7900],
      [18.0040, -76.7870],
      // Cross Roads junction
      [18.0066, -76.7836],
      // Heading NW on Half Way Tree Rd
      [18.0080, -76.7860],
      [18.0095, -76.7885],
      [18.0110, -76.7910],
      // Half Way Tree Transport Centre
      [18.0129, -76.7941],
    ],
    stops: [
      { name: 'Portmore', lat: 17.9718, lng: -76.8722, coordinateIndex: 0 },
      { name: 'Downtown', lat: 17.997, lng: -76.7937, coordinateIndex: 11 },
      { name: 'Cross Roads', lat: 18.0066, lng: -76.7836, coordinateIndex: 15 },
      { name: 'Half Way Tree', lat: 18.0129, lng: -76.7941, coordinateIndex: 19 },
    ],
  },
  {
    id: 'route-76',
    number: '76',
    name: 'Half Way Tree to Downtown',
    coordinates: [
      // Half Way Tree
      [18.0129, -76.7941],
      // South on Half Way Tree Rd
      [18.0110, -76.7910],
      [18.0095, -76.7885],
      [18.0080, -76.7860],
      // Cross Roads
      [18.0066, -76.7836],
      // South on Slipe Road / South Camp Rd
      [18.0045, -76.7855],
      [18.0025, -76.7875],
      [18.0005, -76.7895],
      // Along Windward Rd area
      [17.9988, -76.7915],
      // Downtown Kingston
      [17.9970, -76.7937],
    ],
    stops: [
      { name: 'Half Way Tree', lat: 18.0129, lng: -76.7941, coordinateIndex: 0 },
      { name: 'Cross Roads', lat: 18.0066, lng: -76.7836, coordinateIndex: 4 },
      { name: 'Downtown', lat: 17.997, lng: -76.7937, coordinateIndex: 9 },
    ],
  },
  {
    id: 'route-42',
    number: '42',
    name: 'Half Way Tree to Papine',
    coordinates: [
      // Half Way Tree
      [18.0129, -76.7941],
      // East on Hope Road
      [18.0125, -76.7900],
      [18.0118, -76.7860],
      [18.0110, -76.7820],
      [18.0105, -76.7780],
      // Liguanea area
      [18.0098, -76.7740],
      [18.0088, -76.7700],
      [18.0078, -76.7660],
      // Approaching Mona
      [18.0068, -76.7620],
      [18.0058, -76.7580],
      // UWI / Mona
      [18.0050, -76.7538],
      [18.0050, -76.7498],
      // Old Hope Road heading to Papine
      [18.0058, -76.7478],
      [18.0070, -76.7462],
      [18.0085, -76.7452],
      [18.0100, -76.7445],
      // Papine
      [18.0120, -76.7442],
    ],
    stops: [
      { name: 'Half Way Tree', lat: 18.0129, lng: -76.7941, coordinateIndex: 0 },
      { name: 'UTech', lat: 18.005, lng: -76.7498, coordinateIndex: 11 },
      { name: 'Papine', lat: 18.012, lng: -76.7442, coordinateIndex: 16 },
    ],
  },
  {
    id: 'route-900',
    number: '900',
    name: 'Half Way Tree to Portmore',
    coordinates: [
      // Half Way Tree
      [18.0129, -76.7941],
      // South on Half Way Tree Rd
      [18.0110, -76.7910],
      [18.0095, -76.7885],
      [18.0080, -76.7860],
      // Cross Roads
      [18.0066, -76.7836],
      // South on Slipe / South Camp
      [18.0045, -76.7855],
      [18.0025, -76.7875],
      [18.0005, -76.7895],
      [17.9988, -76.7915],
      // Downtown Kingston
      [17.9970, -76.7937],
      // West on Spanish Town Road
      [17.9940, -76.7960],
      [17.9910, -76.7995],
      [17.9890, -76.8050],
      [17.9870, -76.8120],
      // Hunts Bay / Causeway
      [17.9855, -76.8200],
      [17.9838, -76.8280],
      // Mandela Hwy
      [17.9810, -76.8350],
      [17.9785, -76.8440],
      [17.9760, -76.8530],
      [17.9735, -76.8620],
      // Portmore
      [17.9718, -76.8722],
    ],
    stops: [
      { name: 'Half Way Tree', lat: 18.0129, lng: -76.7941, coordinateIndex: 0 },
      { name: 'Cross Roads', lat: 18.0066, lng: -76.7836, coordinateIndex: 4 },
      { name: 'Downtown', lat: 17.997, lng: -76.7937, coordinateIndex: 9 },
      { name: 'Portmore', lat: 17.9718, lng: -76.8722, coordinateIndex: 20 },
    ],
  },
  {
    id: 'route-83',
    number: '83',
    name: 'Stony Hill to Downtown',
    coordinates: [
      // Stony Hill
      [18.0613, -76.7850],
      // Heading south on Stony Hill Rd
      [18.0580, -76.7860],
      [18.0550, -76.7868],
      [18.0520, -76.7875],
      [18.0490, -76.7885],
      // Constant Spring area
      [18.0460, -76.7895],
      [18.0430, -76.7905],
      [18.0407, -76.7918],
      // South on Constant Spring Rd
      [18.0380, -76.7925],
      [18.0350, -76.7930],
      [18.0320, -76.7932],
      [18.0290, -76.7934],
      [18.0260, -76.7935],
      [18.0230, -76.7936],
      [18.0200, -76.7937],
      [18.0170, -76.7938],
      // Half Way Tree
      [18.0129, -76.7941],
      // South on Half Way Tree Rd
      [18.0110, -76.7910],
      [18.0095, -76.7885],
      [18.0080, -76.7860],
      // Cross Roads
      [18.0066, -76.7836],
      // South to Downtown
      [18.0045, -76.7855],
      [18.0025, -76.7875],
      [18.0005, -76.7895],
      [17.9988, -76.7915],
      // Downtown
      [17.9970, -76.7937],
    ],
    stops: [
      { name: 'Stony Hill', lat: 18.0613, lng: -76.785, coordinateIndex: 0 },
      { name: 'Constant Spring', lat: 18.0407, lng: -76.7918, coordinateIndex: 7 },
      { name: 'Half Way Tree', lat: 18.0129, lng: -76.7941, coordinateIndex: 16 },
      { name: 'Downtown', lat: 17.997, lng: -76.7937, coordinateIndex: 25 },
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
