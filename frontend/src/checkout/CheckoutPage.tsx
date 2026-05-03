import { useMemo, useState } from 'react';
import { Link, useLoaderData } from '@tanstack/react-router';
import { Elements } from '@stripe/react-stripe-js';
import type { StripeElementsOptions } from '@stripe/stripe-js';
import { CheckoutForm } from './CheckoutForm';
import { CheckoutSummary } from './CheckoutSummary';
import { TestCardPopup } from './TestCardPopup';
import { getStripe } from './stripeClient';

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
          className='bg-brand-primary inline-block rounded-md px-10 py-4 text-xs font-black tracking-[0.2em] text-white/90'
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
      <div className='flex justify-center px-6 py-12 lg:px-16'>
        <div className='w-full max-w-xl'>
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret: intent.client_secret,
              appearance: stripeAppearance,
              loader: 'always',
            }}
          >
            <CheckoutForm />
          </Elements>
        </div>
      </div>

      <CheckoutSummary
        subtotalCents={intent.subtotal_cents}
        shippingCents={intent.shipping_cents}
        taxCents={intent.tax_cents}
        totalCents={intent.amount_cents}
      />
    </div>
  );
};
