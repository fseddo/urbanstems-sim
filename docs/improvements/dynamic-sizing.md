# Dynamic sizing — workstream tracker

Pre-launch push to make every page work cleanly on mobile widths. **Status: in progress.**

This doc is the punch list of remaining work. **It does not document how anything works** — for that, see:

- *How* responsive work is done — [`docs/frontend/architecture/dynamic-sizing.md`](../frontend/architecture/dynamic-sizing.md).
- Per-feature current state (which tokens, which breakpoints, what's responsive) — [`docs/frontend/features/`](../frontend/features/), one doc per area.

**Currently focused on:** PDP layout.

## Remaining surfaces

### Product details page

[`<ProductDetailPage>`](../../frontend/src/products/ProductDetailPage.tsx) lays out as a desktop two-column today (`ml-20 w-[50%]` for the pane, fixed-height hero section). On mobile it should collapse to single column with the image gallery on top and the pane below. Possibly also: variant/quantity controls compact differently, sticky add-to-cart bar at the bottom. Largest remaining surface.

#### Pane geometry (next, blocks image-grid work)

The desktop layout is being reworked. Open items:

- The detail pane should sit in its own column on the right (currently it floats absolutely over the background-images section). The pane "travels" sticky in that column as the user scrolls, never overlapping the image grid. The column has no special background — it's just page bg with a white card floating in it. (Earlier reads of the reference identified a "gray column" — that turned out to be image-blend bg around the hero section, not a structural column color.) Decide column widths before the image grid can pick a content width to size against.
- The pane goes away at **1024 sw** (matching `useIsDesktop` and Tailwind `lg:`). The reference uses 1020 but the 4px deviation isn't worth a special-case hook; staying with 1024 keeps one mental model.
- Hero image may need a tablet-range size between 770 and the pane breakpoint — confirm against the design before sizing.

**Reference geometry (from upstream UrbanStems markup, non-touch):**

| Property | Desktop | Mobile |
|---|---|---|
| Width | `640/1568 ≈ 40.8%` of viewport | `100%` |
| Left margin (gutter from section edge) | `80/1568 ≈ 5.1%` of viewport | `0` |
| Top margin | `40px` | `0` |
| Top padding | `36px` | `28px` |
| Side padding | `clamp(32px, ~2.31vw, 74px)` (against 1728) | `16px` |
| Bottom padding | `clamp(40px, ~4.28vw, 74px)` (against 1728) | `51px` |
| Position | `position: sticky` | static |

The width sizing references 1568 (a Mac 14" reference viewport); the side/bottom padding clamps reference 1728 (Mac 16" reference). Worth aligning these to the same anchor when porting — or pick whichever matches our existing token convention. We currently use `w-[37vw]` for the pane and `right-[90px]` for the right offset; both numbers are close to but not exactly the reference's 40.8% / 5.1%.

The reference uses `calc(N/REF * 100%)` math directly. To match, either:
- Use Tailwind arbitrary values (`w-[calc(640/1568*100%)]`), keeps the design intent legible at the call site;
- Define `--pdp-pane-w`, `--pdp-pane-ml-gutter`, `--pdp-pane-padding-x` etc. tokens in [`globals.css`](../../frontend/src/globals.css) following the existing fluid-curve convention.

Tokens are the codebase's pattern for fluid sizing and read more cleanly at the call site (`w-pdp-pane` reads better than `w-[calc(640/1568*100%)]`), so go with tokens unless the value's only used in one place.

#### Pane content audit (paired with geometry)

The reference pane content layout, top to bottom:

1. **Star rating + review count** — clickable, scrolls to `#product-reviews`. Has `sr-only` text for screen readers ("40 reviews with an average of 4.8 star rating"). We have this in [`<ProductDetailContent>`](../../frontend/src/products/productDetailPane/ProductDetailContent.tsx).
2. **`<h1>` product name** — same.
3. **Subtitle (rich text)** — they support metafield rich text with inline `#description` anchor links; ours is plain text from `product.subtitle`. Possible upgrade: support a richer subtitle shape if the backend exposes one.
4. **Price** — regular + sale price structure, same.
5. **"View full details" link** — anchor to the current product URL. Likely SEO/crawl-only. Skip unless someone asks.
6. **Variant swatches** — image (120×128) + title + name + info (e.g. "Single / Standard / Classic Size", "Double / 2x The Stems / Save 10%"). We have [`<ProductDetailVariantOptions>`](../../frontend/src/products/productDetailPane/ProductDetailVariantOptions.tsx) which is similar but lays out variant info differently. Worth a visual pass.
7. **Variant radios fieldset** (hidden by default) — no-JS fallback. Skip; we ship JS-required.
8. **Delivery info** — date + address pickers with shared `pdp__delivery-info-border` separator. We have this in [`<DeliveryInformation>`](../../frontend/src/products/productDetailPane/ProductDeliveryInfo.tsx); the recent gap-removal + `px-3` work matches the reference's flush divider treatment.
9. **Delivery error alerts** — four distinct `alert--error` containers with copy for: per-product date unavailable, global date update across cart, generic cart-availability, alcohol-restriction. We have **one** error path today (`bumpedFrom`); the reference covers more states. Worth threading more error types through if/when the backend exposes them.
10. **Add-ons** — collapsible `<details>`/`<summary>` per add-on. Each row has a thumbnail (`aspect-ratio: 86/104`, ~44px desktop / ~50px mobile width). Ours in [`<AddOns>`](../../frontend/src/products/productDetailPane/ProductAddOns.tsx) is hardcoded to two rows with hardcoded copy ("Add A Vase" / "Add Something Extra") and no actual add-to-cart mechanism — flagged elsewhere as backlog ("Add-ons to cart from PDP" memory). Reference confirms the design direction: collapsible details + thumbnail + copy.
11. **Add-to-cart button** — bottom of pane, full-width-of-pane.

#### Touch vs non-touch pane content split

The reference shares the same pane container CSS variables on both touch and non-touch — what differs is **what content lives inside the pane** depending on which side of the breakpoint:

- **Non-touch (desktop)**: pane content ends at `add-ons + add-to-cart`. Accordions (Description, Care Instructions) live **outside the pane**, in the left content column below the image grid. Matches our current desktop layout.
- **Touch (mobile)**: pane content **includes the accordions** after delivery info — the pane is one continuous vertical stack: stars → h1 → subtitle → price → swatches → delivery info → **accordions** → add-ons → add-to-cart. Our mobile currently renders accordions in a separate `flex-col` *outside* the white card.

When implementing, move the accordions inside the white-card block on mobile so the buy-box reads as one continuous element ending with accordions. Desktop behavior stays as-is.

#### Hero image blueprint (paired with pane work)

**Architectural decision first.** Today's PDP splits the hero into two components: [`<ProductBackgroundImages>`](../../frontend/src/products/ProductBackgroundImages.tsx) on desktop (both `main_image` and `hover_image` fill the viewport-height hero section side-by-side) and [`<ProductHeroImage>`](../../frontend/src/products/ProductHeroImage.tsx) on mobile (single image with `<BubbleSelector>`). The reference site uses **one** Swiper component for both — same DOM, same `<picture>`/`srcset`, same ARIA — and branches the rendering on input mode:

- **Touch** (`pointer: coarse`): only the active slide is visible (`swiper-slide-visible` on slide 1 only), wrapper has `cursor: grab` + `translate3d` for drag, swipe and bubble selector both work.
- **Mouse** (`pointer: fine`): both slides have `swiper-slide-visible` (slide 1 also `swiper-slide-fully-visible`) — they're side-by-side at once. No drag cursor, no swipe.

Recommended path: **unify** into one `<ProductHeroGallery>` that branches its presentation on `useIsTouch`. Wins:
- Single source of truth for "the images that make up the product hero" — `<picture>`/`srcset` wiring, ARIA, eager-loading, and image-data shape live in one place.
- Adding a third hero image (or a video slide) only touches one component.
- Matches the reference site's structure (which converged here for good reason).
- Small TS exercise: one render-prop or branched-JSX component flowing the same image data through two presentations.

The cost is keeping the desktop "fill the viewport-height section" sizing rules and the mobile "aspect-locked + swipe gallery" sizing rules co-resident in one component — manageable because they're keyed off `useIsTouch` (and possibly viewport, if there's a tablet-range middle layout) and don't otherwise share style.

