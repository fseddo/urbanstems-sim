# Landing page

The `/` route. Composed of five vertically stacked sections in [`<HomePage>`](../../../frontend/src/landing/HomePage.tsx):

```
<LandingHero />
<OccasionCarousel />
<Reviews />
<BestSellers />
<AboutUs />
```

Section padding follows the landing-section vertical rhythm — small `pt`, larger `pb` (`pt-landing-section` / `pb-landing-section` — see [`globals.css`](../../../frontend/src/globals.css)). The hero's `pb-landing-hero` matches the section `pt` so the gap between hero and the first section is the same as section-to-section breathing.

## Hero

[`<LandingHero>`](../../../frontend/src/landing/LandingHero.tsx) — full-bleed hero with a viewport-sized image and an overlaid copy lockup (headline + subtext + CTA).

- **Art-direction swap** at 1024sw via `<picture>`: a portrait-shaped mobile image below 1024, a wider desktop image at ≥1024.
- **Image loading**: LCP candidate, so `fetchPriority='high' loading='eager'`.
- **Overlay**: `bg-hero-overlay` — a corner-anchored gradient defined as a CSS token; mobile uses a heavier wash (busier image), desktop a lighter one. Swap at 1024sw alongside the picture source.
- **Typography**: `text-hero-headline` (32 → 40 → 72 across the two-ramp curve, plateau between 1024 and 1233) and `text-hero-subtext` (14 → 20 over 1400 → 2250). Both are token-driven from `globals.css`.
- **NYT Wirecutter logo** sits absolute top-left, scaling 96px → 116px at lg with a `transition-[width,left]` so the breakpoint flip animates.
- **CTA** is `<AnimatedButton>`, the codebase's standard branded button shell — uses `tracking-action` (1.68px) like every other CTA.

## OccasionCarousel

[`<OccasionCarousel>`](../../../frontend/src/landing/occasionCarousel/OccasionCarousel.tsx) — horizontal scroll of [`<OccasionCard>`](../../../frontend/src/landing/occasionCarousel/OccasionCard.tsx)s, one per `Tag` of facet `occasion`. Data via `tagQueries.list('occasion')`.

Wraps the row in [`<HorizontalList>`](../../../frontend/src/common/components/HorizontalList.tsx) (gap-2 / lg:gap-4 between cards), `pl-page` only on the section so the carousel bleeds off the right edge — the canonical "horizontal carousel that extends past the right gutter" shape used throughout the app.

Card width via `--occasion-card-w` — its own ramp (450 → 1024 → 1400 → 3000), capped wider than `--carousel-card-w` because occasion tiles are designed to keep growing on wide screens while product cards stay grid-friendly. See `globals.css` for the curve and the rationale comment.

## Reviews

[`<Reviews>`](../../../frontend/src/landing/reviews/Reviews.tsx) — horizontal scroll of [`<ReviewCard>`](../../../frontend/src/landing/reviews/ReviewCard.tsx)s. Data is **mocked** via [`LANDING_REVIEWS`](../../../frontend/src/landing/reviews/constants.ts) — distinct from the real `<ProductReviews>` on the PDP, which loads from the backend.

Card width via `--review-card-w` (280 → 450 over 1024 → 1400). The card's typography (`--review-name-size`, `--review-caption-size`, `--review-description-size`) and the gap between image-frame and text (`--review-card-gap`) all ramp on the **same** 1024–1400 curve as the card width, so the composition scales as one — the text block never gets visually disconnected from the photo.

There are two `ReviewCard.tsx` files in the codebase — this landing one (mocked, image-heavy) and a separate one in `products/` for real PDP reviews. Renaming for disambiguation is tracked in [`docs/improvements/src-browse.md`](../../improvements/src-browse.md).

## BestSellers

[`<BestSellers>`](../../../frontend/src/landing/bestSellers/BestSellers.tsx) — header-with-tabs + horizontal product carousel.

- **Single-source-literal-union pattern**: `FEATURED_CATEGORY_SLUGS = ['flowers', 'plants'] as const` defines the available tabs, and `FeaturedCategorySlug` is `(typeof FEATURED_CATEGORY_SLUGS)[number]`. Adding a third tab here updates both the iteration and the `category` state's allowed values automatically.
- **Tab item**: [`<BestSellersHeaderItem>`](../../../frontend/src/landing/bestSellers/BestSellersHeaderItem.tsx) is a generic `<T extends string>` so the tab value type flows from the parent's union. Worth reading as an example of the codebase's preference for typed-callback shapes over loosened `string` props.
- **Carousel**: products via `productQueries.list({ category: [category], size: 8 })` with `placeholderData: keepPreviousData` so switching tabs doesn't show a loading flash.
- **Cards** use [`<ProductCard>`](../../../frontend/src/common/components/ProductCard.tsx) in `compact` mode, width via `w-carousel-card`, wrapped in `<HorizontalList>` with `gap-2 lg:gap-4`.
- **Section shape**: `pl-page` only — same off-the-right-edge bleed as `<OccasionCarousel>` and `<ProductRecommendations>`.

The `--carousel-card-w` token has a deliberate step-down at 1024 (mobile range ramps wider; desktop range starts narrower then climbs). See `globals.css` for the curve. Memory note: `--carousel-card-w` and `--occasion-card-w` intentionally diverge at large viewports — don't unify them.

## AboutUs

[`<AboutUs>`](../../../frontend/src/landing/AboutUs.tsx) — symmetric "statement" section with generous vertical padding (`py-about-us`, stepwise 104 → 124 → 150) and a centered headline + LEARN MORE link.

The padding is intentionally distinct from `landing-section` rhythm — AboutUs is meant to read as a closing statement, not just another section in the stack.

The LEARN MORE link is a `<div>` (no destination) — the route it should navigate to doesn't exist yet. Tracked as backlog; per the doc convention "don't ship dead UI", no stub route was wired up.

## Shared section conventions

A few patterns repeat across the landing sections — useful when adding a new one or adjusting an existing one:

- **`pl-page` only on sections that contain a horizontal carousel**, so the cards bleed off the right edge. The `<HorizontalList>` component handles its own right-edge buffer (`pr-page` internally) for scroll-end spacing.
- **Section header typography**: `text-landing-section-header` (28 → 40 → 52). Same ramp shape as `text-hero-headline` but capping smaller — used on every landing section title.
- **Vertical rhythm**: `pt-landing-section` (16 → 24) + `pb-landing-section` (30 → 54) creates the asymmetric tight-top / loose-bottom breathing between consecutive sections. Don't reach for symmetric `py-N` — the asymmetry is the design.
