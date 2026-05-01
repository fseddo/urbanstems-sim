import { loadStripe, type Stripe } from '@stripe/stripe-js';

// Single shared Stripe.js loader across the app — loadStripe should only be
// called once per page (it injects the SDK <script> tag).
let stripePromise: Promise<Stripe | null> | null = null;

export const getStripe = () => {
  if (stripePromise) return stripePromise;
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    stripePromise = Promise.resolve(null);
    return stripePromise;
  }
  stripePromise = loadStripe(key);
  return stripePromise;
};

export const hasStripeKey = () =>
  Boolean(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
