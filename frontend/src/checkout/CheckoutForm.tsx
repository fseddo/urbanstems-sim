import { FormEvent, useState } from 'react';
import {
  AddressElement,
  PaymentElement,
  useStripe,
} from '@stripe/react-stripe-js';
import { tw } from '../common/utils/tw';
import { useConfirmPayment } from './useConfirmPayment';

export const CheckoutForm = () => {
  const stripe = useStripe();
  const [email, setEmail] = useState('');
  // Stripe iframes mount at near-zero height and only post their final height
  // back ~50–200ms later. Each iframe wrapper has a min-height roughly matching
  // its final size so the labels between them don't jump; the PAY NOW button
  // and footer below still wait for both onReady fires (counter === 2) so the
  // user only sees a clickable button once the form is actually ready.
  const [readyCount, setReadyCount] = useState(0);
  const formReady = readyCount === 2;
  const markReady = () => setReadyCount((c) => c + 1);

  const confirmPayment = useConfirmPayment();

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    confirmPayment.mutate({ email });
  };

  return (
    <form onSubmit={onSubmit} className='flex flex-col gap-8'>
      <section className='flex flex-col gap-3'>
        <div className='flex items-center justify-between'>
          <h2 className='text-xl font-bold'>Contact</h2>
        </div>
        <input
          type='email'
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder='Email'
          className='border-background-alt focus:border-brand-primary w-full rounded-md border bg-white px-4 py-3.5 text-sm outline-none transition-colors'
        />
      </section>

      <section className='flex flex-col gap-3'>
        <h2 className='text-xl font-bold'>Delivery</h2>
        <div className='min-h-[160px]'>
          <AddressElement
            options={{
              mode: 'shipping',
              allowedCountries: ['US'],
              fields: { phone: 'always' },
              validation: { phone: { required: 'auto' } },
            }}
            onReady={markReady}
          />
        </div>
      </section>

      <section className='flex flex-col gap-3'>
        <h2 className='text-xl font-bold'>Payment</h2>
        <div className='min-h-[330px]'>
          <PaymentElement options={{ layout: 'tabs' }} onReady={markReady} />
        </div>
      </section>

      <div
        className={tw(
          'flex flex-col gap-8 transition-opacity duration-200',
          formReady ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        {confirmPayment.error && (
          <p className='bg-error-bg text-error rounded-md px-4 py-3 text-sm'>
            {confirmPayment.error.message}
          </p>
        )}

        <button
          type='submit'
          disabled={!stripe || confirmPayment.isPending}
          className='bg-brand-primary mt-2 w-full rounded-md py-5 text-xs font-black tracking-[0.2em] text-white/90 transition-opacity duration-300 hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60'
        >
          {confirmPayment.isPending ? 'PROCESSING…' : 'PAY NOW'}
        </button>

        <p className='text-center text-[11px] opacity-60'>
          Your payment information is processed securely by Stripe. This is a
          sim — use test card 4242 4242 4242 4242 with any future expiry and
          any CVC.
        </p>
      </div>
    </form>
  );
};
