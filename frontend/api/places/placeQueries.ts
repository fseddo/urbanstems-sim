import { queryOptions } from '@tanstack/react-query';
import { request } from '../request';

export interface PlacePrediction {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
}

interface AutocompleteResponse {
  predictions: PlacePrediction[];
}

export interface PlaceDetailsResponse {
  place_id: string;
  description: string;
  name: string;
  lat: number | null;
  lng: number | null;
}

export interface AutocompleteParams {
  q: string;
  lat?: number;
  lng?: number;
  session?: string;
}

const buildAutocompletePath = ({
  q,
  lat,
  lng,
  session,
}: AutocompleteParams) => {
  const sp = new URLSearchParams({ q });
  if (lat != null) sp.set('lat', String(lat));
  if (lng != null) sp.set('lng', String(lng));
  if (session) sp.set('session', session);
  return `/places/autocomplete/?${sp.toString()}`;
};

export interface DetectResponse {
  lat: number;
  lng: number;
  city: string | null;
  region: string | null;
  country: string | null;
  source: 'geoip' | 'no-ip' | 'bad-ip' | 'private-ip' | 'no-db' | 'not-found' | 'no-coords';
}

export const placeKeys = {
  all: ['places'] as const,
  // Session token is intentionally excluded from the cache key — same input
  // should hit cache regardless of which session asked for it.
  autocomplete: (q: string, lat?: number, lng?: number) =>
    [...placeKeys.all, 'autocomplete', q, lat, lng] as const,
  details: (placeId: string) =>
    [...placeKeys.all, 'details', placeId] as const,
  detect: () => [...placeKeys.all, 'detect'] as const,
};

export const placeQueries = {
  autocomplete: (params: AutocompleteParams) =>
    queryOptions({
      queryKey: placeKeys.autocomplete(params.q, params.lat, params.lng),
      queryFn: async () =>
        request<AutocompleteResponse>({
          method: 'get',
          path: buildAutocompletePath(params),
        }),
      enabled: params.q.length >= 3,
      staleTime: 5 * 60 * 1000,
    }),

  details: (placeId: string, session?: string) =>
    queryOptions({
      queryKey: placeKeys.details(placeId),
      queryFn: async () => {
        const sp = new URLSearchParams({ place_id: placeId });
        if (session) sp.set('session', session);
        return request<PlaceDetailsResponse>({
          method: 'get',
          path: `/places/details/?${sp.toString()}`,
        });
      },
      staleTime: 24 * 60 * 60 * 1000,
    }),

  // Server-side IP geolocation. Result is stable for the duration of a tab,
  // so cache aggressively and never refetch on focus.
  detect: () =>
    queryOptions({
      queryKey: placeKeys.detect(),
      queryFn: async () =>
        request<DetectResponse>({
          method: 'get',
          path: '/places/detect/',
        }),
      staleTime: Infinity,
      gcTime: Infinity,
    }),
};
