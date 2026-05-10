import { useEffect, useRef, useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useQuery } from '@tanstack/react-query';
import { FiX } from 'react-icons/fi';
import { CgSpinner } from 'react-icons/cg';
import { AddonType } from '@/api/products/AddonType';
import { Product } from '@/api/products/Product';
import { productQueries } from '@/api/products/productQueries';
import { SlidePane } from '@/src/common/components/SlidePane';
import { tw } from '@/src/common/utils/tw';
import { addonSelectorAtom } from './addonAtoms';
import { ADDON_TYPE_META } from './addonTypeMeta';
import { AddonRow } from './AddonRow';
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
  // Last seen type kept around so the slide-out renders the same content
  // the user just had open (atom goes null on close before SlidePane has
  // finished sliding offscreen).
  const [renderType, setRenderType] = useState<AddonType>('vase');
  const handleAdd = useAddAddon();
  const listScrollRef = useRef<HTMLDivElement>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isOpen = state !== null;
  const isDetail = selectedSlug !== null;
  const meta = ADDON_TYPE_META[renderType];

  useEffect(() => {
    if (state) setRenderType(state.type);
  }, [state]);

  // Reset session state on any close (X, ADD, backdrop) so reopen is fresh.
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
          <>
            <div className='flex items-start justify-end px-5 pt-4 pb-2'>
              <button
                onClick={close}
                className='border-brand-primary hover:bg-brand-primary rounded-full border p-1.5 transition-colors duration-400 hover:text-white'
                aria-label='Close'
              >
                <FiX size={18} />
              </button>
            </div>
            <ListView
              scrollRef={listScrollRef}
              addonType={renderType}
              meta={meta}
              onSelectDetail={showDetail}
              onAdd={handleAdd}
            />
          </>
        )}
      </div>
    </SlidePane>
  );
};

const ListView = ({
  scrollRef,
  addonType,
  meta,
  onSelectDetail,
  onAdd,
}: {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  addonType: AddonType;
  meta: (typeof ADDON_TYPE_META)[AddonType];
  onSelectDetail: (slug: string) => void;
  onAdd: (product: Product) => void;
}) => {
  const { data, isPending } = useQuery(
    productQueries.list({ addon_type: addonType })
  );
  const products = data?.data ?? [];

  return (
    <>
      <div className='flex flex-col items-center gap-1 px-7 pb-4 text-center'>
        <h2 className='font-crimson text-4xl'>{meta.modalTitle}</h2>
        <div className='text-sm'>{meta.modalSubtitle}</div>
      </div>

      <div ref={scrollRef} className='min-h-0 flex-1 overflow-y-auto px-7 pb-8'>
        {isPending ? (
          <div className='flex h-full items-center justify-center'>
            <CgSpinner className='animate-spin opacity-60' size={28} />
          </div>
        ) : (
          <div className='flex flex-col gap-3'>
            {products.map((product) => (
              <AddonRow
                key={product.slug}
                product={product}
                onAdd={() => onAdd(product)}
                onLearnMore={() => onSelectDetail(product.slug)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};
