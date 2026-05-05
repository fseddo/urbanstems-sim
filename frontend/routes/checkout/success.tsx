import { useEffect } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useSetAtom } from 'jotai';
import { cartItemsAtom } from '@/src/cart/cartAtoms';
import { getStripe } from '@/src/checkout/stripeClient';
import { asString } from '@/src/common/utils/asString';

interface SuccessSearch {
  payment_intent?: string;
  payment_intent_client_secret?: string;
  redirect_status?: string;
}

type LoaderResult =
  | { kind: 'succeeded'; amount: number }
  | { kind: 'processing'; amount: number | null }
  | { kind: 'failed' };

const PendingPage = () => (
  <div className='mx-auto flex min-h-[calc(100vh-var(--navbar-height))] max-w-xl flex-col items-center justify-center px-6 py-20 text-center'>
    <p className='text-sm opacity-60'>Confirming your payment…</p>
  </div>
);

const SuccessPage = () => {
  const result = Route.useLoaderData();
  const setCart = useSetAtom(cartItemsAtom);

  // Cart-clear is a side effect of "payment succeeded," not of "we got a
  // result" — keyed on the discriminator so it fires only once on success.
  useEffect(() => {
    if (result.kind === 'succeeded') setCart([]);
  }, [result.kind, setCart]);

  const formattedAmount =
    result.kind !== 'failed' && result.amount != null
      ? `$${(result.amount / 100).toFixed(2)}`
      : null;

  return (
    <div className='mx-auto flex min-h-[calc(100vh-var(--navbar-height))] max-w-xl flex-col items-center justify-center px-6 py-20 text-center'>
      {result.kind === 'succeeded' && (
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

      {result.kind === 'processing' && (
        <>
          <h1 className='font-crimson mb-4 text-4xl'>Almost there</h1>
          <p className='text-sm opacity-70'>
            Your payment is processing. We&apos;ll email you when it&apos;s
            confirmed.
          </p>
        </>
      )}

      {result.kind === 'failed' && (
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
};

export const Route = createFileRoute('/checkout/success')({
  validateSearch: (search): SuccessSearch => ({
    payment_intent: asString(search.payment_intent),
    payment_intent_client_secret: asString(search.payment_intent_client_secret),
    redirect_status: asString(search.redirect_status),
  }),
  loaderDeps: ({ search }) => ({
    clientSecret: search.payment_intent_client_secret,
  }),
  loader: async ({ deps }): Promise<LoaderResult> => {
    document.title = 'Order confirmed | UrbanStems';
    const { clientSecret } = deps;
    if (!clientSecret) return { kind: 'failed' };
    const stripe = await getStripe();
    if (!stripe) return { kind: 'failed' };
    const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);
    if (!paymentIntent) return { kind: 'failed' };
    if (paymentIntent.status === 'succeeded') {
      return { kind: 'succeeded', amount: paymentIntent.amount };
    }
    if (paymentIntent.status === 'processing') {
      return { kind: 'processing', amount: paymentIntent.amount };
    }
    return { kind: 'failed' };
  },
  pendingComponent: PendingPage,
  component: SuccessPage,
});