The blueprint changes below apply regardless of unify vs. split. If unifying, item 1 (swipe) only fires on the touch branch; items 2, 3, 4, 6 apply to all images in both branches; item 5 (slide-change ARIA) only matters in the touch branch (slide-change happens via swipe/tap), since on mouse mode both slides are static.

[`<ProductHeroImage>`](../../frontend/src/products/ProductHeroImage.tsx) currently uses a single hardcoded `imageAtWidth(..., 1200)`, an `aspect-square max-h-[80vh]` wrapper, opacity cross-fade between two `<img>` tags, and a tap-only `<BubbleSelector>`. The reference site (Shopify/Liquid + Swiper.js) ships a richer set of behaviors. Six changes to land in this rework, in rough priority order:

**Real product wins:**

1. **Swipe gesture support** — pointer-drag between images, the standard mobile expectation. The reference uses [Swiper.js](https://swiperjs.com/) which is heavy and over-featured for a 2-image cycle. Cheaper paths: a small dependency like [`embla-carousel-react`](https://www.embla-carousel.com/) (~3kb gz, supports pointer drag, momentum, snap), or roll our own `onPointerDown` / `onPointerMove` / `onPointerUp` updating a `translate-x` on a flex-row of slides. Roll-our-own is the smaller commit and a good TS exercise; reach for embla if a third image lands or we need momentum/easing tuning. The bubble selector stays as the visual indicator and tap-to-jump fallback.

2. **`<picture>` with multi-source `srcset`** — the browser picks the smallest sufficient image instead of always fetching the same width. Reference sources are roughly:
   - `(min-width: 1600px)`: 800/1000/1200/1400/1600 widths
   - `(min-width: 1200px)`: 600/800/1000
   - `(min-width: 1024px)`: 600/800/1000
   - `(min-width: 430px)`: 500/600
   - default: 352/420 with 420 as `src`

   Wrap [`imageAtWidth`](../../frontend/src/common/utils/imageAtWidth.ts) so it can build a `srcset` string given a list of widths, then assemble `<picture>` with the right tier breakdown. Saves bytes on small phones and serves retina at large screens.

3. **`fetchpriority="high"` + `loading="eager"`** on the hero img — it's the LCP element, telling the browser to prioritize it improves Core Web Vitals. Trivial code change, measurable impact.

**Polish (lower priority):**

4. **Explicit `width` / `height` attributes** on the `<img>` itself (not just the CSS aspect wrapper). Browsers use the intrinsic dimensions for pre-load space reservation; gives the layout-stability machinery more to go on. We already have `aspect-square` covering the wrapper, but adding the attribute belt-and-suspenders the CLS prevention.

5. **Per-slide accessibility** — `aria-live="polite"` on the slide container, `aria-label="1 of 2"` on each slide figure. Screen readers announce the slide change when the user swipes. Currently `<BubbleSelector>`'s `getAriaLabel` only labels the bubble *buttons*; the visual slide change itself is silent.

6. **Match-existing-behavior** — different intrinsic aspect ratios per image (reference: 420×449 main, 420×330 secondary), normalized at the container with `object-cover`. We already do this via the aspect-locked wrapper + `object-cover` on the imgs, so no change here — listed for completeness so the next implementer doesn't undo it.

When implementing: ship 1+2+3 as one chunk (the user-facing improvements), then 4+5 as polish.

#### Image grid layout (deferred until pane and hero land)

[`<ProductImageGrid>`](../../frontend/src/products/ProductImageGrid.tsx) needs a full sizing pass. Three layouts based on viewport, all using the same source images (`main_detail_src`, `detail_image_1_src`, `detail_image_2_src`):

**1. ≥1020 with detail pane** — image grid sits in the left content column (whatever the eventual width is, see "Pane and hero image" above). Cluster format. Must never be covered by the pane.

**2. ≥770 to <1020 (no pane, no touch)** — same 2-column cluster format moved below the product detail card. **At exactly 1020 sw**, dimensions are:

| Image | W × H | Aspect |
|---|---|---|
| Main (`main_detail_src`, left, spans both rows) | 486 × 968 | 486:968 |
| Detail 1 (`detail_image_1_src`, top right) | 486 × 355 | 486:355 |
| Detail 2 (`detail_image_2_src`, bottom right) | 486 × 597 | 486:597 |

Right-column rows sum to `355 + gap + 597 = 968` so the right column matches the main's height. The whole grid scales **proportionally** as the viewport shrinks toward 770 — every image keeps its aspect ratio, total grid width tracks the available content width.

**3. <770 OR touch (any width)** — vertical single-column list. **At exactly 770 sw**, dimensions are:

| Image | W × H | Aspect |
|---|---|---|
| Main | 734 × 1305 | 734:1305 |
| Detail 1 | 734 × 536 | 734:536 |
| Detail 2 | 734 × 901 | 734:901 |

Note that detail 1 and detail 2 keep the **same** aspect ratios as the cluster (486:355 ≈ 734:536, 486:597 ≈ 734:901), but the **main image's aspect ratio changes** from 486:968 (very portrait) to 734:1305 (less portrait) when it leaves the cluster. Same source image, different crop framing per layout. As viewport shrinks below 770, all three images continue to shrink width-wise while keeping these vertical-list aspect ratios.

**Two-image grid** (only `main_detail_src` + one of `detail_image_*_src` is present) — in cluster mode, both images share the same size (i.e. main no longer spans two rows; layout is two equal-size cells side by side). In vertical-list mode, the present detail image takes the same aspect ratio as it would in the three-image vertical list (so detail 1 alone is 734:536, detail 2 alone is 734:901, even when not paired with a sibling).

**Implementation notes**:
- The current cluster code uses fixed `460×460` columns at `1100px` height — those numbers don't match the spec and don't scale with viewport. Replace with proportional sizing (`grid-template-columns: 1fr 1fr`, `grid-template-rows` derived from the aspect ratios, container width tracks `px-page`-bounded content width).
- `useIsTouch` already routes touch devices to vertical-list. Add the 770 cutoff as a media query — if it doesn't get used elsewhere, leave it inline; if it spreads, promote to a named hook in `common/hooks/`.
- 2-image grid behavior is described above for the vertical-list aspect ratios; cluster sizing for that case wasn't given specific dimensions, just the rule that "both images share the same size." Confirm against design before implementing.
- **Main image gets an aspect-lock too** in vertical-list mode (`aspect-[438/779]` ≈ `aspect-[734/1305]`). Our current code leaves `main_detail_src` at its natural intrinsic ratio — works because source images happen to be 1024×1820 (matches the spec), but explicit `aspect-ratio` makes the displayed area predictable + CLS-safe before load and survives a future source-image swap with a different intrinsic ratio.
- **The figures' aspect-ratios are the same on touch and non-touch** — confirmed against the reference markup, which is byte-identical between input modes. All three figures carry `aspect-ratio: 438/779`, `389/284`, `389/478`. Cluster mode renders image 1 at a different *effective* shape (`486:968` ≈ 1.992 vs the figure's intrinsic 1.778) because the wrapping CSS grid sets explicit row heights / row-span that override the figure's `aspect-ratio`. Implication: don't try to swap aspect-ratios on the figure depending on layout — set them once on the figure and let the cluster's grid container override via row sizing when in cluster mode.

