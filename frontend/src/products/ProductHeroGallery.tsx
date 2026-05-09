import { useState } from 'react';
import { Product } from '@/api/products/Product';
import { BubbleSelector } from '@/src/common/components/BubbleSelector';
import { PictureSrcset } from '@/src/common/components/PictureSrcset';
import { SwipeCarousel } from '@/src/common/components/SwipeCarousel';
import { useIsDesktop } from '@/src/common/hooks/useIsDesktop';
import { imageAtWidth } from '@/src/common/utils/imageAtWidth';

const VIEWS = ['main', 'hover'] as const;
type View = (typeof VIEWS)[number];

type Slide = { view: View; src: string; alt: string };

const HERO_WIDTHS = [400, 800, 1200, 1600];
const HERO_DEFAULT_WIDTH = 1200;

// PDP hero — branches on `useIsDesktop` so the layout matches the page
// shape (mobile is a single-column flat stack; desktop has the sticky
// pane overlaying the right side of the hero):
//
// - Mobile (<1024): full-bleed at viewport width with each slide
//   `aspect-[600/641]` (matching the reference + the desktop branch).
//   `<SwipeCarousel>` to drag/snap between slides; `<BubbleSelector>`
//   below for tap-to-jump. Wrapper capped at
//   `max-height: 100dvh - --navbar-height` so wide-but-short viewports
//   don't blow past the fold (image overflows + clips at bottom).
// - Desktop (≥1024, including tablet): each slide is `aspect-[600/641]`
//   (~1.07 portrait, matching the reference's `--fill` slides) sitting
//   in a side-by-side 2-col grid. Slide widths come from the grid (50%
//   viewport each); slide heights fall out of the aspect ratio, so the
//   hero ramps with viewport WIDTH. Wrapper is capped at
//   `max-height: 100dvh - --navbar-height` so very wide / short
//   viewports don't blow past the fold. The PDP page overlays the sticky
//   `<ProductDetailPane>` on top of the right slide.
// - Either branch falls back to a single image when only one of
//   `main_image` / `hover_image` is present.
//
// LCP candidate: the visible main image gets `loading='eager'` +
// `fetchpriority='high'`. The secondary slide stays lazy on mobile (loaded
// when swiped to) and eager on desktop (it's visible immediately).
//
// CSS reference: see [`docs/improvements/pdp-ref-css-rules.md`](../../../../docs/improvements/pdp-ref-css-rules.md)
// — the `.pdp__media-item--fill` rule sets `padding-top: calc(641/600 * 100%)`
// (height/width ratio), which we mirror here as `aspect-ratio: 600/641`
// (CSS aspect-ratio is W/H, the inverse of the padding-top trick).

export const ProductHeroGallery = ({ product }: { product: Product }) => {
  const isDesktop = useIsDesktop();
  const [activeIndex, setActiveIndex] = useState(0);

  const slides: Slide[] = [];
  if (product.main_image) {
    slides.push({ view: 'main', src: product.main_image, alt: product.name });
  }
  if (product.hover_image) {
    slides.push({
      view: 'hover',
      src: product.hover_image,
      alt: `${product.name} alternate view`,
    });
  }
  if (slides.length === 0) return null;

  const renderImage = (slide: Slide, isLcp: boolean) => (
    <PictureSrcset
      src={slide.src}
      alt={slide.alt}
      defaultWidths={HERO_WIDTHS}
      defaultWidth={HERO_DEFAULT_WIDTH}
      width={1200}
      height={1200}
      loading={isLcp ? 'eager' : 'lazy'}
      fetchPriority={isLcp ? 'high' : 'auto'}
      className='h-full w-full object-cover'
    />
  );

  const badges = (
    <>
      {product.badge_text && (
        <div className='border-brand-primary absolute top-[5%] left-[5%] max-w-[90%] truncate rounded-2xl border-1 bg-white/90 px-4 py-1 text-sm font-bold'>
          {product.badge_text}
        </div>
      )}
      {product.badge_image_src && (
        <img
          src={imageAtWidth(product.badge_image_src, 240)}
          alt=''
          className='absolute right-[5%] bottom-[5%] h-[74px] w-[74px]'
        />
      )}
    </>
  );

  if (!isDesktop) {
    if (slides.length === 1) {
      return (
        <div
          className='relative w-full overflow-hidden'
          style={{ maxHeight: 'calc(100dvh - var(--navbar-height))' }}
        >
          <div className='aspect-[600/641] w-full overflow-hidden'>
            {renderImage(slides[0], true)}
          </div>
          {badges}
        </div>
      );
    }
    return (
      <div className='flex flex-col gap-6'>
        <div
          className='relative w-full overflow-hidden'
          style={{ maxHeight: 'calc(100dvh - var(--navbar-height))' }}
        >
          <SwipeCarousel
            className='aspect-[600/641]'
            slides={slides}
            activeIndex={activeIndex}
            onIndexChange={setActiveIndex}
            renderSlide={(slide, i) => renderImage(slide, i === 0)}
          />
          {badges}
        </div>
        <BubbleSelector
          options={slides.map((s) => s.view)}
          value={slides[activeIndex].view}
          onChange={(view) =>
            setActiveIndex(slides.findIndex((s) => s.view === view))
          }
          className='self-center'
          getAriaLabel={(_, i) => `Show image ${i + 1}`}
        />
      </div>
    );
  }

  return (
    <div
      className='relative w-full overflow-hidden'
      style={{ maxHeight: 'calc(100dvh - var(--navbar-height))' }}
    >
      {slides.length === 1 ? (
        <div className='aspect-[600/641] overflow-hidden'>
          {renderImage(slides[0], true)}
        </div>
      ) : (
        <div className='grid grid-cols-2'>
          {slides.map((slide) => (
            <div key={slide.view} className='aspect-[600/641] overflow-hidden'>
              {renderImage(slide, true)}
            </div>
          ))}
        </div>
      )}
      {badges}
    </div>
  );
};
