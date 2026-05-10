# `frontend/src/` (products, filters, landing) — improvements

Punch list for browsing/discovery components.

## Pending

### Disambiguate the two `ReviewCard.tsx` files
- Location: `frontend/src/products/ReviewCard.tsx` (real reviews) and `frontend/src/landing/reviews/ReviewCard.tsx` (mock landing).
- Different schemas, different visual styles. Auto-import grabs whichever's closer.
- Fix: rename to `ProductReviewCard` and `LandingReviewCard`. Update imports.

### `Reviews/ReviewCard` re-implements stars
- Location: `frontend/src/landing/reviews/ReviewCard.tsx:54-63`.
- Rolls its own `<img src='/full_star.svg' />` star map instead of using `<StarRating>`. Misses half-stars and empty styling.
- Fix: replace with `<StarRating rating={rating} />`.

### `ProductInfoAccordion` parses HTML without sanitization
- Location: `frontend/src/products/ProductInfoAccordion.tsx:1, 32`.
- `parse(data)` renders backend-supplied HTML. If a description ever contains `<script>` or `onerror`, it runs. Currently scraped+trusted; the trust boundary is invisible.
- Fix: sanitize via DOMPurify, or document the trust boundary in a comment near the parse call.

### `ProductImageGrid` magic numbers
- Location: `frontend/src/products/ProductImageGrid.tsx:11-13`.
- `gridTemplateColumns: '460px 460px'` and `height: '1100px'`. Brittle on any non-default viewport.
- Fix: replace with responsive grid (`grid-cols-1 lg:grid-cols-2`, `aspect-*` for images).

### `ProductRecommendations` always recommends `flowers`
- Location: `frontend/src/products/ProductRecommendations.tsx:12-14`.
- Hardcoded `productQueries.list({ category: ['flowers'] })`. Should pick from the current product's tags and exclude the current slug.
- Fix: take `currentProduct: Product`, query by primary category or tag, filter out the current slug.

### `OccasionCard` `<img>` missing `alt`
- Location: `frontend/src/landing/occasionCarousel/OccasionCard.tsx:14`.
- Fix: add `alt={occasion.name}` and `object-cover` (or `aspect-*` on the wrapper).

### `price_range` from `filter-options/` is fetched but never rendered
- Location: backend serves `price_range: { min, max }` from [`api_views.filter_options`](../../backend/products/api_views.py); frontend declares it in [`FilterOptions.ts`](../../frontend/api/products/FilterOptions.ts) but no sidebar component reads it.
- The data is per-scope-correct (excludes add-ons after the slice 1 fix) — just unsurfaced. The `min_price` / `max_price` filter spec exists but has no UI bound to it.
- Fix: add a price-range filter spec entry that surfaces a slider or two-input min/max bound to the served `price_range` values, writing into the existing `min_price` / `max_price` URL search params.

### Low severity
- **`BestSellers` hardcoded categories** — `FEATURED_CATEGORY_SLUGS = ['flowers', 'plants']`. Sim-acceptable; drive from a backend "is featured" flag if marketing wants editorial control.
- **`DELIVERY_STEP_INFO` rename layer** — `products/constants.ts` exports as one name, consumer aliases on import. Pick one.
- **`ProductBottomBar` `px-70`** — non-standard scale value. Confirm intentional; comment if so.
- **Inconsistent landing section header styles** (`AboutUs` `font-extrabold tracking-[0.2em]`, `BestSellers` no tracking, `Reviews` `text-[52px]` vs others `text-6xl`). Could extract a `<SectionHeader>` shared component once a third site lands.
- **`text-shadow` in `LandingVideo`** — verify it's defined (Tailwind 4 has it, but confirm in this build); if not, define `.text-shadow` in `globals.css`.

## CLAUDE-rule candidates

- **All `<img>` tags must have `alt`** (use `alt=""` for purely decorative). Pending second offender after `OccasionCard` is fixed.
- **Two components sharing a display name across directories is a bug** — disambiguate by purpose (`ProductReviewCard` / `LandingReviewCard`). Pending the rename.
- **`useState` mirrors of props are a smell, but draft state with delayed commit (blur/Enter) is fine** with a comment explaining the choice. Pending refinement.
- **Backend-HTML parsers must sanitize or have a trust-boundary comment.** Pending policy decision.
- **JS-managed CSS variables are documented in one place** with the owning component named in a comment near the write site. Pending docs.
