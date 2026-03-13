import { API_BASE_URL } from '../constants';

function buildUrl(path, params) {
  const base = API_BASE_URL || window.location.origin;
  const url = new URL(path, base);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  return API_BASE_URL ? url.toString() : `${url.pathname}${url.search}`;
}

export async function fetchNearbyTransit({ lat, lng, latSpan, lonSpan, source, signal }) {
  const response = await fetch(
    buildUrl('/api/nyc/nearby', {
      lat,
      lng,
      latSpan,
      lonSpan,
      source,
    }),
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal,
    }
  );

  const payload = await response.json();

  if (!response.ok) {
    const error = new Error(payload?.message || 'Unable to load nearby transit data.');
    error.type = payload?.type || 'UPSTREAM';
    throw error;
  }

  return payload;
}
