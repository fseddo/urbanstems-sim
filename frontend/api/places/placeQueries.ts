import { queryOptions } from '@tanstack/react-query';
import { request } from '../request';
import { createQueryParams } from '../createQueryParams';

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
  autocomplete: (params: AutocompleteParams) =>
    [...placeKeys.all, 'autocomplete', createQueryParams(params).key] as const,
  details: (placeId: string, session?: string) =>
    [
      ...placeKeys.all,
      'details',
      createQueryParams({ place_id: placeId, session }).key,
    ] as const,
  detect: () => [...placeKeys.all, 'detect'] as const,
};

export const placeQueries = {
  autocomplete: (params: AutocompleteParams) =>
    queryOptions({
      queryKey: placeKeys.autocomplete(params),
      queryFn: () =>
        request<AutocompleteResponse>({
          method: 'get',
          path: `/places/autocomplete/${createQueryParams(params).queryString}`,
        }),
      enabled: params.q.length >= 3,
      staleTime: 5 * 60 * 1000,
    }),

  details: (placeId: string, session?: string) =>
    queryOptions({
      queryKey: placeKeys.details(placeId, session),
      queryFn: () =>
        request<PlaceDetailsResponse>({
          method: 'get',
          path: `/places/details/${createQueryParams({ place_id: placeId, session }).queryString}`,
        }),
      staleTime: 24 * 60 * 60 * 1000,
    }),

  // Server-side IP geolocation. Result is stable for the duration of a tab,
  // so cache aggressively and never refetch on focus.
  detect: () =>
    queryOptions({
      queryKey: placeKeys.detect(),
      queryFn: () =>
        request<DetectResponse>({
          method: 'get',
          path: '/places/detect/',
        }),
      staleTime: Infinity,
      gcTime: Infinity,
    }),
};
