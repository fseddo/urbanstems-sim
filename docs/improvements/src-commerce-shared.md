# `frontend/src/` (cart, checkout, address, date, common, navbar) — improvements

Punch list for the commerce-flow + shared infrastructure.

## Pending

### 🚧 Priority: Checkout polish

These are the next items to tackle — grouped at top so they're not buried under older audit-cycle items.

#### Mobile order summary as collapsible at top
- Location: [`<CheckoutPage>`](../../frontend/src/checkout/CheckoutPage.tsx).
- Below `lg`, replace the right-column summary with a collapsible bar at the top of the page. Collapsed: `Order Summary` + total. Expanded: cart line items below.
- Fix: use [`<CollapsiblePanel>`](../../frontend/src/common/components/CollapsiblePanel.tsx) for the open/close transition. Desktop right column unchanged.
- Cross-ref: [`improvements/dynamic-sizing.md`](dynamic-sizing.md#checkout) tracks this under the dynamic-sizing workstream too — fix once, both lists clear.

#### Drop bank payment option from Stripe `<PaymentElement>`
- Location: `frontend/src/checkout/CheckoutForm.tsx` (Stripe `<PaymentElement>` config) — root fix is on the backend PaymentIntent creation.
- Bank-redirect option clutters the picker. Cleanest fix is server-side: set `payment_method_types: ['card']` (or whatever subset we want) when creating the PaymentIntent. The picker shape derives from the PI's `payment_method_types`, so `<PaymentElement>` will only render those.
- Alternative if backend can't change: `<PaymentElement options={{ paymentMethodOrder: [...] }} />` on the frontend — works but less authoritative.

#### Placeholder text on Stripe inputs
- Location: `frontend/src/checkout/CheckoutForm.tsx`.
- Stripe's `<PaymentElement>` / `<AddressElement>` support label and field-level customization via the `appearance` API + element options. Currently no placeholders.
- Fix: pass placeholder values through Stripe's `appearance.labels` or per-field `placeholder` options where supported. Reference: https://stripe.com/docs/elements/appearance-api. Inputs Stripe manages directly (CC field) keep their defaults.

#### Form validation + first-error focus
- Location: `frontend/src/checkout/CheckoutForm.tsx` (and `<AddressForm>`, `<DeliveryForm>` etc.).
- Today, submitting an incomplete form likely fails silently or surfaces a Stripe-side error after submission. Want pre-submit validation that:
  1. Marks the offending input red (border + helper text below) — reuse `--error` / `--error-bg` tokens already in `globals.css`.
  2. **Focuses the first invalid input** on submit-fail (scroll-into-view + `.focus()` on the topmost element with an error).
- Implementation sketch: a small `useFormErrors<T>()` hook holding `errors: Partial<Record<keyof T, string>>` + a `focusFirstError(refsByKey)` action. Or pull in `react-hook-form` if a second form lands needing the same shape. For now, hand-rolled is fine.
- Stripe's `<PaymentElement>` has its own validation-on-submit via `stripe.confirmPayment({ ...elements })` — surface the returned `error.message` next to the element rather than just toasting.

---

### Hex color in `SearchDropdown`
- Location: `frontend/src/navbar/SearchDropdown.tsx:49`.
- `bg-[#f5f5f3]` — neither in the palette nor a sanctioned arbitrary value.
- Fix: identify what this color *means*. If it matches `--footer` (#f2f1eb), use `bg-footer`. If genuinely new, ask before adding a token.

### Gray Tailwind values used as palette substitutes
- Locations: `frontend/src/navbar/Navbar.tsx:79` (`text-gray-400`), `frontend/src/navbar/ShopDropdown.tsx:215` (`bg-gray-100`), `frontend/src/common/components/ProductCard.tsx:36` (`bg-gray-100`), `frontend/src/filters/FilterSidebar.tsx:319` (`border-gray-200`).
- Fix: catalogue what each gray means. Two `bg-gray-100` are image-bg placeholders → potential `--image-bg` token. `text-gray-400` is placeholder text → `--placeholder` or `--brand-primary/50`. Ask before adding tokens.

### `Navbar` boolean state → atoms
- Location: `frontend/src/navbar/NavbarContext.tsx`.
- Booleans + `searchTerm` fit jotai atoms (the rest of the app uses atoms for similar shared UI state). Refs need to stay in Context.
- Fix: move `shopOpen`, `searchOpen`, `searchTerm` to atoms. Keep a smaller Context for the two refs (or hoist refs into the Navbar component).

### Navbar search input → URL search params
- Location: `frontend/src/navbar/Navbar.tsx:29` + `NavbarContext.tsx`.
- Search query is shareable filter state — should live in the URL, not local state. The collections route already takes `?search=...`.
- Fix: navbar input writes to `?search=...` on the collections route via `navigate` after debounce. Local input state in the input is fine; *applied* search term is URL state.

### `ShopDropdown` `setTimeout(close, 80)` hack
- Location: `frontend/src/navbar/ShopDropdown.tsx:65-67`.
- Explicit TODO: 80ms delay so the click registers on the `<Link>` before unmount.
- Fix: keep dropdown mounted until navigation completes (`await navigate(...)`), or use `pointer-events-none` + opacity on close so the click still lands.

### `useColumns` hardcoded `1024` breakpoint
- Location: `frontend/src/common/components/InfiniteList.tsx`.
- Magic number that must match Tailwind's `lg:`. If `globals.css` ever moves the breakpoint, this drifts.
- Fix: read from CSS via `getComputedStyle(...)`, or add a comment pinning it to `lg:`.

### `StarRating` loads three SVGs as `<img>`
- Location: `frontend/src/common/components/StarRating.tsx`.
- One HTTP request per star (browser caches after first). Inline SVG components would be one fewer round-trip on cold load and let stars use `currentColor`.
- Fix: replace with inline SVG components in `frontend/src/common/icons/`.

### `addToCartAtom` opens cart pane as side effect
- Location: `frontend/src/cart/cartAtoms.ts:67`.
- Couples "add to cart" with "open the pane." A future "silent add" (bulk add from wishlist) would need a different atom.
- Fix: leave as-is for now. If a silent-add path appears, split into `addToCartAtom` (data only) and `addToCartAndOpenPaneAtom` (data + open).

### `HorizontalScrollbar` complexity
- Location: `frontend/src/common/components/HorizontalScrollbar.tsx`.
- 144 lines, two `useEffect`s, ResizeObserver + MutationObserver + drag handlers + a dead `fadeTimeout`.
- Fix: consider native CSS scrollbars (Tailwind `scrollbar-thin` plugin) or a small purpose-built lib. If keeping, split into `useScrollProgress(ref)` + presentational `<ScrollbarTrack>`, remove the dead `fadeTimeout`.

### Low severity
- **`Footer` hardcoded `&copy; 2025`** — replace with `{new Date().getFullYear()}`.
- **`CheckoutSummary` shipping-cell ternary** — readable but slightly clever. Optional helper.

## CLAUDE-rule candidates

- **`useDismissable` for any popup/modal/dropdown** that closes on Esc or outside click — don't roll your own listener. (Hook landed; pin once a third consumer beyond the current three lands.)
- **No `any` in shipped code** — use `unknown` and narrow, or pin the generic. Pending second instance.
- **In React 19, `ref` is a regular prop** — don't use `forwardRef`, don't set `displayName` on `forwardRef` wrappers. Pending second offender after the `Navbar` fix.
- **Shared UI state goes in atoms; React Context only for things atoms can't hold** (refs, theming providers). Pending the navbar atom migration.
