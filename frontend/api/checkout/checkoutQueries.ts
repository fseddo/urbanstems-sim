import { queryOptions } from '@tanstack/react-query';
import { request } from '../request';
import type { CartLine } from '@/src/cart/cartAtoms';

export interface ResolvedCheckoutLine {
  slug: string;
  name: string;
  quantity: number;
  unit_cents: number;
  line_cents: number;
}

export interface CreatePaymentIntentResponse {
  client_secret: string;
  amount_cents: number;
  subtotal_cents: number;
  shipping_cents: number;
  tax_cents: number;
  currency: string;
  lines: ResolvedCheckoutLine[];
}

// Stable hash of cart contents (slug + quantity + optional vase slug per
// line) so the payment-intent cache dedups across navigations and doesn't
// collide between configs that share a parent slug.
const lineHash = (lines: CartLine[]) =>
  lines
    .map(
      (l) =>
        `${l.item.slug}:${l.quantity}${l.vase ? `:[${l.vase.slug}]` : ''}`
    )
    .sort()
    .join('|');

export const checkoutKeys = {
  all: ['checkout'] as const,
  paymentIntents: () => [...checkoutKeys.all, 'payment-intent'] as const,
  paymentIntent: (lines: CartLine[]) =>
    [...checkoutKeys.paymentIntents(), lineHash(lines)] as const,
};

export const checkoutQueries = {
  paymentIntent: (lines: CartLine[]) =>
    queryOptions({
      queryKey: checkoutKeys.paymentIntent(lines),
      queryFn: () =>
        request<CreatePaymentIntentResponse>({
          method: 'post',
          path: '/checkout/create-payment-intent/',
          body: {
            // Flatten parent + optional vase into separate line items.
            // Vase qty mirrors set qty (2 sets = 2 vases). Gifts are
            // already independent cart lines, so they pass through as-is.
            line_items: lines.flatMap((l) =>
              l.vase
                ? [
                    { slug: l.item.slug, quantity: l.quantity },
                    { slug: l.vase.slug, quantity: l.quantity },
                  ]
                : [{ slug: l.item.slug, quantity: l.quantity }]
            ),
          },
        }),
      // Cart contents are the cache key; if they don't change, reuse the intent.
      staleTime: Infinity,
    }),
};
