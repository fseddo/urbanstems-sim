import { useParams } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import { productQueries } from '@/api/products/productQueries';
import { NavigationBreadcrumbs } from '@/src/common/components/NavigationBreadcrumbs';
import { useIsDesktop } from '@/src/common/hooks/useIsDesktop';
import { ProductBottomBar } from './ProductBottomBar';
import { ProductDeliveryInstructions } from './ProductDeliveryInstructions';
import { ProductHeroGallery } from './ProductHeroGallery';
import { ProductImageGrid } from './ProductImageGrid';
import { ProductInfoAccordion } from './ProductInfoAccordion';
import { ProductRecommendations } from './ProductRecommendations';
import { ProductReviews } from './ProductReviews';
import { ProductDetailContent } from './productDetailPane/ProductDetailContent';
import { ProductDetailPane } from './productDetailPane/ProductDetailPane';

// PDP layout differs structurally between viewports — different DOM shapes,
// not just CSS — so the page branches on `useIsDesktop`:
//
// - Desktop (≥1024): a `relative` section provides the positioning context
//   for an absolute-positioned `<ProductDetailPane>` overlay. The hero
//   renders full-bleed at the top of the section; the left content column
//   (image grid + Description / Care accordions) flows normally below at
//   `pl-page` left gutter and `calc(848/1568*100%)` width (matching the
//   reference's `.pdp__secondary` zone proportion). The pane is
//   `absolute top-0 right-[calc(7vw-42px)] h-full w-[calc(640/1568*100%)]`
//   — its inner card is `position: sticky` so it overlays the right side
//   of the hero, then sticks through the content area as the user scrolls
//   until the section ends.
// - Mobile (<1024): a flat vertical stack — breadcrumbs, full-bleed
//   `<ProductHeroGallery>` (single image with `<SwipeCarousel>` + bubble
//   selector), then `<ProductDetailContent>` flat in document flow inside
//   a white card. Description + Care accordions render inside that white
//   card between Delivery and AddOns. `px-page` for horizontal gutters
//   on the below-hero blocks.
//
// The shared trailer (reviews, recommendations, delivery instructions,
// sticky bottom-bar add-to-cart) renders the same on both.

export const ProductDetailPage = () => {
  const { slug } = useParams({ from: '/products/$slug' });
  const { data: product } = useSuspenseQuery(productQueries.detail(slug));
  const addToCartRef = useRef<HTMLButtonElement>(null);
  const isDesktop = useIsDesktop();
  // Accordions live inside the pane on mobile (between Delivery and AddOns).
  // On any desktop size they're rendered externally below the image grid,
  // matching the reference's `.pdp__secondary` zone. Description defaults
  // open externally (on desktop) and closed in-pane (on mobile) — that's
  // implicit since the location follows the same `isDesktop` rule.
  const accordionsExternal = isDesktop;

  return (
    <div>
      {isDesktop ? (
        <section className='relative'>
          <div className='relative'>
            <ProductHeroGallery product={product} />
            <NavigationBreadcrumbs
              includeShopAll
              currentPageTitle={product.name}
              withBackdrop
              className='absolute top-4 left-8'
            />
          </div>
          <div className='pl-page flex w-[calc(848/1568*100%)] flex-col gap-5 pt-10 pb-20'>
            {product.main_detail_src && <ProductImageGrid product={product} />}
            {accordionsExternal && (
              <div className='flex flex-col pt-10'>
                <ProductInfoAccordion
                  label='Description'
                  data={product.description}
                  defaultOpen
                />
                <ProductInfoAccordion
                  label='Care Instructions'
                  data={product.care_instructions}
                />
              </div>
            )}
          </div>
          {/*
            Width mirrors the reference's pane geometry token: `calc(640/1568*100%)`
            ≈ 40.8% of the section width.

            Right gutter uses linear interpolation between two visually-tuned
            anchor points (35px @ 1100sw, 77px @ 1700sw) instead of the
            reference's pure proportional `calc(80/1568 * 100%)` (which gives
            56px @ 1100, 87px @ 1700). The proportional formula felt off at
            smaller viewports — `calc(7vw - 42px)` solves
            `f(x) = a·x + b` through both anchor points and produces the
            preferred values across the desktop range.
          */}
          <div className='absolute top-0 right-[calc(7vw_-_42px)] z-10 h-full w-[calc(580/1568*100%)] pb-20'>
            <ProductDetailPane product={product} addToCartRef={addToCartRef} />
          </div>
        </section>
      ) : (
        <section className='bg-background-alt/10 flex flex-col'>
          <div className='px-page pt-4 pb-3'>
            <NavigationBreadcrumbs
              includeShopAll
              currentPageTitle={product.name}
            />
          </div>
          <ProductHeroGallery product={product} />
          <div className='px-page flex flex-col gap-8 pt-6 pb-10'>
            <div className='rounded-md bg-white p-6'>
              <ProductDetailContent
                product={product}
                addToCartRef={addToCartRef}
              />
            </div>
            {product.main_detail_src && <ProductImageGrid product={product} />}
          </div>
        </section>
      )}

      <ProductReviews product={product} />
      <ProductRecommendations />
      <ProductDeliveryInstructions />
      <ProductBottomBar product={product} addToCartRef={addToCartRef} />
    </div>
  );
};
