import { useEffect, useMemo, useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';
import { Elements } from '@stripe/react-stripe-js';
import type { StripeElementsOptions } from '@stripe/stripe-js';
import {
  createPaymentIntent,
  type CreatePaymentIntentResponse,
} from '@/api/checkout/checkoutApi';
import { cartItemsAtom } from '@/src/cart/cartAtoms';
import { CheckoutForm } from '@/src/checkout/CheckoutForm';
import { CheckoutSummary } from '@/src/checkout/CheckoutSummary';
import { getStripe, hasStripeKey } from '@/src/checkout/stripeClient';

export const Route = createFileRoute('/checkout/')({
  component: CheckoutPage,
  loader: () => {
    document.title = 'Checkout | UrbanStems';
  },
});

const stripeAppearance: StripeElementsOptions['appearance'] = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#1e2934',
    colorBackground: '#ffffff',
    colorText: '#1e2934',
    fontFamily: 'Mulish, sans-serif',
    borderRadius: '6px',
    spacingUnit: '4px',
  },
};

function CheckoutPage() {
  const lines = useAtomValue(cartItemsAtom);
  const navigate = useNavigate();
  const [intent, setIntent] = useState<CreatePaymentIntentResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const lineItemsKey = useMemo(
    () =>
      lines
        .map((l) => `${l.item.slug}:${l.quantity}`)
        .sort()
        .join('|'),
    [lines]
  );

  useEffect(() => {
    if (lines.length === 0) {
      navigate({ to: '/' });
      return;
    }
    if (!hasStripeKey()) {
      setLoadError(
        'Stripe publishable key is not configured. Set VITE_STRIPE_PUBLISHABLE_KEY in frontend/.env.'
      );
      return;
    }

    let cancelled = false;
    setLoadError(null);
    createPaymentIntent(
      lines.map((l) => ({ slug: l.item.slug, quantity: l.quantity }))
    )
      .then((resp) => {
        if (!cancelled) setIntent(resp);
      })
      .catch((err: Error) => {
        if (!cancelled)
          setLoadError(err.message || 'Failed to initialize checkout.');
      });

    return () => {
      cancelled = true;
    };
    // lineItemsKey captures cart contents — re-create intent only when it changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineItemsKey]);

  const stripePromise = useMemo(() => getStripe(), []);

  if (loadError) {
    return (
      <div className='mx-auto max-w-xl px-6 py-20 text-center'>
        <h1 className='font-crimson mb-4 text-3xl'>Checkout unavailable</h1>
        <p className='mb-6 text-sm opacity-70'>{loadError}</p>
        <Link
          to='/'
          className='bg-brand-primary inline-block rounded-md px-10 py-4 text-xs font-black tracking-[0.2em] text-white/90'
        >
          BACK TO SHOP
        </Link>
      </div>
    );
  }

  return (
    <div className='grid min-h-[calc(100vh-var(--navbar-height))] gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)]'>
      <div className='flex justify-center px-6 py-12 lg:px-16'>
        <div className='w-full max-w-xl'>
          {intent ? (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret: intent.client_secret,
                appearance: stripeAppearance,
              }}
            >
              <CheckoutForm />
            </Elements>
          ) : (
            <div className='flex h-64 items-center justify-center text-sm opacity-60'>
              Preparing checkout…
            </div>
          )}
        </div>
      </div>

      <CheckoutSummary
        subtotalCents={intent?.subtotal_cents ?? null}
        shippingCents={intent?.shipping_cents ?? null}
        taxCents={intent?.tax_cents ?? null}
        totalCents={intent?.amount_cents ?? null}
      />
    </div>
  );
}
