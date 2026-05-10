# Product detail page (PDP)

The `/products/$slug` route. Renders a single product's hero imagery, buy-box, secondary product images, description/care accordions, and the trailer (reviews, recommendations, delivery instructions, sticky bottom bar).

The page is composed in [`ProductDetailPage.tsx`](../../../frontend/src/products/ProductDetailPage.tsx). Layout differs **structurally** between viewports — different DOM trees, not just CSS — so the page keys off `useIsDesktop` and renders one of two main-content shapes. The trailer renders identically on both.

## Viewport split

| | Desktop (≥1024) | Mobile (<1024) |
|---|---|---|
| Layout | 2-column grid (`grid-cols-2`); breadcrumbs + hero + image grid + accordions stack in the left column, sticky pane in the right | Single flat column |
| Hero | [`<ProductHeroGallery>`](../../../frontend/src/products/ProductHeroGallery.tsx) renders both images side-by-side (mouse input branch — see below) | Same component, touch input branch — single image at a time with `<SwipeCarousel>` + `<BubbleSelector>` |
| Buy-box | [`<ProductDetailPane>`](../../../frontend/src/products/productDetailPane/ProductDetailPane.tsx) — sticky white-rounded shadowed card inside the right grid column, sticks below the navbar via `--navbar-offset` | [`<ProductDetailContent>`](../../../frontend/src/products/productDetailPane/ProductDetailContent.tsx) flat in document flow, wrapped in a white card |
| Image grid | 2-column grid, fixed `460px × 460px` columns at `1100px` height; left column may span both rows | Single-column flex stack, each image `w-full` with natural aspect ratio |
| Horizontal gutters | `pl-20 pr-4` on the left column, `px-10` on the right column | `px-page` (16/34/65 ramp) on every block |

## Buy-box content (shared)

[`<ProductDetailContent>`](../../../frontend/src/products/productDetailPane/ProductDetailContent.tsx) is the actual buy-box: rating + reviews link, name + subtitle, price (with optional discounted strike-through), variant options, delivery information (date + address pickers), add-ons, add-to-cart button.

It's pure content — no positioning chrome — so:
- Desktop wraps it in `<ProductDetailPane>`'s sticky-white-rounded shell, sized by the right grid column.
- Mobile renders it directly inside a white-card-wrapped `px-page` block.

The `addToCartRef` ref forwards to the add-to-cart button so [`<ProductBottomBar>`](../../../frontend/src/products/ProductBottomBar.tsx) can use an `IntersectionObserver` to know when to slide its sticky bottom-bar copy of the button into view.

The ADD TO BAG label and price come from [`useAddToBagButton(product)`](../../../frontend/src/products/useAddToBagButton.ts) — same hook drives the sticky bottom-bar button — so the bundled set price (parent + any pending add-ons selected via `<AddOns>`) stays consistent across both surfaces. The hook also clears pending on add so a re-add doesn't double-apply.

## Add-ons section

[`<AddOns>`](../../../frontend/src/products/productDetailPane/ProductAddOns.tsx) renders the configurator inside the buy-box — collapsible "Make It Extra Special" with a vase row (gated by `isVaseAddonEligible(product)`) and a gift row. Each row has empty (whole row is the click target → opens the selector pane) and selected (per-item rows + Edit/Add Another) states. Selections write into `pendingAddonsAtom[product.slug]` and bundle into the next ADD TO BAG via `useAddToBagButton`. Full flow + selector pane internals live in [`docs/frontend/features/addons.md`](addons.md).

## Hero gallery

[`<ProductHeroGallery>`](../../../frontend/src/products/ProductHeroGallery.tsx) is a single component that branches on [`useIsTouch`](../../../frontend/src/common/hooks/useIsTouch.ts) — the experience matches the input device, not the viewport size, so a touch tablet at 1280 still gets the swipe gallery and a small mouse-driven desktop window still gets both-side-by-side.

- **Touch + 2 images** → [`<SwipeCarousel>`](../../../frontend/src/common/components/SwipeCarousel.tsx) (drag to advance, snaps on release past 25% of width) inside an `aspect-square max-h-[80vh]` frame, with a 2-bubble [`<BubbleSelector>`](../../../frontend/src/common/components/BubbleSelector.tsx) below for tap-to-jump.
- **Mouse + 2 images** → `grid-cols-2` with both images at `aspect-[3/4]` portrait, no swipe affordance.
- **Either + 1 image** → the lone image at `aspect-square max-h-[80vh]`, no carousel/selector.

