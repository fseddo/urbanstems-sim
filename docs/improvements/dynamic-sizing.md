# Dynamic sizing — workstream tracker

Pre-launch push to make every page work cleanly on mobile widths. **Status: in progress.**

This doc is the punch list of remaining work. **It does not document how anything works** — for that, see:

- *How* responsive work is done — [`docs/frontend/architecture/dynamic-sizing.md`](../frontend/architecture/dynamic-sizing.md).
- Per-feature current state (which tokens, which breakpoints, what's responsive) — [`docs/frontend/features/`](../frontend/features/), one doc per area.

**Currently focused on:** Checkout.

## Remaining surfaces

### Checkout

[`<CheckoutPage>`](../../frontend/src/checkout/CheckoutPage.tsx) is a 2-col grid (`lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)]`) with form on the left, summary on the right.

#### Mobile order summary as collapsible at top
Below `lg`, replace the right-side summary column with a collapsible bar at the top of the page (below the navbar). Two states:
- **Collapsed (default):** `Order Summary` left, total right. Single row, click to expand.
- **Expanded:** the cart line items render below the header row.

Use [`<CollapsiblePanel>`](../../frontend/src/common/components/CollapsiblePanel.tsx) for the open/close transition (the codebase's `grid-template-rows: 0fr ↔ 1fr` slide pattern). Desktop right-column summary is unchanged at `lg+`.

#### Internal form spacing
[`<AddressForm>`](../../frontend/src/checkout/AddressForm.tsx) and the payment block likely need spacing tightening on mobile (current padding is sized for the 440px desktop column).

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
