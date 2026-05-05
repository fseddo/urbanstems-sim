import { useAtomValue } from 'jotai';
import { cartItemsAtom, cartCountAtom } from '../cart/cartAtoms';
import { capitalizeString } from '../common/utils/capitalizeString';
import { imageAtWidth } from '../common/utils/imageAtWidth';

interface CheckoutSummaryProps {
  subtotalCents: number | null;
  shippingCents: number | null;
  taxCents: number | null;
  totalCents: number | null;
}

const formatCents = (cents: number | null) =>
  cents == null ? '—' : `$${(cents / 100).toFixed(2)}`;

export const CheckoutSummary = ({
  subtotalCents,
  shippingCents,
  taxCents,
  totalCents,
}: CheckoutSummaryProps) => {
  const lines = useAtomValue(cartItemsAtom);
  const itemCount = useAtomValue(cartCountAtom);

  return (
    <aside className='border-background-alt bg-background flex flex-col gap-6 border-l p-10 lg:min-h-[calc(100vh-var(--navbar-height))]'>
      <ul className='flex flex-col gap-5'>
        {lines.map((line) => (
          <li key={line.item.slug} className='flex items-center gap-4'>
            <div className='relative shrink-0'>
              {line.item.main_image && (
                <img
                  src={imageAtWidth(line.item.main_image, 200)}
                  alt={line.item.name}
                  className='border-background-alt h-16 w-16 rounded-md border object-cover'
                />
              )}
              <span className='absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-black text-[11px] font-semibold text-white'>
                {line.quantity}
              </span>
            </div>
            <div className='flex-1'>
              <div className='text-sm font-bold'>{line.item.name}</div>
              {line.item.variant_type && (
                <div className='text-xs opacity-60'>
                  {capitalizeString(line.item.variant_type)}
                </div>
              )}
            </div>
            <div className='text-sm font-bold'>
              ${(line.item.price_dollars * line.quantity).toFixed(2)}
            </div>
          </li>
        ))}
      </ul>

      {itemCount > 0 && <div className='border-background-alt border-t' />}

      <dl className='flex flex-col gap-2 text-sm'>
        <div className='flex items-center justify-between'>
          <dt>Subtotal</dt>
          <dd>{formatCents(subtotalCents)}</dd>
        </div>
        <div className='flex items-center justify-between'>
          <dt>Shipping</dt>
          <dd>
            {shippingCents == null
              ? '—'
              : shippingCents === 0
                ? 'Free'
                : formatCents(shippingCents)}
          </dd>
        </div>
        <div className='flex items-center justify-between'>
          <dt>Estimated taxes</dt>
          <dd>{formatCents(taxCents)}</dd>
        </div>
      </dl>

      <div className='border-background-alt border-t pt-4'>
        <div className='flex items-baseline justify-between'>
          <span className='text-base'>Total</span>
          <span className='text-2xl font-bold'>
            <span className='mr-2 text-xs opacity-60'>USD</span>
            {formatCents(totalCents)}
          </span>
        </div>
      </div>
    </aside>
  );
};