**Image-loading enrichments** (apply to all three images, both layouts):

- `<picture>` with multi-source `srcset` — same pattern as the hero blueprint. Reference uses `(min-width: 1024px)` srcset with 1024/1400/1600/1800w, default `<img>` srcset with 352/768w as fallback for narrow viewports.
- `loading="lazy"` (vs `eager` for the hero) — these images are below the fold.
- `fetchpriority="auto"` (the default) — explicitly *not* `high` like the hero, so the hero load isn't competed against.
- Decorative alt text: reference uses `alt="presentation image"` + `aria-hidden="true"` + `role="presentation"` — these are atmosphere/lifestyle shots, not semantic content. Worth confirming with design that ours are similarly decorative; if so, mirror the pattern so screen readers don't announce them.

### Checkout

[`<CheckoutPage>`](../../frontend/src/checkout/CheckoutPage.tsx) is a 2-col grid (`lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)]`) with form on the left, summary on the right. On mobile they should stack — form first, summary either collapsible at top or fixed at bottom. Internal forms ([`AddressForm`](../../frontend/src/checkout/AddressForm.tsx), payment) likely also need spacing tightening.

## Future improvements (deferred until repetition forces them)

The bar for extracting an abstraction is **observed repetition**, not anticipated future use.

### `<NavbarDropdownPanel>` shell

