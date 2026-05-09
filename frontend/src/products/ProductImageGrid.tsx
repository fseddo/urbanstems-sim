import { Product } from '@/api/products/Product';
import {
  PictureSrcset,
  SourceTier,
} from '@/src/common/components/PictureSrcset';
import { tw } from '@/src/common/utils/tw';

// Reference srcset tiers for the lifestyle grid figures (per
// `pdp-ref-image-grid-non-touch.html`):
// - Above 1024 viewport: pick from 1024/1400/1600/1800 (the cluster sits
//   in a desktop column ~410-840px wide, 2x retina pushes the chosen
//   width up).
// - Below 1024 (single-column stack): default img srcset 352/768.
const FIGURE_SOURCES: SourceTier[] = [
  { media: '(min-width: 1024px)', widths: [1024, 1400, 1600, 1800] },
];
const FIGURE_DEFAULT_WIDTHS = [352, 768];
const FIGURE_DEFAULT_WIDTH = 768;

type Item = {
  src: string;
  isVideo: boolean;
  alt: string;
  // Aspect ratio expressed as width/height (matching CSS `aspect-ratio: W / H`).
  aspectW: number;
  aspectH: number;
};

// Lifestyle / detail-image grid below the hero. Up to three slots from the
// product: `main_detail_src` (often a video), `detail_image_1_src`,
// `detail_image_2_src`. Each slot has a fixed aspect ratio matching the
// upstream design — main = 438:779 (very tall portrait), image-1 = 389:284
// (landscape), image-2 = 389:478 (portrait).
//
// Layout:
// - **≥768px**: 2-col grid. Item 1 spans both rows in column 1 (so it
//   shows full at its tall aspect). Items 2 and 3 stack in column 2,
//   with a 16px gap between them via `mt-4` on item 3. Threshold matches
//   the reference's mobile→desktop grid switch (~760px).
// - **<768px**: single-column stack with 16px gaps between items
//   (`mt-4` on items 2 and 3).
//
// Edge cases:
// - **2 items only** (no `detail_image_2_src`): item 2 inherits item 1's
//   aspect ratio (438:779), so the desktop 2-col layout reads symmetrically
//   instead of having a half-height item next to a tall one.
// - **1 item only**: renders the single tall slot (col 2 sits empty on
//   desktop — rare in practice since most products have ≥3 detail images).

export const ProductImageGrid = ({ product }: { product: Product }) => {
  const items: Item[] = [];
  if (product.main_detail_src) {
    items.push({
      src: product.main_detail_src,
      isVideo: product.is_main_detail_video,
      alt: `${product.name} detail`,
      aspectW: 438,
      aspectH: 779,
    });
  }
  if (product.detail_image_1_src) {
    items.push({
      src: product.detail_image_1_src,
      isVideo: false,
      alt: `${product.name} detail 1`,
      aspectW: 389,
      aspectH: 284,
    });
  }
  if (product.detail_image_2_src) {
    items.push({
      src: product.detail_image_2_src,
      isVideo: false,
      alt: `${product.name} detail 2`,
      aspectW: 389,
      aspectH: 478,
    });
  }

  if (items.length === 2) {
    items[1] = { ...items[1], aspectW: 438, aspectH: 779 };
  }
  if (items.length === 0) return null;

  return (
    <div className='grid grid-cols-1 gap-x-4 md:grid-cols-2'>
      {items.map((item, i) => {
        const isFirst = i === 0;
        const isLast = i === items.length - 1;
        const isSecond = i === 1;
        const spanRows = isFirst && items.length === 3;

        return (
          <figure
            key={i}
            className={tw(
              'relative overflow-hidden rounded-md',
              spanRows && 'md:row-span-2',
              isSecond && 'mt-4 md:mt-0',
              isLast && !isSecond && 'mt-4'
            )}
            style={{ paddingTop: `${(item.aspectH / item.aspectW) * 100}%` }}
          >
            {item.isVideo ? (
              <video
                autoPlay
                muted
                loop
                playsInline
                src={item.src}
                className='absolute inset-0 h-full w-full object-cover'
              />
            ) : (
              <PictureSrcset
                src={item.src}
                alt={item.alt}
                sources={FIGURE_SOURCES}
                defaultWidths={FIGURE_DEFAULT_WIDTHS}
                defaultWidth={FIGURE_DEFAULT_WIDTH}
                loading='lazy'
                fetchPriority='auto'
                className='absolute inset-0 h-full w-full object-cover'
              />
            )}
          </figure>
        );
      })}
    </div>
  );
};