Both branches share the same image rendering via [`<PictureSrcset>`](../../../frontend/src/common/components/PictureSrcset.tsx) (widths `[400, 800, 1200, 1600]`). The first/main image is treated as the LCP candidate: `loading='eager'` + `fetchPriority='high'`. The secondary slide stays lazy on touch (only loads after the user swipes) and eager on non-touch (it's already on screen). `badge_text` and `badge_image_src` overlay absolutely on top of whichever frame is rendering.

## Detail/lifestyle image grid

[`<ProductImageGrid>`](../../../frontend/src/products/ProductImageGrid.tsx) reads `main_detail_src` (may be `is_main_detail_video`), `detail_image_1_src`, `detail_image_2_src`. Branches on `useIsDesktop`:

- Desktop: 2-col grid with `gridTemplateColumns: '460px 460px'` and `gridTemplateRows: '2fr 4fr'` when both right-column images exist (`'1fr'` otherwise). Fixed `1100px` height. The left column spans both rows when both right images exist.
- Mobile: flex-col stack; each image is `w-full rounded-md` with natural aspect ratio. The desktop fixed sizing would horizontally overflow at 920px+, so the mobile branch returns a different DOM rather than overriding the grid.

## Accordions

[`<ProductInfoAccordion>`](../../../frontend/src/products/ProductInfoAccordion.tsx) wraps content in [`<CollapsiblePanel>`](../../../frontend/src/common/components/CollapsiblePanel.tsx) for the slide-open animation. Two instances on the page: Description (open by default) and Care Instructions (collapsed by default). The first instance gets a `border-t` so the section reads as a closed group above and below.

## Delivery info card

[`<DeliveryInformation>`](../../../frontend/src/products/productDetailPane/ProductDeliveryInfo.tsx) is the bordered "Receive on / Send to" card inside the buy-box. Two flex children with no `gap` between them — instead each cell uses `px-3` so the date side's `border-r` sits flush against the address cell. Without that, a `gap-2` between cells would put 8px of empty whitespace between the divider and where the address dropdown anchors, making the dropdown read as misaligned. The Send-to side is an [`<AddressPicker>`](../../../frontend/src/address/AddressPicker.tsx) trigger, its results dropdown anchors to the address container's left edge (which is now flush with the divider) and its `resultRowClassName='px-3'` matches the trigger's padding so dropdown row text and input text align vertically.

The date side enforces the product's `delivery_lead_time` via `minDate` on `<DatePicker>`. If the cart's selected delivery date falls before that, the page snaps the date forward and surfaces an explanatory error line with the previous date, so the user knows it changed.

## Trailer (shared)

Below the main section, both viewports render the same trailer. The vertical-rhythm sections share the `py-pdp-section` token (40 / 60 / 80 across the three breakpoints) for consistent breathing — except `<ProductReviews>`, which still uses static `py-20`.

- [`<ProductReviews>`](../../../frontend/src/products/ProductReviews.tsx) — symmetric padding, header + rating + WRITE A REVIEW button. The button opens [`<ReviewModal>`](../../../frontend/src/products/ReviewModal.tsx) — built on [`useForm`](../../../frontend/src/common/hooks/useForm.tsx) (see [`architecture/forms.md`](../architecture/forms.md)). Modal is full-screen on touch and centered max-w-2xl on mouse; stays mounted with opacity + `inert` toggling, mounted at `document.body` via [`usePortal`](../../../frontend/src/common/hooks/usePortal.tsx) (which also handles body-scroll lock). Submissions are **local-only**: the form writes into [`localReviewsAtom`](../../../frontend/src/products/reviewAtoms.ts) (`atomWithStorage`), never round-tripping to the backend. `<ProductReviews>` filters that atom by `product_slug` and prepends to the server list for render. [`<ReviewCard>`](../../../frontend/src/products/ReviewCard.tsx) takes a `DisplayReview = Review | LocalReview`; unverified reviews (always the case for local submissions) render with a tinted `bg-background-alt/60` and a "Pending Review" badge to visually distinguish from "Verified Buyer" white cards.
- [`<ProductRecommendations>`](../../../frontend/src/products/ProductRecommendations.tsx) — header + horizontal product carousel. Section uses `pl-page` only; the carousel extends off the right edge of the viewport via [`<HorizontalList>`](../../../frontend/src/common/components/HorizontalList.tsx), mirroring the [`<BestSellers>`](../../../frontend/src/landing/bestSellers/BestSellers.tsx) pattern on the landing page. Header uses `text-landing-section-header`. The "SHOP ALL" link uses `tracking-action` (the shared CTA letter-spacing token, 1.68px) and ramps `text-[12px] lg:text-[14px]`.
- [`<ProductDeliveryInstructions>`](../../../frontend/src/products/ProductDeliveryInstructions.tsx) — header + 3-step horizontal-scrolling list. Section uses `pl-page` only; the cards are wrapped in [`<HorizontalList>`](../../../frontend/src/common/components/HorizontalList.tsx) with `min-w-[280px] flex-1` per cell — at viewports where 3 cards don't fit (~<880sw), the row scrolls horizontally; at ≥lg the cards distribute equally and the scrollbar auto-hides (see [`<HorizontalScrollbar>`](../../../frontend/src/common/components/HorizontalScrollbar.tsx) — it tracks `container.scrollWidth > clientWidth` and fades out over 200ms when content fits). Header copy splits into two `<span className='block'>` elements so the line break is structural, not width-driven. Header uses `text-pdp-section-header` (28 → 48 → 60); step description uses `text-delivery-step-description` (14 → 18).
- [`<ProductBottomBar>`](../../../frontend/src/products/ProductBottomBar.tsx) — sticky-bottom add-to-cart that slides in (`translate-y-100% → 0`) once the in-flow add-to-cart button has scrolled above the viewport (detected via `IntersectionObserver` on `addToCartRef`). Sets `--bottom-bar-height` so other sticky elements can reserve space for it.

## Data flow

Loader fetches via `productQueries.detail(slug)` at the route level. The page calls `useSuspenseQuery(productQueries.detail(slug))` to read it (loader hydration). Variant selection, delivery date, delivery address all live in atoms (`deliveryDateAtom`, `deliveryAddressAtom`, etc.) so they sync with the listing-page header bar.