Four components share most of the "absolute below navbar" shape: [`<ShopDropdown>`](../../frontend/src/navbar/ShopDropdown.tsx), [`<SearchDropdown>`](../../frontend/src/navbar/SearchDropdown.tsx), [`<MobileSearchOverlay>`](../../frontend/src/navbar/MobileSearchOverlay.tsx), [`<MobileMenuPanel>`](../../frontend/src/navbar/MobileMenuPanel.tsx). Common base is `font-mulish bg-background border-brand-primary absolute top-full left-0 w-full border-y` plus an optional `height: calc(100dvh - var(--navbar-height))` for the full-viewport variants. Differences are bg color, height behavior, and inner layout direction.

A shell with a `fillViewport` boolean and pass-through bg/className would let the four share positioning logic. Borderline call today; revisit when a fifth panel shows up or when consistent behavior across the four becomes important.

### `<ColumnChooser>` per-listing options

The chooser's `MOBILE_OPTIONS` / `NARROW_OPTIONS` constants are tied to product-card breakpoints. If a second listing surface emerges (search results, account history) with different card sizing, the chooser will need parameterization or a per-listing config. Not worth doing today; flag if the second consumer materializes.

### Listing header state shape

[`<CollectionListHeader>`](../../frontend/src/collections/CollectionListHeader.tsx) takes a 4-prop bundle wired from `<CollectionPage>`. If a second listing surface lands wanting the same header, swap to an atom-bundle (`headerStateAtom`) that any consumer hydrates — keeps cells self-contained and the bar props-free. YAGNI'd for now (one consumer).

