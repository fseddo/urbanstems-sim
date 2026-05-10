import { useMemo, useState } from 'react';
import { Link, useLoaderData } from '@tanstack/react-router';
import { Elements } from '@stripe/react-stripe-js';
import type { StripeElementsOptions } from '@stripe/stripe-js';
import { CheckoutForm } from './CheckoutForm';
import { CheckoutSummary, MobileCheckoutSummary } from './CheckoutSummary';
import { TestCardPopup } from './TestCardPopup';
import { getStripe } from './stripeClient';

// Stripe iframes are isolated from the parent page's font loading, so
// `appearance.fontFamily: 'Mulish'` alone falls back to the iframe's default.
// Pass a Google Fonts URL here so Stripe loads the same font we use in the
// rest of the app.
const stripeFonts: StripeElementsOptions['fonts'] = [
  {
    cssSrc:
      'https://fonts.googleapis.com/css2?family=Mulish:wght@400;600;700&display=swap',
  },
];

const stripeAppearance: StripeElementsOptions['appearance'] = {
  theme: 'stripe',
  // `labels: 'floating'` puts each field's label inside the input as
  // placeholder-like text that floats up when the field is focused/filled.
  // Stripe doesn't expose a per-field `placeholder` for iframe-rendered
  // inputs (CC number, address fields), so the floating-label pattern is
  // the canonical way to get placeholder UX on Elements.
  labels: 'floating',
  variables: {
    colorPrimary: '#1e2934',
    colorBackground: '#ffffff',
    colorText: '#1e2934',
    // Resting (in-field) floating-label color — matches the email input's
    // browser-default placeholder gray (~Tailwind `gray-400`).
    colorTextPlaceholder: '#9CA3AF',
    fontFamily: 'Mulish, sans-serif',
    // Base size flows through to inputs and resting labels — matches the
    // email input's `text-sm` so Stripe-rendered fields read as the same
    // weight as our own.
    fontSizeBase: '14px',
    borderRadius: '6px',
    spacingUnit: '4px',
  },
  // `colorTextPlaceholder` only styles the underlying `<input>` placeholder,
  // not the floating-label states. Override `.Label--resting` (the in-field
  // placeholder-like state) and `.Label--floating` (the small-above state)
  // explicitly to match the email input's lighter placeholder weight.
  rules: {
    '.Label--resting': {
      color: '#9CA3AF',
      fontWeight: '400',
    },
    '.Label--floating': {
      color: 'rgba(30, 41, 52, 0.6)',
      fontWeight: '400',
    },
  },
};

export const CheckoutPage = () => {
  const result = useLoaderData({ from: '/checkout/' });
  const stripePromise = useMemo(() => getStripe(), []);
  const [testCardOpen, setTestCardOpen] = useState(true);

  if (result.kind === 'error') {
    return (
      <div className='mx-auto max-w-xl px-6 py-20 text-center'>
        <h1 className='font-crimson mb-4 text-3xl'>Checkout unavailable</h1>
        <p className='mb-6 text-sm opacity-70'>{result.message}</p>
        <Link
          to='/'
          className='bg-brand-primary inline-block rounded-md px-10 py-4 text-xs font-black tracking-action text-white/90'
        >
          BACK TO SHOP
        </Link>
      </div>
    );
  }

  const { intent } = result;

  return (
    <div className='grid min-h-[calc(100vh-var(--navbar-height))] gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)]'>
      {testCardOpen && (
        <TestCardPopup onClose={() => setTestCardOpen(false)} />
      )}

      <MobileCheckoutSummary
        subtotalCents={intent.subtotal_cents}
        shippingCents={intent.shipping_cents}
        taxCents={intent.tax_cents}
        totalCents={intent.amount_cents}
        className='lg:hidden'
      />

      <div className='flex justify-center px-6 py-12 lg:px-16'>
        <div className='w-full max-w-xl'>
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret: intent.client_secret,
              appearance: stripeAppearance,
              fonts: stripeFonts,
              loader: 'always',
            }}
          >
            <CheckoutForm totalCents={intent.amount_cents} />
          </Elements>
        </div>
      </div>

      <CheckoutSummary
        subtotalCents={intent.subtotal_cents}
        shippingCents={intent.shipping_cents}
        taxCents={intent.tax_cents}
        totalCents={intent.amount_cents}
        className='hidden lg:flex'
      />
    </div>
  );
};
