import { useEffect, useMemo, useState } from 'react';
import {
  createFileRoute,
  Link,
  useSearch,
} from '@tanstack/react-router';
import { useSetAtom } from 'jotai';
import { cartItemsAtom } from '@/src/cart/cartAtoms';
import { getStripe } from '@/src/checkout/stripeClient';

interface SuccessSearch {
  payment_intent?: string;
  payment_intent_client_secret?: string;
  redirect_status?: string;
}

export const Route = createFileRoute('/checkout/success')({
  validateSearch: (search): SuccessSearch => ({
    payment_intent:
      typeof search.payment_intent === 'string'
        ? search.payment_intent
        : undefined,
    payment_intent_client_secret:
      typeof search.payment_intent_client_secret === 'string'
        ? search.payment_intent_client_secret
        : undefined,
    redirect_status:
      typeof search.redirect_status === 'string'
        ? search.redirect_status
        : undefined,
  }),
  component: SuccessPage,
  loader: () => {
    document.title = 'Order confirmed | UrbanStems';
  },
});

type Status = 'loading' | 'succeeded' | 'processing' | 'failed';

function SuccessPage() {
  const search = useSearch({ from: '/checkout/success' });
  const setCart = useSetAtom(cartItemsAtom);
  const [status, setStatus] = useState<Status>('loading');
  const [amount, setAmount] = useState<number | null>(null);
  const clientSecret = search.payment_intent_client_secret;

  useEffect(() => {
    if (!clientSecret) {
      setStatus('failed');
      return;
    }
    let cancelled = false;
    getStripe().then(async (stripe) => {
      if (!stripe || cancelled) return;
      const { paymentIntent } =
        await stripe.retrievePaymentIntent(clientSecret);
      if (cancelled) return;
      if (!paymentIntent) {
        setStatus('failed');
        return;
      }
      setAmount(paymentIntent.amount);
      switch (paymentIntent.status) {
        case 'succeeded':
          setStatus('succeeded');
          setCart([]);
          break;
        case 'processing':
          setStatus('processing');
          break;
        default:
          setStatus('failed');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [clientSecret, setCart]);

  const formattedAmount = useMemo(
    () => (amount == null ? null : `$${(amount / 100).toFixed(2)}`),
    [amount]
  );

  return (
    <div className='mx-auto flex min-h-[calc(100vh-var(--navbar-height))] max-w-xl flex-col items-center justify-center px-6 py-20 text-center'>
      {status === 'loading' && (
        <p className='text-sm opacity-60'>Confirming your payment…</p>
      )}

      {status === 'succeeded' && (
        <>
          <h1 className='font-crimson mb-4 text-4xl'>Thank you!</h1>
          <p className='mb-2 text-base'>Your order is confirmed.</p>
          {formattedAmount && (
            <p className='mb-6 text-sm opacity-70'>
              We charged {formattedAmount} to your card. A receipt is on its
              way to your inbox.
            </p>
          )}
          <Link
            to='/'
            className='bg-brand-primary inline-block rounded-md px-10 py-4 text-xs font-black tracking-[0.2em] text-white/90 transition-opacity hover:opacity-90'
          >
            CONTINUE SHOPPING
          </Link>
        </>
      )}

      {status === 'processing' && (
        <>
          <h1 className='font-crimson mb-4 text-4xl'>Almost there</h1>
          <p className='text-sm opacity-70'>
            Your payment is processing. We&apos;ll email you when it&apos;s
            confirmed.
          </p>
        </>
      )}

      {status === 'failed' && (
        <>
          <h1 className='font-crimson mb-4 text-4xl'>
            Something went wrong
          </h1>
          <p className='mb-6 text-sm opacity-70'>
            Your payment didn&apos;t go through. Your cart is still saved —
            give it another try.
          </p>
          <Link
            to='/checkout'
            className='bg-brand-primary inline-block rounded-md px-10 py-4 text-xs font-black tracking-[0.2em] text-white/90'
          >
            BACK TO CHECKOUT
          </Link>
        </>
      )}
    </div>
  );
}