### Semantic type-scale tokens

Per-component fluid type tokens (`--review-name-size`, `--review-caption-size`, `--review-description-size`, `--hero-subtext-size`) have floor literals (12, 14, 16, 18) that cluster at familiar numbers — they correspond to "caption / small body / body / small heading" roles, but those roles aren't named yet.

When a third component lands wanting one of those roles with a similar ramp, extract `--text-caption: clamp(...)` / `--text-body-sm: clamp(...)` etc. as a shared semantic layer. Today most floor literals only repeat 2× and the per-component namespaces stay readable. Wait for the third.

### Tokenizing breakpoint values

`1024`, `1400`, `2250` repeat across many `clamp()` and `@media` declarations. Tokenizing in `@theme inline` (e.g. `--breakpoint-md: 1024px`) would help docs, but **CSS custom properties don't work in `@media` rule conditions** — only inside `calc()`. Partial coverage creates divergence (some sites see a token, others see a literal), which is worse than the current consistent literals.

Wait for CSS Custom Media Queries to land in browsers, or for the PostCSS pipeline to grow it (Tailwind v4 already exposes `--breakpoint-2xl` in `@theme inline` — when more of that machinery lights up, revisit).

### Stripping single-use fluid tokens to inline values

Tokens like `--review-card-gap` have one consumer. Could go inline as `gap-[clamp(...)]`. Tradeoff: JSX would carry the clamp expression instead of a clean utility name, and the curve documentation would be scattered across components rather than centralized in `globals.css`.

Current shape (token + utility + comment block) is more readable for now. Revisit if utility-token sprawl becomes the issue (dozens of one-consumer tokens that obscure the shared system).

## Out of scope

- A separate mobile-only route tree. The same routes serve all viewports; layouts diverge inside page components.
- Any net-new breakpoint *tier* in app-wide layout. Per-component local breakpoints are fine where the component genuinely has multiple visual states.
