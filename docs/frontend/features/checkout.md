# Checkout & Stripe

How the checkout flow works, why it's structured the way it is, and what to set up before it works locally.

## The user-facing feature

Clicking **CHECKOUT** in the cart pane navigates to `/checkout`. The page shows the order summary on the right and a single form on the left with three sections: Contact (email), Delivery (full shipping address + phone via Stripe's `AddressElement`), and Payment (card and supported wallets via Stripe's `PaymentElement`).

Submitting confirms the payment with Stripe. On success, Stripe redirects to `/checkout/success`, which clears the cart and shows a confirmation. On failure, the user stays on `/checkout` and sees an inline error.

In parallel with the success redirect, Stripe POSTs `payment_intent.succeeded` to our webhook endpoint. The webhook reads the PaymentIntent (amount, shipping, line items in metadata) and sends an order confirmation email via Resend.

## Architecture at a glance

```
Browser                            Django backend                  Stripe / Resend
─────────                          ──────────────                  ───────────────
/checkout                ── POST ─ /api/checkout/                  Stripe API
  (Elements provider)              create-payment-intent/   ────── PaymentIntents.create
  + AddressElement                   resolves cart vs DB             (line items stashed
  + PaymentElement                   computes total, tax, shipping    in metadata)
  + custom email field               returns client_secret

  stripe.confirmPayment ─────────────────────────────────────────  Stripe.js
                                                                   (3DS, redirects)

/checkout/success      ── retrievePaymentIntent ──────────────────  Stripe.js
  (clears cart on
   succeeded status)

                                   /api/checkout/webhook/    ◄──── Stripe webhook
                                     verifies signature              (payment_intent.
                                     reads intent metadata            succeeded)
                                     sends email     ────────────► Resend API
```

Card details never touch our backend or our frontend code — they go directly from the iframe to Stripe.

## Why a Payment Intent on the server (not Stripe Checkout)

Stripe offers two integration shapes. We use the embedded one:

- **Stripe Checkout** (hosted page) — redirect users to `checkout.stripe.com`. Easy, but the page lives on Stripe's domain and styling is limited. Same "user leaves your site" pattern as Shopify checkout, which is the thing the sim is *not* trying to do.
- **Payment Element** (embedded) — backend creates a `PaymentIntent` and returns the `client_secret`; the frontend uses that secret to render Stripe's secure inputs inside our own page. Layout, copy, and styling are entirely ours.

The `PaymentIntent` is created server-side because:

1. **The amount must be authoritative.** Cart line items in the request are `{slug, quantity}` only — the backend looks each slug up in `products.Product` and computes the total from DB prices. A client-supplied price would let anyone check out at $0.
2. **The secret key never leaves Django.** `STRIPE_SECRET_KEY` is server-side; the browser only ever sees the publishable key.

## Tax and shipping

Both are computed server-side in `checkout.views`:

