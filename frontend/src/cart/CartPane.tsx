import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { FiX } from 'react-icons/fi';
import { HiOutlineTrash } from 'react-icons/hi2';
import { CgSpinner } from 'react-icons/cg';
import { useNavigate } from '@tanstack/react-router';
import { useIsFetching } from '@tanstack/react-query';
import { checkoutKeys } from '@/api/checkout/checkoutQueries';
import { usePortal } from '../common/usePortal';
import { capitalizeString } from '../common/utils/capitalizeString';
import {
  CartLine,
  cartItemsAtom,
  cartOpenAtom,
  cartTotalAtom,
  removeLineAtom,
  setLineQuantityAtom,
} from './cartAtoms';
import { tw } from '../common/utils/tw';

const FREE_SHIPPING_THRESHOLD = 140;

export const CartPane = () => {
  const [open, setOpen] = useAtom(cartOpenAtom);
  const lines = useAtomValue(cartItemsAtom);
  const total = useAtomValue(cartTotalAtom);
  const renderPortal = usePortal(open);
  const navigate = useNavigate();

  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const remainingForShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - total);
  const navigating =
    useIsFetching({ queryKey: checkoutKeys.paymentIntent(lines) }) > 0;

  const close = () => setOpen(false);

  const goToCheckout = async () => {
    await navigate({ to: '/checkout' });
    setOpen(false);
  };

  return (
    <>
      {renderPortal(
        <div
          className={tw(
            'fixed inset-0 z-[51] bg-black/60 transition-opacity duration-300',
            open
              ? 'pointer-events-auto opacity-100'
              : 'pointer-events-none opacity-0'
          )}
          onClick={close}
        />
      )}

      <div
        className={tw(
          'bg-background fixed top-[3vh] right-6 z-[52] flex h-[92vh] w-full max-w-[480px] flex-col rounded-md shadow-2xl transition-transform duration-300',
          open ? 'translate-x-0' : 'translate-x-[calc(100%+10rem)]'
        )}
      >
        {/* Header */}
        <div className='flex items-start justify-between p-7'>
          <span className='font-crimson px-4 pt-7 text-4xl'>
            {itemCount > 0 ? `Cart (${itemCount})` : 'Cart'}
          </span>
          <button
            onClick={close}
            className='border-brand-primary hover:bg-brand-primary rounded-full border p-1.5 transition-colors duration-400 hover:text-white'
            aria-label='Close cart'
          >
            <FiX size={18} />
          </button>
        </div>

        <div className='flex-1 overflow-y-auto px-12'>
          {lines.length === 0 ? (
            <div className='flex h-full flex-col items-center justify-center gap-6 pb-20'>
              <div className='font-mulish text-sm opacity-60'>
                Your cart is empty
              </div>
              <button
                onClick={close}
                className='bg-brand-primary rounded-md px-10 py-4 text-xs font-black tracking-[0.2em] text-white/90 transition-opacity duration-300 hover:opacity-90 active:scale-[0.99]'
              >
                CONTINUE SHOPPING
              </button>
            </div>
          ) : (
            <>
              <div className='border-brand-primary bg-footer border p-5 text-center text-sm'>
                {remainingForShipping > 0
                  ? `You are $${remainingForShipping.toFixed(2)} away from free shipping!`
                  : 'Your order qualifies for free shipping!'}
              </div>

              <div className='flex flex-col gap-1 pt-6'>
                {lines.map((line) => (
                  <CartLineRow key={line.item.slug} line={line} />
                ))}
              </div>
            </>
          )}
        </div>

        {lines.length > 0 && (
          <div className='flex flex-col gap-3 rounded-b-md bg-white px-10 pt-6 pb-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.03)]'>
            <div className='flex items-center justify-between text-base'>
              <span>Total</span>
              <span className='font-bold'>${total.toFixed(0)}</span>
            </div>
            <div className='flex items-center justify-between text-sm'>
              <span>Estimated Shipping</span>
              <span className='font-bold'>
                {remainingForShipping > 0 ? 'TBD' : 'Free'}
              </span>
            </div>
            <button
              onClick={goToCheckout}
              disabled={navigating}
              className='bg-brand-primary mt-2 flex w-full items-center justify-center rounded-md py-5 text-xs font-black tracking-[0.2em] text-white/90 transition-opacity duration-300 hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-80'
            >
              {navigating ? (
                <CgSpinner className='animate-spin' size={20} />
              ) : (
                'CHECKOUT'
              )}
            </button>
            <p className='text-center text-[11px] opacity-60'>
              Total, final shipping amount, discounts, taxes, and fees are
              calculated at checkout
            </p>
          </div>
        )}
      </div>
    </>
  );
};

const CartLineRow = ({ line }: { line: CartLine }) => {
  const setQuantity = useSetAtom(setLineQuantityAtom);
  const removeLine = useSetAtom(removeLineAtom);
  const { item, quantity } = line;
  const lineTotal = item.price_dollars * quantity;
  const originalLineTotal =
    item.discounted_price_dollars != null
      ? item.discounted_price_dollars * quantity
      : null;

  return (
    <div className='border-background-alt flex gap-4 border-b py-5'>
      {item.main_image && (
        <img
          src={`${item.main_image}&width=400`}
          alt={item.name}
          className='h-24 w-24 shrink-0 rounded-sm object-cover'
        />
      )}
      <div className='flex flex-1 flex-col justify-between'>
        <div className='flex items-start justify-between gap-2'>
          <div className='flex flex-col gap-0.5'>
            <div className='text-base leading-tight font-bold'>{item.name}</div>
            {item.variant_type && (
              <div className='text-sm'>
                Size: {capitalizeString(item.variant_type)}
              </div>
            )}
          </div>
          <button
            onClick={() => removeLine(item.slug)}
            aria-label={`Remove ${item.name}`}
            className='shrink-0 transition-opacity hover:opacity-60'
          >
            <HiOutlineTrash size={18} />
          </button>
        </div>
        <div className='flex items-end justify-between'>
          <div className='border-background-alt flex items-center gap-3 rounded-sm border px-3 py-1.5 text-sm'>
            <button
              onClick={() =>
                setQuantity({ slug: item.slug, quantity: quantity - 1 })
              }
              aria-label='Decrease quantity'
              className='transition-opacity hover:opacity-60'
            >
              -
            </button>
            <span className='min-w-[1ch] text-center'>{quantity}</span>
            <button
              onClick={() =>
                setQuantity({ slug: item.slug, quantity: quantity + 1 })
              }
              aria-label='Increase quantity'
              className='transition-opacity hover:opacity-60'
            >
              +
            </button>
          </div>
          <div className='flex items-baseline gap-2 text-sm'>
            {originalLineTotal != null && (
              <span className='line-through opacity-60'>
                ${originalLineTotal.toFixed(0)}
              </span>
            )}
            <span>${lineTotal.toFixed(0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
