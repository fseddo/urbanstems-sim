# PDP refactor — implementation plan

**Status: in progress.** Delete this file when all tasks complete.

A session-state document holding the ordered implementation plan for the PDP rework. The detailed *what to build* lives in [`dynamic-sizing.md`](dynamic-sizing.md) under the "Product details page" section (Pane geometry, Pane content audit, Touch vs non-touch split, Hero image blueprint, Image grid layout). This file holds the *order to build it in* + per-task status, so a fresh session after a commit can pick up where the previous one left off.

Each task is independently shippable — the page still works at any phase boundary.

## Phase 0 — primitives (foundation)

No PDP changes yet; build the reusable helpers that subsequent phases consume.

- [x] **0.1 `<PictureSrcset>` helper** — wrapper around [`imageAtWidth`](../../frontend/src/common/utils/imageAtWidth.ts) that takes an image src + width tiers + media queries and outputs `<picture>` with `<source>` elements. Used by hero, image grid, swatches. Lives in `common/components/`.
- [x] **0.2 `<SwipeCarousel<T>>` primitive** — generic over slide value type, render-prop for slides, pointer-drag handling (`onPointerDown` capture / `onPointerMove` translate / `onPointerUp` snap-or-advance with threshold), snap animation via CSS `transition: transform`. Lives in `common/components/`. Decision: roll our own (~50 LOC) rather than pull in embla — only 2 slides on the PDP and we keep dep count down. Swap to embla later if a third use case lands.

## Phase 1 — desktop page layout

- [x] **1.1 Breakpoint reconciliation** — decided: keep `useIsDesktop` at 1024 (matching Tailwind `lg:`), use it for the PDP pane too. The reference site's 1020 was an arbitrary 4px deviation; not worth the divergence cost. PDP uses `useIsDesktop` everywhere.
- [x] **1.2 Two-column page layout** — restructure `<ProductDetailPage>` desktop branch from `absolute right-[90px]` pane to a real two-column layout: image-grid + accordions in the left content column, sticky `<ProductDetailPane>` floating in the right column over the page background. (Note: there is no "gray column" — the dark gray on the reference is image-blend bg around the hero, not a structural column color.) Hero stays full-width above for now (Phase 2 moves it into the left column when it becomes `<ProductHeroGallery>`). 50/50 split for now; Phase 3.1 refines to reference proportions (640/1568 ≈ 40.8% pane).

## Phase 2 — hero unification