- **Shipping** — flat `CHECKOUT_FLAT_SHIPPING_CENTS` (default $15), waived above `CHECKOUT_FREE_SHIPPING_THRESHOLD_CENTS` (default $140 to mirror the cart pane's free-shipping threshold).
- **Tax** — flat `CHECKOUT_TAX_RATE_PCT` (default 8.875%, NYC combined sales tax) on the subtotal.

Both are placeholders. Real tax usually comes from the shipping address (Stripe Tax, TaxJar, Avalara) and shipping from a carrier rate quote. The current shape returns `{subtotal_cents, shipping_cents, tax_cents, amount_cents}` so the frontend summary already renders them — wiring a real provider is a one-file change.

## Webhook handler

`POST /api/checkout/webhook/` — receives Stripe events. We listen for:

- `payment_intent.succeeded` → triggers the order confirmation email
- `payment_intent.payment_failed` → currently logged only

Three things make this handler different from a normal endpoint:

1. **Signature verification on raw bytes.** `stripe.Webhook.construct_event` hashes the exact request body, so the handler reads `request.body` directly — never `request.data` (which would re-serialize and break the hash). It's a plain Django view (`@csrf_exempt`, `@require_POST`), not a DRF `@api_view`.
2. **Return 2xx fast.** Stripe retries non-2xx for up to 3 days with exponential backoff. Anything slow or error-prone (the email send) is best-effort within the handler — failures are logged but don't fail the response.
3. **Idempotency.** Stripe can deliver the same event more than once. The email send is gated by a Django cache key keyed on the PaymentIntent ID with a 24-hour TTL, so duplicate deliveries don't double-email the customer.

## Order confirmation email

Built in `backend/checkout/emails.py`. Pure Python f-string template — no Jinja, no templating engine. Inline-styled HTML, since most email clients strip `<style>` tags.

The webhook hands the PaymentIntent dict to `send_order_confirmation`, which pulls:
- `intent['receipt_email']` — set client-side via `confirmParams.receipt_email`
- `intent['shipping']` — captured by Stripe's `AddressElement`
- `intent['metadata']['lines']` — JSON we stash in the intent at creation time
- `intent['amount']`, `intent['metadata']['{subtotal,shipping,tax}_cents']` — totals

If `RESEND_API_KEY` is unset, the function logs a warning and returns silently — useful for local dev without Resend wired up.

## Environment variables

### Backend (`backend/.env`)

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
EMAIL_FROM=UrbanStems <orders@urbanstems.francescoseddo.me>
# Optional overrides — defaults are fine for the sim.
# STRIPE_CURRENCY=usd
# CHECKOUT_TAX_RATE_PCT=8.875
# CHECKOUT_FREE_SHIPPING_THRESHOLD_CENTS=14000
# CHECKOUT_FLAT_SHIPPING_CENTS=1500
```

`STRIPE_WEBHOOK_SECRET` is **environment-specific** — the value Railway gives you (from the dashboard endpoint config) is different from the value `stripe listen` prints locally. Use the matching one for whichever server you're running.

### Frontend (`frontend/.env`)

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Stripe account setup

1. Create a free account at https://dashboard.stripe.com/register.
2. Stay in **test mode** (toggle in the dashboard header).
3. Copy the test keys from https://dashboard.stripe.com/test/apikeys:
   - **Publishable key** (`pk_test_...`) → `frontend/.env` as `VITE_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** (`sk_test_...`) → `backend/.env` as `STRIPE_SECRET_KEY`
4. Restart both dev servers so the env vars are picked up.

## Webhook setup

### Production (Railway)

1. Make sure the backend service has a public domain (Railway → backend → Settings → Networking).
2. In Stripe Dashboard → **Developers → Webhooks** (test mode), add an endpoint:
   - URL: `https://<backend-domain>/api/checkout/webhook/`
   - Events: `payment_intent.succeeded` and `payment_intent.payment_failed`
3. Copy the signing secret Stripe shows (`whsec_...`) and set `STRIPE_WEBHOOK_SECRET` on the backend Railway service.
4. Redeploy the backend so Django picks up the new env var.

### Local development

Stripe webhooks need a public URL, so locally we use the Stripe CLI:

```
brew install stripe/stripe-cli/stripe
stripe login
stripe listen --forward-to http://localhost:8000/api/checkout/webhook/
```

The `listen` command prints a webhook signing secret in its startup banner — paste it into `backend/.env` as `STRIPE_WEBHOOK_SECRET` and restart the backend.

This secret is:
- **Stable across runs.** The CLI creates a persistent "Webhook from Stripe CLI" endpoint on your Stripe account on first use; every subsequent `stripe listen` reuses the same secret. Set it in `.env` once and forget about it. Run `stripe listen --print-secret` to retrieve it without forwarding.
- **Different from the Railway one.** Each webhook endpoint (the one in the dashboard pointing at Railway, and the one the CLI creates pointing at localhost) has its own secret. Use the matching value for whichever environment is running.

To trigger a test event without going through the full UI:

```
stripe trigger payment_intent.succeeded
```

The CLI synthesizes a fake event and forwards it to the local handler — useful for iterating on the email template without going through the checkout flow each time. Note: triggered events use synthetic data, so `receipt_email`, `shipping`, and `metadata.lines` will be empty — the email will skip-and-log rather than send. To exercise the full path, do an actual checkout against the local backend.

## Test cards

Stripe's test mode accepts a fixed set of card numbers, any future expiry, and any 3-digit CVC.

| number | what it does |
|---|---|
| `4242 4242 4242 4242` | Succeeds immediately. |
| `4000 0025 0000 3155` | Triggers 3D Secure. |
| `4000 0000 0000 9995` | Declined (insufficient funds). |
| `4000 0000 0000 0002` | Declined (generic). |

Full list: https://docs.stripe.com/testing#cards.

## Files of interest

- `backend/checkout/views.py` — PaymentIntent endpoint, price/tax/shipping math.
- `backend/checkout/webhooks.py` — Stripe webhook handler (signature verification, dispatch).
- `backend/checkout/emails.py` — HTML email template + Resend send helper, with idempotency.
- `frontend/api/checkout/checkoutQueries.ts` — TanStack Query options for the endpoint.
- `frontend/routes/checkout/index.tsx` — page shell, creates the intent on mount and mounts `<Elements>`.
- `frontend/routes/checkout/success.tsx` — confirms the intent, clears the cart.
- `frontend/src/checkout/CheckoutForm.tsx` — the form (Address + Payment + email + submit). The email field is the one input we own; it uses [`useForm`](../../../frontend/src/common/hooks/useForm.tsx) / `<form.Field>` for validation + error styling that matches the Stripe iframes (see [`architecture/forms.md`](../architecture/forms.md)). Address and Payment inputs are Stripe iframes and validate themselves at `confirmPayment` time.
- `frontend/src/checkout/CheckoutSummary.tsx` — the right-hand order summary.
- `frontend/src/checkout/stripeClient.ts` — singleton `loadStripe` wrapper.
