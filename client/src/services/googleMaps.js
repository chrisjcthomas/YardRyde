import { Loader } from '@googlemaps/js-api-loader';
import { GOOGLE_MAPS_BROWSER_KEY } from '../constants';

let loaderPromise;

export function loadGoogleMaps() {
  if (!GOOGLE_MAPS_BROWSER_KEY) {
    return Promise.reject(new Error('Missing VITE_GOOGLE_MAPS_BROWSER_KEY'));
  }

  if (!loaderPromise) {
    const loader = new Loader({
      apiKey: GOOGLE_MAPS_BROWSER_KEY,
      version: 'weekly',
      libraries: ['places'],
    });

    loaderPromise = loader.load();
  }

  return loaderPromise;
}

export async function requestTransitDirections({ origin, destination }) {
  const google = await loadGoogleMaps();
  const directionsService = new google.maps.DirectionsService();

  return directionsService.route({
    origin,
    destination,
    provideRouteAlternatives: true,
    travelMode: google.maps.TravelMode.TRANSIT,
    transitOptions: {
      modes: [google.maps.TransitMode.BUS],
    },
  });
}
