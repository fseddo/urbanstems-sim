import { createFileRoute } from '@tanstack/react-router';
import { getDefaultStore } from 'jotai';
import { cartItemsAtom } from '@/src/cart/cartAtoms';
import { getStripe } from '@/src/checkout/stripeClient';
import { CheckoutResultPage } from '@/src/checkout/CheckoutResultPage';
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

export const Route = createFileRoute('/checkout/result')({
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
      getDefaultStore().set(cartItemsAtom, []);
      return { kind: 'succeeded', amount: paymentIntent.amount };
    }
    if (paymentIntent.status === 'processing') {
      return { kind: 'processing', amount: paymentIntent.amount };
    }
    return { kind: 'failed' };
  },
  pendingComponent: PendingPage,
  component: CheckoutResultPage,
});
