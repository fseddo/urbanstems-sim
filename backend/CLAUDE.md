# Claude rules for the Django backend

These are the conventions established by the audit fixes tracked in [`docs/improvements/backend.md`](../docs/improvements/backend.md). Each rule is backed by a concrete reference in the repo. Architecture and feature docs live in [`docs/backend/`](../docs/backend/).

## Reseeding the catalog (`SEED_ON_BOOT`)

`seed_products --clear` is **destructive** — it wipes Products, Reviews, all M2M tables, and all taxonomies, then rebuilds from `data/products.json` ([seed_products.py:138-152](products/management/commands/seed_products.py#L138-L152)). The Dockerfile `CMD` gates this on `SEED_ON_BOOT=true` so prod doesn't reseed on every restart.

**Default is `false` everywhere.** Migrations always run; seed + blur generation only run when `SEED_ON_BOOT=true`.

**When to flip the flag on Railway:**
- Updated `data/products.json` and want the change live.
- Schema migration touched product data and the seed needs to repopulate.
- First-ever deploy of an empty database.

**How:** set `SEED_ON_BOOT=true` in Railway env, redeploy, **then unset it** (or set to `false`). Leaving it on means every subsequent restart wipes admin edits and churns primary keys (breaks any external system that holds product IDs — Stripe metadata, search indexes, etc.).

**Local dev** runs `python manage.py runserver` directly via `docker-compose.yml`'s `command:` override, which bypasses the Dockerfile `CMD` entirely — so seeding never runs from Compose. Reseed locally with `docker compose exec web python manage.py seed_products --clear`.

## Request validation: DRF Serializers, not `request.data.get`

Validate request bodies with a `Serializer` and `serializer.is_valid(raise_exception=True)`. Don't hand-roll `request.data.get(...) or []`, `isinstance(x, list)`, `int(...)`, etc. The serializer gives structured field-level 400 responses automatically and the failure modes are visible to the caller.

Reference: [`CreatePaymentIntentSerializer`](checkout/serializers.py).

## Query-param filtering: `django_filters.FilterSet`

Filterable list endpoints declare a `FilterSet` and use `DjangoFilterBackend`, not imperative `request.query_params.get(...)` chains in `get_queryset`. Multi-select via repeated params (`?foo=a&foo=b`) needs a method filter that reads `self.request.GET.getlist(...)`, because `BaseInFilter` expects comma-separated values.

References: [`ProductFilter`](products/filters.py), [`ReviewFilter`](products/filters.py).

## DRF settings declare auth/permission classes explicitly

Even when the value is `AllowAny`, set `DEFAULT_AUTHENTICATION_CLASSES` and `DEFAULT_PERMISSION_CLASSES` in `REST_FRAMEWORK` ([settings.py](urbanstems_backend/settings.py)). Defaults are not documentation; the bug we're avoiding is a future write endpoint silently inheriting AllowAny.

## Env vars: read once in `settings.py`, consume via `from django.conf import settings`

No `decouple.config(...)` calls outside `settings.py`. Views and management commands read `settings.X`. This makes overrides via `@override_settings` work in tests and keeps the env-var surface visible in one file.

Production-relevant settings (`SECRET_KEY`, `DEBUG`) have **no insecure defaults** — `SECRET_KEY = config('SECRET_KEY')` raises at boot if missing. `DEBUG = config('DEBUG', default=False, cast=bool)` defaults the safe direction.

## Logging configured explicitly

`settings.py` defines `LOGGING` with per-app levels (`checkout`, `places`, `products`) tied to `DEBUG` (verbose in dev, quiet in prod). Don't rely on Django defaults beyond local dev.

Reference: [settings.py `LOGGING` block](urbanstems_backend/settings.py).

## `is None` for fallback (not falsy `or`)

`x = a or b` only when `0` / `""` / `[]` should be treated as "absent" and fall through to `b`. For "use `a` if it's set, else `b`," use `x = a if a is not None else b`. The `discounted_price or price` bug — where a 0-cent discount would silently fall through to full price — is the canonical example.

## HTML-escape user-supplied strings

Anything from outside the system (customer name, address, gift message, future free-text fields) passes through `html.escape()` before interpolation into HTML. Server-rendered DB strings are trusted; client-supplied ones aren't.

Reference: [`emails._format_address`](checkout/emails.py).

## M2M with `through=` for ordered membership relations

When the relation is "products in this category in curated order" — i.e., a through-model carrying a `position` field — declare it as `models.ManyToManyField(Tag, through='ProductTag', related_name='products')` on the parent. Don't emulate via `@property` lambdas over reverse FK lookups: Django can't `prefetch_related` on properties, the admin doesn't get inlines, and `Tag.products.all()` doesn't work.

Position-ordered queries still use the through-model lookup syntax (`order_by('producttag__position')`) — that's unaffected by the M2M declaration.

Reference: [`Product` taxonomy fields](products/models.py).

## Derive denormalized data at request time

Don't store sibling/related data on a row as a JSONField unless there's a maintained rebuild trigger (signal, celery task, save override). Compute it at serializer time. For list endpoints that would otherwise N+1, bulk-prefetch the entire page in one query and attach as `_<thing>_cache` on each instance.

Reference: [`Product.variants()`](products/models.py) + [`_attach_variants_cache`](products/api_views.py).

## Container hygiene

Base images pin to a specific minor (`python:3.11.15-slim`, never bare `python:3.11-slim`) — combined with exact-pinned `requirements.txt`, builds are reproducible. Container `CMD` runs only the long-lived process. One-shot work (seeds, blur generation) is gated on env vars. Migrations run unconditionally — they're idempotent and safe.

## Trusted-proxy / XFF parsing in one helper

The same `TRUSTED_PROXY_HOPS`-aware XFF parsing should serve both throttle `get_ident` and any view that reads client IP. One function, both call sites consume it.

Reference: [`places._real_client_ip`](places/views.py).

## External SDK init lives in one module per provider

Mutable SDK globals (`stripe.api_key`, etc.) get assigned exactly once, in a per-provider module. Other modules `from .stripe_client import stripe` instead of importing the SDK directly and re-setting the key inline. The bug we're avoiding: a third caller that forgets to set the key before its first call, working only because some other request happened to set it earlier.

Reference: [`checkout/stripe_client.py`](checkout/stripe_client.py).

## Upstream errors logged server-side, never forwarded to the client

When proxying a third-party API (Google Places, Stripe, etc.), non-2xx responses and request exceptions are logged with full detail server-side (`logger.warning('… upstream %d: %s', resp.status_code, resp.text)` / `logger.exception(...)`) and the client gets a generic `{'detail': 'Upstream error.'}` (or the SDK's `user_message` for Stripe). Avoid leaking provider error text — it can include API-key hints, project IDs, or internal paths.

References: [`places.autocomplete` / `places.details`](places/views.py), [`checkout.create_payment_intent`](checkout/views.py).

## Webhook handlers log received-event-id at info before dispatching

The first thing a webhook handler does after signature verification is `logger.info('… event received: %s for %s', event_type, payload_id)`. The bug we're avoiding: a downstream side effect (email send, DB write) early-exits without logging, and you can't tell from the logs whether the webhook ever fired. The signature-verify and unknown-event paths log separately at `warning` / `debug`.

Reference: [`checkout.stripe_webhook`](checkout/webhooks.py).

## No empty stub files

Delete `views.py` / `tests.py` files that contain only `from django.shortcuts import render` / `# Create your X here.`. They lie about coverage and clutter `git grep`.
