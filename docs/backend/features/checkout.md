# Checkout (backend)

The `checkout/` app handles three things: creating a Stripe `PaymentIntent` for a cart, receiving the Stripe webhook when payment succeeds, and rendering + sending the order-confirmation email via Resend.

For the frontend half (Stripe Payment Element wiring, success page, intent fetch) and for setup steps (Stripe CLI, test cards, Resend), see [`docs/checkout-and-stripe.md`](../../checkout-and-stripe.md).

## `create_payment_intent`

POST endpoint that takes `{line_items: [{slug, quantity}, ...]}` and returns a Stripe client secret + the totals.

**Server-side re-pricing.** The request body carries only `slug` and `quantity` — never prices. The view re-prices from the DB in `_compute_totals`. Discount wins when set, with an explicit `is None` check so a 0-cent discount doesn't fall through to full price.

**Validation via DRF Serializer.** `CreatePaymentIntentSerializer` (with a nested `LineItemSerializer`) replaces hand-rolled `request.data.get(...)` + `isinstance(list)` checks. Structured field-level 400s for free.

**Tax + shipping helpers** (`_tax_cents`, `_shipping_cents`) are pure functions of `subtotal_cents` against settings (`CHECKOUT_TAX_RATE_PCT`, `CHECKOUT_FREE_SHIPPING_THRESHOLD_CENTS`, `CHECKOUT_FLAT_SHIPPING_CENTS`). Easy to swap for a real tax/shipping provider — the call sites stay the same.

**Stripe metadata.** Subtotal / shipping / tax / item count and a `lines` JSON blob (slug + name + qty + cents per line) are stamped onto the PaymentIntent so the webhook can render the email without re-querying. The blob is truncated at 500 chars (Stripe's per-value limit) — known failure mode for long carts is documented in [improvements](../../improvements/backend.md).

**Stripe error handling.** `StripeError` is logged with `logger.exception('PaymentIntent.create failed')` (full traceback server-side) and the client gets a 502 with Stripe's `user_message` (or the exception string fallback).

## Stripe SDK init

[`checkout/stripe_client.py`](../../../backend/checkout/stripe_client.py) sets `stripe.api_key = settings.STRIPE_SECRET_KEY` once at import. `views.py`, `emails.py`, `webhooks.py` all `from .stripe_client import stripe` — no inline `api_key` re-assignment. Single source of truth for the SDK global.

## Webhook handler

[`checkout/webhooks.py`](../../../backend/checkout/webhooks.py) is the reference shape for any Stripe webhook in the project:

- **Plain Django** `@csrf_exempt`/`@require_POST`, not DRF — signature verification needs raw bytes via `request.body`, and DRF's `request.data` consumes the stream.
- **Signature verified before any payload trust** — `stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)`. `SignatureVerificationError` returns 400 (correct: tells Stripe "don't retry").
- **Idempotency via Django cache** — `EMAIL_SENT_TTL_S = 24h` keyed on the PaymentIntent id; duplicate webhook deliveries don't double-send. Survives restarts when Redis is configured.
- **Fast 2xx** — Stripe retries non-2xx for up to 3 days. Handler dispatches and returns 200 immediately.
- **Unknown events ack-and-ignored** — logged at debug, 200 returned. Stripe occasionally delivers events on the endpoint we didn't subscribe to.

## Order-confirmation email

[`checkout/emails.py`](../../../backend/checkout/emails.py). Built from the PaymentIntent metadata + shipping fields + an `expand=['latest_charge']` re-fetch (one extra Stripe call) to get billing/payment-method details. Sent via Resend.

**HTML escaping.** All user-supplied strings (customer name, address, etc.) pass through `html.escape()` before interpolation into the template — see `_format_address` and the `_build_html` body. Stripe sanitizes addresses upstream, but defense-in-depth treats anything from outside the system as untrusted.

**Shipping vs billing fall-through.** If the expanded charge doesn't include billing details (Stripe's `expand` support varies), the email shows "Same as shipping address" instead of breaking.

**Email palette is intentionally separate from the brand palette.** `_NAVY`, `_DIVIDER`, etc. in the email module are tuned for email-client rendering. Don't import frontend `--brand-primary` etc.

The 388-line f-string template is workable but hard to diff. Migration to Django templates or Jinja is parked in [improvements](../../improvements/backend.md) until the next email-design pass.

## Frontend cross-link

The SPA's `/checkout` route fetches the intent via `checkoutQueries.createPaymentIntent`, then mounts Stripe's Payment Element. See [`docs/checkout-and-stripe.md`](../../checkout-and-stripe.md) for the full flow.
