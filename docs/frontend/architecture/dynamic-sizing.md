# Dynamic sizing across viewports

Architectural principles for making the app work cleanly across mobile, tablet, desktop, and wide viewports. Read this before adding responsive behavior to a new component or page.

Active workstream — what's landed, what's next, what's deferred — lives in [`improvements/dynamic-sizing.md`](../../improvements/dynamic-sizing.md). Per-feature sizing specifics (tokens, breakpoints, what's responsive) live in the relevant [`docs/frontend/features/`](../features/) doc.

## CSS-responsive vs JS-conditional rendering

Two ways to react to viewport size, different trade-offs:

1. **Tailwind responsive utilities** (`lg:flex-row`, `hidden lg:flex`, `min-[530px]:w-[480px]`, etc.) — pure CSS, layout flips instantly on a viewport cross, no React re-render needed. Right for: layout direction (`flex-col` → `flex-row`), show/hide of decorative elements, spacing or font-size jumps, simple sizing changes. Same DOM tree.
2. **`useIsDesktop()` + JS-side branching** — different DOM trees per viewport. Use when the desktop and mobile shapes can't be expressed as one DOM tree with CSS — e.g. when **adjacency changes** (Filter & Sort and the chooser are non-adjacent on desktop but share a sub-row on mobile, see `<CollectionListHeader>`), or when **behavior changes** (a dropdown on desktop becomes a different layout on mobile, see `<SearchDropdown>` vs `<MobileSearchOverlay>`).

Default to (1). Reach for (2) only when the constraint is structural, not stylistic. The price of (2) is a `matchMedia` re-render on every breakpoint cross and a slightly less declarative file — fine occasionally, smelly if every component does it.

## Container queries for component-internal layout

Where a component renders at very different sizes within the same viewport (a `<ProductCard>` shows up at ~140px in mobile search and ~600px in a 2-col listing), **viewport-based responsive classes can't tell the two apart**. Reach for **container queries** instead: declare `@container` on the wrapper and use `@[<size>]:` prefixes on the children. The card shapes itself based on its rendered width, regardless of the page or viewport it's embedded in.

Don't add `@container` everywhere by default — only when a component actually appears at meaningfully different sizes. Most components have a single canonical size and don't need it.

## Breakpoint policy

The app has **one global breakpoint** for app-level layout: `lg` (≥ 1024px) via `useIsDesktop()` and the standard Tailwind `lg:` prefix. Used by `<CollectionListHeader>`, the navbar mobile/desktop split, etc.

Component-internal responsive logic is allowed to introduce **local breakpoints** when the component has its own visual states. Examples:
- [`<SlidePane>`](../../../frontend/src/common/components/SlidePane.tsx) uses 530px + 1020px (full-screen → wall-attached → floating popover).
- [`<ProductCard>`](../../../frontend/src/common/components/ProductCard.tsx) uses container queries at 300px + 500px (aspect ratio progression).

The bias is still away from a tablet *tier* — there's no `md`-shaped layout tier in app code. Per-component values exist where the visual transition happens at a different point than the global `lg`.

### Document-level safety net

`body { min-width: 250px }` in [`globals.css`](../../../frontend/src/globals.css) ensures the page never collapses below a usable width. Below 250sw the browser auto-renders a horizontal scrollbar and in-flow content holds at the 250px floor. Fixed-positioned elements (navbar, ProductBottomBar) are anchored to the viewport rather than the body, so they stay viewport-wide at sub-250 widths — intentionally, since extending fixed bars past the visible viewport edge is worse than letting them sit flush to the scroll position.

## Fluid token system

For per-component responsive **sizing** (widths, font sizes, gaps that should scale continuously rather than flip stepwise), the project uses CSS custom properties that all follow the same canonical curve, documented at the top of [`globals.css`](../../../frontend/src/globals.css):

```
<1024px        : floor (mobile / tablet baseline)
1024–1400px    : first ramp (desktop kicks in)
1400–2250px    : optional second ramp (large desktops)
≥2250px        : ceiling
```

Floors live in `:root`. Ramps live inside `@media (min-width: 1024px)` and `@media (min-width: 1400px)`, expressed as `clamp(floor, calc(floor + (100vw - start) * delta / range), ceiling)`. A "two-ramp with plateau" variant keeps the floor static for a stretch above 1024 by setting the clamp's floor higher than the calc's starting value (see `--hero-headline-size`).