- [x] **2.1 Build `<ProductHeroGallery>`** — single component branching on `useIsDesktop` (decided against `useIsTouch` so tablet matches the desktop layout). Mobile: single visible slide + swipe via `<SwipeCarousel>` + `<BubbleSelector>` for tap-to-jump. Desktop: both slides side-by-side, no swipe. Both branches use `aspect-[600/641]` per slide (matching the reference's `--fill` ratio), full-width with `max-height: 100dvh - --navbar-height` cap. Both consume `<PictureSrcset>` and share the same data (main_image / hover_image), with fetchpriority="high" + loading="eager" on the LCP slide.
- [x] **2.2 Wire + cleanup** — replaced `<ProductBackgroundImages>` (desktop branch) and `<ProductHeroImage>` (mobile branch) call sites with `<ProductHeroGallery>`. Both old components deleted. Hero now lives in the desktop left column instead of full-bleed above. [`docs/frontend/features/products.md`](../frontend/features/products.md) updated.

## Phase 3 — pane sizing + content

- [x] **3.1 Pane width + position** — pane wrapper width `calc(640/1568*100%)` ≈ 40.8% of section (matches reference). Right gutter `calc(7vw - 42px)` — linear interpolation between two visually-tuned anchors (35px @ 1100sw, 77px @ 1700sw) instead of the reference's pure proportional `calc(80/1568*100%)`. The proportional formula felt off at small viewports; the linear interpolation tracks the user's eye across the desktop range. Inner pane card uses default Tailwind `p-10` for now; the reference's `36px / clamp(32-74) / clamp(40-74)` ramp is deferred (see "Future improvements" below).
- [x] **3.2 Move accordions inside pane on mobile** — accordion location follows `isDesktop`: external (below image grid) on desktop, in-pane (between Delivery and AddOns) on mobile. Description defaults open externally and closed in-pane. Care Instructions defaults closed everywhere. Both branches share `<ProductInfoAccordion>` with a `defaultOpen` prop.

## Phase 4 — image grid sizing

- [x] **4.1 Aspect-ratio on figures via padding-top trick** — each figure gets `padding-top: H/W * 100%` (image 1 = 438/779, image 2 = 389/284, image 3 = 389/478) with absolute-positioned img/video filling. Picked padding-top over CSS `aspect-ratio` so `align-items: stretch` works in the cluster's row-span cell — `aspect-ratio` was constraining item 1 to its intrinsic height instead of letting it stretch to fill the column-2 stack height. Includes the 2-item edge case (item 2 inherits item 1's aspect for symmetry).
- [x] **4.2 Responsive 2-col cluster grid** — `grid-cols-1 md:grid-cols-2 gap-x-4` with item 1 `md:row-span-2` and item 3 `mt-4` (16px row gap in col 2). Single-column stack with 16px gaps below 768px (matches reference's ~760px breakpoint). Replaces the old fixed `460×460 × 1100px` cluster.
- [x] **4.3 Wire `<PictureSrcset>` into figures** — non-video figures now use `<PictureSrcset>` with the reference's tier widths (`(min-width: 1024px)` source: 1024/1400/1600/1800w; default img srcset: 352/768w; src at 768w). `loading='lazy'` + `fetchPriority='auto'` per reference. Video items unchanged (PictureSrcset is image-only). Caveat: `<PictureSrcset>` doesn't accept a `sizes` attribute, so browsers may pick the largest tier on high-DPR — bytes overshoot, no functional issue.

## Phase 5 — enrichments

- [x] **5.1 Loading / fetchpriority** — the LCP-relevant attributes are wired through `<PictureSrcset>`. Hero: visible/LCP slides get `loading='eager' fetchPriority='high'`; off-screen slides (mobile carousel slide 2) get `loading='lazy' fetchPriority='auto'`. Grid: all figures `loading='lazy' fetchPriority='auto'`. **Aria deferred** — the rest of the site doesn't support screen readers yet, so per-slide `aria-live` / `aria-label="N of M"` and decorative `aria-hidden` / `role="presentation"` on grid figures will be tackled in a dedicated a11y refactor instead.
- [ ] **5.2 `<AddOns>` collapsible refactor** — wrap each add-on row in [`<CollapsiblePanel>`](../../frontend/src/common/components/CollapsiblePanel.tsx) so they expand to reveal more detail per row, matching the reference `<details>`/`<summary>` shape. Worth aligning while we're already in the file.

## Future improvements (not blocking the refactor)

Considered during the refactor and intentionally deferred. None are required to call the refactor done — listed here so the next reader can pick them up if the value lands.

- **Pane padding ramp.** The reference's `.pdp__info` has `--padding-desktop: 36px clamp(32px, calc(40/1728*100%), 74px) clamp(40px, calc(74/1728*100%), 74px)` (top / sides / bottom — sides and bottom both ramp with viewport). Our pane card uses Tailwind `p-10` (40px all sides). Switching to a per-side ramp would tighten visual fidelity at large viewports but the current `p-10` reads fine across the desktop range.
- **Image-grid figure aspects as a constants block.** [`ProductImageGrid`](../../frontend/src/products/ProductImageGrid.tsx) currently inlines `438 / 779`, `389 / 284`, `389 / 478` into the items array. They could be lifted to a `FIGURE_ASPECTS` constant. Skipped because each ratio is used exactly once and the inline values sit next to the field they describe (`main_detail_src` etc.) — extracting reduces locality without aiding reuse.
- **Pane geometry as CSS variables in `globals.css`.** `--pdp-pane-w`, `--pdp-pane-right-gutter` etc. would let the pane positioning be one-line at the call site (`right-pdp-gutter w-pdp-pane`) and centralize the design tokens. Single call site today, so the value is mostly readability. Worth doing if the pane geometry needs to be referenced from a second place (e.g., a PDP variant with a different layout).
- **Page-level horizontal padding via `<section className='px-page'>` + hero negative margin.** Reference moves page padding to the page wrapper and has the hero escape via `margin-left: calc(-1 * --wrap-h)` + `:before { width: 100vw }` for the gray background. We currently put `pl-page` on the content column instead, leaving the section padding-free so the hero is naturally full-bleed. Both approaches reach the same visual result; the reference's is more "principled" (one source of truth for page padding) but ours is simpler.

## When done

1. Verify every checkbox is ticked.
2. Strip the corresponding sub-sections from [`dynamic-sizing.md`](dynamic-sizing.md) (Pane geometry, Pane content audit, Touch vs non-touch split, Hero image blueprint, Image grid layout) since the work has shipped.
3. Update [`docs/frontend/features/products.md`](../frontend/features/products.md) so it documents the current state, not the in-progress one.
4. Delete this file (and the `pdp-ref-*.html` / `pdp-ref-css-rules.md` reference files alongside it).
