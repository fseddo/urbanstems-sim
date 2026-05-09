# Address Search & Location Detection

How the "Sending to" address picker works, why it's structured the way it is, and what to know before changing it.

## The user-facing feature

On listing pages, next to the date picker, the header has a **Sending to** control. Clicking it opens a search box with autocomplete suggestions for addresses (residential, businesses, landmarks). Picking one stores the chosen address — including lat/lng — in a Jotai atom that persists across pages via `localStorage`.

The autocomplete predictions are biased to the user's approximate location, so typing "tal" in NYC surfaces "Tall Poppy, West 20th St" rather than results from the other side of the planet.

## Architecture at a glance

```
Browser                Django backend             External
─────────              ──────────────             ────────
AddressPicker  ──GET── /api/places/detect/   ──── MaxMind GeoLite2 (local .mmdb file)
              ──GET── /api/places/autocomplete/?q=...   ──── Google Places API (New)
              ──GET── /api/places/details/?place_id=... ──── Google Places API (New)
```

The browser **never** talks to Google directly. All upstream calls go through Django.

## Why proxy through Django

Four reasons, in priority order:

1. **API key safety** — `GOOGLE_MAPS_API_KEY` lives in `backend/.env` and is loaded server-side. Even with HTTP-referer-restricted browser keys, exposing it in the bundle invites scraping and abuse.
2. **Rate limiting** — DRF `AnonRateThrottle` caps each client IP. Without a proxy, anyone could hammer Google through your key and bill the account dry.
3. **Caching** — server-side cache lets multiple users share lookups for the same query. TanStack Query already caches per-tab; the backend cache catches reloads, new tabs, and convergent queries from different users.
4. **Provider-swap optionality** — if Google's pricing changes or we want to try Mapbox/HERE/LocationIQ, we change one Django view; the frontend doesn't move.

## Location bias: why IP geolocation, not browser geolocation

The original implementation used `navigator.geolocation`, which works but always triggers a permission prompt. That prompt is a deliberate trade-off — the browser API returns precise (~10–20m) coords and demands explicit consent.

We don't need precision. We need a *bias* — "roughly where is this user so we can rank addresses near them?" City-level (~5–50km) is more than enough for that. So the current implementation does **server-side IP geolocation** instead:

- The Django `detect_location` view reads the client IP from `X-Forwarded-For` (with `REMOTE_ADDR` fallback).
- Looks it up against a local **MaxMind GeoLite2 City** database file at `backend/data/geoip/GeoLite2-City.mmdb`.
- Returns `{lat, lng, city, region, country, source}` to the frontend.
- The frontend caches the result forever (`staleTime: Infinity`) since the IP doesn't change during a session.

No permission prompt, no third-party API call (the lookup is local), no per-request cost.

### What "source" means in the response

| value | what happened |
|---|---|
| `geoip` | Hit MaxMind, got coords. Normal case in prod. |
| `private-ip` | Client IP is loopback/private (e.g. `127.0.0.1` in dev). Returned the fallback. |
| `no-db` | The `.mmdb` file isn't on disk. Returned the fallback. |
| `not-found` | MaxMind doesn't have an entry for the IP. Returned the fallback. |
| `bad-ip`, `no-coords`, `no-ip` | Edge cases. Returned the fallback. |

The fallback coords (`GEOIP_FALLBACK_LAT`, `GEOIP_FALLBACK_LNG` in settings) default to NYC. In local dev you'll always see `private-ip` because `127.0.0.1` is loopback; that's correct, not a bug.

### MaxMind setup

Free signup at https://www.maxmind.com/en/geolite2/signup. After confirming email:

1. **Account → Manage License Keys → Generate new license key.**
2. Download the GeoLite2-City database (web UI or via `curl`):
   ```
   curl -L -o GeoLite2-City.tar.gz \
     "https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-City&license_key=YOUR_KEY&suffix=tar.gz"
   ```
3. Extract the `.mmdb` to `backend/data/geoip/GeoLite2-City.mmdb`.
4. Rebuild the web container so `geoip2` is installed: `docker compose build web && docker compose up -d web`.

The license key is **only used to download the file**. The running app never sees it. The `.mmdb` is gitignored (`*.mmdb` in `.gitignore`) and the docs folder is too.

