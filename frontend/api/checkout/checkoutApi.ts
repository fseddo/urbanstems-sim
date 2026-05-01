import { request } from '../request';

export interface CheckoutLineInput {
  slug: string;
  quantity: number;
}

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

export const createPaymentIntent = (line_items: CheckoutLineInput[]) =>
  request<CreatePaymentIntentResponse>({
    method: 'post',
    path: '/checkout/create-payment-intent/',
    body: { line_items },
  });
