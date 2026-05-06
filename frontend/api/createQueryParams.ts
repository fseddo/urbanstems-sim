/**
 * Serialize an object into both a URL query string and a normalized cache key.
 *
 * - `queryString`: `?k=v&k=v` form ready to append to a path. Arrays serialize
 *   as repeated params (`?color=red&color=pink`); `undefined`/`null`/empty
 *   arrays are dropped.
 * - `key`: a plain object with the same surviving entries, intended to sit
 *   inside a TanStack Query queryKey. TanStack Query deep-equals queryKey
 *   contents, so this lets a single object stand in for what would otherwise
 *   be a long tuple of fields — adding a new filter dimension only touches
 *   the input shape, not every queryKey site.
 *
 * Use both fields from one call: the path gets `queryString`, the queryKey
 * gets `key`, and they stay aligned because they're derived from the same
 * input.
 */
export const createQueryParams = <T extends object>(params: T) => {
  const searchParams = new URLSearchParams();
  const key: Record<string, unknown> = {};

  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) {
      if (v.length === 0) return;
      v.forEach((item) => searchParams.append(k, String(item)));
      key[k] = v;
    } else {
      searchParams.append(k, String(v));
      key[k] = v;
    }
  });

  return {
    queryString: searchParams.toString() ? `?${searchParams.toString()}` : '',
    key,
  };
};
