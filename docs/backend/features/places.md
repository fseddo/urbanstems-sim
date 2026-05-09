# Places (backend)

The `places/` app proxies Google Places (autocomplete + details) and provides MaxMind GeoIP detect. Both are rate-limited per real-client-IP.

For the frontend half (`AddressPicker`, autocomplete UI, geo detect on mount) and for setup steps (Google API key, MaxMind license), see [`docs/places-and-geo.md`](../../places-and-geo.md).

## Google Places proxy

Two endpoints, both backed by Google's Places API v1:

- `autocomplete` — POST under the hood (`places:autocomplete`), takes `?q=` + optional `?lat=&lng=` for location bias and an optional `?session=` token. Returns a flat predictions array.
- `details` — GET (`places/{place_id}`), takes `?place_id=` + optional `?session=`. Returns `{place_id, description, name, lat, lng}`.

**Field mask + minimal request body** keeps upstream cost down. `PLACES_DETAILS_FIELD_MASK = 'id,formattedAddress,location,displayName'` — explicit response surface, no default-shape requests. Reference for any pay-per-byte upstream API.

**Caching**:
- Autocomplete: 1h TTL, key includes the lowercased query and rounded lat/lng (~1km bucket). **Cache key intentionally excludes the session token** — same input from two sessions hits the same cache entry.
- Details: 24h TTL, keyed on `place_id` only.

**lat/lng range validation.** After casting to `float`, out-of-range coords (lat ∉ [-90, 90] or lng ∉ [-180, 180]) drop the location bias instead of forwarding bogus values upstream.

**Upstream errors are scrubbed.** Both `RequestException` and non-2xx responses log the full detail server-side (`logger.exception` / `logger.warning`) and return a generic `{'detail': 'Upstream error.'}` to the client. No leaking provider error text (could include API-key hints, project IDs).

## Throttling + client IP

Three throttle classes (`_AutocompleteThrottle`, `_DetailsThrottle`, `_DetectThrottle`) all subclass `_RealClientIPThrottle`, which honors `X-Forwarded-For` when behind exactly `settings.TRUSTED_PROXY_HOPS` trusted proxies. Picks `ips[-N]` — the entry written by the outermost trusted proxy, on the assumption that proxy strips client-supplied XFF.

The XFF parsing lives in one helper, [`_real_client_ip`](../../../backend/places/views.py), consumed by both the throttle's `get_ident` and the GeoIP `_client_ip` lookup. Single trust-boundary policy.

Per-endpoint rates wired via `scope` on each subclass (`places-autocomplete`, `places-details`, `places-detect`) — configured under `DEFAULT_THROTTLE_RATES` in `REST_FRAMEWORK`.

## GeoIP detect

`detect_location` reads the client IP, opens the MaxMind reader, returns `{lat, lng, city, region, country, source}`.

**Lazy reader.** `_get_geoip_reader` caches the `geoip2.database.Reader` at module level and re-inits if `settings.GEOIP_DB_PATH` changes. No per-request file I/O.

**`_fallback_payload(source)` shape.** Six different conditions — no IP, bad IP, private IP, no DB file, IP not found, no coords on the row — all return the same response shape with a `source` discriminator the frontend uses to debug. Reusable design for any "best-effort with degraded-mode response" endpoint.

The MaxMind GeoLite2 DB itself is downloaded lazily by [`backend/entrypoint.sh`](../../../backend/entrypoint.sh) on container boot when missing or stale, no-ops without `MAXMIND_LICENSE_KEY`. Reference shape for "external data the app depends on but doesn't ship."

## Frontend cross-link

The SPA's `AddressPicker` consumes both proxy endpoints via `placeQueries.autocomplete` / `placeQueries.details`. See [`docs/places-and-geo.md`](../../places-and-geo.md) for the full flow including the geo-detect-on-mount pattern.
