# Backend rules

Auto-loaded under `backend/`. Rules only — for rationale and area shape, see [`docs/backend/architecture.md`](../docs/backend/architecture.md) and [`docs/backend/features/`](../docs/backend/features/).

For the project's facet/tag/taxonomy vocabulary, see the root `CLAUDE.md`.

## Reseeding the catalog

`SEED_ON_BOOT=false` is the default everywhere. The flag gates the destructive `seed_products --clear` that runs on container boot. After flipping to `true` and redeploying, **unset it** — leaving it on wipes data and churns primary keys on every restart (breaks Stripe metadata, search indexes, etc.).

When to flip, how to reseed locally: [`docs/backend/features/products.md`](../docs/backend/features/products.md) "Seed + vocab → Operational walkthrough".

## Request validation: DRF Serializers

Validate request bodies with a `Serializer` and `serializer.is_valid(raise_exception=True)`. Don't hand-roll `request.data.get(...) or []`, `isinstance(x, list)`, `int(...)`, etc. Reference: [`CreatePaymentIntentSerializer`](checkout/serializers.py).

## Query-param filtering: `django_filters.FilterSet`

Filterable list endpoints declare a `FilterSet` and use `DjangoFilterBackend`, not imperative `request.query_params.get(...)` chains in `get_queryset`. Multi-select via repeated params (`?foo=a&foo=b`) needs a method filter that reads `self.request.GET.getlist(...)` — `BaseInFilter` expects comma-separated values.

References: [`ProductFilter`](products/filters.py), [`ReviewFilter`](products/filters.py).

## DRF auth/permission classes are explicit

Set `DEFAULT_AUTHENTICATION_CLASSES` and `DEFAULT_PERMISSION_CLASSES` in `REST_FRAMEWORK` even when the value is `AllowAny`. Defaults are not documentation — the bug we're avoiding is a future write endpoint silently inheriting `AllowAny`.

## Env vars

- Read via `decouple.config(...)` once in `settings.py`. No `decouple.config` calls outside that file. Views and management commands use `from django.conf import settings`.
- Production-relevant settings have **no insecure defaults**: `SECRET_KEY = config('SECRET_KEY')` raises at boot if missing. `DEBUG = config('DEBUG', default=False, cast=bool)` defaults safe.

## Logging configured explicitly

`settings.py` defines `LOGGING` with per-app levels (`checkout`, `places`, `products`) tied to `DEBUG`. Don't rely on Django defaults beyond local dev.

## `is None` for fallback (not falsy `or`)

`x = a or b` only when `0` / `""` / `[]` should be treated as "absent." For "use `a` if it's set, else `b`," use `x = a if a is not None else b`. Canonical bug: `discounted_price or price` where a 0-cent discount silently falls through to full price.

## HTML-escape user-supplied strings

Anything from outside the system (customer name, address, gift message, future free-text fields) goes through `html.escape()` before HTML interpolation. Server-rendered DB strings are trusted; client-supplied ones aren't. Reference: [`emails._format_address`](checkout/emails.py).

## M2M with `through=` for ordered membership

Curated-order relations (e.g. "products in this category in order") declare `models.ManyToManyField(Tag, through='ProductTag', related_name='products')` on the parent — never `@property` lambdas over reverse FK lookups (Django can't `prefetch_related` on properties; admin doesn't get inlines). Position-ordered queries use through-model lookup syntax (`order_by('producttag__position')`). Reference: [`Product` facet fields](products/models.py).

## Derive denormalized data at request time

Don't store sibling/related data on a row as a JSONField unless there's a maintained rebuild trigger. Compute it at serializer time. For list endpoints that would N+1, bulk-prefetch the page in one query and attach as `_<thing>_cache` on each instance. Reference: [`Product.variants()`](products/models.py) + [`_attach_variants_cache`](products/api_views.py).

## Container hygiene

- Base images pin to a specific minor (`python:3.11.15-slim`, never bare `python:3.11-slim`).
- Container `CMD` runs only the long-lived process. One-shot work (seeds, blur generation) is gated on env vars.
- Migrations run unconditionally — they're idempotent.

## Trusted-proxy / XFF parsing in one helper

`TRUSTED_PROXY_HOPS`-aware XFF parsing serves both throttle `get_ident` and any view reading client IP. One function, both call sites consume it. Reference: [`places._real_client_ip`](places/views.py).

## External SDK init in one per-provider module

Mutable SDK globals (`stripe.api_key`, etc.) get assigned exactly once. Other modules `from .stripe_client import stripe` instead of importing the SDK directly and re-setting the key inline. Reference: [`checkout/stripe_client.py`](checkout/stripe_client.py).

## Upstream errors logged server-side, never forwarded

Proxying a third-party API: non-2xx and exceptions log full detail server-side (`logger.warning('… upstream %d: %s', ...)` / `logger.exception(...)`); client gets generic `{'detail': 'Upstream error.'}` (or the SDK's `user_message` for Stripe). Avoid leaking provider error text — it can include API-key hints, project IDs, or internal paths. References: [`places.autocomplete` / `places.details`](places/views.py), [`checkout.create_payment_intent`](checkout/views.py).

## Webhook handlers log received-event-id at info before dispatching

After signature verification, the first thing a webhook handler does is `logger.info('… event received: %s for %s', event_type, payload_id)`. Avoids the bug where a downstream side effect (email send, DB write) early-exits without logging — you can't tell from logs whether the webhook ever fired. Signature-verify and unknown-event paths log separately at `warning` / `debug`. Reference: [`checkout.stripe_webhook`](checkout/webhooks.py).

## No empty stub files

Delete `views.py` / `tests.py` files containing only `from django.shortcuts import render` / `# Create your X here.`. They lie about coverage and clutter `git grep`.
