# Backend Architecture

The backend is a single Django + DRF service in `backend/`. It serves a JSON API to the SPA, proxies Google Places, looks up GeoIP, creates Stripe PaymentIntents, and handles the Stripe webhook + sends the order-confirmation email.

For per-area conventions see [`backend/CLAUDE.md`](../../backend/CLAUDE.md). For per-feature design see [`features/`](features/).

## Apps

| App | Scope |
|---|---|
| `urbanstems_backend/` | Project package — `settings.py`, `urls.py`, `wsgi.py` |
| `products/` | `Product`, `Facet`, `Tag`, `ProductTag`, `Review`, plus the seed + blur-placeholder management commands. See [`features/products.md`](features/products.md). |
| `checkout/` | `create_payment_intent` view, Stripe webhook, order-confirmation email. See [`features/checkout.md`](features/checkout.md). |
| `places/` | Google Places autocomplete + details proxy, MaxMind GeoIP detect, throttling. See [`features/places.md`](features/places.md). |

## Settings & env

All env vars are read once in `settings.py` via `decouple.config(...)`. Views and tasks consume via `from django.conf import settings`. `@override_settings` works in tests; the env-var surface is visible in one file.

Production-relevant settings have **no insecure defaults**:
- `SECRET_KEY = config('SECRET_KEY')` — raises at boot if missing.
- `DEBUG = config('DEBUG', default=False, cast=bool)` — defaults the safe direction.

DRF declares auth and permission classes explicitly even when the value is `AllowAny`, so a future write endpoint can't silently inherit. `LOGGING` is configured with per-app levels (`checkout`, `places`, `products`) tied to `DEBUG` — verbose in dev, quiet in prod.

`TRUSTED_PROXY_HOPS` is a settings-level escape hatch the throttle and IP-detection logic both consume (via [`places._real_client_ip`](../../backend/places/views.py)). Lets you switch from "no proxy" to "single proxy (Railway)" with one env var.

## URLs

Mounted at the project root:
- `''` → `products.urls` (which mounts itself under `api/`)
- `api/places/` → `places.urls`
- `api/checkout/` → `checkout.urls`
- `admin/` → Django admin

(The path inconsistency — products mounts internally vs. places/checkout mount externally — is intentional-but-ugly; flagged in [improvements](../improvements/backend.md).)

## Dockerfile + entrypoint

`backend/Dockerfile` pins to a specific Python minor (`python:3.11.15-slim`) — combined with exact-pinned `requirements.txt`, builds are reproducible. Container `CMD` runs only the long-lived process (`exec gunicorn` for clean signal propagation). Migrations always run; one-shot work (seed, blur generation) is gated on `SEED_ON_BOOT=true`. See `backend/CLAUDE.md` "Reseeding the catalog" for when to flip it.

`backend/entrypoint.sh` lazily downloads MaxMind GeoLite2 on container boot when missing or stale, gracefully no-ops without `MAXMIND_LICENSE_KEY`. Reference shape for "external data the app depends on but doesn't ship."

## Cache backend

Redis when `REDIS_URL` is set, `LocMemCache` otherwise. Redis is required for multi-process consistency — throttle counters, autocomplete cache, email-idempotency markers. Local dev runs fine without; staging/prod sets `REDIS_URL`.

## Logging

Per-app loggers (`logging.getLogger(__name__)` in each module). Levels are dialed by `LOGGING` in settings; don't rely on Django defaults beyond local dev.

## Conventions

Codified in [`backend/CLAUDE.md`](../../backend/CLAUDE.md). Highlights:

- **Request validation** uses DRF `Serializer` + `is_valid(raise_exception=True)`, never hand-rolled `request.data.get(...)` + `isinstance` checks.
- **Query-param filtering** uses `django_filters.FilterSet`, not imperative `request.query_params.get` chains in `get_queryset`.
- **External SDK init** lives in one module per provider (`checkout/stripe_client.py`); views import the configured client.
- **Upstream errors** are logged server-side with full detail; the client gets a generic `{'detail': 'Upstream error.'}` (or the SDK's `user_message` for Stripe).
- **`is None`** for fallback when `0`/`""`/`[]` should mean "set to that value," not "absent."
- **HTML-escape** any string from outside the system before interpolating into HTML.
- **M2M with `through=`** for ordered-membership relations; not `@property` lambdas over reverse FK lookups.
- **Derived denormalized data at request time**, with bulk-prefetch + `_<thing>_cache` for list endpoints.

## Cross-references

- [`docs/frontend/features/checkout.md`](../frontend/features/checkout.md) — full checkout walkthrough (frontend + backend, setup, test cards). Backend-only design lives in [`features/checkout.md`](features/checkout.md).
- [`docs/frontend/features/places.md`](../frontend/features/places.md) — full address-picker walkthrough (frontend + backend, setup). Backend-only design lives in [`features/places.md`](features/places.md).
- [`docs/improvements/backend.md`](../improvements/backend.md) — open + deferred + skipped items.
