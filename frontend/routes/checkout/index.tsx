import { createFileRoute, redirect } from '@tanstack/react-router';
import { getDefaultStore } from 'jotai';
import {
  checkoutQueries,
  type CreatePaymentIntentResponse,
} from '@/api/checkout/checkoutQueries';
import { cartItemsAtom } from '@/src/cart/cartAtoms';
import { CheckoutPage } from '@/src/checkout/CheckoutPage';
import { hasStripeKey } from '@/src/checkout/stripeClient';

type LoaderResult =
  | { kind: 'ok'; intent: CreatePaymentIntentResponse }
  | { kind: 'error'; message: string };

export const Route = createFileRoute('/checkout/')({
  component: CheckoutPage,
  // Re-run on each entry so cart edits are reflected.
  staleTime: 0,
  loader: async ({ context }): Promise<LoaderResult> => {
    document.title = 'Checkout | UrbanStems';

    const lines = getDefaultStore().get(cartItemsAtom);
    if (lines.length === 0) {
      throw redirect({ to: '/' });
    }

    if (!hasStripeKey()) {
      return {
        kind: 'error',
        message:
          'Stripe publishable key is not configured. Set VITE_STRIPE_PUBLISHABLE_KEY in frontend/.env.',
      };
    }

    try {
      const intent = await context.queryClient.ensureQueryData(
        checkoutQueries.paymentIntent(lines)
      );
      return { kind: 'ok', intent };
    } catch (err) {
      return {
        kind: 'error',
        message: (err as Error).message || 'Failed to initialize checkout.',
      };
    }
  },
});