Each component gets its own namespace (`--review-card-w`, `--review-name-size`, `--review-card-gap`) with a comment block describing **what** the token is, **at what breakpoints** it ramps, and **which utility** consumes it. Tokens are exposed as Tailwind utilities via `@theme inline` (`text-review-name`, `w-review-card`) or `@utility` blocks (`gap-review-card`, `pl-page`).

Why this shape:
- Responsive logic stays in CSS — no JS-side viewport conditionals, no re-renders on resize.
- Composes with `tw()` className concat — utility names sit alongside Tailwind classes.
- A single token can drive multiple downstream values: `--review-card-w` drives the frame width, the description width below it, and the percentage-based positions of the internal images, so the whole composition scales together without warping.
- One curve, learned once. New tokens slot in by reusing the same anchor breakpoints (1024, 1400, 2250) — variations are only when a component's design genuinely calls for them (e.g. `--occasion-card-w` uses 450 / 1024 / 1400 / 3000 because the design intentionally steps down at 1024 and keeps growing beyond 1400).

Don't try to abstract the `clamp()` shape itself — vanilla CSS can't, PostCSS helpers reduce clarity, and the shape is canonical enough that readers learn it once. Don't introduce per-component tokens for one-off non-responsive values either; if the value isn't reused or doesn't ramp, just inline it.

## Touch capability vs viewport size

**Most layout decisions are viewport-driven** (`useIsDesktop` / `lg:`). A small handful are **input-driven** instead — anchored vs modal popovers, hover affordances, fat-finger-vs-precise-pointer hit targets — and those should key off `(pointer: coarse)` via `useIsTouch`, not viewport width.

The two are not equivalent: a small browser window on a desktop with a mouse stays `pointer: fine`, so it should still get pointer-precision UI (anchored dropdowns, hover states), even though it's narrow. Phones, tablets, and DevTools device emulation all report `coarse`.

The current consumer is [`<DatePicker>`](../../../frontend/src/date/DatePicker.tsx): on touch it renders a centered modal with a black backdrop and `animate-fade-in/out`; on mouse it renders an anchored dropdown below the trigger. Same calendar content; different shell. Use this pattern any time the *interaction model* (not the *layout shape*) is the thing changing.

## Mount/unmount fade-in/out pattern

For overlays that need both fade-in *and* fade-out (modals, dropdowns), pair the `--animate-fade-in` / `--animate-fade-out` tokens with an `exiting` state and a `setTimeout` that delays the actual unmount until after the exit animation finishes (200ms). The reference is [`<DatePicker>`](../../../frontend/src/date/DatePicker.tsx)'s `close()` — `setExiting(true)` → 200ms timer → `setOpen(false)`. Without the delay, fade-out has no chance to play because the element unmounts immediately.

CSS-only enter (just `animate-fade-in` on a conditionally-rendered element) is fine when there's no exit animation. The state-machine cost only pays off when both directions need to animate.

## Single-active-panel atoms