For auto-updates, MaxMind publishes [`geoipupdate`](https://github.com/maxmind/geoipupdate). Not configured currently — the DB drifts but slowly enough that monthly manual updates would be fine.

## Google Places: cost model and session tokens

Google Maps Platform isn't free, but has a generous free tier. The pieces we use:

- **Places API (New) — Autocomplete (per Session)**: ~$2.83 per 1,000 *sessions*, with the first 10,000 sessions/month free.
- **Places API (New) — Place Details (Location Only)**: ~$5 per 1,000 calls. Free tier covers a few thousand/month.

A "session" bundles all the keystrokes leading up to one selection plus the eventual Details call into a **single billable unit** — but only if you pass a session token. Without it, every keystroke is billed separately (much more expensive).

### How session tokens flow through our code

1. The user opens the picker. `AddressPicker` generates a fresh UUID via `crypto.randomUUID()` and stores it in component state.
2. Every autocomplete request to our backend includes `?session=<uuid>`. The backend forwards it as `sessionToken` in the request body to Google.
3. When the user selects a prediction, the frontend fires the Details call with the *same* session token.
4. Google ties them together and bills as one session. The frontend then clears the session — the next open generates a new one.

Sessions expire on Google's side after ~3 minutes of inactivity. We don't try to manage that — if the user opens the picker, walks away for 5 minutes, then picks something, Google bills the Details as a non-session call. Acceptable.

### The cost-vs-cache tension

Our backend cache intentionally **excludes the session token from the cache key**. Two different users typing "tal" share the same cached predictions. That saves billable autocomplete calls.

Trade-off: when we serve cached predictions and the user picks one, the eventual Details call carries a session token that Google never saw on the autocomplete side. Google then bills the Details as a non-session call (~$5/1k instead of being bundled into the session). Net effect is still way fewer billable calls overall, especially in dev.

If billing ever becomes a concern, the lever to pull is: include the session token in the cache key (zero cache sharing across users, but every user gets the bundled-session price).

## Caching: two layers, different jobs

### Layer 1: TanStack Query (frontend)

| | |
|---|---|
| Where | In-memory in the browser tab |
| Lifetime | `staleTime: 5 min` (autocomplete), `staleTime: Infinity` (detect & details) |
| Wiped by | Hard reload, new tab, browser close |
| Catches | Repeated typing in the same tab — survives Vite HMR |

This layer covers the developer's day-to-day workflow. While iterating on styling with HMR, typing "tal" once and revisiting it many times costs zero backend calls.

### Layer 2: Django LocMemCache (backend)

| | |
|---|---|
| Where | In-memory in the Django process |
| Lifetime | 1 hour (autocomplete), 24 hours (details) |
| Wiped by | Container restart |
| Catches | Hard reloads, new tabs, multiple users converging on the same query |

LocMem is per-process. With multiple gunicorn workers, the cache is *not* shared across them — each worker has its own copy. For a single dev container or a low-traffic prod, this is fine. If we ever scale beyond one worker, swap to Redis (set `CACHES` in `settings.py` to `django.core.cache.backends.redis.RedisCache`).

### Cache key design

- **Autocomplete**: `places:autocomplete:{q}:{round(lat,2)}:{round(lng,2)}`. Query is lowercased before hashing. Lat/lng are rounded to ~1km to bin nearby users into the same entry without losing meaningful bias precision.
- **Details**: `places:details:{place_id}`. Place locations are stable, so a 24-hour TTL is safe.

Cache keys deliberately exclude the session token (see "cost-vs-cache tension" above).

## Rate limiting

DRF's `AnonRateThrottle` is applied per endpoint with a custom scope. Limits are per **client IP**:

| Endpoint | Limit | Reasoning |
|---|---|---|
| `autocomplete` | 30/min | Real typing burst (5 chars × 250ms debounce) is well under this. An attacker is capped at 0.5 req/s. |
| `details` | 20/min | Only fires on selection. Nobody legitimately picks 20 addresses/min. |
| `detect` | 10/min | Cached forever client-side, so usually 1 call per tab. |

Excess requests get `429 Too Many Requests` with a `Retry-After` header.

### Production caveats (summary)

- `AnonRateThrottle` keys on `REMOTE_ADDR` — behind a proxy that's the proxy's IP, so every user shares one bucket and the throttle is useless. Fix below.
- Throttle counters live in Django's cache (LocMem by default). With multiple workers, each has its own counter, so the effective limit is `N × the configured rate`. Fix: Redis.

Both are addressed in the **Production deployment checklist** at the bottom of this document. Don't ship to a real domain without applying at least the first two items there.

## File map

### Backend

| File | Purpose |
|---|---|
| [backend/places/views.py](../../../backend/places/views.py) | All three endpoints + GeoIP reader caching + throttle classes |
| [backend/places/urls.py](../../../backend/places/urls.py) | Routes for `autocomplete/`, `details/`, `detect/` |
| [backend/places/apps.py](../../../backend/places/apps.py) | Django app config |
| [backend/urbanstems_backend/settings.py](../../../backend/urbanstems_backend/settings.py) | `GEOIP_DB_PATH`, `GEOIP_FALLBACK_LAT/LNG`, throttle rates, `INSTALLED_APPS` |
| [backend/urbanstems_backend/urls.py](../../../backend/urbanstems_backend/urls.py) | Mounts `places.urls` at `/api/places/` |
| [backend/data/geoip/GeoLite2-City.mmdb](../../../backend/data/geoip/GeoLite2-City.mmdb) | The MaxMind database (gitignored, must be downloaded) |
| [backend/.env](../../../backend/.env) | Holds `GOOGLE_MAPS_API_KEY` (gitignored) |

### Frontend

| File | Purpose |
|---|---|
| [frontend/api/places/placeQueries.ts](../../../frontend/api/places/placeQueries.ts) | TanStack Query options for `autocomplete`, `details`, `detect` |
| [frontend/src/address/AddressPicker.tsx](../../../frontend/src/address/AddressPicker.tsx) | The popover UI, render-prop component (mirrors `DatePicker`) |
| [frontend/src/address/deliveryAddressAtom.ts](../../../frontend/src/address/deliveryAddressAtom.ts) | Jotai atom + `DeliveryAddress` type, persisted via `atomWithStorage` |
| [frontend/routes/collections/$slug.tsx](../../../frontend/routes/collections/$slug.tsx) | Wires `AddressPicker` into the listing page header |

## Required environment

In `backend/.env`:

```
GOOGLE_MAPS_API_KEY=<your-key>
# Optional overrides:
# GEOIP_DB_PATH=/custom/path/to/GeoLite2-City.mmdb
# GEOIP_FALLBACK_LAT=40.7128
# GEOIP_FALLBACK_LNG=-74.006
```

`GOOGLE_MAPS_API_KEY` requires the **Places API (New)** to be enabled in Google Cloud Console — note that's a separate enable from the legacy Places API. Restrict the key to that single API for safety.

## Open trade-offs / things to revisit

- **Geolocation precision**: we accept city-level for bias. If we later want exact-current-location ("📍 Use my location" button), we can add browser geolocation as an opt-in gesture *on top of* the IP fallback — same picker, same atom, just a button that calls `navigator.geolocation.getCurrentPosition`.
- **Provider lock-in**: we're tied to Google's response shape inside the backend view. If we wanted to A/B test Mapbox, we'd need to normalize the prediction shape into a provider-neutral format. Easy to do, not done yet.
- **Address validation**: we trust whatever Google returns. If a delivery zone needs to be enforced, that check happens at order placement, not here.

---

## Railway deployment

Every `git push` to `main` deploys live to Railway — there's no separate dev/staging tier. So the items below aren't a "before you go to prod" wishlist; they describe what's already wired up in the repo and what needs to be configured on the Railway side for the live site to work correctly.

### Topology

Railway's edge proxy terminates TLS and forwards traffic to the gunicorn container. That's exactly **one trusted hop**, and Railway sets `X-Forwarded-For` with the real client IP. So we use `TRUSTED_PROXY_HOPS = 1` in Railway env, `0` (the default) locally.

By default Railway runs **a single replica**, which means LocMem-based caches work *within* a single deploy — but every redeploy creates a fresh container and wipes them. That's the main motivation for adding Redis: cache survives across pushes.

### What's already in the repo

The code in this repo is set up to work in both modes (local with no proxy, Railway with one) without code changes. The relevant pieces:

- **`TRUSTED_PROXY_HOPS` env-driven setting** in [settings.py](../../../backend/urbanstems_backend/settings.py). Default `0`. When set to `1`, both rate limiting and IP geolocation read `X-Forwarded-For` correctly.
- **`_RealClientIPThrottle` base class** in [places/views.py](../../../backend/places/views.py). All three throttle scopes (`places-autocomplete`, `places-details`, `places-detect`) inherit from it. Picks `ips[-hops]` from XFF — the slot written by the outermost trusted proxy, which is the original client IP assuming Railway strips client-supplied XFF entries.
- **`_client_ip` in [places/views.py](../../../backend/places/views.py)** — same trusted-hops logic, used by the GeoIP detect endpoint.
- **Optional Redis cache** in [settings.py](../../../backend/urbanstems_backend/settings.py). When `REDIS_URL` is set, Django uses Redis for both the response cache and DRF throttle counters. Falls back to LocMem when unset (local dev).
- **`backend/entrypoint.sh`** — checks for `backend/data/geoip/GeoLite2-City.mmdb` on container start. If it's missing or older than 30 days, downloads a fresh copy using `MAXMIND_LICENSE_KEY` from env. Skips the download with a warning if the key isn't set.
- **[Dockerfile](../../../backend/Dockerfile)** wires the entrypoint and pulls in `curl` + `ca-certificates` so the download works.

### Railway dashboard configuration

1. **Provision the Redis add-on**. Railway dashboard → New → Database → Add Redis. The `REDIS_URL` env var auto-injects into the web service. No code changes needed.

2. **Set the following env vars** on the web service (Variables tab):

   | Variable | Value | Notes |
   |---|---|---|
   | `GOOGLE_MAPS_API_KEY` | Your Places API (New) key | Restrict to that single API in Google Cloud Console |
   | `MAXMIND_LICENSE_KEY` | License key from MaxMind | Used only by `entrypoint.sh` at boot. Never read by the running app. |
   | `TRUSTED_PROXY_HOPS` | `1` | Tells the throttle + `_client_ip` to read XFF |

   `REDIS_URL` is already set automatically by the Redis add-on. `DATABASE_URL` likewise from the Postgres add-on.

3. **Push**. The first deploy after these vars are set will:
   - Boot the container, run `entrypoint.sh`
   - Download `GeoLite2-City.mmdb` (~70MB, ~5–10s)
   - Run migrations + seed data
   - Start gunicorn with the trusted-hops throttle and Redis-backed cache active

### Verifying the live deploy

Once deployed, three quick checks against the public domain:

```bash
# 1. Throttle works per-IP. From one machine, 31 calls in a minute.
for i in $(seq 1 31); do
  curl -s -o /dev/null -w "%{http_code}\n" \
    "https://YOUR.up.railway.app/api/places/autocomplete/?q=tal"
done
# Expect: 30× 200, then 429. If you see 200 the whole way, TRUSTED_PROXY_HOPS
# isn't set — every request is keying on Railway's edge IP and you're sharing
# a bucket with everyone else (the throttle still functions as a global cap
# but isn't per-user).

# 2. GeoIP returns real coords. From a real-world IP (not localhost):
curl "https://YOUR.up.railway.app/api/places/detect/"
# Expect: {"lat": ..., "lng": ..., "city": "...", "source": "geoip", ...}.
# If you see "source": "no-db", the entrypoint download failed — check the
# deploy logs for "[entrypoint]" lines. Most likely cause: MAXMIND_LICENSE_KEY
# unset or wrong.

# 3. Cache survives a soft-bounce.
curl "https://YOUR.up.railway.app/api/places/autocomplete/?q=tall"
# (Restart the web service via Railway dashboard, wait, then:)
curl "https://YOUR.up.railway.app/api/places/autocomplete/?q=tall"
# Both responses identical, second one served from Redis (no upstream
# Google call). Verify in the deploy logs that the second request didn't
# log an outbound POST to googleapis.com.
```

### Things to know about Railway's XFF behavior

Railway's edge **does** strip and replace client-supplied `X-Forwarded-For` (this is standard for any reputable cloud edge — they wouldn't be passing through a header that lets clients spoof their own IP). That means with `TRUSTED_PROXY_HOPS=1`, an attacker sending `X-Forwarded-For: 1.2.3.4` in their request gets that header overwritten by Railway before Django sees it. The throttle keys on the real client IP.

If Railway ever changes this (unlikely), check 2 in the verification block above will catch it: if you can use spoofed XFF headers to land in different throttle buckets, the assumption is broken.

### Things this does NOT cover yet

- **Production-grade IP detection (`CF-Connecting-IP` etc.)**: not needed unless you put Cloudflare in front of Railway. If you do, prefer that header over XFF.
- **GeoIP DB updates without redeploys**: the entrypoint re-checks DB age on every container start, but Railway only restarts containers on deploy or manual restart. If you deploy infrequently, the DB can drift past 30 days. Workaround: trigger a manual restart via the Railway dashboard once a month, or wire up a cron service.
- **Throttle rates tuning**: the current 30/20/10-per-min rates are conservative defaults. If real users hit `429` legitimately, increase `places-autocomplete` first (typing-burst is the most likely false positive).
