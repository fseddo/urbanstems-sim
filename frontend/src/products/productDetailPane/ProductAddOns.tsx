import { useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { FiChevronDown } from 'react-icons/fi';
import { AddonType } from '@/api/products/AddonType';
import { Product, isVaseAddonEligible } from '@/api/products/Product';
import {
  addonSelectorAtom,
  pendingAddonsAtom,
  type PendingGift,
} from '@/src/addons/addonAtoms';
import { ADDON_TYPE_META, addonCtaLabel } from '@/src/addons/addonTypeMeta';
import { CartItem } from '@/src/cart/cartAtoms';
import { CollapsiblePanel } from '@/src/common/components/CollapsiblePanel';
import { imageAtWidth } from '@/src/common/utils/imageAtWidth';
import { tw } from '@/src/common/utils/tw';

// PDP add-ons section: collapsible vase + gift configurator. Selections
// write into `pendingAddonsAtom` and bundle into the next ADD TO BAG via
// `useAddToBagButton`. All add/remove/quantity adjustments happen inside
// the selector modal — the PDP rows are summary surfaces with an Edit CTA.

export const AddOns = ({ product }: { product: Product }) => {
  const pending = useAtomValue(pendingAddonsAtom)[product.slug] ?? {
    gifts: [],
  };
  const openSelector = useSetAtom(addonSelectorAtom);

  const showVase = isVaseAddonEligible(product);
  const [open, setOpen] = useState(true);

  return (
    <div className='w-full pb-4'>
      <button
        type='button'
        onClick={() => setOpen((o) => !o)}
        className='flex w-full items-center justify-between text-left font-bold'
      >
        <span>Make It Extra Special</span>
        <FiChevronDown
          size={18}
          className={tw(
            'transition-transform duration-300',
            open && 'rotate-180'
          )}
        />
      </button>
      <CollapsiblePanel open={open}>
        <div className='flex flex-col pt-3'>
          {showVase && (
            <VaseRow
              vase={pending.vase}
              onOpen={() =>
                openSelector({
                  type: 'vase',
                  context: { kind: 'pdp', parentSlug: product.slug },
                })
              }
            />
          )}
          <GiftRow
            gifts={pending.gifts}
            onOpen={() =>
              openSelector({
                type: 'gift',
                context: { kind: 'pdp', parentSlug: product.slug },
              })
            }
          />
        </div>
      </CollapsiblePanel>
    </div>
  );
};

const VaseRow = ({
  vase,
  onOpen,
}: {
  vase: CartItem | undefined;
  onOpen: () => void;
}) => {
  const meta = ADDON_TYPE_META.vase;
  if (!vase) return <EmptyRow addonType='vase' onOpen={onOpen} />;
  return (
    <div className='border-b-background-alt border-b border-dashed py-3'>
      <div className='flex items-center gap-3'>
        {vase.main_image && (
          <img
            src={imageAtWidth(vase.main_image, 200)}
            alt={vase.name}
            className='h-10 w-10 shrink-0 rounded-sm object-cover'
          />
        )}
        <div className='flex-1 text-xs leading-tight'>
          <div className='font-bold'>{vase.name}</div>
          <div className='opacity-60'>${vase.price_dollars}</div>
        </div>
        <button
          onClick={onOpen}
          className='text-brand-primary text-xs font-bold underline'
          aria-label={`Edit ${meta.modalTitle}`}
        >
          Edit
        </button>
      </div>
    </div>
  );
};

const GiftRow = ({
  gifts,
  onOpen,
}: {
  gifts: PendingGift[];
  onOpen: () => void;
}) => {
  const total = gifts.reduce((s, g) => s + g.count, 0);
  if (total === 0) return <EmptyRow addonType='gift' onOpen={onOpen} />;
  const first = gifts[0].item;
  const others = total - 1;
  const totalPrice = gifts.reduce(
    (s, g) => s + g.item.price_dollars * g.count,
    0
  );
  return (
    <div className='border-b-background-alt border-b border-dashed py-3'>
      <div className='flex items-center gap-3'>
        {first.main_image && (
          <img
            src={imageAtWidth(first.main_image, 200)}
            alt={first.name}
            className='h-10 w-10 shrink-0 rounded-sm object-cover'
          />
        )}
        <div className='flex-1 text-xs leading-tight'>
          <div className='font-bold'>
            {first.name}
            {others > 0 && (
              <span className='font-normal opacity-70'>
                {` + ${others} other ${others === 1 ? 'gift' : 'gifts'}`}
              </span>
            )}
          </div>
          <div className='opacity-60'>${totalPrice}</div>
        </div>
        <button
          onClick={onOpen}
          className='text-brand-primary text-xs font-bold underline'
        >
          Edit
        </button>
      </div>
    </div>
  );
};

const EmptyRow = ({
  addonType,
  onOpen,
}: {
  addonType: AddonType;
  onOpen: () => void;
}) => {
  const meta = ADDON_TYPE_META[addonType];
  return (
    <button
      type='button'
      onClick={onOpen}
      className='border-b-background-alt flex w-full items-center justify-between gap-3 border-b border-dashed py-3 text-left'
    >
      <span className='flex items-center gap-3'>
        <img
          src={meta.rowThumbnail}
          alt={meta.modalTitle}
          width={40}
          height={80}
          className='shrink-0 object-cover'
        />
        <span className='text-xs'>{meta.rowSubtitle}</span>
      </span>
      <span className='text-brand-primary min-w-[68px] text-xs font-bold underline'>
        {addonCtaLabel(addonType)}
      </span>
    </button>
  );
};
