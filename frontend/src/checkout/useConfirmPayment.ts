import { useStripe, useElements } from '@stripe/react-stripe-js';
import { useMutation } from '@tanstack/react-query';

// Stripe.js calls live in a custom hook because they need React hook context
// (`useStripe`/`useElements`) — they can't live as a pure `mutationFn` in
// `checkoutQueries.ts` the way a backend-API mutation would. See CLAUDE.local.md
// for the broader convention.
export const useConfirmPayment = () => {
  const stripe = useStripe();
  const elements = useElements();

  return useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      if (!stripe || !elements) throw new Error('Stripe not ready');
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/result`,
          receipt_email: email || undefined,
        },
      });
      // confirmPayment redirects to return_url on success; we only reach this
      // line on an immediate error (validation, declined card, etc.).
      if (error) {
        throw new Error(
          error.message ?? 'Something went wrong. Please try again.'
        );
      }
    },
  });
};
