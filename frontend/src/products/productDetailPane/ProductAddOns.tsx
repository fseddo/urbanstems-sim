import { useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { FiChevronDown } from 'react-icons/fi';
import { HiOutlineTrash } from 'react-icons/hi2';
import { AddonType } from '@/api/products/AddonType';
import { Product, isVaseAddonEligible } from '@/api/products/Product';
import {
  addonSelectorAtom,
  clearPendingVaseAtom,
  pendingAddonsAtom,
  removePendingGiftAtom,
} from '@/src/addons/addonAtoms';
import { ADDON_TYPE_META, addonCtaLabel } from '@/src/addons/addonTypeMeta';
import { CartItem } from '@/src/cart/cartAtoms';
import { CollapsiblePanel } from '@/src/common/components/CollapsiblePanel';
import { imageAtWidth } from '@/src/common/utils/imageAtWidth';
import { tw } from '@/src/common/utils/tw';

// PDP add-ons section: collapsible vase + gift configurator. Selections
// write into `pendingAddonsAtom` and bundle into the next ADD TO BAG via
// `useAddToBagButton`. Vase row hides via `isVaseAddonEligible(product)`.

export const AddOns = ({ product }: { product: Product }) => {
  const pending = useAtomValue(pendingAddonsAtom)[product.slug] ?? {
    gifts: [],
  };
  const openSelector = useSetAtom(addonSelectorAtom);
  const clearVase = useSetAtom(clearPendingVaseAtom);
  const removeGift = useSetAtom(removePendingGiftAtom);

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
            <AddOnSection
              addonType='vase'
              selected={pending.vase ? [pending.vase] : []}
              onAdd={() =>
                openSelector({
                  type: 'vase',
                  context: { kind: 'pdp', parentSlug: product.slug },
                })
              }
              onRemove={() => clearVase(product.slug)}
            />
          )}
          <AddOnSection
            addonType='gift'
            selected={pending.gifts}
            onAdd={() =>
              openSelector({
                type: 'gift',
                context: { kind: 'pdp', parentSlug: product.slug },
              })
            }
            onRemove={(giftSlug) =>
              removeGift({ parentSlug: product.slug, giftSlug })
            }
          />
        </div>
      </CollapsiblePanel>
    </div>
  );
};

const AddOnSection = ({
  addonType,
  selected,
  onAdd,
  onRemove,
}: {
  addonType: AddonType;
  selected: CartItem[];
  onAdd: () => void;
  onRemove: (slug: string) => void;
}) => {
  const meta = ADDON_TYPE_META[addonType];
  const isEmpty = selected.length === 0;
  // Vase: 1-max → "Edit" reopens selector; new pick replaces via the
  // useAddAddon hook. Gift: unlimited → "Add Another" appends.
  const reopenLabel = addonType === 'vase' ? 'Edit' : 'Add Another';

  return (
    <div className='border-b-background-alt border-b border-dashed py-3'>
      {isEmpty ? (
        <button
          type='button'
          onClick={onAdd}
          className='flex w-full items-center justify-between gap-3 text-left'
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
      ) : (
        <div className='flex flex-col gap-2'>
          {selected.map((item, i) => (
            // Slug isn't unique within gifts (user can attach the same gift
            // twice); index suffix keeps the React key stable.
            <div key={`${item.slug}-${i}`} className='flex items-center gap-3'>
              {item.main_image && (
                <img
                  src={imageAtWidth(item.main_image, 200)}
                  alt={item.name}
                  className='h-10 w-10 shrink-0 rounded-sm object-cover'
                />
              )}
              <div className='flex-1 text-xs leading-tight'>
                <div className='font-bold'>{item.name}</div>
                <div className='opacity-60'>${item.price_dollars}</div>
              </div>
              <button
                onClick={() => onRemove(item.slug)}
                aria-label={`Remove ${item.name}`}
                className='shrink-0 transition-opacity hover:opacity-60'
              >
                <HiOutlineTrash size={16} />
              </button>
            </div>
          ))}
          <button
            onClick={onAdd}
            className='text-brand-primary self-end text-xs font-bold underline'
          >
            {reopenLabel}
          </button>
        </div>
      )}
    </div>
  );
};