When a UI surface has multiple expandable elements that are **mutually exclusive** (the navbar's shop dropdown / search dropdown / mobile menu), encode the "at most one open" invariant as a `'a' | 'b' | 'c' | null` atom rather than separate booleans. The mutual-exclusion comes for free — setting the atom to `'b'` clears `'a'` automatically — and there's no scattered `setShopOpen(false)` / `setSearchOpen(true)` coordination at every call site. Reference: [`navbarPanelAtom`](../../../frontend/src/navbar/navbarAtoms.ts).

For boolean ergonomics at the consumer, layer a `useNavbarPanel(name)` hook that returns `[isOpen, setIsOpen]` so existing call sites read the same as `useState`. The setter for `false` is a no-op unless the named panel is currently active.

## Resize-driven side effects

When a viewport flip needs to mutate state (e.g. clamping `columnCount` into the new range), the current shape is `useIsDesktop()` + a `useEffect` watching the boolean and calling a setter. Acceptable for one site (only `<CollectionPage>` does this today). If a second site lands the same shape, factor a callback-driven hook like `useResizeHandler(({ isDesktop }) => { ... })` so the side effect is expressed declaratively.

## Transitions across breakpoints — keep values numeric

If a `transition-all` is supposed to animate the breakpoint flip itself (e.g. a pane resizing), make sure every property being transitioned uses **explicit numeric values** in both states. `inset-0` → `left-auto` doesn't tween (the `auto` keyword can't be interpolated); `width: 100vw` → `width: 480px` does. The `<SlidePane>` shell pins `top/right/bottom` numerically and only changes `width` between viewports for this reason — see [the file's comment](../../../frontend/src/common/components/SlidePane.tsx) for the gotcha.

## View Transitions API — gotchas

Used for the menu-search-bar morph + all panel open/close cross-fades. Three things bit us:

- **CSS `animation: fade-in` on a panel root + view transitions = transparent snapshot.** The API captures the new DOM right after `flushSync`. If the panel root has `animate-fade-in` (starting at `opacity: 0`), the snapshot is nearly transparent — and the API's own cross-fade can't recover pixels that weren't painted. Behind the transparent snapshot you see the previous page bleeding through. Fix: either remove the CSS fade entirely (let the API handle it) or ensure the panel is fully opaque at mount time. Don't combine the two.
- **Force-`opacity:1` on `::view-transition-new(name)` makes named elements pop in.** When we set `animation: none; opacity: 1` on the new search-bar to fix the "two Search Heres at midpoint" problem during the morph, we accidentally made the search-bar appear instantly during *every* transition involving it — including opening the menu from a closed state, where the rest of the content was fading in normally. Hide the OLD only (it's the duplicate); let NEW use the API's default cross-fade so it matches surrounding content timing.
- **`flushSync` is required.** Without it, React batches the state update outside the snapshot window and the API animates between two identical snapshots. `withViewTransition` wraps the call so consumers don't have to remember.

Custom timing per named transition goes in `globals.css` via `::view-transition-group(name) { animation-duration: ... }`. Browser default is ~250ms.

## Primitives

Reusable bits that show up in the principles above:

- [`useMediaQuery`](../../../frontend/src/common/hooks/useMediaQuery.ts) — generic `matchMedia(query)` subscription hook. Underlying primitive for the named viewport hooks below; consume the named hook at call sites rather than passing breakpoint strings around.
- [`useIsDesktop`](../../../frontend/src/common/hooks/useIsDesktop.ts) — `(min-width: 1024px)`. Single source for "are we above the `lg` breakpoint."
- [`useIsNarrow`](../../../frontend/src/common/hooks/useIsNarrow.ts) — `(max-width: 374px)`. Used by [`<CollectionPage>`](../../../frontend/src/collections/CollectionPage.tsx) to force the product grid to 1 column when two cards (each `min-w-[160px]`) plus padding/gap stop fitting.
- [`useIsTouch`](../../../frontend/src/common/hooks/useIsTouch.ts) — `(pointer: coarse)`. Drives interaction-model decisions (modal vs anchored, hover affordances) — NOT layout decisions, which stay on viewport hooks. See "Touch capability vs viewport size" above.
- [`useDebounce`](../../../frontend/src/common/hooks/useDebounce.ts) — `useDebounce(value, ms)` returns a value that lags behind the input. Used by the search dropdowns to avoid firing a backend query per keystroke.
- [`<SlidePane>`](../../../frontend/src/common/components/SlidePane.tsx) — shell-only reusable container for slide-in panes. Three states: `< 530px` full-screen, `530-1019px` wall-attached fixed-width, `≥ 1020px` floating popover. Used by [`<CartPane>`](../../../frontend/src/cart/CartPane.tsx) (right) and [`<FilterSidebar>`](../../../frontend/src/filters/FilterSidebar.tsx) (left). Includes portaled backdrop with click-to-close and body-scroll lock.
- [`withViewTransition`](../../../frontend/src/common/withViewTransition.ts) — wraps a React state update in `document.startViewTransition()` + `flushSync` so the browser snapshots the DOM before/after and animates between them. Falls through to a plain call in unsupported browsers (Firefox without the flag) — no flicker, no animation.
- [`navbarPanelAtom`](../../../frontend/src/navbar/navbarAtoms.ts) — single-active-panel state for navbar surfaces, with `useNavbarPanel(name)` hook for `useState`-shaped consumption.
- **Animation tokens** — three `animate-fade-in-{fast,base,slow}` utilities (100ms / 200ms / 600ms) plus a single `animate-fade-out` (200ms), defined in [`globals.css`](../../../frontend/src/globals.css) `@theme inline`. Pair `animate-fade-in` + `animate-fade-out` with the mount/unmount delay pattern above when both directions need to animate.
