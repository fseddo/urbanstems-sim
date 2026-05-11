import { useEffect, useRef, useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useQuery } from '@tanstack/react-query';
import { FiX } from 'react-icons/fi';
import { AddonType } from '@/api/products/AddonType';
import { Product } from '@/api/products/Product';
import { productQueries } from '@/api/products/productQueries';
import { List } from '@/src/common/components/List';
import { SlidePane } from '@/src/common/components/SlidePane';
import { tw } from '@/src/common/utils/tw';
import {
  AddonSelectorState,
  addonSelectorAtom,
  clearPendingVaseAtom,
  decrementPendingGiftAtom,
  pendingAddonsAtom,
} from './addonAtoms';
import { ADDON_TYPE_META } from './addonTypeMeta';
import { AddonRow, AddonRowAction } from './AddonRow';
import { AddonDetail } from './AddonDetail';
import { useAddAddon } from './useAddAddon';

// Right-side slide-in selector mounted once at the root. Open state +
// type live in `addonSelectorAtom`; non-null = open. Two views (list /
// detail) cross-fade in-place via the DatePicker delayed-unmount pattern.
// Close skips the fade since SlidePane's slide-out covers it. Session
// state resets on close so reopening is always fresh.

const FADE_DURATION_MS = 150;

export const AddonSelectorPane = () => {
  const state = useAtomValue(addonSelectorAtom);
  const closeSelector = useSetAtom(addonSelectorAtom);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [exiting, setExiting] = useState(false);
  // Last-seen type — keeps slide-out content stable while the atom is
  // already null but the pane is still visible.
  const [renderType, setRenderType] = useState<AddonType>('vase');
  const handleAdd = useAddAddon();
  const listScrollRef = useRef<HTMLDivElement>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isOpen = state !== null;
  const isDetail = selectedSlug !== null;

  useEffect(() => {
    if (state) setRenderType(state.type);
  }, [state]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedSlug(null);
      setExiting(false);
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
      if (listScrollRef.current) listScrollRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  const swapView = (next: string | null) => {
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    setExiting(true);
    fadeTimerRef.current = setTimeout(() => {
      setSelectedSlug(next);
      setExiting(false);
      fadeTimerRef.current = null;
    }, FADE_DURATION_MS);
  };

  const close = () => closeSelector(null);
  const back = () => swapView(null);
  const showDetail = (slug: string) => swapView(slug);

  return (
    <SlidePane isOpen={isOpen} onClose={close} side='right' tier='over'>
      <div
        className={tw(
          'flex min-h-0 flex-1 flex-col',
          exiting ? 'animate-fade-out opacity-0' : 'animate-fade-in'
        )}
      >
        {isDetail ? (
          <AddonDetail
            slug={selectedSlug}
            onAdd={handleAdd}
            onClose={close}
            onBack={back}
          />
        ) : (
          <AddonSelectorListView
            scrollRef={listScrollRef}
            renderType={renderType}
            state={state}
            onSelectDetail={showDetail}
            onAdd={handleAdd}
            onClose={close}
          />
        )}
      </div>
    </SlidePane>
  );
};

const AddonSelectorListView = ({
  scrollRef,
  renderType,
  state,
  onSelectDetail,
  onAdd,
  onClose,
}: {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  renderType: AddonType;
  state: AddonSelectorState | null;
  onSelectDetail: (slug: string) => void;
  onAdd: (product: Product) => void;
  onClose: () => void;
}) => {
  const meta = ADDON_TYPE_META[renderType];
  const { data, isPending } = useQuery(
    productQueries.list({ addon_type: renderType })
  );
  const products = data?.data ?? [];

  // Per-row selection state — only meaningful in PDP context.
  const pendingForProduct = useAtomValue(pendingAddonsAtom);
  const clearPendingVase = useSetAtom(clearPendingVaseAtom);
  const decrementPendingGift = useSetAtom(decrementPendingGiftAtom);

  const actionFor = (product: Product): AddonRowAction => {
    if (state?.context.kind !== 'pdp') {
      return { kind: 'add', onAdd: () => onAdd(product) };
    }
    const parentSlug = state.context.parentSlug;
    const pending = pendingForProduct[parentSlug] ?? { gifts: [] };
    if (renderType === 'vase') {
      const isPending = pending.vase?.slug === product.slug;
      return isPending
        ? { kind: 'remove', onRemove: () => clearPendingVase(parentSlug) }
        : { kind: 'add', onAdd: () => onAdd(product) };
    }
    const giftEntry = pending.gifts.find(
      (g) => g.item.slug === product.slug
    );
    if (!giftEntry) {
      return { kind: 'add', onAdd: () => onAdd(product) };
    }
    return {
      kind: 'stepper',
      count: giftEntry.count,
      onIncrement: () => onAdd(product),
      onDecrement: () =>
        decrementPendingGift({
          parentSlug,
          giftSlug: product.slug,
        }),
    };
  };

  // Gifts-only sticky footer: lets the user dismiss after picking.
  // Vase ADD-and-close doesn't need it.
  const giftFooterTotal =
    renderType === 'gift' && state?.context.kind === 'pdp'
      ? (
          pendingForProduct[state.context.parentSlug]?.gifts ?? []
        ).reduce((s, g) => s + g.item.price_dollars * g.count, 0)
      : 0;

  return (
    <List
      items={products}
      isLoading={isPending}
      getKey={(p) => p.slug}
      scrollRef={scrollRef}
      scrollClassName='px-7 pb-8'
      header={
        <>
          <div className='flex items-start justify-end px-5 pt-4 pb-2'>
            <button
              onClick={onClose}
              className='border-brand-primary hover:bg-brand-primary rounded-full border p-1.5 transition-colors duration-400 hover:text-white'
              aria-label='Close'
            >
              <FiX size={18} />
            </button>
          </div>
          <div className='flex flex-col items-center gap-1 px-7 pb-4 text-center'>
            <h2 className='font-crimson text-4xl'>{meta.modalTitle}</h2>
            <div className='text-sm'>{meta.modalSubtitle}</div>
          </div>
        </>
      }
      footer={
        giftFooterTotal > 0 && (
          <div className='bg-white px-10 pt-6 pb-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.03)] min-[1020px]:rounded-b-md'>
            <button
              onClick={onClose}
              className='bg-brand-primary hover:border-brand-primary hover:text-brand-primary w-full rounded-md border py-5 text-xs font-black tracking-action text-white/90 transition-colors duration-300 hover:bg-white active:scale-[0.99]'
            >
              {`ADD SELECTED - $${giftFooterTotal}`}
            </button>
          </div>
        )
      }
      renderItem={(product) => (
        <AddonRow
          product={product}
          action={actionFor(product)}
          onLearnMore={() => onSelectDetail(product.slug)}
        />
      )}
    />
  );
};
